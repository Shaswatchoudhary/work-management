package com.management.backend.dto;

// FIX WARN 1: Return this instead of User entity
// This ensures password hash is NEVER sent to frontend
public class UserResponseDTO {

  private Long id;
  private String fullName;
  private String email;
  private String role; // lowercase: "admin", "hr", "helpdesk"

  public UserResponseDTO(Long id, String fullName, String email, String role) {
    this.id = id;
    this.fullName = fullName;
    this.email = email;
    // FIX ERR 4: Convert enum to lowercase so frontend matches
    this.role = role.toLowerCase();
  }

  public Long getId() {
    return id;
  }

  public String getFullName() {
    return fullName;
  }

  public String getEmail() {
    return email;
  }

  public String getRole() {
    return role;
  }
}