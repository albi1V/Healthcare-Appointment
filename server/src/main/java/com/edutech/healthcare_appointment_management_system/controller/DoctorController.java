package com.edutech.healthcare_appointment_management_system.controller;
 
 
// import com.wecp.healthcare_appointment_management_system.entity.Appointment;
// import com.wecp.healthcare_appointment_management_system.entity.Doctor;
// import com.wecp.healthcare_appointment_management_system.service.AppointmentService;
// import com.wecp.healthcare_appointment_management_system.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.edutech.healthcare_appointment_management_system.dto.DoctorBrief;
import com.edutech.healthcare_appointment_management_system.dto.DoctorProfileRequestDTO;
import com.edutech.healthcare_appointment_management_system.dto.DoctorProfileResponseDTO;
import com.edutech.healthcare_appointment_management_system.entity.Appointment;
import com.edutech.healthcare_appointment_management_system.entity.Doctor;
import com.edutech.healthcare_appointment_management_system.service.AppointmentService;
import com.edutech.healthcare_appointment_management_system.service.DoctorService;
 
import java.util.List;
 
@RestController
public class DoctorController {
 
    @Autowired
    private AppointmentService appointmentService;
 
    @Autowired
    private DoctorService doctorService;
 
    @GetMapping("/api/doctor/appointments")
    public ResponseEntity<List<Appointment>> viewAppointments(@RequestParam Long doctorId) {
        // view appointments
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctorId(doctorId);
        return new ResponseEntity<List<Appointment>>(appointments, HttpStatus.OK);
    }
 
    @PostMapping("/api/doctor/availability")
    public ResponseEntity<Doctor> manageAvailability(@RequestParam Long doctorId, @RequestParam String availability) throws Exception {
        // manage availablity
        Doctor updatedDoctor = doctorService.updateAvailability(doctorId, availability);
        return ResponseEntity.status(HttpStatus.OK).body(updatedDoctor);
    }
 
@GetMapping("/api/doctor/profile/{id}")
public ResponseEntity<String> getDoctorUsername(@PathVariable Long id) {
    String username = doctorService.getUsernameById(id);
    return ResponseEntity.ok(username);
}
 
 

    // ==========================================
 
    // NEW: Profile Management Endpoints
 
    // ==========================================
 
    /**
 
     * GET FULL DOCTOR PROFILE
 
     * Endpoint: GET /api/doctor/profile/full/{doctorId}
 
     * Returns: Complete doctor profile as DTO
 
     *
 
     * @param doctorId - ID of the doctor
 
     * @return DoctorProfileResponseDTO with all profile fields
 
     */
 
    @GetMapping("/api/doctor/profile/full/{doctorId}")
 
    public ResponseEntity<DoctorProfileResponseDTO> getFullDoctorProfile(@PathVariable Long doctorId) {
 
        try {
 
            DoctorProfileResponseDTO profile = doctorService.getDoctorProfile(doctorId);
 
            return ResponseEntity.ok(profile);
 
        } catch (Exception e) {
 
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
 
        }
 
    }
 
    /**
 
     * UPDATE DOCTOR PROFILE
 
     * Endpoint: PUT /api/doctor/profile/{doctorId}
 
     * Body: DoctorProfileRequestDTO (JSON)
 
     * Returns: Success message
 
     *
 
     * @param doctorId - ID of the doctor to update
 
     * @param requestDTO - Profile data from frontend
 
     * @return Success or error message
 
     */
 
    @PutMapping("/api/doctor/profile/{doctorId}")
 
    public ResponseEntity<String> updateDoctorProfile(
 
            @PathVariable Long doctorId,
 
            @RequestBody DoctorProfileRequestDTO requestDTO) {
 
        try {
 
            doctorService.updateDoctorProfile(doctorId, requestDTO);
 
            return ResponseEntity.ok().build();
 
        } catch (Exception e) {
 
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
 
                    .body("Error updating profile: " + e.getMessage());
 
        }
 
    }
 
// NEW: returns { id, username }
    @GetMapping("/api/doctor/brief/{id}")
    public ResponseEntity<DoctorBrief> getDoctorBrief(@PathVariable Long id) {
        Doctor d = doctorService.findDoctorByID(id);
        if (d == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(new DoctorBrief(d.getId(), d.getUsername()));
    }


}