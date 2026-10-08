package com.occasionwear.service;

import com.occasionwear.entity.enums.OutfitCategory;

/**
 * Rental-period rule for fixed-price rentals:
 *
 * <ul>
 *   <li>Wedding outfits (bridal gowns, civil wedding attire, wedding guest
 *       and other wedding wear) → <strong>5 days</strong>.</li>
 *   <li>All other outfits (graduation, traditional ceremony, bridal shower,
 *       photoshoot, accessories, …) → <strong>3 days</strong>.</li>
 * </ul>
 *
 * The customer pays one fixed rental price for the whole period; the
 * expected return date is {@code startDate + rentalPeriodDays}.
 */
public final class RentalPeriods {

    public static final int WEDDING_DAYS = 5;
    public static final int DEFAULT_DAYS = 3;

    private RentalPeriods() {
    }

    /** Default rental period (in days) for a category. */
    public static int defaultDays(OutfitCategory category) {
        return isWedding(category) ? WEDDING_DAYS : DEFAULT_DAYS;
    }

    /**
     * Wedding wear gets the 5-day period. Bridal Shower is explicitly a
     * NON-wedding outfit for this rule despite its name.
     */
    public static boolean isWedding(OutfitCategory category) {
        return category == OutfitCategory.BRIDAL_WEDDING_GOWNS
            || category == OutfitCategory.CIVIL_WEDDING_ATTIRE
            || category == OutfitCategory.WEDDING_GUEST;
    }
}
