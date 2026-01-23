package com.edutech.healthcare_appointment_management_system.service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;
 
/**
* AI Service for medical specialty classification using Groq API
* 
* PURPOSE: Communicates with Groq's Llama 3.3 70B model to analyze patient symptoms
* and recommend the appropriate medical specialist
* 
* GROQ INFO:
* - Free API with no credit card required
* - Model: llama-3.3-70b-versatile
* - Very fast inference (< 1 second response time)
* - Rate limit: 60 requests per minute (free tier)
* 
* CONFIGURATION: API credentials are in application.properties
* - groq.api.key: Your Groq API key from console.groq.com
* - groq.api.url: API endpoint
* - groq.model: AI model name
*/
 
@Service
public class GroqAIService {
 
    // Inject configuration from application.properties
 
    @Value("${groq.api.key}")
    private String apiKey;
 
    @Value("${groq.api.url}")
    private String apiUrl;
 
    @Value("${groq.model}")
    private String model;
 
    private final RestTemplate restTemplate;  // HTTP client for API calls
    private final ObjectMapper objectMapper;  // JSON parser
 
    /**
     * List of valid medical specialties in our system
     * IMPORTANT: These MUST match the specialty values in your Doctor table
     * If AI returns a specialty not in this list, fallback is "General Physician"
     */
    private static final List<String> VALID_SPECIALTIES = Arrays.asList(
        "Cardiologist",       // Heart and cardiovascular issues
        "Dermatologist",      // Skin conditions
        "Neurologist",        // Brain and nervous system
        "Orthopedician",      // Bones, joints, muscles
        "Ophthalmologist",    // Eye conditions
        "General Physician",  // General health issues (fallback)
        "Pediatrician",       // Children's health
        "Gynecologist",       // Women's reproductive health
        "ENT Specialist",     // Ear, nose, throat
        "Psychiatrist"        // Mental health
    );
 
    /**
     * Constructor: Initializes HTTP client and JSON parser
     */
    public GroqAIService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }
 
    /**
     * Main public method: Analyzes symptoms and returns recommended specialty
     * 
     * FLOW:
     * 1. Build AI prompt with symptoms and specialty list
     * 2. Send request to Groq API
     * 3. Parse AI response
     * 4. Validate specialty against allowed list
     * 5. Return validated specialty or "General Physician" as fallback
     * 
     * @param symptoms - Patient's symptom description
     * @return Medical specialty name (e.g., "Cardiologist")
     */
    public String getSpecialtyFromSymptoms(String symptoms) {
        try {
 
            // STEP 1: Create AI prompt with instructions
            String prompt = buildPrompt(symptoms);
 
            // STEP 2: Call Groq API with the prompt
            String rawResponse = callGroq(prompt);
 
            // STEP 3: Extract specialty text from JSON response
            String specialty = extractSpecialty(rawResponse);
 
            // STEP 4: Validate against allowed specialties
            return validateSpecialty(specialty);
        } catch (Exception e) {
            // If AI fails, log error and return safe fallback
            System.err.println("Groq AI Error: " + e.getMessage());
            e.printStackTrace();
            return "General Physician";  // Fallback specialty
        }
    }
 
 
    /**
     * Builds the AI prompt with clear instructions
     * 
     * PROMPT ENGINEERING:
     * - Tells AI it's a medical classifier
     * - Provides exact specialty list
     * - Instructs to return ONLY the specialty name (no explanation)
     * - This ensures clean, parseable responses
     * 
     * @param symptoms - Patient symptoms to analyze
     * @return Formatted prompt string for AI
     */
    private String buildPrompt(String symptoms) {
        return "You are a medical specialist classifier. Choose ONLY ONE specialty from this list:\n" +
               String.join(", ", VALID_SPECIALTIES) + "\n\n" +
               "Symptoms: " + symptoms + "\n\n" +
               "Return ONLY the specialty name, nothing else.";
    }
 
 
 
    /**
     * Makes HTTP POST request to Groq API
     * 
     * REQUEST STRUCTURE:
     * - model: Which AI model to use (llama-3.3-70b-versatile)
     * - temperature: 0.1 (low = more focused/deterministic responses)
     * - max_tokens: 20 (short response, just specialty name)
     * - messages: Array with user's prompt
     * 
     * AUTHENTICATION: Uses Bearer token (API key in header)
     * 
     * @param prompt - The formatted prompt to send to AI
     * @return Raw JSON response from Groq API
     * @throws Exception if API call fails
     */
    private String callGroq(String prompt) throws Exception {
        // Build request body
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("temperature", 0.1);  // Low temperature = consistent results
        requestBody.put("max_tokens", 20);    // Short response expected
        // Format message for AI
        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        messages.add(message);
        requestBody.put("messages", messages);
        // Set HTTP headers with authentication
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);  // API key for authentication
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        System.out.println("🚀 Calling Groq API...");
        // Make POST request to Groq
        ResponseEntity<String> response = restTemplate.exchange(
            apiUrl,
            HttpMethod.POST,
            entity,
            String.class
        );
        // Check if successful
        if (response.getStatusCode() == HttpStatus.OK) {
            System.out.println("✅ Groq API Success!");
            return response.getBody();
        } else {
            throw new RuntimeException("Groq API error: " + response.getStatusCode());
        }
    }
 
 
 
    /**
     * Parses JSON response from Groq API to extract specialty text
     * 
     * RESPONSE STRUCTURE:
     * {
     *   "choices": [
     *     {
     *       "message": {
     *         "content": "Cardiologist"
     *       }
     *     }
     *   ]
     * }
     * 
     * @param jsonResponse - Raw JSON string from API
     * @return Extracted specialty text (e.g., "Cardiologist")
     * @throws Exception if JSON parsing fails
     */
    private String extractSpecialty(String jsonResponse) throws Exception {
        JsonNode root = objectMapper.readTree(jsonResponse);
        JsonNode choices = root.path("choices");
        if (choices.isArray() && choices.size() > 0) {
            String text = choices.get(0).path("message").path("content").asText();
            System.out.println("🤖 AI Response: '" + text + "'");
            return text.trim();
        }
        throw new RuntimeException("Unable to extract specialty");
    }
 
 
    
    /**
     * Validates AI response against allowed specialty list
     * 
     * VALIDATION STEPS:
     * 1. Clean the AI response (remove special characters)
     * 2. Try exact match (case-insensitive)
     * 3. Try partial match (e.g., "Cardio" matches "Cardiologist")
     * 4. If no match, return "General Physician" as safe fallback
     * 
     * WHY: AI might return "cardiology" instead of "Cardiologist"
     * This ensures we always get a valid specialty from our database
     * 
     * @param specialty - Raw specialty text from AI
     * @return Validated specialty that exists in VALID_SPECIALTIES list
     */
    private String validateSpecialty(String specialty) {
        // Clean response: remove punctuation, extra spaces
        specialty = specialty.replaceAll("[^a-zA-Z ]", "").trim();
        // ATTEMPT 1: Exact match (case-insensitive)
        for (String valid : VALID_SPECIALTIES) {
            if (valid.equalsIgnoreCase(specialty)) {
                System.out.println("✅ Matched: " + valid);
                return valid;
            }
        }
        // ATTEMPT 2: Partial match (handles variations like "Cardio" -> "Cardiologist")
        for (String valid : VALID_SPECIALTIES) {
            if (specialty.toLowerCase().contains(valid.toLowerCase())) {
                System.out.println("✅ Partial match: " + valid);
                return valid;
            }
        }
        // FALLBACK: If no match found, default to General Physician
        System.out.println("⚠️ Fallback to General Physician");
        return "General Physician";
    }
}