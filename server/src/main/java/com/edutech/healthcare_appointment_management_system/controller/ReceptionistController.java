package com.edutech.healthcare_appointment_management_system.controller;
 
 
// import com.wecp.healthcare_appointment_management_system.dto.TimeDto;

// import com.wecp.healthcare_appointment_management_system.entity.Appointment;

// import com.wecp.healthcare_appointment_management_system.repository.AppointmentRepository;

// import com.wecp.healthcare_appointment_management_system.service.AppointmentService;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.HttpStatus;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;
 
import com.edutech.healthcare_appointment_management_system.dto.TimeDto;

import com.edutech.healthcare_appointment_management_system.entity.Appointment;

import com.edutech.healthcare_appointment_management_system.repository.AppointmentRepository;

import com.edutech.healthcare_appointment_management_system.service.AppointmentService;
 
import java.sql.Time;

import java.time.LocalDate;

import java.time.LocalDateTime;

import java.time.ZoneId;

import java.time.format.DateTimeFormatter;

import java.util.Date;

import java.util.HashMap;

import java.util.List;

import java.util.Map;

import java.util.stream.Collectors;
 
@RestController

public class ReceptionistController {
 
    @Autowired

    private AppointmentService appointmentService;
 
    @Autowired

    private AppointmentRepository appointmentRepository;
 
    @GetMapping("/api/receptionist/appointments")

    public List<Appointment> getAppointments() {

      // get all appointments

      return appointmentService.getAppointments();

    }
 
    @PostMapping("/api/receptionist/appointment")

    public ResponseEntity<Appointment> scheduleAppointment(@RequestParam Long patientId,

                                                           @RequestParam Long doctorId,

                                                           @RequestBody TimeDto timeDto) {

        // schedule appointment

        return new ResponseEntity<Appointment>(appointmentService.scheduleAppointment(patientId, doctorId, timeDto), HttpStatus.OK);

    }
 
    @PutMapping("/api/receptionist/appointment-reschedule/{appointmentId}")

    public ResponseEntity<Appointment> rescheduleAppointment(@PathVariable Long appointmentId,

                                                             @RequestBody TimeDto timeDto) {

        // reschedule appointment

        return new ResponseEntity<Appointment>(appointmentService.rescheduleAppointment(appointmentId,timeDto), HttpStatus.OK);

    }

     @GetMapping("/api/receptionist/dashboard-data")

  public ResponseEntity<?> getDashboardData() {

      LocalDate today = LocalDate.now();

      // Convert to java.util.Date

      Date startDate = Date.from(today.atStartOfDay(ZoneId.systemDefault()).toInstant());

      Date endDate = Date.from(today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());

      List<Appointment> todaysAppointments = appointmentRepository.findByAppointmentTimeBetween(startDate, endDate);

      List<Map<String, Object>> response = todaysAppointments.stream().map(appointment -> {

          Map<String, Object> map = new HashMap<>();

          map.put("appointmentId", appointment.getId());

          map.put("appointmentTime", appointment.getAppointmentTime());

          map.put("status", appointment.getStatus());

          map.put("doctorName", appointment.getDoctor().getUsername());

          map.put("patientName", appointment.getPatient().getUsername());

          return map;

      }).collect(Collectors.toList());

      return ResponseEntity.ok(response);

  }


  // NEW DELETE ENDPOINT
    @DeleteMapping("/api/receptionist/appointment/{appointmentId}")
    public ResponseEntity<Map<String, String>> deleteAppointment(@PathVariable Long appointmentId) {
        try {
            appointmentService.deleteAppointment(appointmentId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Appointment deleted successfully");
            response.put("appointmentId", appointmentId.toString());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
        }
    }

}
 