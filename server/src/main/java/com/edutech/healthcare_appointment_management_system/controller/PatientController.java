package com.edutech.healthcare_appointment_management_system.controller;
 
 
// import com.wecp.healthcare_appointment_management_system.dto.TimeDto;

// import com.wecp.healthcare_appointment_management_system.entity.Appointment;

// import com.wecp.healthcare_appointment_management_system.entity.Doctor;

// import com.wecp.healthcare_appointment_management_system.entity.MedicalRecord;

// import com.wecp.healthcare_appointment_management_system.service.AppointmentService;

// import com.wecp.healthcare_appointment_management_system.service.DoctorService;

// import com.wecp.healthcare_appointment_management_system.service.MedicalRecordService;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.HttpStatus;

import org.springframework.http.ResponseEntity;

import org.springframework.validation.BindingResult;

import org.springframework.web.bind.annotation.*;
 
import java.time.LocalDateTime;

import java.time.format.DateTimeFormatter;

import java.util.Date;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.web.bind.annotation.RequestParam;
 
import com.edutech.healthcare_appointment_management_system.dto.TimeDto;

import com.edutech.healthcare_appointment_management_system.entity.Appointment;

import com.edutech.healthcare_appointment_management_system.entity.Doctor;

import com.edutech.healthcare_appointment_management_system.entity.MedicalRecord;

import com.edutech.healthcare_appointment_management_system.service.AppointmentService;

import com.edutech.healthcare_appointment_management_system.service.DoctorService;

import com.edutech.healthcare_appointment_management_system.service.MedicalRecordService;
 
 
@RestController

public class PatientController {
 
    @Autowired

    private AppointmentService appointmentService;
 
    @Autowired

    private DoctorService doctorService;
 
    @Autowired

    private MedicalRecordService medicalRecordService;
 
    @GetMapping("/api/patient/doctors")

    public ResponseEntity<List<Doctor>> getDoctors() {

        // get all doctors

        return new ResponseEntity<List<Doctor>>(doctorService.getDoctors(),HttpStatus.OK);

    }
 
    @PostMapping("/api/patient/appointment")

    public ResponseEntity<?> scheduleAppointment(@RequestParam Long patientId,

                                                 @RequestParam Long doctorId,

                                                 @RequestBody TimeDto timeDto) {

      // schedule appointment

      return new ResponseEntity<Appointment>(appointmentService.scheduleAppointment(patientId,doctorId,timeDto),HttpStatus.OK);

    }
 
    @GetMapping("/api/patient/appointments")

    public ResponseEntity<List<Appointment>> getAppointmentsByPatientId(@RequestParam Long patientId) {

        // get appointments by patient id

        return new ResponseEntity<List<Appointment>>(appointmentService.getAppointmentsByPatientId(patientId),HttpStatus.OK);

    }
 
    @GetMapping("/api/patient/medicalrecords")

    public ResponseEntity<List<MedicalRecord>> viewMedicalRecords(@RequestParam Long patientId) {

        // view medical records

        return new ResponseEntity<>(medicalRecordService.getMedicalRecordsByPatientId(patientId),HttpStatus.OK);

    }

    // @GetMapping("/api/patient/appointment/{id}/qr")

    // public ResponseEntity<String> getAppointmentQr(@PathVariable Long id) {

    //     try{

    //         String qrBase64 = appointmentService.genrateAppointmentQr(id);

    //         return new ResponseEntity<>(qrBase64,HttpStatus.OK);

    //     }

    //     catch(Exception e){

    //         return new ResponseEntity<>("Error generating QR: "+ e.getMessage(),HttpStatus.BAD_REQUEST);

    //     }

    // }

}
 