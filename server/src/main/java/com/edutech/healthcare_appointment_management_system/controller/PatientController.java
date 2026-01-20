package com.edutech.healthcare_appointment_management_system.controller;
 
 
// import com.wecp.healthcare_appointment_management_system.dto.TimeDto;

// import com.wecp.healthcare_appointment_management_system.entity.Appointment;

// import com.wecp.healthcare_appointment_management_system.entity.Doctor;

// import com.wecp.healthcare_appointment_management_system.entity.MedicalRecord;

// import com.wecp.healthcare_appointment_management_system.service.AppointmentService;

// import com.wecp.healthcare_appointment_management_system.service.DoctorService;

// import com.wecp.healthcare_appointment_management_system.service.MedicalRecordService;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.HttpStatus;

import org.springframework.http.ResponseEntity;

import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
 
import java.time.LocalDateTime;

import java.time.format.DateTimeFormatter;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.web.bind.annotation.RequestParam;

import com.edutech.healthcare_appointment_management_system.dto.DoctorRecommendationDTO;
import com.edutech.healthcare_appointment_management_system.dto.SymptomRequestDTO;
import com.edutech.healthcare_appointment_management_system.dto.TimeDto;

import com.edutech.healthcare_appointment_management_system.entity.Appointment;

import com.edutech.healthcare_appointment_management_system.entity.Doctor;

import com.edutech.healthcare_appointment_management_system.entity.MedicalRecord;

import com.edutech.healthcare_appointment_management_system.service.AppointmentService;
import com.edutech.healthcare_appointment_management_system.service.DoctorRecommendationService;
import com.edutech.healthcare_appointment_management_system.service.DoctorService;

import com.edutech.healthcare_appointment_management_system.service.MedicalRecordService;
 
 
@RestController

public class PatientController {
 
    @Autowired

    private AppointmentService appointmentService;
 
    @Autowired

    private DoctorService doctorService;
 
    @Autowired

    private MedicalRecordService medicalRecordService;

    @Autowired
    private DoctorRecommendationService recommendationService;
 
    @GetMapping("/api/patient/doctors")

    public ResponseEntity<List<Doctor>> getDoctors() {

        // get all doctors

        return new ResponseEntity<List<Doctor>>(doctorService.getDoctors(),HttpStatus.OK);

    }
 
    @PostMapping("/api/patient/appointment")

    public ResponseEntity<?> scheduleAppointment(@RequestParam Long patientId,

                                                 @RequestParam Long doctorId,

                                                 @RequestBody TimeDto timeDto) {

          System.out.println("===== BACKEND RECEIVED DATA =====");
    System.out.println("Patient ID: " + patientId);
    System.out.println("Doctor ID: " + doctorId);
    System.out.println("Appointment Time: " + timeDto.getTime());
    System.out.println("================================");

      return new ResponseEntity<Appointment>(appointmentService.scheduleAppointment(patientId,doctorId,timeDto),HttpStatus.OK);

    }
 
    @GetMapping("/api/patient/appointments")

    public ResponseEntity<List<Appointment>> getAppointmentsByPatientId(@RequestParam Long patientId) {

        // get appointments by patient id

        return new ResponseEntity<List<Appointment>>(appointmentService.getAppointmentsByPatientId(patientId),HttpStatus.OK);

    }
 
    @GetMapping("/api/patient/medicalrecords")

    public ResponseEntity<List<MedicalRecord>> viewMedicalRecords(@RequestParam Long patientId) {

        // view medical records

        return new ResponseEntity<>(medicalRecordService.getMedicalRecordsByPatientId(patientId),HttpStatus.OK);

    }

    // @GetMapping("/api/patient/appointment/{id}/qr")

    // public ResponseEntity<String> getAppointmentQr(@PathVariable Long id) {

    //     try{

    //         String qrBase64 = appointmentService.genrateAppointmentQr(id);

    //         return new ResponseEntity<>(qrBase64,HttpStatus.OK);

    //     }

    //     catch(Exception e){

    //         return new ResponseEntity<>("Error generating QR: "+ e.getMessage(),HttpStatus.BAD_REQUEST);

    //     }

    // }

    // ==========================================
    // AI-POWERED DOCTOR RECOMMENDATION
    // ==========================================
    /**
     * AI-powered endpoint that recommends a medical specialist based on patient symptoms
     * 
     * FLOW:
     * 1. Receives patient symptoms from frontend (min 10 chars, max 1000 chars)
     * 2. Validates the input using @Valid annotation
     * 3. Sends symptoms to Groq AI (via DoctorRecommendationService)
     * 4. AI analyzes symptoms and returns a specialty (e.g., "Cardiologist")
     * 5. Searches database for available doctors with that specialty
     * 6. Returns the recommended specialty + list of available doctors
     * 
     * @param request - Contains patient's symptom description
     * @param bindingResult - Holds validation errors (if any)
     * @return DoctorRecommendationDTO with specialist name and available doctors list
     */
    @PostMapping("/api/patient/recommend-doctor")
    public ResponseEntity<?> recommendDoctor(@Valid @RequestBody SymptomRequestDTO request,
                                             BindingResult bindingResult) {
        try {
            // STEP 1: Check if validation failed (empty input, too short, too long)
            if (bindingResult.hasErrors()) {
                FieldError error = bindingResult.getFieldError();
                String userFriendlyMessage;
                if (error != null) {
                    String rejectedValue = error.getRejectedValue() != null ? 
                                          error.getRejectedValue().toString() : "";
                    // Create user-friendly error messages based on validation failure
                    if (rejectedValue.trim().isEmpty()) {
                        userFriendlyMessage = "Please describe your symptoms in detail";
                    } else if (rejectedValue.trim().length() < 10) {
                        userFriendlyMessage = "Please provide more detailed symptoms (at least 10 characters)";
                    } else if (rejectedValue.trim().length() > 1000) {
                        userFriendlyMessage = "Symptoms description is too long (maximum 1000 characters)";
                    } else {
                        userFriendlyMessage = "Please describe your symptoms in detail";
                    }
                } else {
                    userFriendlyMessage = "Please describe your symptoms in detail";
                }
                // Return 400 Bad Request with friendly error message
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("message", userFriendlyMessage);
                System.err.println("❌ Validation Error: " + userFriendlyMessage);
                return ResponseEntity.badRequest().body(errorResponse);
            }
 
            // STEP 2: Log the incoming symptoms for debugging
            System.out.println("===== DOCTOR RECOMMENDATION REQUEST =====");
            System.out.println("Symptoms: " + request.getSymptoms());
            System.out.println("========================================");
 
            // STEP 3: Call service layer which:
            //   - Sends symptoms to Groq AI
            //   - AI returns a specialty (e.g., "Cardiologist")
            //   - Queries database for doctors with that specialty
            //   - Returns DoctorRecommendationDTO object
            DoctorRecommendationDTO recommendation = 
                recommendationService.recommendDoctorBySymptoms(request.getSymptoms());
 
            // STEP 4: Log the results
            System.out.println("✅ Recommended Specialist: " + recommendation.getRecommendedSpecialist());
            System.out.println("✅ Doctors Found: " + recommendation.getAvailableDoctors().size());
 
            // STEP 5: Return 200 OK with recommendation data to frontend
            return ResponseEntity.ok(recommendation);
        } catch (IllegalArgumentException e) {
            // Handle invalid input exceptions
            System.err.println("❌ Validation Error: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            // Handle unexpected server errors (AI API failure, database issues, etc.)
            System.err.println("❌ Server Error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Unable to process recommendation. Please try again later.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

}
 