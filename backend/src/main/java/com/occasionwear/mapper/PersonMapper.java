package com.occasionwear.mapper;

import com.occasionwear.dto.AuthResponse;
import com.occasionwear.dto.PersonResponse;
import com.occasionwear.entity.Admin;
import com.occasionwear.entity.Customer;
import com.occasionwear.entity.Person;

/** Maps {@link Person} entities to response DTOs (passwords are never exposed). */
public final class PersonMapper {

    private PersonMapper() {}

    public static PersonResponse toResponse(Person person) {
        return new PersonResponse(
            person.getId(),
            person.getName(),
            person.getEmail(),
            person.getPhone(),
            person.getRole().name(),
            person instanceof Customer customer ? customer.getAddress() : null,
            person instanceof Admin admin ? admin.getStaffRole() : null
        );
    }

    public static AuthResponse toAuthResponse(String token, Person person) {
        PersonResponse profile = toResponse(person);
        return new AuthResponse(
            token,
            profile.id(),
            profile.name(),
            profile.email(),
            profile.phone(),
            profile.role(),
            profile.address(),
            profile.staffRole()
        );
    }
}
