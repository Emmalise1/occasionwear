package com.occasionwear.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Payload for creating a booking.
 *
 * <p>The customer only chooses the start date. The rental period (and hence the
 * expected return date) is fixed by the outfit — wedding wear 5 days, everything
 * else 3 days — so the server derives the return date itself. {@code endDate} is
 * accepted for compatibility but must match the outfit's expected return date.
 */
public record BookingRequest(
    @NotNull(message = "Outfit is required")
    Long outfitId,

    @NotNull(message = "Start date is required")
    LocalDate startDate,

    /** Optional; when present it must equal startDate + the outfit's rental period. */
    LocalDate endDate,

    /** Optional home delivery address for this booking. */
    String deliveryAddress
) {}
