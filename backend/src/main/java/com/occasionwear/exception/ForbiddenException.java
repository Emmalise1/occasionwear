package com.occasionwear.exception;

import org.springframework.http.HttpStatus;

/** 403 — authenticated but not allowed (wrong role / another user's resource). */
public class ForbiddenException extends ApiException {

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
    }
}
