package com.edutech.healthcare_appointment_management_system.service;
 
import com.sendgrid.*;

import com.sendgrid.helpers.mail.Mail;

import com.sendgrid.helpers.mail.objects.*;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.stereotype.Service;
 
import java.io.IOException;

import java.util.Base64;
 
@Service

public class SendGridEmailService {
 
    @Value("${sendgrid.api.key}")

    private String sendGridApiKey;
 
    @Value("${sendgrid.from.email}")

    private String fromEmail;
 
    public void sendAppointmentConfirmation(

            String toEmail,

            String patientName,

            String doctorName,

            String specialty,

            String date,

            String time,

            Long appointmentId,

            byte[] qrPng

    ) throws IOException {
 
        Email from = new Email(fromEmail);

        Email to = new Email(toEmail);

        String subject = "Appointment Confirmed | Healthcare System";
 
        // ✅ SIMPLE EMAIL BODY (NO INLINE IMAGE)

        String htmlBody =

                "<h2>Appointment Confirmed</h2>" +

                "<p>Hello <b>" + patientName + "</b>,</p>" +

                "<p>Your appointment has been successfully booked.</p>" +

                "<hr/>" +

                "<p><b>Doctor:</b> " + doctorName + "</p>" +

                "<p><b>Specialty:</b> " + specialty + "</p>" +

                "<p><b>Date:</b> " + date + "</p>" +

                "<p><b>Time:</b> " + time + "</p>" +

                "<p><b>Appointment ID:</b> #" + appointmentId + "</p>" +

                "<br/>" +

                "<p><b>QR Code:</b> Your appointment QR code is attached with this email.</p>" +

                "<p>Please show and scan the QR code at the reception desk.</p>" +

                "<br/>" +

                "<p>Thank you,<br/>Healthcare Appointment Team</p>";
 
        Content content = new Content("text/html", htmlBody);

        Mail mail = new Mail(from, subject, to, content);
 
        // ✅ ATTACH QR FILE

        if (qrPng != null) {

            Attachments attachment = new Attachments();

            attachment.setContent(Base64.getEncoder().encodeToString(qrPng));

            attachment.setType("image/png");

            attachment.setFilename("appointment-qr.png");

            attachment.setDisposition("attachment");
 
            mail.addAttachments(attachment);

        }
 
        SendGrid sg = new SendGrid(sendGridApiKey);

        Request request = new Request();
 
        request.setMethod(Method.POST);

        request.setEndpoint("mail/send");

        request.setBody(mail.build());
 
        Response response = sg.api(request);
 
        System.out.println("SendGrid Email Status: " + response.getStatusCode());

    }

}

 