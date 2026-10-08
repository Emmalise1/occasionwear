package com.occasionwear.mapper;

import com.occasionwear.dto.OutfitResponse;
import com.occasionwear.entity.Outfit;
import com.occasionwear.entity.enums.OutfitStatus;

/** Maps {@link Outfit} entities to response DTOs. */
public final class OutfitMapper {

    private OutfitMapper() {}

    /** Basic mapping — availability derived from the outfit's own status. */
    public static OutfitResponse toResponse(Outfit outfit) {
        boolean available = outfit.getStatus() == OutfitStatus.AVAILABLE;
        return toResponse(outfit, available, noteFor(outfit, available));
    }

    /** Mapping with an availability verdict computed for a requested date range. */
    public static OutfitResponse toResponse(Outfit outfit, boolean available, String availabilityNote) {
        return new OutfitResponse(
            outfit.getId(),
            outfit.getName(),
            outfit.getCategory().name(),
            outfit.getSize(),
            outfit.getColor(),
            outfit.getRentalPrice(),
            outfit.getRentalPeriodDays(),
            outfit.getDepositAmount(),
            outfit.getLateFeePerDay(),
            outfit.getStatus().name(),
            outfit.getImageUrl(),
            outfit.getDescription(),
            available,
            availabilityNote
        );
    }

    public static String noteFor(Outfit outfit, boolean available) {
        if (available) {
            return "Available now";
        }
        return switch (outfit.getStatus()) {
            case RESERVED -> "Reserved for another booking";
            case RENTED_OUT -> "Currently rented out";
            case RETURNED -> "Awaiting return inspection";
            case DAMAGED -> "Under repair";
            case RETIRED -> "No longer in circulation";
            case AVAILABLE -> "Unavailable for the selected dates";
        };
    }
}
