package com.management.backend.service;

import com.management.backend.dto.LoginRequest;
import com.management.backend.dto.RegisterRequest;
import com.management.backend.entity.Role;
import com.management.backend.entity.User;
import com.management.backend.repository.UserRepository;
// BCryptPasswordEncoder removed per user request – passwords stored in plain text
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final UserRepository userRepository;
  // FIX ERR 1: BCrypt encoder — passwords stored as hash, never plain text
  // No password encoder – plain text passwords

  public AuthService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public User register(RegisterRequest request) {

    // FIX WARN 4: Basic validation
    if (request.getEmail() == null || request.getEmail().isBlank()) {
      throw new IllegalArgumentException("Email is required.");
    }
    if (request.getPassword() == null || request.getPassword().length() < 4) {
      throw new IllegalArgumentException("Password must be at least 4 characters.");
    }
    if (!request.getPassword().equals(request.getConfirmPassword())) {
      throw new IllegalArgumentException("Passwords do not match.");
    }

    // Check duplicate email
    if (userRepository.findByEmail(request.getEmail()).isPresent()) {
      throw new IllegalArgumentException("Email already registered.");
    }

    User user = new User();
    user.setFullName(request.getFullName());
    user.setEmail(request.getEmail().trim().toLowerCase());

    // FIX ERR 1: Hash the password before saving
    user.setPassword(request.getPassword());

    // Set role (uppercase enum). If invalid, IllegalArgumentException will be thrown and handled by controller.
    user.setRole(Role.valueOf(request.getRole().toUpperCase()));

    // Save user
    return userRepository.save(user);
  }

  public User login(LoginRequest request) {
    User user = userRepository
        .findByEmail(request.getEmail().trim().toLowerCase())
        .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

    // FIX ERR 1: Compare hashed password using BCrypt
    if (!request.getPassword().equals(user.getPassword())) {
      throw new IllegalArgumentException("Invalid email or password.");
    }

    return user;
  }
}