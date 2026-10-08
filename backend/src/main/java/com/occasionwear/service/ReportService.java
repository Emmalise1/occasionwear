package com.occasionwear.service;

import com.occasionwear.dto.ReportSummaryResponse;
import com.occasionwear.entity.Booking;
import com.occasionwear.entity.Outfit;
import com.occasionwear.entity.Payment;
import com.occasionwear.entity.enums.BookingStatus;
import com.occasionwear.entity.enums.OutfitStatus;
import com.occasionwear.entity.enums.PaymentStatus;
import com.occasionwear.repository.BookingRepository;
import com.occasionwear.repository.OutfitRepository;
import com.occasionwear.repository.PaymentRepository;
import com.occasionwear.security.AuthFacade;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Aggregated statistics for the admin dashboard and reports page. */
@Service
public class ReportService {

    private final BookingRepository bookingRepository;
    private final OutfitRepository outfitRepository;
    private final PaymentRepository paymentRepository;
    private final AuthFacade authFacade;

    public ReportService(BookingRepository bookingRepository,
                         OutfitRepository outfitRepository,
                         PaymentRepository paymentRepository,
                         AuthFacade authFacade) {
        this.bookingRepository = bookingRepository;
        this.outfitRepository = outfitRepository;
        this.paymentRepository = paymentRepository;
        this.authFacade = authFacade;
    }

    @Transactional(readOnly = true)
    public ReportSummaryResponse summary() {
        authFacade.currentAdmin();

        List<Booking> bookings = bookingRepository.findAll();
        List<Outfit> outfits = outfitRepository.findAll();

        Map<String, Long> bookingsByStatus = new LinkedHashMap<>();
        for (BookingStatus status : BookingStatus.values()) {
            bookingsByStatus.put(status.name(), bookings.stream()
                .filter(b -> b.getStatus() == status).count());
        }

        Map<String, Long> outfitsByStatus = new LinkedHashMap<>();
        EnumMap<OutfitStatus, Long> statusCounts = new EnumMap<>(OutfitStatus.class);
        for (OutfitStatus status : OutfitStatus.values()) {
            statusCounts.put(status, 0L);
        }
        outfits.forEach(o -> statusCounts.merge(o.getStatus(), 1L, Long::sum));
        for (OutfitStatus status : OutfitStatus.values()) {
            outfitsByStatus.put(status.name(), statusCounts.get(status));
        }

        List<Payment> paidPayments = paymentRepository.findByStatus(PaymentStatus.PAID);
        BigDecimal totalRevenue = paidPayments.stream()
            .map(Payment::getRevenue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // revenue over time, grouped by calendar day, oldest first
        Map<LocalDate, BigDecimal> byDay = new TreeMap<>();
        for (Payment payment : paidPayments) {
            LocalDateTime paidAt = payment.getPaymentDate();
            if (paidAt == null) continue;
            byDay.merge(paidAt.toLocalDate(), payment.getRevenue(), BigDecimal::add);
        }
        List<ReportSummaryResponse.DailyRevenue> revenueOverTime = new ArrayList<>();
        byDay.forEach((date, amount) -> revenueOverTime.add(new ReportSummaryResponse.DailyRevenue(date, amount)));
        revenueOverTime.sort(Comparator.comparing(ReportSummaryResponse.DailyRevenue::date));

        long activeRentals = bookingsByStatus.getOrDefault(BookingStatus.ACTIVE.name(), 0L);

        return new ReportSummaryResponse(
            bookings.size(),
            bookingsByStatus,
            outfitsByStatus,
            totalRevenue,
            activeRentals,
            statusCounts.getOrDefault(OutfitStatus.DAMAGED, 0L),
            statusCounts.getOrDefault(OutfitStatus.AVAILABLE, 0L),
            statusCounts.getOrDefault(OutfitStatus.RENTED_OUT, 0L),
            bookingsByStatus.getOrDefault(BookingStatus.PENDING.name(), 0L),
            revenueOverTime
        );
    }
}
