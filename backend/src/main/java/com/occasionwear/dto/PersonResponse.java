package com.occasionwear.dto;

/** Profile payload for /api/auth/me. */
public record PersonResponse(
    Long id,
    String name,
    String email,
    String phone,
    String role,
    String address,
    String staffRole
) {}
