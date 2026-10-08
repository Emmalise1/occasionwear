package com.occasionwear.entity;

import com.occasionwear.entity.enums.NotificationType;
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
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A customer-facing notification. Messages are persisted in MySQL and
 * mirrored to the backend console — no real email/SMS provider is used.
 */
@Entity
@Table(name = "notifications")
public class Notification {

    private static final Logger log = LoggerFactory.getLogger(Notification.class);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NotificationType type;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(nullable = false)
    private LocalDateTime dateSent;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    /** "Send" by email — logs to the console; persistence happens in the service. */
    public void sendEmail(String content) {
        this.type = NotificationType.EMAIL;
        this.message = content;
        this.dateSent = LocalDateTime.now();
        log.info("[EMAIL NOTIFICATION] to={} :: {}", customer != null ? customer.getEmail() : "n/a", content);
    }

    /** "Send" by SMS — logs to the console; persistence happens in the service. */
    public void sendSMS(String content) {
        this.type = NotificationType.SMS;
        this.message = content;
        this.dateSent = LocalDateTime.now();
        log.info("[SMS NOTIFICATION] to={} :: {}", customer != null ? customer.getPhone() : "n/a", content);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public LocalDateTime getDateSent() { return dateSent; }
    public void setDateSent(LocalDateTime dateSent) { this.dateSent = dateSent; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
}
