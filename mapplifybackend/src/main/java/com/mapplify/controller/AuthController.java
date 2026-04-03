package com.mapplify.controller;

import com.mapplify.model.UserAccount;
import com.mapplify.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        try {
            String name = required(payload, "name");
            String email = required(payload, "email");
            String password = required(payload, "password");
            String phoneNumber = payload.getOrDefault("phoneNumber", "");

            if (password.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters"));
            }

            UserAccount user = authService.register(name, email, password, phoneNumber);
            return ResponseEntity.ok(userResponse(user));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        try {
            String email = required(payload, "email");
            String password = required(payload, "password");

            UserAccount user = authService.login(email, password);
            return ResponseEntity.ok(userResponse(user));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(401).body(Map.of("message", ex.getMessage()));
        }
    }

    private static String required(Map<String, String> payload, String key) {
        String value = payload.get(key);
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(key + " is required");
        }
        return value;
    }

    private static Map<String, Object> userResponse(UserAccount user) {
        return Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "phoneNumber", user.getPhoneNumber(),
                "createdAt", user.getCreatedAt()
        );
    }
}
