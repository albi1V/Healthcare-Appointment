package com.edutech.healthcare_appointment_management_system.service;
 
import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
 
@Service
public class EmailService {
 
    @Autowired
    private JavaMailSender mailSender;
 
    public void sendOtp(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Email Verification OTP");
        message.setText("Your OTP for registration is: " + otp + "\nValid for 5 minutes.");
 
        mailSender.send(message);
    }


    public void sendAppointmentReminder(
        String toEmail,
        String patientName,
        String doctorName,
        Date appointmentTime
) {
    SimpleMailMessage message = new SimpleMailMessage();
    message.setTo(toEmail);
    message.setSubject("Appointment Reminder");

    message.setText(
        "Hello " + patientName + ",\n\n" +
        "This is a reminder for your appointment.\n\n" +
        "Doctor: Dr. " + doctorName + "\n" +
        "Time: " + appointmentTime + "\n\n" +
        "Please be available 10 minutes early.\n\n" +
        "Thank you."
    );

    mailSender.send(message);
}

}