package com.occasionwear.entity.enums;

/**
 * Booking lifecycle.
 *
 * PENDING   – created, waiting for payment / admin approval
 * CONFIRMED – paid (or approved), ready for pickup
 * ACTIVE    – outfit handed over, rental in progress
 * COMPLETED – outfit returned and inspected
 * CANCELLED – cancelled by customer, failed payment, or rejected
 */
public enum BookingStatus {
    PENDING,
    CONFIRMED,
    ACTIVE,
    COMPLETED,
    CANCELLED
}
