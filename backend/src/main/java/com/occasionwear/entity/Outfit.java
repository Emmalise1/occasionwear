package com.occasionwear.entity;

import com.occasionwear.entity.enums.BookingStatus;
import com.occasionwear.entity.enums.OutfitCategory;
import com.occasionwear.entity.enums.OutfitStatus;
import com.occasionwear.service.RentalPeriods;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * An outfit in the rental catalogue.
 * Availability is decided by real overlapping bookings, never by the status field alone.
 */
@Entity
@Table(name = "outfits")
public class Outfit {

    /** Standard late fee applied to every extra day beyond the rental period. */
    public static final BigDecimal DEFAULT_LATE_FEE_PER_DAY = new BigDecimal("2000");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Outfit name is required")
    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OutfitCategory category;

    @NotBlank(message = "Size is required")
    @Column(nullable = false, length = 20)
    private String size;

    @NotBlank(message = "Color is required")
    @Column(nullable = false, length = 60)
    private String color;

    /**
     * Fixed rental price for the whole agreed rental period — never a daily
     * rate. The customer pays it once, regardless of how many days the period
     * covers.
     */
    @NotNull(message = "Rental price is required")
    @Positive(message = "Rental price must be positive")
    @Digits(integer = 10, fraction = 2, message = "Rental price is too large")
    @Column(name = "rental_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal rentalPrice;

    /**
     * Rental period in days: 5 for wedding wear (bridal gowns, civil wedding
     * attire, wedding guest), 3 for every other category. Nullable in the
     * schema so legacy rows migrate safely; {@link #getRentalPeriodDays()}
     * normalises null to the category default.
     */
    @Column(name = "rental_period_days")
    private Integer rentalPeriodDays;

    @NotNull(message = "Deposit amount is required")
    @Positive(message = "Deposit amount must be positive")
    @Digits(integer = 10, fraction = 2, message = "Deposit amount is too large")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal depositAmount;

    /**
     * Late fee charged for each day beyond the expected return date.
     * Nullable in the schema for legacy rows; {@link #getLateFeePerDay()}
     * normalises null to the standard 2,000 RWF.
     */
    @Column(name = "late_fee_per_day", precision = 12, scale = 2)
    private BigDecimal lateFeePerDay;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OutfitStatus status = OutfitStatus.AVAILABLE;

    /** Public image URL or an uploaded data URL. */
    @Column(length = 2000)
    private String imageUrl;

    @Column(length = 2000)
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manager_id")
    private Admin manager;

    @OneToMany(mappedBy = "outfit")
    private List<Booking> bookings = new ArrayList<>();

    /**
     * Business rule 1 — an outfit is available for a range only when no blocking
     * booking overlaps it (endpoints inclusive).
     */
    public boolean checkAvailability(LocalDate startDate, LocalDate endDate) {
        return checkAvailability(startDate, endDate, this.bookings);
    }

    /** Same rule, evaluated against an explicit set of overlapping bookings. */
    public boolean checkAvailability(LocalDate startDate, LocalDate endDate, Collection<Booking> existingBookings) {
        if (startDate == null || endDate == null || !startDate.isBefore(endDate)) {
            return false;
        }
        if (status == OutfitStatus.RETIRED || status == OutfitStatus.DAMAGED) {
            return false;
        }
        if (existingBookings == null) {
            return true;
        }
        for (Booking booking : existingBookings) {
            if (booking.blocksDates(startDate, endDate)) {
                return false;
            }
        }
        return true;
    }

    /** True when this booking's date range intersects the requested range. */
    public boolean overlapsRange(LocalDate startDate, LocalDate endDate) {
        return !startDate.isAfter(endDate) && !endDate.isBefore(startDate);
    }

    public void updateStatus(OutfitStatus newStatus) {
        this.status = newStatus;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public OutfitCategory getCategory() { return category; }
    public void setCategory(OutfitCategory category) { this.category = category; }
    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public BigDecimal getRentalPrice() { return rentalPrice; }
    public void setRentalPrice(BigDecimal rentalPrice) { this.rentalPrice = rentalPrice; }

    /** Raw stored period (may be null on legacy rows). */
    public Integer getRentalPeriodDaysRaw() { return rentalPeriodDays; }
    public void setRentalPeriodDays(Integer rentalPeriodDays) { this.rentalPeriodDays = rentalPeriodDays; }

    /** Effective rental period: stored value, or the category default (wedding → 5, other → 3). */
    public int getRentalPeriodDays() {
        if (rentalPeriodDays != null && rentalPeriodDays > 0) {
            return rentalPeriodDays;
        }
        return category == null ? RentalPeriods.DEFAULT_DAYS : RentalPeriods.defaultDays(category);
    }

    public BigDecimal getDepositAmount() { return depositAmount; }
    public void setDepositAmount(BigDecimal depositAmount) { this.depositAmount = depositAmount; }

    /** Raw stored late fee (may be null on legacy rows). */
    public BigDecimal getLateFeePerDayRaw() { return lateFeePerDay; }
    public void setLateFeePerDay(BigDecimal lateFeePerDay) { this.lateFeePerDay = lateFeePerDay; }

    /** Effective per-day late fee: stored value, or the standard 2,000 RWF. */
    public BigDecimal getLateFeePerDay() {
        return lateFeePerDay == null || lateFeePerDay.signum() <= 0
            ? DEFAULT_LATE_FEE_PER_DAY
            : lateFeePerDay;
    }

    public OutfitStatus getStatus() { return status; }
    public void setStatus(OutfitStatus status) { this.status = status; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Admin getManager() { return manager; }
    public void setManager(Admin manager) { this.manager = manager; }
    public List<Booking> getBookings() { return bookings; }
    public void setBookings(List<Booking> bookings) { this.bookings = bookings; }

    /** Statuses of other bookings that block this date range. */
    public static final List<BookingStatus> BLOCKING_STATUSES =
        List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE);
}
