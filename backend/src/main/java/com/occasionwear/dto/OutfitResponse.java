package com.occasionwear.dto;

import java.math.BigDecimal;

/**
 * Outfit payload returned to customers and admins.
 *
 * <p>{@code rentalPrice} is the FIXED total price for the whole rental period
 * (never a daily rate) and {@code rentalPeriodDays} is the agreed period
 * (wedding wear → 5 days, everything else → 3 days).
 */
public record OutfitResponse(
    Long id,
    String name,
    String category,
    String size,
    String color,
    /** Fixed total price for the whole rental period — never per day. */
    BigDecimal rentalPrice,
    /** Rental period in days (wedding → 5, other → 3). */
    Integer rentalPeriodDays,
    BigDecimal depositAmount,
    /** Late fee charged for each day beyond the expected return date. */
    BigDecimal lateFeePerDay,
    String status,
    String imageUrl,
    String description,
    boolean available,
    String availabilityNote
) {}
