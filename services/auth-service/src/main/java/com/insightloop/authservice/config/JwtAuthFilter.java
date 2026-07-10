package com.insightloop.authservice.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final SecretKey key;

    public JwtAuthFilter(@Value("${insightloop.jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        return path.startsWith("/auth/")
                || path.startsWith("/api/auth/")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-ui")
                || path.equals("/swagger-ui.html")
                || path.equals("/actuator/health")
                || "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String subject = claims.getSubject();
            Long principal = null;
            try {
                principal = Long.parseLong(subject);
            } catch (NumberFormatException ignored) {
                Number uid = claims.get("uid", Number.class);
                if (uid != null) principal = uid.longValue();
            }

            if (principal == null) {
                SecurityContextHolder.clearContext();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }

            Set<SimpleGrantedAuthority> authorities = new LinkedHashSet<>();

            Object rolesClaim = claims.get("roles");

            if (rolesClaim instanceof Collection<?> roles) {
                for (Object roleObj : roles) {
                    if (roleObj != null) {
                        String role = roleObj.toString();

                        if (!role.startsWith("ROLE_")) {
                            role = "ROLE_" + role;
                        }

                        authorities.add(new SimpleGrantedAuthority(role));
                    }
                }
            }

            String singleRole = claims.get("role", String.class);

            if (singleRole != null && !singleRole.isBlank()) {
                String role = singleRole;

                if (!role.startsWith("ROLE_")) {
                    role = "ROLE_" + role;
                }

                authorities.add(new SimpleGrantedAuthority(role));
            }

            Object permissionsClaim = claims.get("permissions");

            if (permissionsClaim instanceof Collection<?> permissions) {
                for (Object permissionObj : permissions) {
                    if (permissionObj != null) {
                        authorities.add(
                                new SimpleGrantedAuthority(permissionObj.toString())
                        );
                    }
                }
            }

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            new ArrayList<>(authorities)
                    );

            auth.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        chain.doFilter(request, response);
    }
}