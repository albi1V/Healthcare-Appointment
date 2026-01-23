package com.edutech.healthcare_appointment_management_system.service;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import com.edutech.healthcare_appointment_management_system.entity.MedicalRecord;

import com.edutech.healthcare_appointment_management_system.entity.Patient;

import com.edutech.healthcare_appointment_management_system.entity.Doctor;

import com.edutech.healthcare_appointment_management_system.repository.MedicalRecordRepository;

import com.edutech.healthcare_appointment_management_system.repository.PatientRepository;

import com.edutech.healthcare_appointment_management_system.repository.DoctorRepository;

import java.time.LocalDateTime;

import java.util.List;
 
@Service

public class MedicalRecordService {
 
    @Autowired

    private MedicalRecordRepository medicalRecordRepository;
 
    @Autowired

    private PatientRepository patientRepository;
 
    @Autowired

    private DoctorRepository doctorRepository;
 
    public List<MedicalRecord> getMedicalRecordsByPatientId(Long patientId) {

        return medicalRecordRepository.getMedicalRecordsByPatientId(patientId);

    }
 
    public List<MedicalRecord> getPatientMedicalHistory(Long patientId) {

        return medicalRecordRepository.findByPatientIdOrderByRecordDateDesc(patientId);

    }
 
    @Transactional

    public MedicalRecord addMedicalRecord(Long patientId, Long doctorId, String diagnosis, String treatment) {

        Patient patient = patientRepository.findById(patientId)

                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Doctor doctor = doctorRepository.findById(doctorId)

                .orElseThrow(() -> new RuntimeException("Doctor not found"));
 
        MedicalRecord medicalRecord = new MedicalRecord();

        medicalRecord.setPatient(patient);

        medicalRecord.setDoctor(doctor);

        medicalRecord.setDiagnosis(diagnosis);

        medicalRecord.setTreatment(treatment);

        medicalRecord.setRecordDate(LocalDateTime.now());
 
        return medicalRecordRepository.save(medicalRecord);

    }
 
    // ✅ NEW: used by ReportService to fetch a record by ID

    public MedicalRecord getMedicalRecordById(Long recordId) {

        return medicalRecordRepository.findById(recordId).orElse(null);

    }

}
 
 