package com.edutech.healthcare_appointment_management_system.repository;

 
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
 
import com.edutech.healthcare_appointment_management_system.entity.Patient;
 
@Repository
public interface PatientRepository  extends JpaRepository<Patient,Long> {
    @Query(value = "SELECT * FROM users WHERE role = 'PATIENT' AND (" +
           "LOWER(username) LIKE LOWER(CONCAT('%', ?1, '%')) OR " +
           "LOWER(email) LIKE LOWER(CONCAT('%', ?1, '%')) OR " +
           "CAST(id AS CHAR) LIKE CONCAT('%', ?1, '%'))", 
           nativeQuery = true)
    List<Patient> searchPatients(String searchTerm);
    @Query(value = "SELECT * FROM users WHERE role = 'PATIENT' ORDER BY id", nativeQuery = true)
    List<Patient> findAllPatients();
}