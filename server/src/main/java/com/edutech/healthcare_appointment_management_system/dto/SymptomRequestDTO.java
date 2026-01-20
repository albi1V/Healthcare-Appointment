package com.edutech.healthcare_appointment_management_system.dto;
 
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
 
/**
* Request DTO for symptom submission
*/
public class SymptomRequestDTO {
    @NotBlank(message = "Symptoms cannot be empty")
    @Size(min = 10, max = 1000, message = "Symptoms must be between 10 and 1000 characters")
    private String symptoms;
 
    // Constructors
    public SymptomRequestDTO() {}
 
    public SymptomRequestDTO(String symptoms) {
        this.symptoms = symptoms;
    }
 
    // Getters and Setters
    public String getSymptoms() {
        return symptoms;
    }
 
    public void setSymptoms(String symptoms) {
        this.symptoms = symptoms;
    }
 
    @Override
    public String toString() {
        return "SymptomRequestDTO{" +
                "symptoms='" + symptoms + '\'' +
                '}';
    }
}