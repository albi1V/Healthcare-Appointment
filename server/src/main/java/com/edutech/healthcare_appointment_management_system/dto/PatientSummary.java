package com.edutech.healthcare_appointment_management_system.dto;
 
/**
* A lightweight Data Transfer Object (DTO) representing summary-level
* information about a patient. This is typically used in lists, search
* results, or dropdown selections where only minimal patient details
* are needed — not the full patient profile.
*/
public class PatientSummary {
 
    // Unique identifier for the patient.
    private Long id;
 
    // Patient's username or display name shown in UI.
    private String username;
 
    // Email associated with the patient account.
    private String email;
 
    // Default constructor required by frameworks like Jackson for JSON binding.
    public PatientSummary() {}
 
    /**
     * Parameterized constructor for easy object creation.
     *
     * @param id       Patient ID
     * @param username Patient's username
     * @param email    Patient's email address
     */
    public PatientSummary(Long id, String username, String email) {
        this.id = id;
        this.username = username;
        this.email = email;
    }
 
    // ---- Getters and Setters ----
 
    public Long getId() { 
        return id; 
    }
    public void setId(Long id) { 
        this.id = id; 
    }
 
    public String getUsername() { 
        return username; 
    }
    public void setUsername(String username) { 
        this.username = username; 
    }
 
    public String getEmail() { 
        return email; 
    }
    public void setEmail(String email) { 
        this.email = email; 
    }
}