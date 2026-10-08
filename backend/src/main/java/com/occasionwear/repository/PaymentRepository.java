package com.occasionwear.repository;

import com.occasionwear.entity.Payment;
import com.occasionwear.entity.enums.PaymentStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByStatus(PaymentStatus status);

    boolean existsByBookingId(Long bookingId);
}
