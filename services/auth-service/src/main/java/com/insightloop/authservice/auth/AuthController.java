package com.insightloop.authservice.auth;

import com.insightloop.authservice.config.JwtService;
import com.insightloop.authservice.role.Role;
import com.insightloop.authservice.role.RoleRepository;
import com.insightloop.authservice.user.User;
import com.insightloop.authservice.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthController(UserRepository users, RoleRepository roles, PasswordEncoder encoder, JwtService jwt) {
        this.users = users; this.roles = roles; this.encoder = encoder; this.jwt = jwt;
    }

    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
    public record RegisterRequest(@Email @NotBlank String email, @NotBlank @Size(min = 6) String password) {}
    public record UserDto(Long id, String email, List<String> roles, List<String> permissions) {}
    public record AuthResponse(String accessToken, UserDto user) {}

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        User u = users.findByEmail(req.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!u.isEnabled() || !encoder.matches(req.password(), u.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        List<String> roleNames = u.getRoles().stream().map(Role::getName).sorted().collect(Collectors.toList());
        Set<String> allPerms = new HashSet<>();
        if (u.getPermissions() != null && !u.getPermissions().isEmpty()) {
            u.getPermissions().stream().map(p -> p.getName()).forEach(allPerms::add);
        } else {
            u.getRoles().stream().flatMap(r -> r.getPermissions().stream())
                    .map(p -> p.getName()).forEach(allPerms::add);
        }
        List<String> perms = allPerms.stream().distinct().sorted().collect(Collectors.toList());
        String token = jwt.issue(u.getId(), u.getEmail(), roleNames, perms);
        return new AuthResponse(token, new UserDto(u.getId(), u.getEmail(), roleNames, perms));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        if (users.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        User u = new User();
        u.setEmail(req.email());
        u.setPassword(encoder.encode(req.password()));
        Role userRole = roles.findByName("USER")
                .orElseThrow(() -> new IllegalStateException("USER role missing"));
        u.setRoles(new HashSet<>(Set.of(userRole)));
        users.save(u);
        return ResponseEntity.status(HttpStatus.CREATED).body(login(new LoginRequest(req.email(), req.password())));
    }
}
