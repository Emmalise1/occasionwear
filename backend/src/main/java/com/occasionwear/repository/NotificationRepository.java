package com.occasionwear.repository;

import com.occasionwear.entity.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByCustomerIdOrderByDateSentDesc(Long customerId);
}
