
package com.edutech.healthcare_appointment_management_system.service;

import com.edutech.healthcare_appointment_management_system.entity.User;
import com.edutech.healthcare_appointment_management_system.exception.UsernameAlreadyTakenException; // existing
import com.edutech.healthcare_appointment_management_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ==========================
    // Helpers
    // ==========================
    // CHANGED: normalize email for consistent lookups
    private String normalizeEmail(String email) {
        return (email == null) ? null : email.trim().toLowerCase();
    }

    private String normalizeUsername(String username) {
        return (username == null) ? null : username.trim().toLowerCase();
    }

    // ==========================
    // Login by EMAIL (not username)
    // ==========================
    // CHANGED: accept email instead of username
    public User loginUser(String email, String password) {
        email = normalizeEmail(email);
        User user = userRepository.findByEmail(email); // CHANGED
        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            return user;
        }
        return null;
    }

    // ==========================
    // Registration with duplicate check → 409
    // ==========================
    public User registerUser(User user) {

        // Normalize username
        String uname = normalizeUsername(user.getUsername());
        if (uname == null || uname.isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        user.setUsername(uname);

        // (Recommended) normalize email and check required
        String email = normalizeEmail(user.getEmail()); // CHANGED: normalize email on register
        if (email == null || email.isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        user.setEmail(email);

        // Duplicate username check
        User oldUser = userRepository.findByUsername(uname);
        if (oldUser != null) {
            throw new UsernameAlreadyTakenException("Username already exists: " + uname);
        }

        // (Recommended) Duplicate email check — make email unique
        // If you want email uniqueness to be enforced, uncomment these lines and
        // add repository method existsByEmail + DB unique constraint (shown below).
        //
        // if (userRepository.existsByEmail(email)) {
        //     throw new UsernameAlreadyTakenException("Email already exists: " + email);
        // }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return userRepository.save(user);
    }

    // Keep for legacy usage where you still need username
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(normalizeUsername(username));
    }

    // CHANGED: we treat the parameter as email now
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        email = normalizeEmail(email);
        User user = userRepository.findByEmail(email); // CHANGED
        if (user == null) {
            throw new UsernameNotFoundException("User not found");
        }

        // CHANGED: Principal username now equals email (Spring Security 'username' field)
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),      // CHANGED: email as principal
                user.getPassword(),
                new ArrayList<>()
        );
    }

    // Convenience if controllers/services need to fetch by email
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(normalizeEmail(email));
    }
}
