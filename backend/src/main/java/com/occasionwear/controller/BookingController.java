package com.occasionwear.controller;

import com.occasionwear.dto.BookingRequest;
import com.occasionwear.dto.BookingResponse;
import com.occasionwear.dto.PaymentRequest;
import com.occasionwear.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Customer booking endpoints — all require a customer JWT. */
@RestController
@RequestMapping("/api/bookings")
@Tag(name = "Customer bookings", description = "Create, pay, cancel and return bookings (authenticated)")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @Operation(summary = "Create a booking",
        description = "Validates overlapping bookings, reserves the outfit and calculates the total "
            + "(fixed rental price for the outfit's rental period + refundable deposit). "
            + "The return date is derived server-side: wedding wear → 5 days, all other "
            + "outfits → 3 days from the start date. Booking starts as PENDING.")
    public ResponseEntity<BookingResponse> create(@Valid @RequestBody BookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.create(request));
    }

    @GetMapping("/my")
    @Operation(summary = "My bookings")
    public ResponseEntity<List<BookingResponse>> myBookings() {
        return ResponseEntity.ok(bookingService.myBookings());
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel a booking", description = "Allowed only for PENDING or CONFIRMED bookings.")
    public ResponseEntity<BookingResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancel(id));
    }

    @PostMapping("/{id}/pay")
    @Operation(summary = "Pay for a booking (mock)",
        description = "Success → payment PAID, booking CONFIRMED, notifications sent. "
            + "Failure (simulateFailure=true) → payment FAILED, booking CANCELLED, outfit released.")
    public ResponseEntity<BookingResponse> pay(@PathVariable Long id,
                                               @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(bookingService.pay(id, request));
    }

    @PostMapping("/{id}/return")
    @Operation(summary = "Report a return", description = "Marks the outfit as RETURNED and notifies the admin for inspection.")
    public ResponseEntity<BookingResponse> requestReturn(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.requestReturn(id));
    }
}
