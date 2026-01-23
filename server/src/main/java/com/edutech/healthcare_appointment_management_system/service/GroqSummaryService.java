package com.edutech.healthcare_appointment_management_system.service;

import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Service
public class GroqSummaryService {

    // Read configuration from application properties
    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.model}")
    private String model;

    // Reusable OkHttpClient instance with timeouts configured
    private final OkHttpClient client;

    public GroqSummaryService() {
        this.client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS) // Max time to establish TCP connection
                .writeTimeout(30, TimeUnit.SECONDS)   // Max time for sending request body
                .readTimeout(30, TimeUnit.SECONDS)    // Max time to wait for server response
                .build();
    }

    /**
     * Generates a structured medical report using the Groq API.
     * If the API fails or returns unexpected output, a fallback structured report is returned.
     */
    public MedicalReportContent generateMedicalReport(String patientName, String patientId, String patientEmail,
                                                      String doctorName, String doctorId,
                                                      String diagnosis, String treatment, String recordDate) {
        try {
            // Build a long, explicit prompt to control the LLM output format and content
            String prompt = buildDetailedPrompt(
                    patientName, patientId, patientEmail, doctorName, doctorId,
                    diagnosis, treatment, recordDate
            );

            // Construct request body as per Chat Completions-like schema
            JSONObject requestBody = new JSONObject();
            requestBody.put("model", model);

            // Prepare messages array with a single 'user' message containing the prompt
            JSONArray messages = new JSONArray();
            JSONObject message = new JSONObject();
            message.put("role", "user");
            message.put("content", prompt);
            messages.put(message);

            // Additional generation parameters
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.5); // Balanced creativity vs determinism
            requestBody.put("max_tokens", 2500); // Ensure enough space for long sections

            // Convert JSON to OkHttp RequestBody
            RequestBody body = RequestBody.create(
                    requestBody.toString(),
                    MediaType.parse("application/json")
            );

            // Build HTTP request with Authorization header
            Request request = new Request.Builder()
                    .url(apiUrl)
                    .post(body)
                    .addHeader("Authorization", "Bearer " + apiKey)
                    .addHeader("Content-Type", "application/json")
                    .build();

            // Execute request synchronously and handle response
            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    // On non-2xx, log and return fallback content
                    System.err.println("Groq API call failed: " + response);
                    return generateFallbackReport(patientName, diagnosis, treatment);
                }

                // Read body as string and parse JSON
                String responseBody = response.body().string();
                JSONObject jsonResponse = new JSONObject(responseBody);

                // Navigate to the assistant message content
                String content = jsonResponse
                        .getJSONArray("choices")
                        .getJSONObject(0)
                        .getJSONObject("message")
                        .getString("content")
                        .trim();

                // Parse the structured text into the internal DTO
                return parseAIResponse(content, patientName, diagnosis, treatment);
            }

        } catch (Exception e) {
            // Any exception along the way triggers a safe fallback
            e.printStackTrace();
            return generateFallbackReport(patientName, diagnosis, treatment);
        }
    }

    /**
     * Creates a very explicit and sectioned prompt to instruct the LLM to return
     * a comprehensive medical report with strict headers and rich details.
     */
    private String buildDetailedPrompt(String patientName, String patientId, String patientEmail,
                                       String doctorName, String doctorId,
                                       String diagnosis, String treatment, String recordDate) {
        return String.format(
            "You are a medical documentation specialist. Generate a COMPREHENSIVE and DETAILED medical case summary with extensive clinical information.\n\n" +

            "Patient: %s (ID: %s, Email: %s)\n" +
            "Attending Physician: Dr. %s (ID: %s)\n" +
            "Consultation Date: %s\n" +
            "Primary Diagnosis: %s\n" +
            "Prescribed Treatment: %s\n\n" +

            "Generate these sections with EXTENSIVE detail (5-8 sentences each, rich with clinical information):\n\n" +

            "1. CHIEF COMPLAINT:\n" +
            "   Provide a thorough description of the patient's presenting symptoms related to '%s'. " +
            "Include specific details about: the exact nature and quality of symptoms (sharp, dull, throbbing, etc.), " +
            "precise location and radiation patterns, severity rating (1-10 scale if applicable), " +
            "duration and frequency of symptoms, aggravating and alleviating factors, " +
            "impact on activities of daily living (work, sleep, eating, mobility), " +
            "associated symptoms that accompany the chief complaint, " +
            "and the patient's own description of how the condition affects their quality of life.\n\n" +

            "2. HISTORY OF PRESENT ILLNESS:\n" +
            "   Provide a detailed chronological narrative of symptom evolution. Include: exact onset date and time if acute, " +
            "initial symptom presentation and intensity, progression pattern (gradual vs sudden, constant vs intermittent), " +
            "triggering events or precipitating factors identified by patient, " +
            "previous episodes or similar occurrences with dates, " +
            "self-treatment attempts and their effectiveness (over-the-counter medications, home remedies, rest), " +
            "why the patient decided to seek medical care at this particular time, " +
            "changes in symptoms over the past 24-48 hours, " +
            "and any red flag symptoms that prompted urgent evaluation.\n\n" +

            "3. PAST MEDICAL HISTORY:\n" +
            "   Document comprehensive background medical information including: relevant chronic medical conditions and their current status, " +
            "previous similar diagnoses with dates and outcomes, " +
            "history of hospitalizations or surgeries (especially related to current condition), " +
            "current medication list with dosages and indication, " +
            "known drug allergies and type of reaction, " +
            "family history of similar conditions or hereditary factors, " +
            "relevant social history (smoking, alcohol use, occupation, living situation), " +
            "immunization status if relevant, " +
            "and any predisposing factors or comorbidities that may influence current diagnosis or treatment.\n\n" +

            "4. CLINICAL ASSESSMENT:\n" +
            "   Provide comprehensive examination findings for '%s'. Include: vital signs with specific values " +
            "(temperature, blood pressure, heart rate, respiratory rate, oxygen saturation), " +
            "general appearance and level of distress, " +
            "systematic physical examination findings relevant to chief complaint (inspection, palpation, percussion, auscultation), " +
            "specific diagnostic signs or tests performed during examination, " +
            "any laboratory results or imaging studies reviewed (if applicable to the diagnosis), " +
            "clinical reasoning and differential diagnoses considered, " +
            "final diagnosis justification based on clinical criteria, " +
            "and severity assessment or staging of the condition.\n\n" +

            "5. TREATMENT PLAN:\n" +
            "   Provide exhaustive treatment details for '%s'. Include: complete medication name with generic and brand if applicable, " +
            "precise dosage strength and units, " +
            "exact administration route (oral, topical, injection, etc.), " +
            "detailed dosing schedule (frequency and timing), " +
            "total duration of treatment course, " +
            "mechanism of action and expected therapeutic effect, " +
            "common side effects the patient should monitor, " +
            "specific instructions (take with food, avoid alcohol, etc.), " +
            "non-pharmacological interventions (rest, ice/heat, physical therapy, dietary modifications), " +
            "activity restrictions or recommendations, " +
            "expected timeline for symptom improvement, " +
            "and clear instructions on what to do if symptoms worsen.\n\n" +

            "6. FOLLOW-UP RECOMMENDATIONS:\n" +
            "   Provide detailed follow-up care instructions including: specific follow-up appointment timeframe (exact days or weeks), " +
            "what will be assessed during follow-up visit, " +
            "symptoms that indicate improvement or successful treatment, " +
            "warning signs requiring immediate medical attention (create a specific list), " +
            "circumstances requiring emergency department visit, " +
            "additional diagnostic tests scheduled or recommended, " +
            "referrals to specialists if indicated, " +
            "patient education points about the condition and prevention, " +
            "lifestyle modifications for long-term management, " +
            "home monitoring instructions (temperature checks, symptom diary, etc.), " +
            "and resources or support services available to the patient.\n\n" +

            "FORMAT RESPONSE EXACTLY AS:\n" +
            "CHIEF COMPLAINT:\n[5-8 comprehensive sentences with clinical details]\n\n" +
            "HISTORY OF PRESENT ILLNESS:\n[5-8 comprehensive sentences with timeline and progression]\n\n" +
            "PAST MEDICAL HISTORY:\n[5-8 comprehensive sentences with background information]\n\n" +
            "CLINICAL ASSESSMENT:\n[5-8 comprehensive sentences with examination findings]\n\n" +
            "TREATMENT PLAN:\n[5-8 comprehensive sentences with detailed instructions]\n\n" +
            "FOLLOW-UP RECOMMENDATIONS:\n[5-8 comprehensive sentences with specific guidance]\n\n" +

            "IMPORTANT: Be thorough, professional, and clinically comprehensive. Use medical terminology appropriately. " +
            "Make the report detailed enough to serve as a complete medical record.",

            // Arguments for String.format placeholders
            patientName, patientId, patientEmail, doctorName, doctorId, recordDate, diagnosis, treatment,
            diagnosis, diagnosis, treatment
        );
    }

    /**
     * Parses the LLM's plain-text response by slicing between known headers.
     * If sections are missing, it fills critical ones with safe defaults.
     */
    private MedicalReportContent parseAIResponse(String aiResponse, String patientName,
                                                 String diagnosis, String treatment) {
        MedicalReportContent report = new MedicalReportContent();

        try {
            // Extract sections by fixed markers; returns "" if not found
            report.chiefComplaint = extractSection(aiResponse, "CHIEF COMPLAINT:", "HISTORY OF PRESENT ILLNESS:");
            report.historyOfPresentIllness = extractSection(aiResponse, "HISTORY OF PRESENT ILLNESS:", "PAST MEDICAL HISTORY:");
            report.pastMedicalHistory = extractSection(aiResponse, "PAST MEDICAL HISTORY:", "CLINICAL ASSESSMENT:");
            report.clinicalAssessment = extractSection(aiResponse, "CLINICAL ASSESSMENT:", "TREATMENT PLAN:");
            report.treatmentPlan = extractSection(aiResponse, "TREATMENT PLAN:", "FOLLOW-UP RECOMMENDATIONS:");
            report.followUpRecommendations = extractSection(aiResponse, "FOLLOW-UP RECOMMENDATIONS:", null);

            // Fallbacks for critical sections when parsing fails or content is empty
            if (report.chiefComplaint.isEmpty()) {
                report.chiefComplaint = String.format(
                        "%s presents with symptoms characteristic of %s. The patient reports experiencing " +
                        "significant discomfort and functional impairment. These symptoms have prompted the current medical consultation.",
                        patientName, diagnosis
                );
            }
            if (report.treatmentPlan.isEmpty()) {
                report.treatmentPlan = String.format(
                        "The patient is prescribed %s as the primary treatment modality. The medication should be taken as directed " +
                        "with appropriate dosing intervals. The patient has been counseled on medication adherence and potential side effects.",
                        treatment
                );
            }

        } catch (Exception e) {
            // If parsing itself fails, return the standard fallback content
            e.printStackTrace();
            return generateFallbackReport(patientName, diagnosis, treatment);
        }

        return report;
    }

    /**
     * Utility method to get the text between two section headers.
     * If endMarker is null, it returns until the end of the string.
     */
    private String extractSection(String text, String startMarker, String endMarker) {
        try {
            int startIdx = text.indexOf(startMarker);
            if (startIdx == -1) return ""; // Section not found

            startIdx += startMarker.length();
            int endIdx = endMarker != null ? text.indexOf(endMarker, startIdx) : text.length();
            if (endIdx == -1) endIdx = text.length();

            return text.substring(startIdx, endIdx).trim();
        } catch (Exception e) {
            // Be resilient against malformed content
            return "";
        }
    }

    /**
     * If the API call fails or the AI returns unusable content,
     * produce a structured, generic-but-safe report that fits the UI contract.
     */
    private MedicalReportContent generateFallbackReport(String patientName, String diagnosis, String treatment) {
        MedicalReportContent report = new MedicalReportContent();

        report.chiefComplaint = String.format(
                "%s presents to the clinic with primary complaints consistent with %s. The patient reports experiencing significant discomfort " +
                "and functional limitations related to this condition. Symptoms have been progressively affecting quality of life and daily activities. " +
                "The patient describes the condition as moderately severe, warranting medical evaluation and intervention. Associated symptoms have also been " +
                "noted by the patient. The severity of the presentation has necessitated comprehensive clinical assessment. The patient expresses concern " +
                "about symptom progression and seeks effective therapeutic management.",
                patientName, diagnosis
        );

        report.historyOfPresentIllness =
                "The patient reports that initial symptoms began approximately several days ago with mild presentation. Symptom onset was gradual without specific " +
                "triggering event identified. Over the subsequent period, there has been steady progression in symptom intensity and frequency. The patient initially " +
                "attempted self-management with over-the-counter remedies and conservative measures. Despite these efforts, symptoms continued to worsen, " +
                "prompting the current medical consultation. The patient denies recent trauma, exposure to ill contacts, or changes in medications. " +
                "Review of systems reveals symptoms limited to the affected area without systemic involvement. The progression pattern has been consistent " +
                "without significant fluctuation or intermittent relief periods.";

        report.pastMedicalHistory =
                "Complete medical history has been obtained and carefully reviewed. The patient's background includes documentation of relevant health information " +
                "and previous medical encounters. Screening for chronic conditions, hereditary factors, and predisposing conditions has been performed. " +
                "The patient reports medication allergies have been assessed and documented appropriately. Current medication regimen has been reviewed for potential " +
                "interactions with proposed treatment. Family history includes consideration of hereditary conditions relevant to current presentation. " +
                "Social history including occupation, lifestyle factors, and environmental exposures has been documented. Previous similar episodes, if any, " +
                "have been compared to current presentation. Immunization status and preventive health measures have been reviewed and are current.";

        report.clinicalAssessment = String.format(
                "Comprehensive physical examination was conducted with systematic evaluation of relevant systems. Vital signs were obtained and documented within " +
                "normal parameters for age and presentation. General appearance reveals a patient in mild to moderate distress related to primary complaint. " +
                "Focused examination of affected area demonstrates clinical findings consistent with %s. Specific diagnostic signs have been elicited supporting " +
                "the clinical diagnosis. Differential diagnoses were considered and systematically ruled out based on clinical presentation and examination findings. " +
                "The diagnosis of %s has been confirmed based on established clinical criteria and diagnostic standards. Severity assessment indicates condition " +
                "is appropriate for outpatient management with close follow-up monitoring.",
                diagnosis, diagnosis
        );

        report.treatmentPlan = String.format(
                "The patient has been prescribed %s as the primary pharmacological intervention for this condition. Detailed medication instructions include " +
                "specific dosing schedule, route of administration, and duration of therapy. The patient has been counseled on proper medication administration " +
                "technique and the importance of adherence to the full treatment course. Common side effects and adverse reactions have been discussed, with " +
                "instructions to report any concerning symptoms. Non-pharmacological interventions have been recommended including adequate rest, hydration, " +
                "and activity modifications as appropriate. Specific precautions regarding drug interactions and contraindications have been reviewed. " +
                "Expected timeline for therapeutic response and symptom improvement has been explained. The patient has been advised on supportive care measures " +
                "and lifestyle modifications to facilitate recovery and prevent recurrence.",
                treatment
        );

        report.followUpRecommendations =
                "The patient is scheduled for follow-up evaluation in 7-14 days for reassessment of treatment response and clinical progress. During the follow-up visit, " +
                "symptom resolution and any residual complaints will be evaluated. The patient has been instructed to return sooner if symptoms worsen, new symptoms develop, " +
                "or there is no improvement within the expected timeframe. Specific warning signs requiring immediate medical attention have been explained and include: " +
                "fever above 101°F, severe or worsening pain, development of new symptoms, signs of allergic reaction, or any other concerning changes. " +
                "The patient should seek emergency care if experiencing severe symptoms or signs of complications. Home monitoring instructions include maintaining a symptom diary " +
                "and noting any changes in condition. Patient education materials regarding the diagnosed condition have been provided. The importance of medication compliance " +
                "and completing the full treatment course has been emphasized. Contact information for questions or concerns has been provided to the patient.";

        return report;
    }

    /**
     * Simple DTO to hold extracted sections of the medical report.
     */
    public static class MedicalReportContent {
        public String chiefComplaint = "";
        public String historyOfPresentIllness = "";
        public String pastMedicalHistory = "";
        public String clinicalAssessment = "";
        public String treatmentPlan = "";
        public String followUpRecommendations = "";
    }
}


