package com.edutech.healthcare_appointment_management_system.repository;

 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
 
import com.edutech.healthcare_appointment_management_system.entity.MedicalRecord;
 
import java.util.List;
 
@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord,Long> {
 
    // @Query("select m from MedicalRecord m where m.patient.id =:patientId")
    // public List<MedicalRecord> getMedicalRecordsByPatientId(Long patientId);


    @Query("select m from MedicalRecord m where m.patient.id = :patientId") ////////////////////////////////////////////
    List<MedicalRecord> getMedicalRecordsByPatientId(@Param("patientId") Long patientId);
 
    @Query("select m from MedicalRecord m where m.patient.id = :patientId order by m.recordDate desc")//new
    List<MedicalRecord> findByPatientIdOrderByRecordDateDesc(@Param("patientId") Long patientId);//new
}
