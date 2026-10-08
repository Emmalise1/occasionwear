package com.occasionwear.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.occasionwear.entity.Outfit;
import com.occasionwear.entity.enums.OutfitCategory;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

/**
 * Verifies the fixed rental-period rule:
 *
 * <pre>
 * Wedding outfits (Bridal Wedding Gowns, Civil Wedding Attire, Wedding Guest)
 *   → 5 days
 * All other outfits (Graduation, Traditional Ceremony, Bridal Shower,
 * Photoshoot, Accessories, …)
 *   → 3 days
 * </pre>
 *
 * Bridal Shower is deliberately NOT treated as wedding wear despite its name.
 */
class RentalPeriodsTest {

    @Test
    void weddingCategoriesGetFiveDays() {
        assertEquals(5, RentalPeriods.defaultDays(OutfitCategory.BRIDAL_WEDDING_GOWNS));
        assertEquals(5, RentalPeriods.defaultDays(OutfitCategory.CIVIL_WEDDING_ATTIRE));
        assertEquals(5, RentalPeriods.defaultDays(OutfitCategory.WEDDING_GUEST));
    }

    @Test
    void allOtherCategoriesGetThreeDays() {
        assertEquals(3, RentalPeriods.defaultDays(OutfitCategory.GRADUATION));
        assertEquals(3, RentalPeriods.defaultDays(OutfitCategory.TRADITIONAL_CEREMONY));
        assertEquals(3, RentalPeriods.defaultDays(OutfitCategory.PHOTOSHOOT));
        assertEquals(3, RentalPeriods.defaultDays(OutfitCategory.ACCESSORY));
    }

    @Test
    void bridalShowerIsNotWeddingWearForThePeriodRule() {
        assertFalse(RentalPeriods.isWedding(OutfitCategory.BRIDAL_SHOWER),
            "Bridal Shower must NOT receive the 5-day wedding period");
        assertEquals(3, RentalPeriods.defaultDays(OutfitCategory.BRIDAL_SHOWER));
    }

    @Test
    void onlyWeddingCategoriesAreWeddingWear() {
        int weddingCategories = 0;
        for (OutfitCategory category : OutfitCategory.values()) {
            boolean expected = category == OutfitCategory.BRIDAL_WEDDING_GOWNS
                || category == OutfitCategory.CIVIL_WEDDING_ATTIRE
                || category == OutfitCategory.WEDDING_GUEST;
            assertEquals(expected, RentalPeriods.isWedding(category), category.name());
            if (expected) {
                weddingCategories++;
            }
        }
        assertEquals(3, weddingCategories);
    }

    @Test
    void storedPeriodOverridesAndNullFallsBackToCategoryDefault() {
        Outfit gown = new Outfit();
        gown.setCategory(OutfitCategory.BRIDAL_WEDDING_GOWNS);
        assertEquals(5, gown.getRentalPeriodDays(), "null period → wedding default");

        gown.setRentalPeriodDays(7); // admin override is honoured
        assertEquals(7, gown.getRentalPeriodDays());

        Outfit suit = new Outfit();
        suit.setCategory(OutfitCategory.GRADUATION);
        assertEquals(3, suit.getRentalPeriodDays(), "null period → 3-day default");
    }

    @Test
    void defaultLateFeeIsTwoThousandRwf() {
        Outfit outfit = new Outfit();
        assertEquals(0, outfit.getLateFeePerDay().compareTo(BigDecimal.valueOf(2000)),
            "unset late fee → standard 2,000 RWF");
        outfit.setLateFeePerDay(new BigDecimal("3500"));
        assertEquals(0, outfit.getLateFeePerDay().compareTo(new BigDecimal("3500")),
            "an explicit per-outfit late fee is honoured");
    }
}
