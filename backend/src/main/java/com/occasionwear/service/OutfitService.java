package com.occasionwear.service;

import com.occasionwear.dto.OutfitRequest;
import com.occasionwear.dto.OutfitResponse;
import com.occasionwear.entity.Admin;
import com.occasionwear.entity.Outfit;
import com.occasionwear.entity.enums.BookingStatus;
import com.occasionwear.entity.enums.OutfitCategory;
import com.occasionwear.entity.enums.OutfitStatus;
import com.occasionwear.exception.BadRequestException;
import com.occasionwear.exception.BusinessException;
import com.occasionwear.exception.NotFoundException;
import com.occasionwear.mapper.OutfitMapper;
import com.occasionwear.repository.BookingRepository;
import com.occasionwear.repository.OutfitRepository;
import com.occasionwear.security.AuthFacade;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Outfit browsing + inventory management.
 * Business rule 1 lives here: availability is computed from real overlapping bookings.
 */
@Service
public class OutfitService {

    private static final List<BookingStatus> BLOCKING_STATUSES =
        List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE);

    private final OutfitRepository outfitRepository;
    private final BookingRepository bookingRepository;
    private final AuthFacade authFacade;

    public OutfitService(OutfitRepository outfitRepository,
                         BookingRepository bookingRepository,
                         AuthFacade authFacade) {
        this.outfitRepository = outfitRepository;
        this.bookingRepository = bookingRepository;
        this.authFacade = authFacade;
    }

    // ---------------------------------------------------------------- customer

    @Transactional(readOnly = true)
    public List<OutfitResponse> list(OutfitCategory category,
                                     String size,
                                     BigDecimal minPrice,
                                     BigDecimal maxPrice,
                                     LocalDate startDate,
                                     LocalDate endDate) {
        if (startDate != null && endDate != null) {
            validateRange(startDate, endDate);
        }
        List<Outfit> outfits = outfitRepository.findAll(publicSpec(category, size, minPrice, maxPrice));

        List<OutfitResponse> result = new ArrayList<>();
        for (Outfit outfit : outfits) {
            if (startDate != null && endDate != null) {
                boolean available = isRangeAvailable(outfit, startDate, endDate);
                String note = available
                    ? "Available " + startDate + " → " + endDate
                    : "Booked for the selected dates";
                result.add(OutfitMapper.toResponse(outfit, available, note));
            } else {
                result.add(OutfitMapper.toResponse(outfit));
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public OutfitResponse get(Long id) {
        Outfit outfit = find(id);
        return OutfitMapper.toResponse(outfit);
    }

    /** Business rule 1 — overlap check against blocking bookings, not just the status field. */
    @Transactional(readOnly = true)
    public boolean isRangeAvailable(Outfit outfit, LocalDate startDate, LocalDate endDate) {
        if (outfit.getStatus() == OutfitStatus.RETIRED || outfit.getStatus() == OutfitStatus.DAMAGED) {
            return false;
        }
        // A still-ACTIVE rental (physically unreturned, even if overdue) blocks ALL new
        // bookings — a late return adds a per-day fee, it never frees the outfit early.
        long activeRentals = bookingRepository.countByOutfitIdAndStatus(outfit.getId(), BookingStatus.ACTIVE);
        if (activeRentals > 0) {
            return false;
        }
        long overlaps = bookingRepository.countOverlapping(
            outfit.getId(), startDate, endDate, BLOCKING_STATUSES);
        return overlaps == 0 && outfit.checkAvailability(startDate, endDate, List.of());
    }

    // ------------------------------------------------------------------ admin

    @Transactional(readOnly = true)
    public List<OutfitResponse> adminList(OutfitStatus status,
                                          OutfitCategory category,
                                          String size,
                                          String search,
                                          BigDecimal minPrice,
                                          BigDecimal maxPrice) {
        List<Outfit> outfits = outfitRepository.findAll(adminSpec(status, category, size, search, minPrice, maxPrice));
        return outfits.stream().map(OutfitMapper::toResponse).toList();
    }

    @Transactional
    public OutfitResponse create(OutfitRequest request) {
        Admin admin = authFacade.currentAdmin();

        Outfit outfit = new Outfit();
        applyRequest(outfit, request);
        outfit.setStatus(request.status() != null && request.status() != OutfitStatus.RETIRED
            ? request.status()
            : OutfitStatus.AVAILABLE);
        outfit.setManager(admin);
        return OutfitMapper.toResponse(outfitRepository.save(outfit));
    }

    @Transactional
    public OutfitResponse update(Long id, OutfitRequest request) {
        authFacade.currentAdmin();
        Outfit outfit = find(id);

        applyRequest(outfit, request);
        if (request.status() != null && request.status() != outfit.getStatus()) {
            validateTransition(outfit.getStatus(), request.status());
            outfit.updateStatus(request.status());
        }
        return OutfitMapper.toResponse(outfitRepository.save(outfit));
    }

    /** DELETE never removes the row — the outfit is retired instead. */
    @Transactional
    public OutfitResponse retire(Long id) {
        authFacade.currentAdmin();
        Outfit outfit = find(id);
        outfit.updateStatus(OutfitStatus.RETIRED);
        return OutfitMapper.toResponse(outfitRepository.save(outfit));
    }

    // ----------------------------------------------------------------- helpers

    public Outfit find(Long id) {
        return outfitRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Outfit not found with id " + id + "."));
    }

    private void applyRequest(Outfit outfit, OutfitRequest request) {
        outfit.setName(request.name().trim());
        outfit.setCategory(request.category());
        outfit.setSize(request.size().trim());
        outfit.setColor(request.color().trim());
        // Fixed total price for the rental period — never a daily rate.
        outfit.setRentalPrice(request.rentalPrice());
        // Rental period defaults by category (wedding → 5 days, other → 3 days);
        // admins may verify and adjust it explicitly.
        outfit.setRentalPeriodDays(request.rentalPeriodDays() != null
            ? request.rentalPeriodDays()
            : RentalPeriods.defaultDays(request.category()));
        outfit.setDepositAmount(request.depositAmount());
        // null keeps the current fee, or the standard 2,000 RWF on create.
        if (request.lateFeePerDay() != null) {
            outfit.setLateFeePerDay(request.lateFeePerDay());
        } else if (outfit.getLateFeePerDayRaw() == null) {
            outfit.setLateFeePerDay(Outfit.DEFAULT_LATE_FEE_PER_DAY);
        }
        outfit.setImageUrl(request.imageUrl().trim());
        outfit.setDescription(request.description());
    }

    /**
     * Legal transitions: RETIRED is terminal; a DAMAGED outfit may only be
     * repaired (→ AVAILABLE) or retired (→ RETIRED).
     */
    private void validateTransition(OutfitStatus current, OutfitStatus target) {
        if (current == OutfitStatus.RETIRED) {
            throw BusinessException.conflict("OUTFIT_RETIRED",
                "A retired outfit cannot be returned to service. Create a new outfit instead.");
        }
        if (current == OutfitStatus.DAMAGED && target != OutfitStatus.AVAILABLE && target != OutfitStatus.RETIRED) {
            throw BusinessException.conflict("INVALID_STATUS_TRANSITION",
                "A damaged outfit can only be repaired (AVAILABLE) or retired (RETIRED).");
        }
    }

    private void validateRange(LocalDate startDate, LocalDate endDate) {
        if (!startDate.isBefore(endDate)) {
            throw new BadRequestException("INVALID_DATE_RANGE", "Start date must be before end date.");
        }
    }

    private Specification<Outfit> publicSpec(OutfitCategory category,
                                             String size,
                                             BigDecimal minPrice,
                                             BigDecimal maxPrice) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.notEqual(root.get("status"), OutfitStatus.RETIRED));
            if (category != null) predicates.add(cb.equal(root.get("category"), category));
            if (size != null && !size.isBlank()) predicates.add(cb.equal(root.get("size"), size.trim()));
            if (minPrice != null) predicates.add(cb.greaterThanOrEqualTo(root.get("rentalPrice"), minPrice));
            if (maxPrice != null) predicates.add(cb.lessThanOrEqualTo(root.get("rentalPrice"), maxPrice));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Specification<Outfit> adminSpec(OutfitStatus status,
                                            OutfitCategory category,
                                            String size,
                                            String search,
                                            BigDecimal minPrice,
                                            BigDecimal maxPrice) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (category != null) predicates.add(cb.equal(root.get("category"), category));
            if (size != null && !size.isBlank()) predicates.add(cb.equal(root.get("size"), size.trim()));
            if (search != null && !search.isBlank())
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + search.trim().toLowerCase() + "%"));
            if (minPrice != null) predicates.add(cb.greaterThanOrEqualTo(root.get("rentalPrice"), minPrice));
            if (maxPrice != null) predicates.add(cb.lessThanOrEqualTo(root.get("rentalPrice"), maxPrice));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
