package com.occasionwear.repository;

import com.occasionwear.entity.Admin;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<Admin, Long> {

    Optional<Admin> findByEmail(String email);

    /** First seeded admin — used as the default overseeing admin for new bookings. */
    Optional<Admin> findFirstByOrderByIdAsc();
}
