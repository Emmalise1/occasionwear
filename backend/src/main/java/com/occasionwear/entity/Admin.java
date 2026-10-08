package com.occasionwear.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;

import com.occasionwear.entity.enums.Role;
import java.util.ArrayList;
import java.util.List;

/** Admin staff who manage inventory, bookings and returns. */
@Entity
@DiscriminatorValue("ADMIN")
public class Admin extends Person {

    /** e.g. Manager, Inventory Officer, Returns Officer. */
    private String staffRole;

    @OneToMany(mappedBy = "admin")
    private List<Booking> overseenBookings = new ArrayList<>();

    @OneToMany(mappedBy = "manager")
    private List<Outfit> managedOutfits = new ArrayList<>();

    public Admin() {
        setRole(Role.ADMIN);
    }

    public String getStaffRole() { return staffRole; }
    public void setStaffRole(String staffRole) { this.staffRole = staffRole; }
    public List<Booking> getOverseenBookings() { return overseenBookings; }
    public void setOverseenBookings(List<Booking> overseenBookings) { this.overseenBookings = overseenBookings; }
    public List<Outfit> getManagedOutfits() { return managedOutfits; }
    public void setManagedOutfits(List<Outfit> managedOutfits) { this.managedOutfits = managedOutfits; }
}
