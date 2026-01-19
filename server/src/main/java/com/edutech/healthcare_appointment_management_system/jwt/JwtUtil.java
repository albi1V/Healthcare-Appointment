
package com.edutech.healthcare_appointment_management_system.jwt;

import com.edutech.healthcare_appointment_management_system.entity.User;
import com.edutech.healthcare_appointment_management_system.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class JwtUtil {

    private final UserRepository userRepository;

    @Autowired
    public JwtUtil(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // NOTE: consider moving these to application.properties in the future
    private final String secret =
            "secretKey000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    private final int expiration = 86400; // seconds = 24h

    /**
     * principal can be an email (new flow) or username (legacy).
     * We try email first, then fallback to username.
     */
    public String generateToken(String principal) {
        final String subject = (principal == null) ? null : principal.trim().toLowerCase();

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + (24L * 60 * 60 * 1000));

        // Try by email first (new login flow), then fallback to username
        User user = null;
        if (subject != null) {
            user = userRepository.findByEmail(subject);
            if (user == null) {
                user = userRepository.findByUsername(subject);
            }
        }

        Map<String, Object> claims = new HashMap<>();
        String role = (user != null && user.getRole() != null) ? user.getRole() : "USER";
        Long userId = (user != null) ? user.getId() : null;

        claims.put("role", role);
        if (userId != null) {
            claims.put("userId", userId);
        }

        // 🔵 Logging (safe)
        log.info("Generating JWT for subject={} role={}", subject, role);
        if (log.isDebugEnabled()) {
            log.debug("JWT expiresAt={} (msSinceEpoch={})", expiryDate, expiryDate.getTime());
        }

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)             // set subject
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, secret)
                .compact();
    }

    public Claims extractAllClaims(String token) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(secret)
                    .parseClaimsJws(token)
                    .getBody();
            log.info("claimes extracted successfully for the given token");
            return claims;
        } catch (Exception e) {
            
            log.warn("Failed to extract claims from JWT: {}", e.getMessage());
            return null;
        }
    }

    public String extractUsername(String token) {
        try {
            String subject = Jwts.parser()
                    .setSigningKey(secret)
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
            if (log.isDebugEnabled()) {
                log.debug("Extracted subject from JWT: {}", subject);
            }
            return subject;
        } catch (Exception e) {
            log.warn("Failed to extract subject from JWT: {}", e.getMessage());
            return null;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            Date expirationDate = Jwts.parser()
                    .setSigningKey(secret)
                    .parseClaimsJws(token)
                    .getBody()
                    .getExpiration();
            boolean expired = expirationDate.before(new Date());
            if (expired) {
                log.info("JWT is expired at {}", expirationDate);
            }
            return expired;
        } catch (Exception e) {
            log.warn("Failed to read JWT expiration: {}", e.getMessage());
            // If we cannot parse, treat as expired/invalid at higher level
            return true;
        }
    }

    public boolean validateToken(String token, org.springframework.security.core.userdetails.UserDetails userDetails) {
        String subject = extractUsername(token);
        if (subject == null) {
            log.warn("JWT validation failed: subject is null");
            return false;
        }
        boolean notExpired = !isTokenExpired(token);
        boolean subjectMatches = subject.equalsIgnoreCase(userDetails.getUsername());

        if (!subjectMatches) {
            log.warn("JWT subject does not match userDetails: tokenSubject={} expected={}", subject, userDetails.getUsername());
        }
        if (!notExpired) {
            log.warn("JWT validation failed: token expired");
        }

        return subjectMatches && notExpired;
    }
}
