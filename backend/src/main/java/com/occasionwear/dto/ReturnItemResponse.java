package com.occasionwear.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * An ACTIVE booking awaiting return, with the server-calculated late-fee
 * preview. The rental period is fixed by the outfit (wedding wear → 5 days,
 * everything else → 3 days) and there is no grace allowance beyond it:
 *
 * <pre>
 * chargeableLateDays = max(0, actualReturnDate - expectedReturnDate)
 * lateFee            = chargeableLateDays × lateFeePerDay (2,000 RWF)
 * </pre>
 */
public record ReturnItemResponse(
    BookingResponse booking,
    LocalDate expectedReturn,
    /** The outfit's fixed rental period in days (wedding → 5, other → 3). */
    int rentalPeriodDays,
    int overdueDays,
    int chargeableLateDays,
    BigDecimal lateFeePerDay,
    BigDecimal lateFeePreview
) {}
