package com.edutech.healthcare_appointment_management_system.controller;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.edutech.healthcare_appointment_management_system.service.ChatbotService;
 
@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatbotController {
 
    private final ChatbotService chatbotService;
 
    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }
 
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, String> body) {
 
        if (!body.containsKey("message") || body.get("message").trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Message is required"));
        }
 
        String reply = chatbotService.chat(body.get("message"));
 
        // ✅ Always return JSON
        return ResponseEntity.ok(
                Map.of("reply", reply)
        );
    }
}