package com.edutech.healthcare_appointment_management_system.repository;

 
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import com.edutech.healthcare_appointment_management_system.entity.User;
 
@Repository
public interface UserRepository extends JpaRepository<User,Long> {
 
    User findByUsername(String username);
    
    User findByEmail(String email);               // NEW
    boolean existsByEmail(String email);          // NEW
     Optional<User> getByEmail(String email);
 

}
