package com.insightloop.authservice.user;

import com.insightloop.authservice.auth.AuthController.UserDto;
import com.insightloop.authservice.role.Role;
import com.insightloop.authservice.role.RoleRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.constraints.Pattern;

import java.util.*;
import java.util.stream.Collectors;

@RestController
public class UserController {

    private final UserRepository users;
    private final RoleRepository roles;
    private final com.insightloop.authservice.role.PermissionRepository permissions;
    private final PasswordEncoder encoder;

    public UserController(UserRepository users, RoleRepository roles,
                          com.insightloop.authservice.role.PermissionRepository permissions,
                          PasswordEncoder encoder) {
        this.users = users;
        this.roles = roles;
        this.permissions = permissions;
        this.encoder = encoder;
    }

    public record CreateUserRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 6) String password,
            Set<String> roles,
            Set<String> permissions
    ) {}

    public record AssignRoleRequest(
            @NotNull Long userId,
            @NotBlank @Pattern(regexp = "ADMIN|MANAGER|USER|AGENT") String role
    ) {}

    private UserDto toDto(User u) {
        List<String> roleNames = u.getRoles().stream().map(Role::getName).sorted().toList();
        
        Set<String> allPerms = new HashSet<>();
        if (u.getPermissions() != null && !u.getPermissions().isEmpty()) {
            u.getPermissions().stream().map(p -> p.getName()).forEach(allPerms::add);
        } else {
            u.getRoles().stream().flatMap(r -> r.getPermissions().stream())
                    .map(p -> p.getName()).forEach(allPerms::add);
        }
        List<String> sortedPerms = allPerms.stream().sorted().toList();
        
        return new UserDto(u.getId(), u.getEmail(), roleNames, sortedPerms);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDto> list() { return users.findAll().stream().map(this::toDto).toList(); }

    @GetMapping("/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    public List<String> listPermissions() {
        return permissions.findAll().stream().map(com.insightloop.authservice.role.Permission::getName).sorted().toList();
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> create(@Valid @RequestBody CreateUserRequest req) {
        if (users.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        User u = new User();
        u.setEmail(req.email());
        u.setPassword(encoder.encode(req.password()));
        
        Set<String> requestedRoles = req.roles() == null || req.roles().isEmpty() ? Set.of("USER") : req.roles();
        Set<Role> resolvedRoles = requestedRoles.stream()
                .map(name -> roles.findByName(name).orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown role: " + name)))
                .collect(Collectors.toSet());
        u.setRoles(resolvedRoles);

        if (req.permissions() != null && !req.permissions().isEmpty()) {
            Set<com.insightloop.authservice.role.Permission> resolvedPerms = req.permissions().stream()
                    .map(name -> permissions.findByName(name).orElseThrow(
                            () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown permission: " + name)))
                    .collect(Collectors.toSet());
            u.setPermissions(resolvedPerms);
        }

        users.save(u);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(u));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        Long callerId = (Long) auth.getPrincipal();
        if (id.equals(callerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admins cannot delete themselves");
        }
        if (!users.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        users.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/roles/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto assignRole(@Valid @RequestBody AssignRoleRequest req) {
        User u = users.findById(req.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Role r = roles.findByName(req.role())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown role: " + req.role()));
        u.getRoles().add(r);
        users.save(u);
        return toDto(u);
    }

    @GetMapping("/me/permissions")
    public UserDto myPermissions(Authentication auth) {
        Long id = (Long) auth.getPrincipal();
        return toDto(users.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED)));
    }

    public record UpdateUserRequest(
            @Email @NotBlank String email,
            Set<String> roles,
            Set<String> permissions
    ) {}

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest req) {
        User u = users.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!u.getEmail().equalsIgnoreCase(req.email())
                && users.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        u.setEmail(req.email());

        if (req.roles() != null && !req.roles().isEmpty()) {
            Set<Role> resolved = req.roles().stream()
                    .map(name -> roles.findByName(name).orElseThrow(
                            () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown role: " + name)))
                    .collect(Collectors.toSet());
            u.setRoles(resolved);
        }

        if (req.permissions() != null) {
            Set<com.insightloop.authservice.role.Permission> resolvedPerms = req.permissions().stream()
                    .map(name -> permissions.findByName(name).orElseThrow(
                            () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown permission: " + name)))
                    .collect(Collectors.toSet());
            u.setPermissions(resolvedPerms);
        } else {
            u.getPermissions().clear();
        }

        users.save(u);
        return toDto(u);
    }
}
