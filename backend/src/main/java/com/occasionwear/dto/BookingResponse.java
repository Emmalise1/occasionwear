package com.occasionwear.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Booking payload for customers and admins. */
public record BookingResponse(
    Long id,
    String reference,
    LocalDate startDate,
    LocalDate endDate,
    LocalDate returnDate,
    String status,
    BigDecimal totalAmount,
    LocalDateTime createdAt,
    CustomerSummary customer,
    OutfitSummary outfit,
    PaymentSummary payment,
    DeliverySummary delivery
) {

    public record CustomerSummary(Long id, String name, String email, String phone, String address) {}

    public record OutfitSummary(
        Long id,
        String name,
        String category,
        String imageUrl,
        /** Fixed total price for the whole rental period — never per day. */
        BigDecimal rentalPrice,
        /** Rental period in days (wedding → 5, other → 3). */
        Integer rentalPeriodDays,
        BigDecimal depositAmount,
        BigDecimal lateFeePerDay,
        String size,
        String color
    ) {}

    public record PaymentSummary(
        Long id,
        BigDecimal amount,
        BigDecimal deposit,
        String method,
        String status,
        LocalDateTime paymentDate,
        BigDecimal lateFee,
        BigDecimal damageFee,
        BigDecimal amountDue
    ) {}

    public record DeliverySummary(String address, LocalDate deliveryDate, String status) {}
}
