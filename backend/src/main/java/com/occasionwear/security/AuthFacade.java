package com.occasionwear.security;

import com.occasionwear.entity.Admin;
import com.occasionwear.entity.Customer;
import com.occasionwear.entity.Person;
import com.occasionwear.exception.ForbiddenException;
import com.occasionwear.exception.UnauthorizedException;
import com.occasionwear.repository.PersonRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Resolves the caller of the current request from the security context. */
@Component
public class AuthFacade {

    private final PersonRepository personRepository;

    public AuthFacade(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }

    public String currentEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return authentication.getName();
    }

    public Person currentPerson() {
        String email = currentEmail();
        if (email == null) {
            throw new UnauthorizedException("Authentication required.");
        }
        return personRepository.findByEmail(email)
            .orElseThrow(() -> new UnauthorizedException("Account no longer exists."));
    }

    public Customer currentCustomer() {
        Person person = currentPerson();
        if (!(person instanceof Customer customer)) {
            throw new ForbiddenException("This endpoint is only available to customers.");
        }
        return customer;
    }

    public Admin currentAdmin() {
        Person person = currentPerson();
        if (!(person instanceof Admin admin)) {
            throw new ForbiddenException("Administrator access is required.");
        }
        return admin;
    }
}
