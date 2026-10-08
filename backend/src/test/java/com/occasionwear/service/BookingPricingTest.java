package com.occasionwear.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.occasionwear.dto.BookingRequest;
import com.occasionwear.dto.BookingResponse;
import com.occasionwear.dto.InspectionRequest;
import com.occasionwear.dto.ReturnItemResponse;
import com.occasionwear.entity.Admin;
import com.occasionwear.entity.Booking;
import com.occasionwear.entity.Customer;
import com.occasionwear.entity.Outfit;
import com.occasionwear.entity.Payment;
import com.occasionwear.entity.enums.BookingStatus;
import com.occasionwear.entity.enums.OutfitCategory;
import com.occasionwear.entity.enums.OutfitStatus;
import com.occasionwear.entity.enums.PaymentStatus;
import com.occasionwear.entity.enums.ReturnCondition;
import com.occasionwear.exception.BadRequestException;
import com.occasionwear.repository.AdminRepository;
import com.occasionwear.repository.BookingRepository;
import com.occasionwear.repository.OutfitRepository;
import com.occasionwear.security.AuthFacade;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Verifies the fixed-rental-price booking rules end to end at the service layer:
 *
 * <pre>
 * rental period  = 5 days for wedding wear, 3 days for everything else
 * expected return = startDate + rentalPeriodDays   (server-derived)
 * totalAmountDue  = fixedRentalPrice + refundableDeposit + lateFee + damageFee
 * lateFee         = max(0, actualReturn - expectedReturn) × 2,000 RWF
 * </pre>
 *
 * The rental price is NEVER multiplied by the number of rental days.
 */
class BookingPricingTest {

    /** Future start date — booking creation rejects past dates. */
    private static final LocalDate START = LocalDate.now().plusDays(30);
    private static final BigDecimal LATE_FEE_PER_DAY = new BigDecimal("2000");

    private BookingRepository bookingRepository;
    private OutfitRepository outfitRepository;
    private AdminRepository adminRepository;
    private NotificationService notificationService;
    private AuthFacade authFacade;
    private BookingService service;

    private Customer customer;
    private Admin admin;

    @BeforeEach
    void setUp() {
        bookingRepository = mock(BookingRepository.class);
        outfitRepository = mock(OutfitRepository.class);
        adminRepository = mock(AdminRepository.class);
        notificationService = mock(NotificationService.class);
        authFacade = mock(AuthFacade.class);
        service = new BookingService(bookingRepository, outfitRepository, adminRepository,
            notificationService, authFacade, LATE_FEE_PER_DAY);

        customer = new Customer();
        customer.setId(1L);
        customer.setName("Aline Uwase");
        customer.setEmail("customer@demo.com");
        customer.setPhone("+250 788 123 456");
        customer.setAddress("Kigali");
        when(authFacade.currentCustomer()).thenReturn(customer);

        admin = new Admin();
        admin.setId(2L);
        admin.setName("Eric Mugisha");
        admin.setEmail("admin@demo.com");
    }

    // ------------------------------------------------------------------ helpers

    private Outfit outfit(OutfitCategory category, String rentalPrice, String deposit) {
        Outfit outfit = new Outfit();
        outfit.setId(10L);
        outfit.setName("Test Outfit");
        outfit.setCategory(category);
        outfit.setSize("M");
        outfit.setColor("White");
        outfit.setRentalPrice(new BigDecimal(rentalPrice));
        outfit.setRentalPeriodDays(RentalPeriods.defaultDays(category));
        outfit.setDepositAmount(new BigDecimal(deposit));
        outfit.setStatus(OutfitStatus.AVAILABLE);
        outfit.setImageUrl("/images/test.jpg");
        return outfit;
    }

