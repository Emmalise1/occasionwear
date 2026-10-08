package com.occasionwear.dto;

import com.occasionwear.entity.enums.ReturnCondition;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/** Admin inspection of a returned outfit (business rule 6). */
public record InspectionRequest(
    @NotNull(message = "Condition is required")
    ReturnCondition condition,

    /** Required when condition = DAMAGED. */
    BigDecimal damageFee
) {}
