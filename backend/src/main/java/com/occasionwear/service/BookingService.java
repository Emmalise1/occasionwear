package com.occasionwear.service;

import com.occasionwear.dto.BookingRequest;
import com.occasionwear.dto.BookingResponse;
import com.occasionwear.dto.InspectionRequest;
import com.occasionwear.dto.PaymentRequest;
import com.occasionwear.dto.ReturnItemResponse;
import com.occasionwear.entity.Admin;
import com.occasionwear.entity.Booking;
import com.occasionwear.entity.Customer;
import com.occasionwear.entity.Delivery;
import com.occasionwear.entity.Outfit;
import com.occasionwear.entity.Payment;
import com.occasionwear.entity.enums.BookingStatus;
import com.occasionwear.entity.enums.OutfitStatus;
import com.occasionwear.entity.enums.PaymentStatus;
import com.occasionwear.entity.enums.ReturnCondition;
import com.occasionwear.exception.BadRequestException;
import com.occasionwear.exception.BusinessException;
import com.occasionwear.exception.NotFoundException;
import com.occasionwear.mapper.BookingMapper;
import com.occasionwear.repository.AdminRepository;
import com.occasionwear.repository.BookingRepository;
import com.occasionwear.repository.OutfitRepository;
import com.occasionwear.security.AuthFacade;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Booking lifecycle and every mandatory business rule (1–7).
 * Controllers stay thin; all state transitions happen here.
 */
@Service
public class BookingService {

