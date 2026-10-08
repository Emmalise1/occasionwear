package com.occasionwear.exception;

import org.springframework.http.HttpStatus;

/** 400 — syntactically valid but semantically wrong request. */
public class BadRequestException extends ApiException {

    public BadRequestException(String errorCode, String message) {
        super(HttpStatus.BAD_REQUEST, errorCode, message);
    }
}
