package com.insightloop.authservice.config;

import com.insightloop.authservice.role.Role;
import com.insightloop.authservice.role.RoleRepository;
import com.insightloop.authservice.user.User;
import com.insightloop.authservice.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedUsers(UserRepository users, RoleRepository roles, PasswordEncoder encoder) {
        return args -> {
            users.findByEmail("user@insightloop.com").ifPresent(users::delete);
            seed(users, roles, encoder, "admin@insightloop.com", "Admin@123", "ADMIN");
            seed(users, roles, encoder, "manager@insightloop.com", "Manager@123", "MANAGER");
            seed(users, roles, encoder, "agent@insightloop.com", "Agent@123", "AGENT");
        };
    }

    private void seed(UserRepository users, RoleRepository roles, PasswordEncoder enc,
                      String email, String password, String roleName) {
        if (users.existsByEmail(email)) return;
        Role r = roles.findByName(roleName).orElseThrow(
                () -> new IllegalStateException("Missing role: " + roleName));
        User u = new User();
        u.setEmail(email);
        u.setPassword(enc.encode(password));
        u.setRoles(new HashSet<>(Set.of(r)));
        users.save(u);
    }
}
