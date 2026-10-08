package com.occasionwear.dto;

import com.occasionwear.entity.enums.OutfitCategory;
import com.occasionwear.entity.enums.OutfitStatus;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

/** Admin payload for creating or editing an outfit. */
public record OutfitRequest(
    @NotBlank(message = "Name is required")
    String name,

    @NotNull(message = "Category is required")
    OutfitCategory category,

    @NotBlank(message = "Size is required")
    String size,

    @NotBlank(message = "Color is required")
    String color,

    @NotNull(message = "Rental price is required")
    @Positive(message = "Rental price must be positive")
    @Digits(integer = 10, fraction = 2, message = "Rental price is too large")
    BigDecimal rentalPrice,

    /**
     * Rental period in days. Optional — null defaults to the category rule
     * (wedding categories → 5 days, all others → 3 days); admins may adjust it.
     */
    @Min(value = 1, message = "Rental period must be at least 1 day")
    Integer rentalPeriodDays,

    @NotNull(message = "Deposit amount is required")
    @Positive(message = "Deposit amount must be positive")
    @Digits(integer = 10, fraction = 2, message = "Deposit amount is too large")
    BigDecimal depositAmount,

    /** Optional per-day late fee; null defaults to the standard 2,000 RWF. */
    @Positive(message = "Late fee per day must be positive")
    BigDecimal lateFeePerDay,

    @NotBlank(message = "Image URL is required — every outfit must have a real image")
    String imageUrl,

    String description,

    /** Optional status change, validated against legal transitions. */
    OutfitStatus status
) {}
