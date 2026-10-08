package com.occasionwear.entity.enums;

import com.occasionwear.service.RentalPeriods;

/**
 * Occasion categories used to browse the collection.
 * The rental period per category is defined by
 * {@link RentalPeriods} (wedding → 5 days, else 3).
 */
public enum OutfitCategory {
    WEDDING_GUEST,
    TRADITIONAL_CEREMONY,
    GRADUATION,
    PHOTOSHOOT,
    ACCESSORY,
    BRIDAL_WEDDING_GOWNS,
    CIVIL_WEDDING_ATTIRE,
    BRIDAL_SHOWER
}
