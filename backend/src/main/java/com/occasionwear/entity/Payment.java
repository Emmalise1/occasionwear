package com.occasionwear.entity;

import com.occasionwear.entity.enums.PaymentMethod;
import com.occasionwear.entity.enums.PaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Mock payment record owned by a {@link Booking}.
 * No real payment provider is integrated.
 */
@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Fixed rental price for the whole rental period — never multiplied by days. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    /** Refundable security deposit held against the rental. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal deposit = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PENDING;

    private LocalDateTime paymentDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal lateFee = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal damageFee = BigDecimal.ZERO;

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    /** Successful payment. */
    public void process(PaymentMethod chosenMethod) {
        this.method = chosenMethod;
        this.status = PaymentStatus.PAID;
        this.paymentDate = LocalDateTime.now();
    }

    /** Mock failure. */
    public void fail(PaymentMethod chosenMethod) {
        this.method = chosenMethod;
        this.status = PaymentStatus.FAILED;
        this.paymentDate = LocalDateTime.now();
    }

    public void refund() {
        this.status = PaymentStatus.REFUNDED;
    }

    public void applyLateFee(BigDecimal fee) {
        if (fee != null && fee.signum() > 0) {
            this.lateFee = this.lateFee.add(fee);
        }
    }

    public void applyDamageFee(BigDecimal fee) {
        if (fee != null && fee.signum() > 0) {
            this.damageFee = this.damageFee.add(fee);
        }
    }

    /**
     * totalAmountDue = fixed rental price + refundable deposit + late fee + damage fee.
     * The rental price itself never changes with the number of rental days.
     */
    public BigDecimal getAmountDue() {
        return amount.add(deposit).add(lateFee).add(damageFee);
    }

    /** Everything retained by the business: rental + fees (deposit is refundable). */
    public BigDecimal getRevenue() {
        return amount.add(lateFee).add(damageFee);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public BigDecimal getDeposit() { return deposit; }
    public void setDeposit(BigDecimal deposit) { this.deposit = deposit; }
    public PaymentMethod getMethod() { return method; }
    public void setMethod(PaymentMethod method) { this.method = method; }
    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }
    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }
    public BigDecimal getLateFee() { return lateFee; }
    public void setLateFee(BigDecimal lateFee) { this.lateFee = lateFee; }
    public BigDecimal getDamageFee() { return damageFee; }
    public void setDamageFee(BigDecimal damageFee) { this.damageFee = damageFee; }
    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }
}
