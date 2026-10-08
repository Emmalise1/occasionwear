package com.occasionwear.repository;

import com.occasionwear.entity.Booking;
import com.occasionwear.entity.enums.BookingStatus;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    Optional<Booking> findByIdAndCustomerId(Long bookingId, Long customerId);

    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);

    List<Booking> findAllByOrderByCreatedAtDesc();

    boolean existsByReference(String reference);

    List<Booking> findByStatusInOrderByCreatedAtDesc(Collection<BookingStatus> statuses);

    /**
     * Business rule 1 — counts bookings whose date range overlaps
     * [startDate, endDate] (endpoints inclusive) and whose status still blocks the outfit.
     */
    @Query("""
        select count(b) from Booking b
        where b.outfit.id = :outfitId
          and b.status in :statuses
          and b.startDate <= :endDate
          and b.endDate >= :startDate
        """)
    long countOverlapping(@Param("outfitId") Long outfitId,
                          @Param("startDate") LocalDate startDate,
                          @Param("endDate") LocalDate endDate,
                          @Param("statuses") Collection<BookingStatus> statuses);

    /**
     * Rentals of an outfit that are still ACTIVE (physically unreturned, even if
     * overdue). Such outfits must not be booked again until they are inspected.
     */
    long countByOutfitIdAndStatus(Long outfitId, BookingStatus status);
}
