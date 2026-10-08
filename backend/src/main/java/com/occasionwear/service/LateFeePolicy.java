package com.occasionwear.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Late-return policy for fixed-period rentals.
 *
 * <p>Every outfit has a fixed rental period (wedding wear → 5 days, all other
 * outfits → 3 days) ending on the expected return date. Returning on or before
 * that date is always free. Every day beyond it is charged at the outfit's
 * per-day late fee (standard 2,000 RWF). There is no grace allowance.
 *
 * <pre>
 * chargeableLateDays = max(0, actualReturnDate - expectedReturnDate)
 * lateFee            = chargeableLateDays × feePerDay
 * </pre>
 *
 * Example at 2,000 RWF/day for a wedding outfit (5-day period):
 * returned within 5 days → 0 RWF; 1 day late → 2,000 RWF;
 * 2 days late → 4,000 RWF; 3 days late → 6,000 RWF; 5 days late → 10,000 RWF.
 */
public final class LateFeePolicy {

    private LateFeePolicy() {
    }

    /** Whole days the rental is overdue (0 when returned on or before the expected return date). */
    public static long overdueDays(LocalDate expectedReturnDate, LocalDate actualReturnDate) {
        if (expectedReturnDate == null || actualReturnDate == null) {
            return 0;
        }
        return Math.max(0, ChronoUnit.DAYS.between(expectedReturnDate, actualReturnDate));
    }

    /** Days that actually incur a fee: every day beyond the expected return date. */
    public static long chargeableLateDays(LocalDate expectedReturnDate, LocalDate actualReturnDate) {
        return overdueDays(expectedReturnDate, actualReturnDate);
    }

    /** lateFee = chargeableLateDays × feePerDay. */
    public static BigDecimal lateFee(long chargeableLateDays, BigDecimal feePerDay) {
        if (chargeableLateDays <= 0 || feePerDay == null) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(chargeableLateDays).multiply(feePerDay);
    }

    /** Convenience: full calculation from the expected return date and actual return date. */
    public static BigDecimal lateFee(LocalDate expectedReturnDate,
                                     LocalDate actualReturnDate,
                                     BigDecimal feePerDay) {
        return lateFee(chargeableLateDays(expectedReturnDate, actualReturnDate), feePerDay);
    }
}
