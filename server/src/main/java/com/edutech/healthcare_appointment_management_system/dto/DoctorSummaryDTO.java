package com.edutech.healthcare_appointment_management_system.dto;
 
/**
* Simplified doctor information for recommendations
* Uses String for availability to match Doctor entity
*/
public class DoctorSummaryDTO {
    private Long id;
    private String username;
    private String specialty;
    private String email;
    private String availability;  // String type matches Doctor entity
 
    // Constructors
    public DoctorSummaryDTO() {}
 
    public DoctorSummaryDTO(Long id, String username, String specialty, 
                           String email, String availability) {
        this.id = id;
        this.username = username;
        this.specialty = specialty;
        this.email = email;
        this.availability = availability;
    }
 
    // Getters and Setters
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
 
    public String getSpecialty() {
        return specialty;
    }
 
    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }
 
    public String getEmail() {
        return email;
    }
 
    public void setEmail(String email) {
        this.email = email;
    }
 
    public String getAvailability() {
        return availability;
    }
 
    public void setAvailability(String availability) {
        this.availability = availability;
    }
 
    @Override
    public String toString() {
        return "DoctorSummaryDTO{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", specialty='" + specialty + '\'' +
                ", email='" + email + '\'' +
                ", availability='" + availability + '\'' +
                '}';
    }
}