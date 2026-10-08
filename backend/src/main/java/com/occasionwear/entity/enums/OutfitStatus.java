package com.occasionwear.entity.enums;

/**
 * Inventory state of an outfit.
 *
 * AVAILABLE  – rentable
 * RESERVED   – held by a pending/confirmed booking
 * RENTED_OUT – currently with a customer
 * RETURNED   – back from customer, awaiting inspection
 * DAMAGED    – failed inspection, awaiting repair or retirement
 * RETIRED    – removed from circulation (never hard-deleted)
 */
public enum OutfitStatus {
    AVAILABLE,
    RESERVED,
    RENTED_OUT,
    RETURNED,
    DAMAGED,
    RETIRED
}
