package com.edutech.healthcare_appointment_management_system.service;
 
 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.edutech.healthcare_appointment_management_system.dto.DoctorProfileRequestDTO;
import com.edutech.healthcare_appointment_management_system.dto.DoctorProfileResponseDTO;
import com.edutech.healthcare_appointment_management_system.entity.Doctor;
import com.edutech.healthcare_appointment_management_system.entity.User;
import com.edutech.healthcare_appointment_management_system.repository.DoctorRepository;
import com.edutech.healthcare_appointment_management_system.repository.UserRepository;
 
import java.util.List;
 
 
 
// import com.wecp.healthcare_appointment_management_system.entity.Doctor;
// import com.wecp.healthcare_appointment_management_system.entity.User;
// import com.wecp.healthcare_appointment_management_system.repository.DoctorRepository;
// import com.wecp.healthcare_appointment_management_system.repository.UserRepository;
 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
 
import java.util.List;
 
@Service
public class DoctorService {
 
    @Autowired
    private DoctorRepository doctorRepository;
 
    @Autowired
    private UserRepository userRepository;
 
    public Doctor findDoctorByID(Long Id){
        return doctorRepository.findById(Id).orElse(null);
    }
 
    public List<Doctor> getDoctors(){
        return doctorRepository.findAll();
    }
 
    public Doctor updateAvailability(Long doctorId, String availability) throws Exception {
        Doctor doctorToUpdate = doctorRepository.findById(doctorId).orElse(null);
        if (doctorToUpdate == null) {
            throw new Exception("Doctor not found with ID: " + doctorId);
        } else {
            doctorToUpdate.setAvailability(availability);
            return doctorRepository.save(doctorToUpdate);
        }
    }
          public String getUsernameById(Long id) {
        return userRepository.findById(id)
                .map(User::getUsername)
                .orElse("User not found");
        }

// ==========================================
 
    // NEW: Profile Management Methods
 
    // ==========================================
 
    /**
 
     * Get doctor profile information as DTO
 
     * @param doctorId - ID of the doctor
 
     * @return DoctorProfileResponseDTO with profile data
 
     * @throws Exception if doctor not found
 
     */
 
    public DoctorProfileResponseDTO getDoctorProfile(Long doctorId) throws Exception {
 
        Doctor doctor = doctorRepository.findById(doctorId)
 
                .orElseThrow(() -> new Exception("Doctor not found with ID: " + doctorId));
 
        // Map Entity to Response DTO
 
        DoctorProfileResponseDTO dto = new DoctorProfileResponseDTO();
 
        // User Basic Info
 
        dto.setId(doctor.getId());
 
        dto.setUsername(doctor.getUsername());
 
        dto.setEmail(doctor.getEmail());
 
        // Personal Information
 
        dto.setFirstName(doctor.getFirstName());
 
        dto.setMiddleName(doctor.getMiddleName());
 
        dto.setLastName(doctor.getLastName());
 
        dto.setDob(doctor.getDob());
 
        dto.setGender(doctor.getGender());
 
        dto.setPhone(doctor.getPhone());
 
        // Address Information
 
        dto.setCountry(doctor.getCountry());
 
        dto.setState(doctor.getState());
 
        dto.setCity(doctor.getCity());
 
        dto.setZipCode(doctor.getZipCode());
 
        dto.setAddress(doctor.getAddress());
 
        // Professional Information
 
        dto.setQualification(doctor.getQualification());
 
        dto.setSpecialty(doctor.getSpecialty());
 
        dto.setAvailability(doctor.getAvailability());
 
        return dto;
 
    }
 
    /**
 
     * Update doctor profile information from DTO
 
     * @param doctorId - ID of the doctor to update
 
     * @param requestDTO - DTO containing updated profile data
 
     * @throws Exception if doctor not found
 
     */
 
    public void updateDoctorProfile(Long doctorId, DoctorProfileRequestDTO requestDTO) throws Exception {

        System.out.println("Entered the update profile page!");
 
        Doctor doctor = doctorRepository.findById(doctorId)
 
                .orElseThrow(() -> new Exception("Doctor not found with ID: " + doctorId));
 
        // Map Request DTO to Entity
 
        // Personal Information
 
        doctor.setFirstName(requestDTO.getFirstName());
 
        doctor.setMiddleName(requestDTO.getMiddleName());
 
        doctor.setLastName(requestDTO.getLastName());
 
        doctor.setDob(requestDTO.getDob());
 
        doctor.setGender(requestDTO.getGender());
 
        doctor.setPhone(requestDTO.getPhone());
 
        // Address Information
 
        doctor.setCountry(requestDTO.getCountry());
 
        doctor.setState(requestDTO.getState());
 
        doctor.setCity(requestDTO.getCity());
 
        doctor.setZipCode(requestDTO.getZipCode());
 
        doctor.setAddress(requestDTO.getAddress());
 
        // Professional Information
 
        doctor.setQualification(requestDTO.getQualification());
 
        doctor.setSpecialty(requestDTO.getSpecialty());
 
        // Availability (if provided in DTO)
 
        if (requestDTO.getAvailability() != null) {
 
            doctor.setAvailability(requestDTO.getAvailability());
 
        }
 
        doctorRepository.save(doctor);
 
    }

 
}