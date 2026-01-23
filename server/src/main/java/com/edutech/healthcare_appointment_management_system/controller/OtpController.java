package com.edutech.healthcare_appointment_management_system.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.edutech.healthcare_appointment_management_system.service.EmailService;
import com.edutech.healthcare_appointment_management_system.service.OtpService;

@RestController
@RequestMapping("/api/otp")
@CrossOrigin(origins = "*")
public class OtpController {

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<?> sendOtp(@RequestParam String email) {

        String otp = otpService.generateOtp(email);
        emailService.sendOtp(email, otp);

        return ResponseEntity.ok(
                Map.of("message", "OTP Sent successfully")
        );
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(
            @RequestParam String email,
            @RequestParam String otp
    ) {

        boolean isValid = otpService.validateOtp(email, otp);

        return isValid
                ? ResponseEntity.ok(
                        Map.of("message", "OTP verified")
                )
                : ResponseEntity.badRequest().body(
                        Map.of("message", "invalid OTP or expired otp")
                );
    }
}
