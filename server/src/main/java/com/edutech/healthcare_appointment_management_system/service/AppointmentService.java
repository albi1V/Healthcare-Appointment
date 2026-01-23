package com.edutech.healthcare_appointment_management_system.service;
 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edutech.healthcare_appointment_management_system.common.QrUtil;
import com.edutech.healthcare_appointment_management_system.dto.TimeDto;
import com.edutech.healthcare_appointment_management_system.entity.Appointment;
import com.edutech.healthcare_appointment_management_system.entity.Doctor;
import com.edutech.healthcare_appointment_management_system.entity.Patient;
import com.edutech.healthcare_appointment_management_system.repository.*;
 
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
 
 

import java.time.LocalDateTime;
import java.util.List;
 
@Service
public class AppointmentService {
 
    @Autowired
    private AppointmentRepository appointmentRepository;
 
    @Autowired
    private PatientRepository patientRepository;
 
    @Autowired
    private DoctorService doctorService;

    @Autowired
private EmailService emailService;

@Autowired
private DoctorRepository doctorRepository;

@Autowired
private UserRepository userRepository;

@Autowired
    private SendGridEmailService sendGridEmailService;

 /*
 
  */   
public Appointment scheduleAppointment(Long patientId, Long doctorId, TimeDto timeDto) {

    List<Appointment> existingAppointments =
            appointmentRepository.getAppointmentsByDoctorId(doctorId);

    for (Appointment a : existingAppointments) {
        if (a.getAppointmentTime() == null) continue;

        long diff = Math.abs(
            a.getAppointmentTime().getTime() - timeDto.getTime().getTime()
        );

        // Block same 15-minute slot
        if (diff < (15 * 60 * 1000)) {
            throw new RuntimeException("Slot already booked");
        }
    }

    Appointment appointment = new Appointment();

    Patient p = patientRepository.findById(patientId).orElse(null);
    Doctor d = doctorService.findDoctorByID(doctorId);

    appointment.setDoctor(d);
    appointment.setPatient(p);
    appointment.setAppointmentTime(timeDto.getTime());
    appointment.setStatus("Scheduled");

    // return appointmentRepository.save(appointment);


    Appointment saved = appointmentRepository.save(appointment);
 
// ✅ NEW: Send confirmation email with QR (async). Booking still succeeds if email fails.

// NOTE: This does NOT change any time storage logic. It only formats IST text for the email body.

try {

    if (p != null && d != null && saved.getId() != null) {

        // Build email-friendly IST strings (keeps your existing time fix intact)

        java.util.TimeZone ist = java.util.TimeZone.getTimeZone("Asia/Kolkata");

        java.text.SimpleDateFormat dFmt = new java.text.SimpleDateFormat("yyyy-MM-dd");

        dFmt.setTimeZone(ist);

        java.text.SimpleDateFormat tFmt = new java.text.SimpleDateFormat("HH:mm");

        tFmt.setTimeZone(ist);
 
        java.util.Date apptDt = saved.getAppointmentTime();

        String dateStr = dFmt.format(apptDt);

        String timeStr = tFmt.format(apptDt);
 
        String link = ""; // optional: e.g., "https://your-ui.app/appointments/" + saved.getId()

        String qrPayload = "APPT:" + saved.getId()

        + "|PATIENT:" + p.getUsername()

        + "|DATE:" + dateStr

        + "|TIME:" + timeStr;
 
byte[] qrPng = QrUtil.toPng(qrPayload, 320);
 
sendGridEmailService.sendAppointmentConfirmation(

    p.getEmail(),

    p.getUsername(),

    d.getUsername(),

    d.getSpecialty(),

    dateStr,

    timeStr,

    saved.getId(),

    qrPng

);
 
    }

} catch (Exception ignored) {

    // Never break booking flow for email errors

}
 
return saved;

}

 



      public List<Appointment> getAppointmentsByPatientId(Long patientId){
          return appointmentRepository.getAppointmentsByPatientId(patientId);
      }
      public List<Appointment> getAppointments(){
          return appointmentRepository.findAll();
      }
      public Appointment rescheduleAppointment(Long appointmentId,TimeDto timeDto){
          Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
          if(appointment!=null){
              appointment.setAppointmentTime(timeDto.getTime());
              return appointmentRepository.save(appointment);
          }
          return null;
      }
      public List<Appointment> getAppointmentsByDoctorId(Long doctorId){
          return appointmentRepository.getAppointmentsByDoctorId(doctorId);
      }


      @Transactional
public void sendAppointmentReminders() {

Date now = new Date();
Date from = new Date(now.getTime() + (0 * 60 * 1000));
Date to   = new Date(now.getTime() + (1 * 60 * 1000));


    List<Appointment> appointments =
            appointmentRepository.findAppointmentsForReminder(from, to);

    for (Appointment appointment : appointments) {

        Patient patient = appointment.getPatient();
        Doctor doctor = appointment.getDoctor();

        if (patient == null || doctor == null) {
            continue;
        }

        emailService.sendAppointmentReminder(
                patient.getEmail(),
                patient.getUsername(),
                doctor.getUsername(),
                appointment.getAppointmentTime()
        );

        appointment.setReminderSent(true);
        appointmentRepository.save(appointment);
    }
}

    // NEW DELETE METHOD
    @Transactional
    public void deleteAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + appointmentId));
        appointmentRepository.delete(appointment);
    }
      // public String genrateAppointmentQr(Long appointmentId) throws Exception{
      //   Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
      //   if(appointmentId == null){
      //       throw new Exception("Appointment not found");
      //   }
      //   String qrContent = "Appointment ID: " + appointment.getId() + "\nPatient: " + appointment.getPatient().getUsername() + " (" + appointment.getPatient().getEmail() + ")" + "\nDoctor: " + appointment.getDoctor().getUsername() + " (" + appointment.getDoctor().getEmail() + ")" + "\nSpeciality: " + appointment.getDoctor().getSpecialty() + "\nAppointment Time: " + appointment.getAppointmentTime().toString() + "\nStatus: " + appointment.getStatus();
      //   return QrCodeGenerator.genrateQrCodeImage(qrContent, 300, 300);
      // }
}