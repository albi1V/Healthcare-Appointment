package com.edutech.healthcare_appointment_management_system.entity;
import javax.persistence.*;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
@Entity
public class MedicalRecord {
    // implement medical record entity
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)//new
    @JoinColumn(name = "patient_id")//new
    @JsonIgnoreProperties({ "medicalRecords", "appointments", "password" })//new
    private Patient patient;

    // Prevent recursion via doctor as well
    @ManyToOne(fetch = FetchType.LAZY)//new
    @JoinColumn(name = "doctor_id")//new
    @JsonIgnoreProperties({ "medicalRecords", "appointments", "password" })//new
    private Doctor doctor;

    private String diagnosis;
    private String treatment;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")//new
    private LocalDateTime recordDate;

    public MedicalRecord() {}
    public MedicalRecord(Long id, Patient patient, Doctor doctor, String diagnosis, String treatment, LocalDateTime recordDate) {
        this.id = id;
    
        this.patient = patient;
        this.doctor = doctor;
        this.diagnosis = diagnosis;
        this.treatment = treatment;
        this.recordDate = recordDate;
    }
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Patient getPatient() {
        return patient;
    }
    public void setPatient(Patient patient) {
        this.patient = patient;
    }
    public Doctor getDoctor() {
        return doctor;
    }
    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
    }
    public String getDiagnosis() {
        return diagnosis;
    }
    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }
    public String getTreatment() {
        return treatment;
    }
    public void setTreatment(String treatment) {
        this.treatment = treatment;
    }
    public LocalDateTime getRecordDate() {
        return recordDate;
    }
    public void setRecordDate(LocalDateTime recordDate) {
        this.recordDate = recordDate;
    }
}