
package com.edutech.healthcare_appointment_management_system.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();

    @Value("${otp.expiry.time}")
    private long expiryTime;

    public String generateOtp(String email) {
        String otp = String.valueOf(100000 + new Random().nextInt(900000));
        Instant expiry = Instant.now().plusSeconds(expiryTime);

        otpStore.put(email, new OtpData(otp, expiry));

        return otp;
    }

    public boolean validateOtp(String email, String otp) {
        OtpData data = otpStore.get(email);

        if (data == null) return false;

        if (Instant.now().isAfter(data.getExpiryTime())) {
            otpStore.remove(email);
            return false;
        }

        boolean isValid = data.getOtp().equals(otp);

        if (isValid) otpStore.remove(email);

        return isValid;
    }

    // 🔽 NORMAL INNER CLASS (NOT record)
    private static class OtpData {

        private final String otp;
        private final Instant expiryTime;

        public OtpData(String otp, Instant expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }

        public String getOtp() {
            return otp;
        }

        public Instant getExpiryTime() {
            return expiryTime;
        }
    }


    
}
