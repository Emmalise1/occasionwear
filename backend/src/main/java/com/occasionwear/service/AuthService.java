package com.occasionwear.service;

import com.occasionwear.dto.AuthResponse;
import com.occasionwear.dto.LoginRequest;
import com.occasionwear.dto.PersonResponse;
import com.occasionwear.dto.RegisterRequest;
import com.occasionwear.entity.Customer;
import com.occasionwear.exception.BadRequestException;
import com.occasionwear.exception.BusinessException;
import com.occasionwear.exception.UnauthorizedException;
import com.occasionwear.mapper.PersonMapper;
import com.occasionwear.repository.CustomerRepository;
import com.occasionwear.repository.PersonRepository;
import com.occasionwear.security.AuthFacade;
import com.occasionwear.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.occasionwear.entity.enums.Role;

/** Registration, login and profile operations. */
@Service
public class AuthService {

    private final PersonRepository personRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthFacade authFacade;

    public AuthService(PersonRepository personRepository,
                       CustomerRepository customerRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthFacade authFacade) {
        this.personRepository = personRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authFacade = authFacade;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (personRepository.existsByEmail(request.email())) {
            throw BusinessException.conflict("EMAIL_EXISTS", "An account with this email already exists.");
        }
        if (!request.passwordsMatch()) {
            throw new BadRequestException("PASSWORD_MISMATCH", "Passwords do not match.");
        }

        Customer customer = new Customer();
        customer.setName(request.name().trim());
        customer.setEmail(request.email().trim().toLowerCase());
        customer.setPhone(request.phone().trim());
        customer.setAddress(request.address().trim());
        // BCrypt hash — plain text is never stored
        customer.setPassword(passwordEncoder.encode(request.password()));
        customer.setRole(Role.CUSTOMER);
        customer = customerRepository.save(customer);

        return PersonMapper.toAuthResponse(jwtService.generateToken(customer), customer);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        var person = personRepository.findByEmail(request.email().trim().toLowerCase())
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!person.login(request.password(), passwordEncoder)) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        return PersonMapper.toAuthResponse(jwtService.generateToken(person), person);
    }

    @Transactional(readOnly = true)
    public PersonResponse me() {
        return PersonMapper.toResponse(authFacade.currentPerson());
    }
}
