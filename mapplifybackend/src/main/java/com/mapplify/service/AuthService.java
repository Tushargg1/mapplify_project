package com.mapplify.service;

import com.mapplify.model.UserAccount;
import com.mapplify.repository.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserAccountRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserAccountRepository userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    public UserAccount register(String name, String email, String password, String phoneNumber) {
        String normalizedEmail = email.trim().toLowerCase();
        if (userRepo.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Email already registered");
        }

        UserAccount user = new UserAccount();
        user.setName(name.trim());
        user.setEmail(normalizedEmail);
        user.setPhoneNumber(phoneNumber == null ? null : phoneNumber.trim());
        user.setPasswordHash(passwordEncoder.encode(password));
        return userRepo.save(user);
    }

    public UserAccount login(String email, String password) {
        String normalizedEmail = email.trim().toLowerCase();
        UserAccount user = userRepo.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return user;
    }
}
