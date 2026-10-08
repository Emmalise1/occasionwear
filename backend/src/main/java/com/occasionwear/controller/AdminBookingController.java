package com.occasionwear.controller;

import com.occasionwear.dto.BookingResponse;
import com.occasionwear.dto.InspectionRequest;
import com.occasionwear.dto.ReturnItemResponse;
import com.occasionwear.entity.enums.BookingStatus;
import com.occasionwear.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Admin booking operations — every endpoint requires the ADMIN role. */
@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin — bookings & returns", description = "Approve bookings, confirm pickups, inspect returns (ADMIN only)")
public class AdminBookingController {

    private final BookingService bookingService;

    public AdminBookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/bookings")
    @Operation(summary = "List bookings", description = "Optionally filter by status.")
    public ResponseEntity<List<BookingResponse>> list(
        @Parameter(description = "Booking status filter") @RequestParam(required = false) BookingStatus status) {
        return ResponseEntity.ok(bookingService.adminList(status));
    }

    @PatchMapping("/bookings/{id}/approve")
    @Operation(summary = "Approve a booking", description = "PENDING → CONFIRMED.")
    public ResponseEntity<BookingResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.approve(id));
    }

    @PostMapping("/bookings/{id}/pickup")
    @Operation(summary = "Confirm pickup / handover",
        description = "Business rule 5: CONFIRMED → ACTIVE and outfit → RENTED_OUT.")
    public ResponseEntity<BookingResponse> confirmPickup(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.confirmPickup(id));
    }

    @GetMapping("/returns")
    @Operation(summary = "Returns awaiting inspection",
        description = "ACTIVE bookings with expected return date and a calculated late-fee preview.")
    public ResponseEntity<List<ReturnItemResponse>> returnsAwaiting() {
        return ResponseEntity.ok(bookingService.returnsAwaiting());
    }

    @PostMapping("/returns/{bookingId}/inspect")
    @Operation(summary = "Inspect a returned outfit",
        description = "GOOD_ON_TIME → no fee; LATE → late fee applied; DAMAGED → damage fee applied. "
            + "Booking becomes COMPLETED and the outfit is released, repaired or retired.")
    public ResponseEntity<BookingResponse> inspect(
        @PathVariable Long bookingId,
        @Valid @RequestBody InspectionRequest request) {
        return ResponseEntity.ok(bookingService.inspectReturn(bookingId, request));
    }
}
