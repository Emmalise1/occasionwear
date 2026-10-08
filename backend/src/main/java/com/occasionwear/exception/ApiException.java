package com.occasionwear.exception;

import org.springframework.http.HttpStatus;

/**
 * Base class for controlled API errors.
 * The status + error code drive the JSON error contract; stack traces never reach clients.
 */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    protected ApiException(HttpStatus status, String errorCode, String message) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public HttpStatus getStatus() { return status; }

    public String getErrorCode() { return errorCode; }
}
