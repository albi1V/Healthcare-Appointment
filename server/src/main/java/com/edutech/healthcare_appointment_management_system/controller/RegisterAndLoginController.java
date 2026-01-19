package com.edutech.healthcare_appointment_management_system.controller;

import com.edutech.healthcare_appointment_management_system.dto.LoginRequest;
import com.edutech.healthcare_appointment_management_system.entity.Doctor;
import com.edutech.healthcare_appointment_management_system.entity.Patient;
import com.edutech.healthcare_appointment_management_system.entity.Receptionist;
import com.edutech.healthcare_appointment_management_system.jwt.JwtUtil;
import com.edutech.healthcare_appointment_management_system.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
// @Slf4j
public class RegisterAndLoginController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    // =========================
    // REGISTER ENDPOINTS
    // =========================

    @PostMapping("/api/patient/register")
    public ResponseEntity<Patient> registerPatient(@RequestBody Patient patient) {
        Patient registeredPatient = (Patient) userService.registerUser(patient);
        return new ResponseEntity<>(registeredPatient, HttpStatus.CREATED);
    }

    @PostMapping("/api/doctors/register")
    public ResponseEntity<Doctor> registerDoctor(@RequestBody Doctor doctor) {
        Doctor registeredDoctor = (Doctor) userService.registerUser(doctor);
        return new ResponseEntity<>(registeredDoctor, HttpStatus.CREATED);
    }

    @PostMapping("/api/receptionist/register")
    public ResponseEntity<Receptionist> registerReceptionist(
            @RequestBody Receptionist receptionist) {
        Receptionist registeredReceptionist =
                (Receptionist) userService.registerUser(receptionist);
        return new ResponseEntity<>(registeredReceptionist, HttpStatus.CREATED);
    }

    // =========================
    // LOGIN ENDPOINT (REQUIRED BY TESTS)
    // =========================

        
@PostMapping("/api/user/login")
public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
    try {
        // CHANGED: authenticate with email (as the principal)
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getEmail(),              // CHANGED
                loginRequest.getPassword()
            )
        );

        // CHANGED: load user by email
        UserDetails userDetails = userService.loadUserByUsername(loginRequest.getEmail());

        // Get full user (for id/role/username)
        var user = userService.getUserByEmail(loginRequest.getEmail()); // CHANGED

        // Generate JWT; subject will now be the email
        String token = jwtUtil.generateToken(userDetails.getUsername());

        // Return token + id + role + username + email (keep username for UI compatibility)
        return ResponseEntity.ok(Map.of(
                "token", token,
                "userId", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),             // CHANGED: add email
                "role", user.getRole()
        ));

    } catch (AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}

}
