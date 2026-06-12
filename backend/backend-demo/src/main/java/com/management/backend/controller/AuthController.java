package com.management.backend.controller;

import com.management.backend.dto.LoginRequest;
import com.management.backend.dto.RegisterRequest;
import com.management.backend.dto.UserResponseDTO;
import com.management.backend.entity.User;
import com.management.backend.service.AuthService;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @GetMapping("/test")
  public String test() {
    return "Backend Working";
  }

  @PostMapping("/register")
  public ResponseEntity<Map<String, Object>> register(
      @RequestBody RegisterRequest request) {
    try {
      User savedUser = authService.register(request);

      // FIX WARN 1: Return DTO without password
      UserResponseDTO dto = new UserResponseDTO(
          savedUser.getId(),
          savedUser.getFullName(),
          savedUser.getEmail(),
          savedUser.getRole().name());

      return ResponseEntity.ok(Map.of(
          "success", true,
          "message", "User registered successfully",
          "user", dto));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of(
          "success", false,
          "message", e.getMessage()));
    }
  }

  @PostMapping("/login")
  public ResponseEntity<Map<String, Object>> login(
      @RequestBody LoginRequest request) {
    try {
      User user = authService.login(request);

      // FIX WARN 1 + ERR 4: Return DTO with lowercase role, no password
      UserResponseDTO dto = new UserResponseDTO(
          user.getId(),
          user.getFullName(),
          user.getEmail(),
          user.getRole().name() // "ADMIN" → toLowerCase() → "admin" in DTO constructor
      );

      return ResponseEntity.ok(Map.of(
          "success", true,
          "message", "Logged in successfully",
          "user", dto));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.status(401).body(Map.of(
          "success", false,
          "message", e.getMessage()));
    }
  }
}