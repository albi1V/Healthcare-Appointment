package com.edutech.healthcare_appointment_management_system.dto;
 
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;
 
/**
* DTO sent to the frontend for medical record rows.
* Includes brief doctor and patient objects (id + username).
*/
public class MedicalRecordView {
 
    private Long id;
 
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime recordDate;
 
    private String diagnosis;
    private String treatment;
 
    private DoctorBrief doctor;
    private PatientBrief patient;
 
    public MedicalRecordView() {}
 
    public MedicalRecordView(Long id,
                             LocalDateTime recordDate,
                             String diagnosis,
                             String treatment,
                             PatientBrief patient,
                             DoctorBrief doctor) {
        this.id = id;
        this.recordDate = recordDate;
        this.diagnosis = diagnosis;
        this.treatment = treatment;
        this.patient = patient;
        this.doctor = doctor;
    }
 
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
 
    public LocalDateTime getRecordDate() { return recordDate; }
    public void setRecordDate(LocalDateTime recordDate) { this.recordDate = recordDate; }
 
    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
 
    public String getTreatment() { return treatment; }
    public void setTreatment(String treatment) { this.treatment = treatment; }
 
    public DoctorBrief getDoctor() { return doctor; }
    public void setDoctor(DoctorBrief doctor) { this.doctor = doctor; }
 
    public PatientBrief getPatient() { return patient; }
    public void setPatient(PatientBrief patient) { this.patient = patient; }
}