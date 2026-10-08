package com.occasionwear.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Aggregates KPIs, reports and chart data for the admin dashboard. */
public record ReportSummaryResponse(
    long totalBookings,
    Map<String, Long> bookingsByStatus,
    Map<String, Long> outfitsByStatus,
    BigDecimal totalRevenue,
    long activeRentals,
    long damagedOutfits,
    long availableOutfits,
    long rentedOutfits,
    long pendingApprovals,
    List<DailyRevenue> revenueOverTime
) {

    public record DailyRevenue(LocalDate date, BigDecimal revenue) {}
}
