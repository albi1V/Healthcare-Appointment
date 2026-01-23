package com.edutech.healthcare_appointment_management_system.dto;
 
public class DoctorBrief {
    private Long id;
    private String username;
 
    public DoctorBrief() {}
 
    public DoctorBrief(Long id, String username) {
        this.id = id;
        this.username = username;
    }
 
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
 
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
}