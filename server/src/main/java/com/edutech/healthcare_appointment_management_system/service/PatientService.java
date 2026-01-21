package com.edutech.healthcare_appointment_management_system.service;
 
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Service;

import com.edutech.healthcare_appointment_management_system.entity.Patient;

import com.edutech.healthcare_appointment_management_system.repository.PatientRepository;

import java.util.List;

import java.util.Optional;
 
@Service

public class PatientService {

    @Autowired

    private PatientRepository patientRepository;

    public List<Patient> searchPatients(String searchTerm) {

        System.out.println("==========================================");

        System.out.println("PATIENT SERVICE - searchPatients()");

        System.out.println("Search term received: '" + searchTerm + "'");

        try {

            List<Patient> results;

            if (searchTerm == null || searchTerm.trim().isEmpty()) {

                System.out.println("Empty search - fetching ALL patients");

                results = patientRepository.findAllPatients();

            } else {

                System.out.println("Searching for: '" + searchTerm.trim() + "'");

                results = patientRepository.searchPatients(searchTerm.trim());

            }

            System.out.println("Query returned " + results.size() + " patients:");

            for (Patient p : results) {

                System.out.println("  ID: " + p.getId() + " | Username: " + p.getUsername() + " | Email: " + p.getEmail() + " | Role: " + p.getRole());

            }

            System.out.println("==========================================");

            return results;

        } catch (Exception e) {

            System.out.println("!!! ERROR in searchPatients !!!");

            System.out.println("Error message: " + e.getMessage());

            e.printStackTrace();

            System.out.println("==========================================");

            return List.of();

        }

    }

    public Optional<Patient> getPatientById(Long patientId) {

        return patientRepository.findById(patientId);

    }

    public List<Patient> getAllPatients() {

        try {

            return patientRepository.findAllPatients();

        } catch (Exception e) {

            return patientRepository.findAll();

        }

    }

}
 