package com.occasionwear.service;

import com.occasionwear.entity.Admin;
import com.occasionwear.entity.Customer;
import com.occasionwear.entity.Notification;
import com.occasionwear.entity.Person;
import com.occasionwear.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates Email + SMS notifications for a message.
 * Notifications are persisted in MySQL and mirrored to the backend console —
 * no real email/SMS provider is integrated.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void notifyCustomer(Customer customer, String message) {
        send(customer, message, true);
    }

    @Transactional
    public void notifyAdmin(Admin admin, String message) {
        send(admin, message, false);
    }

    private void send(Person recipient, String message, boolean persist) {
        String target = recipient.getEmail();
        String phone = recipient.getPhone();

        if (persist && recipient instanceof Customer customer) {
            Notification email = new Notification();
            email.setCustomer(customer);
            email.sendEmail(message);
            notificationRepository.save(email);

            Notification sms = new Notification();
            sms.setCustomer(customer);
            sms.sendSMS(message);
            notificationRepository.save(sms);
        } else {
            log.info("[EMAIL NOTIFICATION] to={} :: {}", target, message);
            log.info("[SMS NOTIFICATION] to={} :: {}", phone, message);
        }
    }
}
