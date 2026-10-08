package com.occasionwear.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;

import com.occasionwear.entity.enums.Role;
import java.util.ArrayList;
import java.util.List;

/** A customer who browses, books and rents outfits. */
@Entity
@DiscriminatorValue("CUSTOMER")
public class Customer extends Person {

    private String address;

    @OneToMany(mappedBy = "customer")
    private List<Booking> bookings = new ArrayList<>();

    @OneToMany(mappedBy = "customer")
    private List<Notification> notifications = new ArrayList<>();

    public Customer() {
        setRole(Role.CUSTOMER);
    }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public List<Booking> getBookings() { return bookings; }
    public void setBookings(List<Booking> bookings) { this.bookings = bookings; }
    public List<Notification> getNotifications() { return notifications; }
    public void setNotifications(List<Notification> notifications) { this.notifications = notifications; }
}
