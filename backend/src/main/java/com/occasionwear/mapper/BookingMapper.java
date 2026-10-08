package com.occasionwear.mapper;

import com.occasionwear.dto.BookingResponse;
import com.occasionwear.entity.Booking;
import com.occasionwear.entity.Delivery;
import com.occasionwear.entity.Payment;

/** Maps {@link Booking} entities to response DTOs. */
public final class BookingMapper {

    private BookingMapper() {}

    public static BookingResponse toResponse(Booking booking) {
        Payment payment = booking.getPayment();
        Delivery delivery = booking.getDelivery();

        return new BookingResponse(
            booking.getId(),
            booking.getReference(),
            booking.getStartDate(),
            booking.getEndDate(),
            booking.getReturnDate(),
            booking.getStatus().name(),
            booking.getTotalAmount(),
            booking.getCreatedAt(),
            new BookingResponse.CustomerSummary(
                booking.getCustomer().getId(),
                booking.getCustomer().getName(),
                booking.getCustomer().getEmail(),
                booking.getCustomer().getPhone(),
                booking.getCustomer().getAddress()
            ),
            new BookingResponse.OutfitSummary(
                booking.getOutfit().getId(),
                booking.getOutfit().getName(),
                booking.getOutfit().getCategory().name(),
                booking.getOutfit().getImageUrl(),
                booking.getOutfit().getRentalPrice(),
                booking.getOutfit().getRentalPeriodDays(),
                booking.getOutfit().getDepositAmount(),
                booking.getOutfit().getLateFeePerDay(),
                booking.getOutfit().getSize(),
                booking.getOutfit().getColor()
            ),
            payment == null ? null : new BookingResponse.PaymentSummary(
                payment.getId(),
                payment.getAmount(),
                payment.getDeposit(),
                payment.getMethod() == null ? null : payment.getMethod().name(),
                payment.getStatus().name(),
                payment.getPaymentDate(),
                payment.getLateFee(),
                payment.getDamageFee(),
                payment.getAmountDue()
            ),
            delivery == null ? null : new BookingResponse.DeliverySummary(
                delivery.getAddress(),
                delivery.getDeliveryDate(),
                delivery.getStatus().name()
            )
        );
    }
}
