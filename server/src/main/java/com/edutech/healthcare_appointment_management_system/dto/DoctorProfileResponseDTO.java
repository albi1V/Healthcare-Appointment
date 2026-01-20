package com.edutech.healthcare_appointment_management_system.dto;
 
import java.util.Date;
 
/**
 
* DTO for sending doctor profile data to frontend
 
* Used when doctor views their profile information
 
* DOES NOT include sensitive fields like password
 
*/
 
public class DoctorProfileResponseDTO {
 
    // ==========================================
 
    // User Basic Info (from User entity)
 
    // ==========================================
 
    private Long id;
 
    private String username;
 
    private String email;
 
    // ==========================================
 
    // Personal Information
 
    // ==========================================
 
    private String firstName;
 
    private String middleName;
 
    private String lastName;
 
    private Date dob;
 
    private String gender;
 
    private String phone;
 
    // ==========================================
 
    // Address Information
 
    // ==========================================
 
    private String country;
 
    private String state;
 
    private String city;
 
    private String zipCode;
 
    private String address;
 
    // ==========================================
 
    // Professional Information
 
    // ==========================================
 
    private String qualification;
 
    private String specialty;
 
    // ==========================================
 
    // Availability (keeping existing field)
 
    // ==========================================
 
    private String availability;
 
    // ==========================================
 
    // Default Constructor
 
    // ==========================================
 
    public DoctorProfileResponseDTO() {}
 
    // ==========================================
 
    // Getters and Setters
 
    // ==========================================
 
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
 
    public String getFirstName() {
 
        return firstName;
 
    }
 
    public void setFirstName(String firstName) {
 
        this.firstName = firstName;
 
    }
 
    public String getMiddleName() {
 
        return middleName;
 
    }
 
    public void setMiddleName(String middleName) {
 
        this.middleName = middleName;
 
    }
 
    public String getLastName() {
 
        return lastName;
 
    }
 
    public void setLastName(String lastName) {
 
        this.lastName = lastName;
 
    }
 
    public Date getDob() {
 
        return dob;
 
    }
 
    public void setDob(Date dob) {
 
        this.dob = dob;
 
    }
 
    public String getGender() {
 
        return gender;
 
    }
 
    public void setGender(String gender) {
 
        this.gender = gender;
 
    }
 
    public String getPhone() {
 
        return phone;
 
    }
 
    public void setPhone(String phone) {
 
        this.phone = phone;
 
    }
 
    public String getCountry() {
 
        return country;
 
    }
 
    public void setCountry(String country) {
 
        this.country = country;
 
    }
 
    public String getState() {
 
        return state;
 
    }
 
    public void setState(String state) {
 
        this.state = state;
 
    }
 
    public String getCity() {
 
        return city;
 
    }
 
    public void setCity(String city) {
 
        this.city = city;
 
    }
 
    public String getZipCode() {
 
        return zipCode;
 
    }
 
    public void setZipCode(String zipCode) {
 
        this.zipCode = zipCode;
 
    }
 
    public String getAddress() {
 
        return address;
 
    }
 
    public void setAddress(String address) {
 
        this.address = address;
 
    }
 
    public String getQualification() {
 
        return qualification;
 
    }
 
    public void setQualification(String qualification) {
 
        this.qualification = qualification;
 
    }
 
    public String getSpecialty() {
 
        return specialty;
 
    }
 
    public void setSpecialty(String specialty) {
 
        this.specialty = specialty;
 
    }
 
    public String getAvailability() {
 
        return availability;
 
    }
 
    public void setAvailability(String availability) {
 
        this.availability = availability;
 
    }
 
}