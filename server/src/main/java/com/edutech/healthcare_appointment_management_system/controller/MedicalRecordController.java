package com.edutech.healthcare_appointment_management_system.controller;
 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
 
import com.edutech.healthcare_appointment_management_system.dto.PatientSummary;
import com.edutech.healthcare_appointment_management_system.dto.DoctorBrief;
import com.edutech.healthcare_appointment_management_system.dto.PatientBrief;
import com.edutech.healthcare_appointment_management_system.dto.MedicalRecordView;
 
import com.edutech.healthcare_appointment_management_system.entity.MedicalRecord;
import com.edutech.healthcare_appointment_management_system.entity.Patient;
import com.edutech.healthcare_appointment_management_system.service.MedicalRecordService;
import com.edutech.healthcare_appointment_management_system.service.PatientService;
import com.edutech.healthcare_appointment_management_system.service.ReportService;
 
import java.util.List;
import java.util.stream.Collectors;
 
@RestController
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    // ✅ expose filename so browser code can read it
    exposedHeaders = { HttpHeaders.CONTENT_DISPOSITION }
)
public class MedicalRecordController {
 
    @Autowired
    private MedicalRecordService medicalRecordService;
 
    @Autowired
    private PatientService patientService;
 
    @Autowired
    private ReportService reportService;
 
    // Search patients (returns lightweight DTOs)
    @GetMapping("/api/patients/search")
    public ResponseEntity<List<PatientSummary>> searchPatients(
            @RequestParam(required = false, defaultValue = "") String searchTerm) {
        try {
            List<Patient> patients = patientService.searchPatients(searchTerm);
            List<PatientSummary> result = patients.stream()
                    .map(p -> new PatientSummary(p.getId(), p.getUsername(), p.getEmail()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }
 
    // Doctor: view patient medical history (DTO list)
    @GetMapping("/api/doctor/patients/{patientId}/records")
    public ResponseEntity<List<MedicalRecordView>> getPatientRecords(@PathVariable Long patientId) {
        System.out.println("Doctor view history => patientId=" + patientId);
        List<MedicalRecord> records = medicalRecordService.getMedicalRecordsByPatientId(patientId);
 
        List<MedicalRecordView> dto = records.stream().map(r ->
            new MedicalRecordView(
                r.getId(),
                r.getRecordDate(),
                r.getDiagnosis(),
                r.getTreatment(),
                new PatientBrief(
                    r.getPatient() != null ? r.getPatient().getId() : null,
                    r.getPatient() != null ? r.getPatient().getUsername() : null
                ),
                new DoctorBrief(
                    r.getDoctor() != null ? r.getDoctor().getId() : null,
                    r.getDoctor() != null ? r.getDoctor().getUsername() : null
                )
            )
        ).collect(Collectors.toList());
 
        System.out.println("Records found: " + (dto == null ? 0 : dto.size()));
        return ResponseEntity.ok(dto);
    }
 
    // Doctor: add a medical record (return DTO)
    @PostMapping("/api/doctor/medical-record")
    public ResponseEntity<MedicalRecordView> addMedicalRecord(
            @RequestParam Long patientId,
            @RequestParam Long doctorId,
            @RequestParam String diagnosis,
            @RequestParam String treatment) {
        try {
            MedicalRecord record = medicalRecordService.addMedicalRecord(patientId, doctorId, diagnosis, treatment);
            System.out.println("Record saved successfully with ID: " + record.getId());
            System.out.println("Saved record -> id=" + record.getId()
                    + ", patientId=" + (record.getPatient() != null ? record.getPatient().getId() : null)
                    + ", doctorId=" + (record.getDoctor() != null ? record.getDoctor().getId() : null));
 
            MedicalRecordView dto = new MedicalRecordView(
                    record.getId(),
                    record.getRecordDate(),
                    record.getDiagnosis(),
                    record.getTreatment(),
                    new PatientBrief(
                        record.getPatient() != null ? record.getPatient().getId() : null,
                        record.getPatient() != null ? record.getPatient().getUsername() : null
                    ),
                    new DoctorBrief(
                        record.getDoctor() != null ? record.getDoctor().getId() : null,
                        record.getDoctor() != null ? record.getDoctor().getUsername() : null
                    )
            );
            return new ResponseEntity<>(dto, HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
 
    // Receptionist: view patient medical history (DTO list)
    @GetMapping("/api/receptionist/patients/{patientId}/records")
    public ResponseEntity<List<MedicalRecordView>> getPatientRecordsByReceptionist(@PathVariable Long patientId) {
        List<MedicalRecord> records = medicalRecordService.getMedicalRecordsByPatientId(patientId);
        List<MedicalRecordView> dto = records.stream().map(r ->
            new MedicalRecordView(
                r.getId(),
                r.getRecordDate(),
                r.getDiagnosis(),
                r.getTreatment(),
                new PatientBrief(
                    r.getPatient() != null ? r.getPatient().getId() : null,
                    r.getPatient() != null ? r.getPatient().getUsername() : null
                ),
                new DoctorBrief(
                    r.getDoctor() != null ? r.getDoctor().getId() : null,
                    r.getDoctor() != null ? r.getDoctor().getUsername() : null
                )
            )
        ).collect(Collectors.toList());
        return ResponseEntity.ok(dto);
    }
 
    // ✅ NEW: Download PDF report for a medical record
    @GetMapping("/api/records/{recordId}/report")
    public ResponseEntity<byte[]> downloadMedicalRecordReport(@PathVariable Long recordId) {
        try {
            MedicalRecord found = medicalRecordService.getMedicalRecordById(recordId);
            if (found == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(("Record not found: " + recordId).getBytes());
            }
 
            byte[] pdf = reportService.buildMedicalRecordPdf(recordId);
            String filename = "Record_" + recordId + (found.getPatient() != null ? ("_Patient_" + found.getPatient().getId()) : "") + ".pdf";
 
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
            headers.setCacheControl(CacheControl.noCache().getHeaderValue());
            headers.setContentLength(pdf.length);
 
            return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
 
        } catch (Exception e) {
            e.printStackTrace();
            // Return error text so client can show the message if needed
            String msg = "Error generating report: " + e.getMessage();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(msg.getBytes());
        }
    }
}