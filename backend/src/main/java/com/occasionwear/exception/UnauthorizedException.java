package com.occasionwear.exception;

import org.springframework.http.HttpStatus;

/** 401 — missing or invalid credentials/token. */
public class UnauthorizedException extends ApiException {

    public UnauthorizedException(String message) {
        super(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
    }
}