    private void stubCreate(Outfit outfit) {
        when(outfitRepository.findById(10L)).thenReturn(Optional.of(outfit));
        when(outfitRepository.save(any(Outfit.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bookingRepository.countOverlapping(anyLong(), any(LocalDate.class), any(LocalDate.class), anyList()))
            .thenReturn(0L);
        when(bookingRepository.countByOutfitIdAndStatus(anyLong(), any(BookingStatus.class))).thenReturn(0L);
        when(adminRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(admin));
    }

    private void assertMoney(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual),
            "expected " + expected + " RWF but was " + actual);
    }

    // ------------------------------------------------------------ create: price

    @Test
    void weddingOutfitChargesTheFixedPriceOnceForFiveDays() {
        // Spec example: Luxury Bridal Wedding Gown — 700,000 RWF, 5 days, 350,000 deposit.
        Outfit gown = outfit(OutfitCategory.BRIDAL_WEDDING_GOWNS, "700000", "350000");
        stubCreate(gown);

        BookingResponse response = service.create(new BookingRequest(10L, START, null, null));

        assertEquals(START.plusDays(5), response.endDate(), "wedding outfit: return = start + 5 days");
        assertMoney("1050000", response.totalAmount()); // 700,000 + 350,000 — NOT 700,000 × 5
        assertMoney("700000", response.payment().amount());
        assertMoney("350000", response.payment().deposit());
    }

    @Test
    void nonWeddingOutfitChargesTheFixedPriceOnceForThreeDays() {
        // Spec example: graduation suit — 180,000 RWF, 3 days, 70,000 deposit.
        Outfit suit = outfit(OutfitCategory.GRADUATION, "180000", "70000");
        stubCreate(suit);

        BookingResponse response = service.create(new BookingRequest(10L, START, null, null));

        assertEquals(START.plusDays(3), response.endDate(), "other outfit: return = start + 3 days");
        assertMoney("250000", response.totalAmount()); // 180,000 + 70,000 — NOT 180,000 × 3
        assertMoney("180000", response.payment().amount());
        assertMoney("70000", response.payment().deposit());
    }

    @Test
    void bridalShowerGetsTheThreeDayPeriodNotFive() {
        Outfit shower = outfit(OutfitCategory.BRIDAL_SHOWER, "150000", "70000");
        stubCreate(shower);

        BookingResponse response = service.create(new BookingRequest(10L, START, null, null));

        assertEquals(START.plusDays(3), response.endDate(),
            "Bridal Shower is not wedding wear for the period rule");
        assertMoney("220000", response.totalAmount());
    }

    @Test
    void weddingGuestOutfitGetsTheFiveDayPeriod() {
        Outfit guest = outfit(OutfitCategory.WEDDING_GUEST, "150000", "60000");
        stubCreate(guest);

        BookingResponse response = service.create(new BookingRequest(10L, START, null, null));

        assertEquals(START.plusDays(5), response.endDate());
        assertMoney("210000", response.totalAmount());
    }

    @Test
    void aEndDateOutsideTheFixedPeriodIsRejected() {
        Outfit gown = outfit(OutfitCategory.BRIDAL_WEDDING_GOWNS, "700000", "350000");
        stubCreate(gown);

        BadRequestException ex = assertThrows(BadRequestException.class,
            () -> service.create(new BookingRequest(10L, START, START.plusDays(9), null)));
        assertTrue(ex.getMessage().toLowerCase().contains("rental period"),
            "error should explain the fixed rental period, was: " + ex.getMessage());
    }

    // -------------------------------------------------------------- inspection

    private Booking activeBooking(Outfit outfit, LocalDate expectedReturn, LocalDate actualReturn) {
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setReference("OW-TEST01");
        booking.setStartDate(expectedReturn.minusDays(outfit.getRentalPeriodDays()));
        booking.setEndDate(expectedReturn);
        booking.setReturnDate(actualReturn);
        booking.setCustomer(customer);
        booking.setOutfit(outfit);
        booking.setStatus(BookingStatus.ACTIVE);

        Payment payment = new Payment();
        payment.setAmount(outfit.getRentalPrice());
        payment.setDeposit(outfit.getDepositAmount());
        payment.setStatus(PaymentStatus.PAID);
        payment.setBooking(booking);
        booking.setPayment(payment);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
        when(outfitRepository.save(any(Outfit.class))).thenAnswer(inv -> inv.getArgument(0));
        when(authFacade.currentAdmin()).thenReturn(admin);
        return booking;
    }