    private static final List<BookingStatus> BLOCKING_STATUSES =
        List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE);

    private final BookingRepository bookingRepository;
    private final OutfitRepository outfitRepository;
    private final AdminRepository adminRepository;
    private final NotificationService notificationService;
    private final AuthFacade authFacade;
    private final BigDecimal defaultLateFeePerDay;

    public BookingService(BookingRepository bookingRepository,
                          OutfitRepository outfitRepository,
                          AdminRepository adminRepository,
                          NotificationService notificationService,
                          AuthFacade authFacade,
                          @Value("${occasionwear.fees.late-per-day}") BigDecimal defaultLateFeePerDay) {
        this.bookingRepository = bookingRepository;
        this.outfitRepository = outfitRepository;
        this.adminRepository = adminRepository;
        this.notificationService = notificationService;
        this.authFacade = authFacade;
        this.defaultLateFeePerDay = defaultLateFeePerDay;
    }

    // ================================================================ customer

    /** Business rules 1 & 2 — availability by overlapping bookings, pricing, PENDING + RESERVED. */
    @Transactional
    public BookingResponse create(BookingRequest request) {
        Customer customer = authFacade.currentCustomer();
        Outfit outfit = outfitRepository.findById(request.outfitId())
            .orElseThrow(() -> new NotFoundException("Outfit not found with id " + request.outfitId() + "."));

        LocalDate startDate = request.startDate();

        if (startDate == null) {
            throw new BadRequestException("INVALID_DATE_RANGE", "Start date must be provided.");
        }
        if (startDate.isBefore(LocalDate.now())) {
            throw new BadRequestException("INVALID_DATE_RANGE", "Start date cannot be in the past.");
        }

        // Fixed rental period: wedding wear → 5 days, all other outfits → 3 days.
        // The expected return date is derived by the server — customers only pick the start date.
        int rentalPeriodDays = outfit.getRentalPeriodDays();
        LocalDate endDate = startDate.plusDays(rentalPeriodDays);
        if (request.endDate() != null && !endDate.equals(request.endDate())) {
            throw new BadRequestException("INVALID_RENTAL_PERIOD",
                "The rental period for this outfit is fixed at " + rentalPeriodDays
                    + " day(s). Booking from " + startDate + " must be returned on " + endDate + ".");
        }

        // Rule 1: reject overlapping bookings (endpoints inclusive).
        // Any still-ACTIVE rental blocks the outfit outright — even an overdue one whose
        // original dates have passed (the outfit has not physically come back yet).
        long overlaps = bookingRepository.countOverlapping(outfit.getId(), startDate, endDate, BLOCKING_STATUSES);
        long activeRentals = bookingRepository.countByOutfitIdAndStatus(outfit.getId(), BookingStatus.ACTIVE);
        if (overlaps > 0
            || activeRentals > 0
            || outfit.getStatus() == OutfitStatus.RETIRED
            || outfit.getStatus() == OutfitStatus.DAMAGED) {
            throw BusinessException.conflict("OUTFIT_UNAVAILABLE",
                "This outfit is already booked for the selected dates.");
        }

        // Rule 2 — price the rental and hold the outfit.
        // The rental price is a FIXED total for the agreed rental period — it is
        // never multiplied by the number of days. The customer pays the rental
        // price once plus the refundable deposit.
        BigDecimal rentalTotal = outfit.getRentalPrice();
        BigDecimal deposit = outfit.getDepositAmount();

        Booking booking = new Booking();
        booking.setReference(generateReference());
        booking.setStartDate(startDate);
        booking.setEndDate(endDate);
        booking.setCustomer(customer);
        booking.setOutfit(outfit);
        booking.setTotalAmount(rentalTotal.add(deposit));
        booking.setAdmin(adminRepository.findFirstByOrderByIdAsc().orElse(null));
        booking.create(); // → PENDING

        Payment payment = new Payment();
        payment.setAmount(rentalTotal);
        payment.setDeposit(deposit);
        payment.setBooking(booking);
        booking.setPayment(payment);

        if (request.deliveryAddress() != null && !request.deliveryAddress().isBlank()) {
            Delivery delivery = new Delivery();
            delivery.setAddress(request.deliveryAddress().trim());
            delivery.schedule(startDate);
            delivery.setBooking(booking);
            booking.setDelivery(delivery);
        }

        outfit.updateStatus(OutfitStatus.RESERVED);
        outfitRepository.save(outfit);
        Booking saved = bookingRepository.save(booking);
        return BookingMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> myBookings() {
        Customer customer = authFacade.currentCustomer();
        return bookingRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId()).stream()
            .map(BookingMapper::toResponse)
            .toList();
    }

    /** Business rule 7 — only PENDING or CONFIRMED bookings may be cancelled by the customer. */
    @Transactional
    public BookingResponse cancel(Long bookingId) {
        Customer customer = authFacade.currentCustomer();
        Booking booking = findOwned(bookingId, customer);

        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw BusinessException.conflict("INVALID_STATE_TRANSITION",
                "Only pending or confirmed bookings can be cancelled.");
        }

        booking.cancel();
        if (booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatus.PAID) {
            booking.getPayment().refund();
        }

        Outfit outfit = booking.getOutfit();
        if (outfit.getStatus() == OutfitStatus.RESERVED) {
            outfit.updateStatus(OutfitStatus.AVAILABLE);
            outfitRepository.save(outfit);
        }

        notificationService.notifyCustomer(customer,
            "Your booking " + booking.getReference() + " for " + outfit.getName() + " has been cancelled.");

        return BookingMapper.toResponse(bookingRepository.save(booking));
    }

    /** Business rules 3 & 4 — successful and failed mock payments. */
    @Transactional
    public BookingResponse pay(Long bookingId, PaymentRequest request) {
        Customer customer = authFacade.currentCustomer();
        Booking booking = findOwned(bookingId, customer);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw BusinessException.conflict("INVALID_STATE_TRANSITION",
                "This booking cannot be paid for in its current state.");
        }
        Payment payment = booking.getPayment();
        if (payment == null) {
            throw BusinessException.conflict("PAYMENT_MISSING", "This booking has no payment record.");
        }

        Outfit outfit = booking.getOutfit();
        String reference = booking.getReference();

        if (request.shouldFail()) {
            // Rule 4 — failed payment
            payment.fail(request.method());
            booking.cancel();
            if (outfit.getStatus() == OutfitStatus.RESERVED) {
                outfit.updateStatus(OutfitStatus.AVAILABLE);
                outfitRepository.save(outfit);
            }
            notificationService.notifyCustomer(customer,
                "Payment failed for booking " + reference + ". Your booking has been cancelled and "
                    + outfit.getName() + " released.");
            bookingRepository.save(booking);
            return BookingMapper.toResponse(booking);
        }

        // Rule 3 — successful payment
        payment.process(request.method());
        booking.setStatus(BookingStatus.CONFIRMED);

        String message = "Payment received. Booking " + reference + " for " + outfit.getName()
            + " (" + booking.getStartDate() + " → " + booking.getEndDate() + ") is confirmed.";
        notificationService.notifyCustomer(customer, message);
        if (booking.getAdmin() != null) {
            notificationService.notifyAdmin(booking.getAdmin(),
                "New confirmed booking " + reference + " (" + customer.getName() + " / " + outfit.getName() + ").");
        }

        return BookingMapper.toResponse(bookingRepository.save(booking));
    }

    /** Customer reports the outfit as returned → admin inspection follows. */
    @Transactional
    public BookingResponse requestReturn(Long bookingId) {
        Customer customer = authFacade.currentCustomer();
        Booking booking = findOwned(bookingId, customer);

        if (booking.getStatus() != BookingStatus.ACTIVE) {
            throw BusinessException.conflict("INVALID_STATE_TRANSITION",
                "Only active rentals can be returned.");
        }

        // Record the actual return date — the late-fee policy is calculated from it.
        booking.setReturnDate(LocalDate.now());

        Outfit outfit = booking.getOutfit();
        outfit.updateStatus(OutfitStatus.RETURNED);
        outfitRepository.save(outfit);

        Admin admin = booking.getAdmin() != null ? booking.getAdmin()
            : adminRepository.findFirstByOrderByIdAsc().orElse(null);
        if (admin != null) {
            notificationService.notifyAdmin(admin,
                "Return reported for booking " + booking.getReference() + " (" + outfit.getName()
                    + "). Inspection required.");
        }

        return BookingMapper.toResponse(booking);
    }

    // ==================================================================== admin

    @Transactional(readOnly = true)
    public List<BookingResponse> adminList(BookingStatus status) {
        List<Booking> bookings = status == null
            ? bookingRepository.findAllByOrderByCreatedAtDesc()
            : bookingRepository.findByStatusOrderByCreatedAtDesc(status);
        return bookings.stream().map(BookingMapper::toResponse).toList();
    }

    /** Admin approval: PENDING → CONFIRMED. */
    @Transactional
    public BookingResponse approve(Long bookingId) {
        Admin admin = authFacade.currentAdmin();
        Booking booking = find(bookingId);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw BusinessException.conflict("INVALID_STATE_TRANSITION",
                "Only pending bookings can be approved.");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setAdmin(admin);

        notificationService.notifyCustomer(booking.getCustomer(),
            "Booking " + booking.getReference() + " has been approved and is ready for pickup.");

        return BookingMapper.toResponse(bookingRepository.save(booking));
    }

    /** Business rule 5 — admin confirms pickup: CONFIRMED → ACTIVE, outfit → RENTED_OUT. */
    @Transactional
    public BookingResponse confirmPickup(Long bookingId) {
        authFacade.currentAdmin();
        Booking booking = find(bookingId);

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw BusinessException.conflict("INVALID_STATE_TRANSITION",
                "Only confirmed bookings can be handed over to the customer.");
        }

        booking.setStatus(BookingStatus.ACTIVE);
        Outfit outfit = booking.getOutfit();
        outfit.updateStatus(OutfitStatus.RENTED_OUT);
        outfitRepository.save(outfit);

        if (booking.getDelivery() != null) {
            booking.getDelivery().deliver();
        }

        notificationService.notifyCustomer(booking.getCustomer(),
            "Pickup confirmed for booking " + booking.getReference() + ". Enjoy "
                + outfit.getName() + "! Please return it by " + booking.getEndDate() + ".");

        return BookingMapper.toResponse(bookingRepository.save(booking));
    }

    /** ACTIVE bookings awaiting return, with a server-calculated fee preview. */
    @Transactional(readOnly = true)
    public List<ReturnItemResponse> returnsAwaiting() {
        LocalDate today = LocalDate.now();
        return bookingRepository.findByStatusOrderByCreatedAtDesc(BookingStatus.ACTIVE).stream()
            .map(booking -> {
                long overdue = LateFeePolicy.overdueDays(booking.getEndDate(), today);
                long chargeable = LateFeePolicy.chargeableLateDays(booking.getEndDate(), today);
                BigDecimal perDay = lateFeePerDayFor(booking.getOutfit());
                BigDecimal preview = LateFeePolicy.lateFee(chargeable, perDay);
                return new ReturnItemResponse(
                    BookingMapper.toResponse(booking),
                    booking.getEndDate(),
                    booking.getOutfit().getRentalPeriodDays(),
                    (int) overdue,
                    (int) chargeable,
                    perDay,
                    preview
                );
            })
            .toList();
    }

    /** Business rule 6 — return inspection with late/damage fees. */
    @Transactional
    public BookingResponse inspectReturn(Long bookingId, InspectionRequest request) {
        authFacade.currentAdmin();
        Booking booking = find(bookingId);

        if (booking.getStatus() != BookingStatus.ACTIVE) {
            throw BusinessException.conflict("INVALID_STATE_TRANSITION",
                "Only active rentals can be inspected.");
        }

        Payment payment = booking.getPayment();
        Outfit outfit = booking.getOutfit();

        // Actual return date: recorded when the customer reported the return,
        // otherwise the date the admin performs the inspection.
        LocalDate actualReturn = booking.getReturnDate() != null ? booking.getReturnDate() : LocalDate.now();
        booking.setReturnDate(actualReturn);

        long overdue = LateFeePolicy.overdueDays(booking.getEndDate(), actualReturn);
        long chargeable = LateFeePolicy.chargeableLateDays(booking.getEndDate(), actualReturn);
        BigDecimal perDay = lateFeePerDayFor(outfit);
        BigDecimal lateFee = LateFeePolicy.lateFee(chargeable, perDay);

        BigDecimal feeApplied = BigDecimal.ZERO;
        String feeDetail = "";

        switch (request.condition()) {
            case GOOD_ON_TIME -> {
                outfit.updateStatus(OutfitStatus.AVAILABLE);
            }
            case LATE -> {
                // On-time returns are free; every day beyond the expected return date
                // is charged at the outfit's per-day late fee (standard 2,000 RWF).
                if (payment != null && lateFee.signum() > 0) {
                    payment.applyLateFee(lateFee);
                }
                feeApplied = lateFee;
                feeDetail = feeBreakdown(booking.getEndDate(), actualReturn, overdue, chargeable, lateFee, perDay);
                outfit.updateStatus(OutfitStatus.AVAILABLE);
            }
            case DAMAGED -> {
                BigDecimal damageFee = request.damageFee();
                if (damageFee == null || damageFee.signum() <= 0) {
                    throw new BadRequestException(
                        "DAMAGE_FEE_REQUIRED", "A positive damage fee is required for DAMAGED inspections.");
                }
                if (payment != null) {
                    payment.applyDamageFee(damageFee);
                    // Damage charges are separate, but a damaged return that is also
                    // late carries both fees.
                    if (lateFee.signum() > 0) {
                        payment.applyLateFee(lateFee);
                    }
                }
                feeApplied = damageFee.add(lateFee);
                feeDetail = " Damage fee: " + damageFee + " RWF."
                    + (lateFee.signum() > 0
                        ? " " + feeBreakdown(booking.getEndDate(), actualReturn, overdue, chargeable, lateFee, perDay)
                        : "");
                outfit.updateStatus(OutfitStatus.DAMAGED);
            }
        }

        outfitRepository.save(outfit);
        booking.confirmReturn(); // → COMPLETED
        // totalAmountDue = fixed rental price + refundable deposit + late fee + damage fee.
        if (payment != null) {
            booking.setTotalAmount(payment.getAmountDue());
        }

        String feeText = feeApplied.signum() > 0
            ? " Fees applied: " + feeApplied + " RWF." + feeDetail
            : " No fee applied."
                + (request.condition() == ReturnCondition.LATE
                    ? " The outfit was returned on or before the expected return date."
                    : "");
        notificationService.notifyCustomer(booking.getCustomer(),
            "Return inspected for booking " + booking.getReference() + " (" + outfit.getName()
                + "). Condition: " + request.condition() + "." + feeText);

        return BookingMapper.toResponse(bookingRepository.save(booking));
    }

    /** Human-readable late-fee breakdown, e.g. "Late fee: 6,000 RWF — 3 chargeable day(s) at 2,000 RWF/day." */
    private String feeBreakdown(LocalDate endDate, LocalDate actualReturn, long overdue,
                                long chargeable, BigDecimal lateFee, BigDecimal perDay) {
        return "Late fee: " + lateFee + " RWF — expected return date " + endDate
            + ", actual return date " + actualReturn
            + ", " + overdue + " day(s) overdue, "
            + chargeable + " chargeable late day(s) at " + perDay + " RWF/day.";
    }

    /** The outfit's per-day late fee, falling back to the configured standard rate. */
    private BigDecimal lateFeePerDayFor(Outfit outfit) {
        BigDecimal perDay = outfit == null ? null : outfit.getLateFeePerDay();
        return perDay != null && perDay.signum() > 0 ? perDay : defaultLateFeePerDay;
    }

    // ================================================================= helpers

    private Booking find(Long id) {
        return bookingRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Booking not found with id " + id + "."));
    }

    private Booking findOwned(Long id, Customer customer) {
        return bookingRepository.findByIdAndCustomerId(id, customer.getId())
            .orElseThrow(() -> new NotFoundException("Booking not found."));
    }

    private String generateReference() {
        String code = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        String reference = "OW-" + code;
        while (bookingRepository.existsByReference(reference)) {
            code = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
            reference = "OW-" + code;
        }
        return reference;
    }
}
