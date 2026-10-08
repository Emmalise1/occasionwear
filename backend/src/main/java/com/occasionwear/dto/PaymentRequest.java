package com.occasionwear.dto;

import com.occasionwear.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;

/** Mock checkout payload — no real payment provider is integrated. */
public record PaymentRequest(
    @NotNull(message = "Payment method is required")
    PaymentMethod method,

    /** Demo switch used to exercise business rule 4 (failed payment). */
    Boolean simulateFailure
) {
    public boolean shouldFail() {
        return Boolean.TRUE.equals(simulateFailure);
    }
}
