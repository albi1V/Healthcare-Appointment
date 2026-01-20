package com.edutech.healthcare_appointment_management_system.service;
 
import com.edutech.healthcare_appointment_management_system.dto.DoctorRecommendationDTO;
 
import com.edutech.healthcare_appointment_management_system.dto.DoctorSummaryDTO;
 
import com.edutech.healthcare_appointment_management_system.entity.Doctor;
 
import com.edutech.healthcare_appointment_management_system.repository.DoctorRepository;
 
import org.springframework.beans.factory.annotation.Autowired;
 
import org.springframework.stereotype.Service;
 
import org.springframework.transaction.annotation.Transactional;
 
import java.util.List;
 
import java.util.stream.Collectors;
 
@Service
 
public class DoctorRecommendationService {
 
    @Autowired
 
    private GroqAIService groqAIService;
 
    @Autowired
 
    private DoctorRepository doctorRepository;
 
    @Transactional(readOnly = true)
 
    public DoctorRecommendationDTO recommendDoctorBySymptoms(String symptoms) {
 
        if (symptoms == null || symptoms.trim().isEmpty()) {
 
            throw new IllegalArgumentException("Symptoms cannot be empty");
 
        }
 
        if (symptoms.trim().length() < 10) {
 
            throw new IllegalArgumentException("Please provide more detailed symptoms");
 
        }
 
        System.out.println("========================================");
 
        System.out.println("Processing symptoms: " + symptoms);
 
        // ✅ STEP 1: AI → specialty
 
        String specialty = groqAIService.getSpecialtyFromSymptoms(symptoms);
 
        System.out.println("Recommended Specialty: " + specialty);
 
        // ✅ STEP 2: ONLY check specialty + availability present
 
        List<Doctor> doctors =
 
                doctorRepository
 
                        .findBySpecialtyIgnoreCaseAndAvailabilityIsNotNullAndAvailabilityNot(
 
                                specialty,
 
                                ""
 
                        );
 
        System.out.println("Found " + doctors.size() + " doctors with availability");
 
        for (Doctor d : doctors) {
 
            System.out.println(" ✓ " + d.getUsername() +
 
                    " | availability = " + d.getAvailability());
 
        }
 
        System.out.println("========================================");
 
        // ✅ STEP 3: Convert to DTO
 
        List<DoctorSummaryDTO> summaries = doctors.stream()
 
                .map(this::convertToDoctorSummary)
 
                .collect(Collectors.toList());
 
        DoctorRecommendationDTO response =
 
                new DoctorRecommendationDTO(specialty, summaries);
 
        if (summaries.isEmpty()) {
 
            response.setMessage("No doctors available for " + specialty);
 
        }
 
        return response;
 
    }
 
    private DoctorSummaryDTO convertToDoctorSummary(Doctor doctor) {
 
        return new DoctorSummaryDTO(
 
                doctor.getId(),
 
                doctor.getUsername(),
 
                doctor.getSpecialty(),
 
                doctor.getEmail(),
 
                doctor.getAvailability()
 
        );
 
    }
 
}