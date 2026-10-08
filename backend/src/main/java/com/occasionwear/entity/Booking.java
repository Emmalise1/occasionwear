package com.occasionwear.entity;

import com.occasionwear.entity.enums.BookingStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * A reservation of an outfit for a date range.
 * Payment is compositionally owned by the booking — it never exists on its own.
 */
@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-readable booking reference shown to customers, e.g. OW-8F3K2D. */
    @Column(unique = true, length = 20)
    private String reference;

    @NotNull(message = "Start date is required")
    @Column(nullable = false)
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    @Column(nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status;

    /** Actual date the customer returned the outfit (set when a return is reported/inspected). */
    @Column(name = "return_date")
    private LocalDate returnDate;

    /** Amount due at checkout: rental total + refundable deposit. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "admin_id")
    private Admin admin;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "outfit_id", nullable = false)
    private Outfit outfit;

    /** Owned by this booking — cascaded, orphan-removed with it. */
    @OneToOne(fetch = FetchType.EAGER, cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @OneToOne(fetch = FetchType.EAGER, cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "delivery_id")
    private Delivery delivery;

    /** Begin a new booking: PENDING, stamped with creation time. */
    public void create() {
        this.createdAt = LocalDateTime.now();
        this.status = BookingStatus.PENDING;
    }

    /** Business rule 7 — cancellation (preconditions are validated by the service). */
    public void cancel() {
        this.status = BookingStatus.CANCELLED;
    }

    /** Business rule 6 — return accepted, rental finished. */
    public void confirmReturn() {
        this.status = BookingStatus.COMPLETED;
    }

    /** Fees applied so far (late + damage). */
    public BigDecimal calculateFees() {
        if (payment == null) {
            return BigDecimal.ZERO;
        }
        return payment.getLateFee().add(payment.getDamageFee());
    }

    /** Fees an inspection would apply for the given condition inputs. */
    public BigDecimal calculateFees(int lateDays, BigDecimal lateFeePerDay, BigDecimal damageFee) {
        BigDecimal late = BigDecimal.valueOf(Math.max(lateDays, 0)).multiply(lateFeePerDay);
        return late.add(damageFee == null ? BigDecimal.ZERO : damageFee);
    }

    /** Inclusive rental days: Dec 20 → Dec 22 counts as 3 days. */
    public long rentalDays() {
        if (startDate == null || endDate == null || startDate.isAfter(endDate)) {
            return 0;
        }
        return ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }

    /**
     * True when this booking blocks the given date range for new bookings.
     *
     * <p>ACTIVE bookings block <em>any</em> range while the outfit is physically
     * unreturned — including after the expected return date. A late return only
     * adds a per-day fee; it never makes the outfit bookable again before inspection.
     */
    public boolean blocksDates(LocalDate startDate, LocalDate endDate) {
        if (status == null
            || status == BookingStatus.CANCELLED
            || status == BookingStatus.COMPLETED) {
            return false;
        }
        if (status == BookingStatus.ACTIVE) {
            return true; // outfit still with the customer until inspection
        }
        // overlap: this booking starts no later than the range ends AND ends no earlier than it starts
        return !this.startDate.isAfter(endDate) && !this.endDate.isBefore(startDate);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }
    public LocalDate getReturnDate() { return returnDate; }
    public void setReturnDate(LocalDate returnDate) { this.returnDate = returnDate; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public Admin getAdmin() { return admin; }
    public void setAdmin(Admin admin) { this.admin = admin; }
    public Outfit getOutfit() { return outfit; }
    public void setOutfit(Outfit outfit) { this.outfit = outfit; }
    public Payment getPayment() { return payment; }
    public void setPayment(Payment payment) { this.payment = payment; }
    public Delivery getDelivery() { return delivery; }
    public void setDelivery(Delivery delivery) { this.delivery = delivery; }
}
