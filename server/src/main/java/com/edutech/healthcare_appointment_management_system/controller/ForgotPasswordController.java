package com.edutech.healthcare_appointment_management_system.controller;
 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
 
import com.edutech.healthcare_appointment_management_system.dto.EmailRequest;
import com.edutech.healthcare_appointment_management_system.dto.OtpRequest;
import com.edutech.healthcare_appointment_management_system.dto.ResetPasswordRequest;
import com.edutech.healthcare_appointment_management_system.repository.UserRepository;
import com.edutech.healthcare_appointment_management_system.service.EmailService;
import com.edutech.healthcare_appointment_management_system.service.OtpService;
 
@RestController
@RequestMapping("/api/password")
@CrossOrigin("*")
public class ForgotPasswordController {
 
    @Autowired
    private UserRepository userRepository;
 
    @Autowired
    private OtpService otpService;
 
    @Autowired
    private EmailService emailService;
 
    @Autowired
    private PasswordEncoder passwordEncoder;
 
    // STEP 1: SEND OTP
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody EmailRequest request) {
 
    String email = request.getEmail();
 
    if (!userRepository.existsByEmail(email)) {
        return ResponseEntity.badRequest().body("Email not registered");
    }
 
    String otp = otpService.generateOtp(email);
    emailService.sendOtp(email, otp);
 
    return ResponseEntity.ok("OTP sent successfully");
}
 
 
    // STEP 2: VERIFY OTP
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpRequest request) {
 
        boolean valid = otpService.validateOtp(
                request.getEmail(),
                request.getOtp()
        );
 
        if (!valid) {
            return ResponseEntity.badRequest().body("Invalid or expired OTP");
        }
 
        return ResponseEntity.ok("OTP verified");
    }
 
    // STEP 3: RESET PASSWORD
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
 
        return userRepository.getByEmail(request.getEmail())
                .map(user -> {
                    user.setPassword(
                            passwordEncoder.encode(request.getNewPassword())
                    );
                    userRepository.save(user);
                    return ResponseEntity.ok("Password reset successful");
                })
                .orElse(ResponseEntity.badRequest().body("User not found"));
    }
}