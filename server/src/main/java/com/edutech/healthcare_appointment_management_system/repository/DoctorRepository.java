
package com.edutech.healthcare_appointment_management_system.repository;
 
import org.springframework.data.jpa.repository.JpaRepository;
 
import org.springframework.stereotype.Repository;
 
import com.edutech.healthcare_appointment_management_system.entity.Doctor;
 
import java.util.List;
 
@Repository
 
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
 
    /**

     * ✅ CORRECT METHOD

     * Find doctors by specialty who HAVE availability

     * (availability is NOT NULL and NOT EMPTY)

     */
 
    List<Doctor> findBySpecialtyIgnoreCaseAndAvailabilityIsNotNullAndAvailabilityNot(String specialty,String availability);

    /**

     * Optional: Find all doctors by specialty (debug)

     */

    List<Doctor> findBySpecialtyIgnoreCase(String specialty);

}

 