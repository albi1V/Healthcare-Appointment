package com.edutech.healthcare_appointment_management_system.dto;
 
import java.util.List;
/**
* Response DTO for doctor recommendation
*/
public class DoctorRecommendationDTO {
    private String recommendedSpecialist;
    private List<DoctorSummaryDTO> availableDoctors;
    private String message;
 
    // Constructors
    public DoctorRecommendationDTO() {}
 
    public DoctorRecommendationDTO(String recommendedSpecialist, 
                                   List<DoctorSummaryDTO> availableDoctors) {
        this.recommendedSpecialist = recommendedSpecialist;
        this.availableDoctors = availableDoctors;
    }
 
    public DoctorRecommendationDTO(String recommendedSpecialist, 
                                   List<DoctorSummaryDTO> availableDoctors,
                                   String message) {
        this.recommendedSpecialist = recommendedSpecialist;
        this.availableDoctors = availableDoctors;
        this.message = message;
    }
 
    // Getters and Setters
    public String getRecommendedSpecialist() {
        return recommendedSpecialist;
    }
 
    public void setRecommendedSpecialist(String recommendedSpecialist) {
        this.recommendedSpecialist = recommendedSpecialist;
    }
 
    public List<DoctorSummaryDTO> getAvailableDoctors() {
        return availableDoctors;
    }
 
    public void setAvailableDoctors(List<DoctorSummaryDTO> availableDoctors) {
        this.availableDoctors = availableDoctors;
    }
 
    public String getMessage() {
        return message;
    }
 
    public void setMessage(String message) {
        this.message = message;
    }
 
    @Override
    public String toString() {
        return "DoctorRecommendationDTO{" +
                "recommendedSpecialist='" + recommendedSpecialist + '\'' +
                ", availableDoctors=" + availableDoctors +
                ", message='" + message + '\'' +
                '}';
    }
}