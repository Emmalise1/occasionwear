package com.occasionwear.dto;

/** Returned after a successful login or registration: JWT + the caller's profile. */
public record AuthResponse(
    String token,
    Long id,
    String name,
    String email,
    String phone,
    String role,
    String address,
    String staffRole
) {}
