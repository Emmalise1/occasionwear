package com.occasionwear.exception;

import org.springframework.http.HttpStatus;

/** 409 — a business rule conflict (e.g. outfit unavailable, illegal state transition). */
public class BusinessException extends ApiException {

    public BusinessException(HttpStatus status, String errorCode, String message) {
        super(status, errorCode, message);
    }

    public static BusinessException conflict(String errorCode, String message) {
        return new BusinessException(HttpStatus.CONFLICT, errorCode, message);
    }
}
