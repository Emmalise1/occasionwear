package com.occasionwear.controller;

import com.occasionwear.dto.AuthResponse;
import com.occasionwear.dto.LoginRequest;
import com.occasionwear.dto.PersonResponse;
import com.occasionwear.dto.RegisterRequest;
import com.occasionwear.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public authentication endpoints — login returns a JWT. */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Registration, login and current profile")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new customer", description = "Creates a customer account and returns a JWT.")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Log in", description = "Returns a JWT for customers and admins.")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Current profile", description = "Returns the profile of the authenticated caller.")
    public ResponseEntity<PersonResponse> me() {
        return ResponseEntity.ok(authService.me());
    }
}
