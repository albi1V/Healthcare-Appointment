package com.edutech.healthcare_appointment_management_system.service;

import com.edutech.healthcare_appointment_management_system.entity.MedicalRecord;
import com.edutech.healthcare_appointment_management_system.entity.Patient;
import com.edutech.healthcare_appointment_management_system.entity.Doctor;
import com.edutech.healthcare_appointment_management_system.service.GroqSummaryService.MedicalReportContent;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.PDFont;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReportService {

    // Dependencies:
    // - medicalRecordService: fetches MedicalRecord and related Patient/Doctor
    // - groqService: generates AI-based narrative content for the report
    private final MedicalRecordService medicalRecordService;
    private final GroqSummaryService groqService;

    @Autowired
    public ReportService(MedicalRecordService medicalRecordService, GroqSummaryService groqService) {
        this.medicalRecordService = medicalRecordService;
        this.groqService = groqService;
    }

    // Layout constants for the PDF
    private static final float MARGIN = 50f;
    private static final float CONTENT_WIDTH = 495f;          // Available text width (A4 width minus margins)
    private static final float FOOTER_RESERVED_SPACE = 100f;  // Space reserved to avoid overlapping footer

    /**
     * Builds a multi-page Medical Record PDF as a byte[].
     * Steps:
     * 1) Fetch MedicalRecord + Patient + Doctor
     * 2) Normalize text values (safe())
     * 3) Generate AI narrative (chief complaint, HPI, etc.)
     * 4) Create PDF (title, sections, paragraphs with wrapping, pagination, header/footers)
     */
    public byte[] buildMedicalRecordPdf(Long recordId) {
        // Fetch the medical record; error if missing
        MedicalRecord r = medicalRecordService.getMedicalRecordById(recordId);
        if (r == null) {
            throw new RuntimeException("MedicalRecord not found: " + recordId);
        }

        // Extract linked entities
        Patient p = r.getPatient();
        Doctor d = r.getDoctor();

        // Safely map values, avoid nulls and trim
        String patientName  = safe(p != null ? p.getUsername() : "Unknown");
        Long patientId = p != null ? p.getId() : null;
        String patientEmail = safe(p != null ? p.getEmail() : "N/A");
        String doctorName = safe(d != null ? d.getUsername() : "Unknown");
        Long doctorId = d != null ? d.getId() : null;
        String doctorEmail = safe(d != null ? d.getEmail() : "N/A");
        String diagnosis = safe(r.getDiagnosis());
        String treatment = safe(r.getTreatment());
        String recordDate = r.getRecordDate() != null
                ? r.getRecordDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "N/A";

        // Generate AI content using Groq service (structured narrative for the report)
        MedicalReportContent aiContent = groqService.generateMedicalReport(
            patientName, String.valueOf(patientId), patientEmail,
            doctorName, String.valueOf(doctorId),
            diagnosis, treatment, recordDate
        );

        // Will hold the final PDF bytes
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        // Create the PDF document in-memory
        try (PDDocument doc = new PDDocument()) {
            // ContentWriter encapsulates page creation, writing text, pagination, header/footer
            ContentWriter writer = new ContentWriter(doc, doctorName, recordDate);

            // Track Y position for writing; first page starts below the header area
            float pageHeight = PDRectangle.A4.getHeight();
            float yPos = pageHeight - 150f;

            // Create the first page with a gradient header and header text
            writer.startNewPage(true);
            yPos = writer.drawTitle(yPos);

            // === Patient Information Section ===
            yPos = writer.writeSectionHeader("Patient Information", yPos);
            yPos = writer.writeKeyValue("Patient Name:", patientName, yPos);
            yPos = writer.writeKeyValue("Medical Record Number:", String.valueOf(patientId), yPos);
            yPos = writer.writeKeyValue("Contact Information:", patientEmail, yPos);
            yPos -= 20;

            // === Doctor Information Section ===
            yPos = writer.writeSectionHeader("Doctor Information", yPos);
            yPos = writer.writeKeyValue("Doctor Name:", "Dr. " + doctorName, yPos);
            yPos = writer.writeKeyValue("Doctor ID:", String.valueOf(doctorId), yPos);
            yPos = writer.writeKeyValue("Email:", doctorEmail, yPos);
            yPos -= 20;

            // === Chief Complaint ===
            yPos = writer.writeSectionHeader("Chief Complaint", yPos);
            yPos = writer.writeParagraph(aiContent.chiefComplaint, yPos);
            yPos -= 20;

            // === History of Present Illness ===
            yPos = writer.writeSectionHeader("History of Present Illness", yPos);
            yPos = writer.writeParagraph(aiContent.historyOfPresentIllness, yPos);
            yPos -= 20;

            // === Past Medical History ===
            yPos = writer.writeSectionHeader("Past Medical History", yPos);
            yPos = writer.writeParagraph(aiContent.pastMedicalHistory, yPos);
            yPos -= 20;

            // === Clinical Assessment ===
            yPos = writer.writeSectionHeader("Clinical Assessment", yPos);
            yPos = writer.writeParagraph(aiContent.clinicalAssessment, yPos);
            yPos -= 20;

            // === Treatment Plan ===
            yPos = writer.writeSectionHeader("Treatment Plan", yPos);
            yPos = writer.writeParagraph(aiContent.treatmentPlan, yPos);
            yPos -= 20;

            // === Follow-up Recommendations ===
            yPos = writer.writeSectionHeader("Follow-up Recommendations", yPos);
            yPos = writer.writeParagraph(aiContent.followUpRecommendations, yPos);

            // Finalize last page, draw footer, close streams
            writer.close();

            // Write the document into the output byte stream
            doc.save(baos);
        } catch (IOException e) {
            // Convert checked exception to runtime to bubble up as service error
            throw new RuntimeException("Failed to build PDF report", e);
        }

        // Return the PDF as bytes to the caller (controller can stream/download)
        return baos.toByteArray();
    }

    /**
     * Utility: Replaces null/blank strings with "N/A" and trims whitespace.
     */
    private static String safe(String s) {
        return s == null || s.trim().isEmpty() ? "N/A" : s.trim();
    }

    /**
     * Helper class that encapsulates PDF writing concerns:
     * - Page lifecycle (start new page, maintain content stream)
     * - Drawing gradient header (first page only) and footer (every page)
     * - Writing sections, key-value rows, wrapped paragraphs
     * - Pagination logic via ensureSpace()
     */
    private class ContentWriter {
        private final PDDocument doc;
        private PDPage currentPage;
        private PDPageContentStream currentStream;
        private final String doctorName;
        private final String date;
        private float pageHeight;
        private float pageWidth;

        ContentWriter(PDDocument doc, String doctorName, String date) {
            this.doc = doc;
            this.doctorName = doctorName;
            this.date = date;
        }

        /**
         * Starts a new A4 page. If a page was open, draws its footer and closes it.
         * If isFirstPage=true, draws the gradient blue header and header text.
         */
        void startNewPage(boolean isFirstPage) throws IOException {
            if (currentStream != null) {
                // Before leaving current page, draw its footer and close stream
                drawFooter(currentStream, pageWidth, doctorName, date);
                currentStream.close();
            }

            // Create and register a fresh A4 page
            currentPage = new PDPage(PDRectangle.A4);
            doc.addPage(currentPage);
            pageHeight = currentPage.getMediaBox().getHeight();
            pageWidth = currentPage.getMediaBox().getWidth();

            // Open a new content stream for this page
            currentStream = new PDPageContentStream(doc, currentPage);

            // Draw a gradient header only on the first page
            if (isFirstPage) {
                drawGradientBlueHeader(currentStream, pageWidth, pageHeight);
                drawHeaderText(currentStream, pageWidth, pageHeight);
            }
        }

        /**
         * Draws centered document title and an underline rule.
         * Returns updated y position.
         */
        float drawTitle(float yPos) throws IOException {
            currentStream.beginText();
            currentStream.setFont(PDType1Font.HELVETICA_BOLD, 20);
            currentStream.setNonStrokingColor(Color.BLACK);
            currentStream.newLineAtOffset(
                (pageWidth - getTextWidth("Medical Case Summary Sheet", PDType1Font.HELVETICA_BOLD, 20)) / 2,
                yPos
            );
            currentStream.showText("Medical Case Summary Sheet");
            currentStream.endText();

            // Horizontal rule under the title
            yPos -= 5;
            currentStream.setStrokingColor(150, 150, 150);
            currentStream.setLineWidth(1f);
            currentStream.moveTo(MARGIN, yPos);
            currentStream.lineTo(pageWidth - MARGIN, yPos);
            currentStream.stroke();

            return yPos - 30;
        }

        /**
         * Writes a bold section header. Ensures space (may page-break).
         */
        float writeSectionHeader(String title, float yPos) throws IOException {
            yPos = ensureSpace(yPos, 40);

            currentStream.setNonStrokingColor(Color.BLACK);
            currentStream.beginText();
            currentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
            currentStream.newLineAtOffset(MARGIN, yPos);
            currentStream.showText(title);
            currentStream.endText();
            return yPos - 18;
        }

        /**
         * Writes a "Key: Value" line with bold key and regular value.
         * Key column starts at margin; value column starts at margin + 180.
         */
        float writeKeyValue(String key, String value, float yPos) throws IOException {
            yPos = ensureSpace(yPos, 20);

            currentStream.setNonStrokingColor(Color.BLACK);

            // Key (bold)
            currentStream.beginText();
            currentStream.setFont(PDType1Font.HELVETICA_BOLD, 10);
            currentStream.newLineAtOffset(MARGIN, yPos);
            currentStream.showText(key);
            currentStream.endText();

            // Value (regular)
            currentStream.beginText();
            currentStream.setFont(PDType1Font.HELVETICA, 10);
            currentStream.newLineAtOffset(MARGIN + 180, yPos);
            currentStream.showText(value);
            currentStream.endText();

            return yPos - 16;
        }

        /**
         * Writes a wrapped paragraph using CONTENT_WIDTH, splitting text across lines.
         * Automatically page-breaks when nearing footer.
         */
        float writeParagraph(String text, float yPos) throws IOException {
            if (text == null || text.trim().isEmpty()) {
                text = "N/A";
            }

            // Split into lines that fit in CONTENT_WIDTH
            List<String> lines = wrapText(text, PDType1Font.HELVETICA, 10, CONTENT_WIDTH);

            for (String line : lines) {
                // Ensure there's space for the next line, otherwise start new page
                yPos = ensureSpace(yPos, 20);

                currentStream.setNonStrokingColor(Color.BLACK);
                currentStream.beginText();
                currentStream.setFont(PDType1Font.HELVETICA, 10);
                currentStream.newLineAtOffset(MARGIN, yPos);
                currentStream.showText(line);
                currentStream.endText();

                // Move down for next line
                yPos -= 14;
            }

            return yPos;
        }

        /**
         * Ensures at least 'needed' vertical space remains above the footer.
         * If not, creates a new page (without first-page header) and resets yPos near top.
         */
        float ensureSpace(float yPos, float needed) throws IOException {
            if (yPos - needed < FOOTER_RESERVED_SPACE) {
                // Start a new page (subsequent pages have no decorative header)
                startNewPage(false);
                // Reset y position to top content start (below top margin)
                return pageHeight - MARGIN - 20;
            }
            return yPos;
        }

        /**
         * Closes the current stream after drawing the footer; called at end of document writing.
         */
        void close() throws IOException {
            if (currentStream != null) {
                // Draw footer on the last page too
                drawFooter(currentStream, pageWidth, doctorName, date);
                currentStream.close();
            }
        }

        /**
         * Draws a vertical gradient blue header rectangle band at the top of the first page.
         * Implemented as multiple thin filled rectangles with interpolated colors.
         */
        private void drawGradientBlueHeader(PDPageContentStream cs, float pageWidth, float pageHeight) throws IOException {
            float headerHeight = 100f;
            int steps = 50; // More steps = smoother gradient
            float stepHeight = headerHeight / steps;

            for (int i = 0; i < steps; i++) {
                float ratio = (float) i / steps;

                // Interpolate from (41,128,185) to (189,215,238)
                int r = (int) (41 + ratio * (189 - 41));
                int g = (int) (128 + ratio * (215 - 128));
                int b = (int) (185 + ratio * (238 - 185));

                cs.setNonStrokingColor(new Color(r, g, b));
                cs.addRect(0, pageHeight - headerHeight + (i * stepHeight), pageWidth, stepHeight);
                cs.fill();
            }
        }

        /**
         * Writes "HAMS" and subtext centered within the header band on the first page.
         */
        private void drawHeaderText(PDPageContentStream cs, float pageWidth, float pageHeight) throws IOException {
            float headerY = pageHeight - 30;

            // Big title "HAMS"
            cs.setNonStrokingColor(Color.WHITE);
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 18);
            cs.newLineAtOffset(
                (pageWidth - getTextWidth("HAMS", PDType1Font.HELVETICA_BOLD, 18)) / 2,
                headerY
            );
            cs.showText("HAMS");
            cs.endText();

            // Subtitle
            headerY -= 22;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 9);
            cs.setNonStrokingColor(new Color(240, 240, 240));
            String contactInfo = "Healthcare Appointment Management System";
            cs.newLineAtOffset(
                (pageWidth - getTextWidth(contactInfo, PDType1Font.HELVETICA, 9)) / 2,
                headerY
            );
            cs.showText(contactInfo);
            cs.endText();

            // Contact line
            headerY -= 14;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 8);
            String contact = "contact@hams.com | www.hams-health.com | +91 222 555 7777";
            cs.newLineAtOffset(
                (pageWidth - getTextWidth(contact, PDType1Font.HELVETICA, 8)) / 2,
                headerY
            );
            cs.showText(contact);
            cs.endText();
        }

        /**
         * Draws footer with date (left), doctor name and title (right), and disclaimers (centered bottom).
         * Called on every page (including last).
         */
        private void drawFooter(PDPageContentStream cs, float pageWidth, String doctorName, String date) throws IOException {
            float footerY = 60;

            // Left-aligned date
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 9);
            cs.setNonStrokingColor(Color.BLACK);
            cs.newLineAtOffset(MARGIN, footerY);
            cs.showText("Date: " + date);
            cs.endText();

            // Right-side doctor info (positioned using a fixed width block)
            float doctorX = pageWidth - MARGIN - 200;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 10);
            cs.setNonStrokingColor(Color.BLACK);
            cs.newLineAtOffset(doctorX, footerY);
            cs.showText("Dr. " + doctorName);
            cs.endText();

            // Doctor role (just below name)
            footerY -= 14;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 9);
            cs.setNonStrokingColor(new Color(100, 100, 100));
            cs.newLineAtOffset(doctorX, footerY);
            cs.showText("Attending Physician");
            cs.endText();

            // Centered disclaimer lines at the very bottom
            float bottomY = 35;
            cs.setNonStrokingColor(new Color(120, 120, 120));
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_OBLIQUE, 8);
            String footer = "This document is electronically generated and is valid without physical signature";
            float footerWidth = getTextWidth(footer, PDType1Font.HELVETICA_OBLIQUE, 8);
            cs.newLineAtOffset((pageWidth - footerWidth) / 2, bottomY);
            cs.showText(footer);
            cs.endText();

            bottomY -= 12;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 7);
            String copyright = "Healthcare Appointment Management System (HAMS) - Confidential Medical Document";
            float copyrightWidth = getTextWidth(copyright, PDType1Font.HELVETICA, 7);
            cs.newLineAtOffset((pageWidth - copyrightWidth) / 2, bottomY);
            cs.showText(copyright);
            cs.endText();
        }
    }

    /**
     * Splits text into lines that fit 'maxWidth' using font metrics.
     * This prevents text from overflowing the right margin.
     */
    private List<String> wrapText(String text, PDFont font, float fontSize, float maxWidth) throws IOException {
        List<String> lines = new ArrayList<>();
        String[] words = text.split("\\s+");
        StringBuilder currentLine = new StringBuilder();

        for (String word : words) {
            String testLine = currentLine.length() == 0 ? word : currentLine + " " + word;
            float width = font.getStringWidth(testLine) / 1000 * fontSize;

            if (width > maxWidth) {
                // If adding the word exceeds maxWidth, push current line and start a new one
                if (currentLine.length() > 0) {
                    lines.add(currentLine.toString());
                    currentLine = new StringBuilder(word);
                } else {
                    // Single word larger than maxWidth; add it anyway as a line
                    lines.add(word);
                    currentLine = new StringBuilder();
                }
            } else {
                currentLine = new StringBuilder(testLine);
            }
        }

        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }

        return lines;
    }

    /**
     * Measures a string's width for layout using the provided font and size.
     */
    private float getTextWidth(String text, PDFont font, float fontSize) throws IOException {
        return font.getStringWidth(text) / 1000 * fontSize;
    }
}

