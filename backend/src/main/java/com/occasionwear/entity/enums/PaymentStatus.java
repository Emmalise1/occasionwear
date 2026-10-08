package com.occasionwear.entity.enums;

/** Mock payment lifecycle — no real payment provider is integrated. */
public enum PaymentStatus {
    PENDING,
    PAID,
    REFUNDED,
    FAILED
}
