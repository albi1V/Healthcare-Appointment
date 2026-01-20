package com.edutech.healthcare_appointment_management_system.service;
 
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.*;
 
@Service
public class ChatbotService {
 
    private final WebClient webClient;
 
    @Value("${groq.api.key}")
    private String apiKey;
 
    public ChatbotService(WebClient.Builder builder) {
        this.webClient = builder
                .baseUrl("https://api.groq.com")
                .build();
    }
 
    public String chat(String userMessage) {
 
    if (userMessage == null || userMessage.trim().isEmpty()) {
        throw new RuntimeException("Message cannot be empty");
    }
 
    Map<String, Object> requestBody = new HashMap<>();
    requestBody.put("model", "llama-3.1-8b-instant");
 
    requestBody.put("messages", List.of(
        Map.of("role", "user", "content", userMessage)
    ));
 
    Map response = webClient.post()
            .uri("/openai/v1/chat/completions")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
            .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map.class)
            .block();
 
     
    List<Map<String, Object>> choices =
            (List<Map<String, Object>>) response.get("choices");
 
    Map<String, Object> message =
            (Map<String, Object>) choices.get(0).get("message");
 
    return message.get("content").toString();
}
 
}
 