    @Test
    void lateReturnChargesTwoThousandRwfPerExtraDay() {
        Outfit gown = outfit(OutfitCategory.BRIDAL_WEDDING_GOWNS, "700000", "350000");
        // Due 15 June, returned 18 June → 3 chargeable days → 6,000 RWF.
        Booking booking = activeBooking(gown, LocalDate.of(2026, 6, 15), LocalDate.of(2026, 6, 18));

        service.inspectReturn(1L, new InspectionRequest(ReturnCondition.LATE, null));

        assertMoney("6000", booking.getPayment().getLateFee());
        assertMoney("0", booking.getPayment().getDamageFee());
        // totalAmountDue = 700,000 + 350,000 + 6,000
        assertMoney("1056000", booking.getTotalAmount());
        assertEquals(BookingStatus.COMPLETED, booking.getStatus());
        assertEquals(OutfitStatus.AVAILABLE, gown.getStatus());
    }

    @Test
    void onTimeReturnChargesNoLateFee() {
        Outfit gown = outfit(OutfitCategory.BRIDAL_WEDDING_GOWNS, "700000", "350000");
        // Due 15 June, returned 15 June (within the 5-day period) → no fee, no grace needed.
        Booking booking = activeBooking(gown, LocalDate.of(2026, 6, 15), LocalDate.of(2026, 6, 15));

        service.inspectReturn(1L, new InspectionRequest(ReturnCondition.LATE, null));

        assertMoney("0", booking.getPayment().getLateFee());
        assertMoney("1050000", booking.getTotalAmount());
    }

    @Test
    void lateAndDamageFeesBothApplyAndAreIncludedInTotal() {
        Outfit suit = outfit(OutfitCategory.GRADUATION, "180000", "70000");
        // Due 13 June, returned 15 June → 2 chargeable days → 4,000 RWF + 20,000 damage.
        Booking booking = activeBooking(suit, LocalDate.of(2026, 6, 13), LocalDate.of(2026, 6, 15));

        service.inspectReturn(1L, new InspectionRequest(ReturnCondition.DAMAGED, new BigDecimal("20000")));

        assertMoney("4000", booking.getPayment().getLateFee());
        assertMoney("20000", booking.getPayment().getDamageFee());
        // totalAmountDue = 180,000 + 70,000 + 4,000 + 20,000
        assertMoney("274000", booking.getTotalAmount());
        assertEquals(OutfitStatus.DAMAGED, suit.getStatus());
    }

    // --------------------------------------------------------- fee preview

    @Test
    void returnPreviewUsesOutfitPeriodAndPerDayFee() {
        Outfit gown = outfit(OutfitCategory.BRIDAL_WEDDING_GOWNS, "700000", "350000");
        Booking booking = activeBooking(gown, LocalDate.of(2026, 6, 15), null);
        when(bookingRepository.findByStatusOrderByCreatedAtDesc(BookingStatus.ACTIVE))
            .thenReturn(List.of(booking));

        List<ReturnItemResponse> items = service.returnsAwaiting();

        assertEquals(1, items.size());
        ReturnItemResponse item = items.get(0);
        assertEquals(LocalDate.of(2026, 6, 15), item.expectedReturn());
        assertEquals(5, item.rentalPeriodDays());
        assertEquals(LATE_FEE_PER_DAY, item.lateFeePerDay());
        // preview is calculated for "today" — only assert the invariant that
        // chargeable days equal overdue days (no grace allowance).
        assertEquals(item.overdueDays(), item.chargeableLateDays());
        assertEquals(0, item.lateFeePreview()
            .compareTo(BigDecimal.valueOf(item.chargeableLateDays()).multiply(LATE_FEE_PER_DAY)));
    }
}
