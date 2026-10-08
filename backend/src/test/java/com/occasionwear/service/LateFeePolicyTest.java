package com.occasionwear.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

/**
 * Verifies the late-return policy exactly as specified:
 *
 * <pre>
 * chargeableLateDays = max(0, actualReturnDate - expectedReturnDate)
 * lateFee            = chargeableLateDays × 2,000 RWF
 * </pre>
 *
 * There is NO grace allowance: returning on or before the expected return date
 * (the end of the outfit's fixed rental period — 5 days for wedding wear,
 * 3 days for everything else) is free, and every day after it is charged.
 */
class LateFeePolicyTest {

    private static final BigDecimal FEE_PER_DAY = new BigDecimal("2000");
    private static final LocalDate EXPECTED_RETURN = LocalDate.of(2026, 6, 15);

    private BigDecimal feeFor(int daysAfterExpectedReturn) {
        return LateFeePolicy.lateFee(EXPECTED_RETURN, EXPECTED_RETURN.plusDays(daysAfterExpectedReturn), FEE_PER_DAY);
    }

    private long chargeableFor(int daysAfterExpectedReturn) {
        return LateFeePolicy.chargeableLateDays(EXPECTED_RETURN, EXPECTED_RETURN.plusDays(daysAfterExpectedReturn));
    }

    @Test
    void returnedOnOrBeforeExpectedReturnDateChargesNothing() {
        assertEquals(0, feeFor(-5).signum(), "returned early");
        assertEquals(0, feeFor(0).signum(), "returned on the expected return date");
        assertEquals(0, chargeableFor(0));
    }

    @Test
    void firstLateDayChargesOneDay() {
        assertEquals(1, chargeableFor(1));
        assertEquals(new BigDecimal("2000"), feeFor(1));
    }

    @Test
    void secondLateDayChargesTwoDays() {
        assertEquals(2, chargeableFor(2));
        assertEquals(new BigDecimal("4000"), feeFor(2));
    }

    @Test
    void thirdLateDayChargesThreeDays() {
        assertEquals(3, chargeableFor(3));
        assertEquals(new BigDecimal("6000"), feeFor(3));
    }

    @Test
    void fifthLateDayChargesFiveDays() {
        assertEquals(5, chargeableFor(5));
        assertEquals(new BigDecimal("10000"), feeFor(5));
    }

    @Test
    void overdueDaysCountFromTheDayAfterTheExpectedReturnDate() {
        assertEquals(1, LateFeePolicy.overdueDays(EXPECTED_RETURN, EXPECTED_RETURN.plusDays(1)));
        assertEquals(6, LateFeePolicy.overdueDays(EXPECTED_RETURN, EXPECTED_RETURN.plusDays(6)));
        assertEquals(0, LateFeePolicy.overdueDays(EXPECTED_RETURN, EXPECTED_RETURN));
        assertEquals(0, LateFeePolicy.overdueDays(EXPECTED_RETURN, EXPECTED_RETURN.minusDays(3)));
    }

    @Test
    void chargeableDaysEqualOverdueDays() {
        // No grace allowance — every overdue day is chargeable.
        for (int day = 0; day <= 30; day++) {
            LocalDate actual = EXPECTED_RETURN.plusDays(day);
            assertEquals(
                LateFeePolicy.overdueDays(EXPECTED_RETURN, actual),
                LateFeePolicy.chargeableLateDays(EXPECTED_RETURN, actual),
                "chargeable days must equal overdue days on day +" + day);
        }
    }

    @Test
    void feeScalesLinearlyWithNoFreeDays() {
        BigDecimal previous = BigDecimal.ZERO;
        for (int day = 1; day <= 30; day++) {
            BigDecimal current = feeFor(day);
            assertEquals(day * 2000, current.intValue(), "fee on day +" + day);
            assertTrue(current.subtract(previous).compareTo(FEE_PER_DAY) == 0,
                "each late day adds exactly 2,000 RWF (day " + day + ")");
            previous = current;
        }
    }

    @Test
    void nullSafety() {
        assertEquals(0, LateFeePolicy.overdueDays(null, LocalDate.now()));
        assertEquals(0, LateFeePolicy.overdueDays(EXPECTED_RETURN, null));
        assertEquals(0, LateFeePolicy.chargeableLateDays(null, null));
        assertEquals(45, LateFeePolicy.chargeableLateDays(EXPECTED_RETURN, EXPECTED_RETURN.plusDays(45)));
        assertEquals(0, LateFeePolicy.lateFee(0, FEE_PER_DAY).signum());
        assertEquals(0, LateFeePolicy.lateFee(3, null).signum());
    }
}
