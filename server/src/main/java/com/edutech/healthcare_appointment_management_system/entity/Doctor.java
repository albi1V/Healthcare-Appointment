package com.edutech.healthcare_appointment_management_system.entity;
 
import javax.persistence.*;
 
import com.fasterxml.jackson.annotation.JsonIgnore;
 
import java.util.Date;
 
import java.util.Set;
 
@Entity

public class Doctor extends User {
 
    // ==========================================
 
    // EXISTING CODE - UNCHANGED
 
    // ==========================================
 
    @OneToMany(mappedBy = "doctor")

    @JsonIgnore

    private Set<Appointment> appointments;
 
    @OneToMany(mappedBy = "doctor")

    @JsonIgnore

    private Set<MedicalRecord> medicalRecords;
 
    private String specialty;
 
    private String availability;  // Keep as String
 
    // ==========================================
 
    // NEW: Personal Information Fields
 
    // ==========================================
 
    private String firstName;
 
    private String middleName;
 
    private String lastName;
 
    @Temporal(TemporalType.DATE)

    private Date dob;
 
    private String gender;
 
    private String phone;
 
    // ==========================================
 
    // NEW: Address Information Fields
 
    // ==========================================
 
    private String country;
 
    private String state;
 
    private String city;
 
    private String zipCode;
 
    @Column(length = 500)

    private String address;
 
    // ==========================================
 
    // NEW: Professional Information Fields
 
    // ==========================================
 
    private String qualification;
 
    // Note: 'specialty' already exists above, so we keep it
 
    // If you want to add more professional fields, add them here
 
    // ==========================================
 
    // EXISTING CONSTRUCTOR - UNCHANGED
 
    // ==========================================
 
    public Doctor() {}
 
    // ==========================================
 
    // EXISTING GETTERS/SETTERS - UNCHANGED
 
    // ==========================================
 
    public Set<Appointment> getAppointments() {
 
        return appointments;
 
    }
 
    public void setAppointments(Set<Appointment> appointments) {
 
        this.appointments = appointments;
 
    }
 
    public Set<MedicalRecord> getMedicalRecords() {
 
        return medicalRecords;
 
    }
 
    public void setMedicalRecords(Set<MedicalRecord> medicalRecords) {
 
        this.medicalRecords = medicalRecords;
 
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
 
    // ==========================================
 
    // EXISTING HELPER METHOD - UNCHANGED
 
    // ==========================================
 
    @JsonIgnore
 
    public Boolean isAvailable() {
 
        if (availability == null) {
 
            return false;
 
        }
 
        return availability.equalsIgnoreCase("true") ||
 
               availability.equalsIgnoreCase("available") ||
 
               availability.equalsIgnoreCase("yes") ||
 
               availability.equals("1");
 
    }
 
    // ==========================================
 
    // NEW: Getters and Setters for Profile Fields
 
    // ==========================================
 
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
 
}

 