package com.edutech.healthcare_appointment_management_system;

import java.util.TimeZone;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import com.edutech.healthcare_appointment_management_system.service.AppointmentService;

@SpringBootApplication
@EnableScheduling
public class HealthcareAppointmentManagementSystemApplication {

    private static final Logger log =
            LoggerFactory.getLogger(HealthcareAppointmentManagementSystemApplication.class);

    @Autowired
    private AppointmentService appointmentService;

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
        log.info("Application timezone set to Asia/Kolkata (IST)");
    }

    public static void main(String[] args) {
        SpringApplication.run(HealthcareAppointmentManagementSystemApplication.class, args);
        log.info("Healthcare Appointment Management System started successfully");
    }

    @Scheduled(fixedRate = 60000)
    public void reminderScheduler() {
        log.info("Reminder scheduler running");
        appointmentService.sendAppointmentReminders();
    }
}
