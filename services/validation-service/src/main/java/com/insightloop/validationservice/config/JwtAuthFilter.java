package com.insightloop.validationservice.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    public JwtAuthFilter(JwtService jwt) { this.jwt = jwt; }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims c = jwt.parse(header.substring(7));
                Long userId = Long.valueOf(c.getSubject());
                @SuppressWarnings("unchecked")
                List<String> roles = c.get("roles", List.class);
                @SuppressWarnings("unchecked")
                List<String> perms = c.get("permissions", List.class);
                if (roles == null) roles = new ArrayList<>();
                if (perms == null) perms = new ArrayList<>();
                List<SimpleGrantedAuthority> auths = new ArrayList<>();
                for (String r : roles) auths.add(new SimpleGrantedAuthority("ROLE_" + r));
                for (String p : perms) auths.add(new SimpleGrantedAuthority(p));
                UsernamePasswordAuthenticationToken t = new UsernamePasswordAuthenticationToken(userId, null, auths);
                SecurityContextHolder.getContext().setAuthentication(t);
            } catch (JwtException ignored) {}
        }
        chain.doFilter(req, res);
    }
}
