package com.edutech.healthcare_appointment_management_system.service;
 
 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
 
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


}