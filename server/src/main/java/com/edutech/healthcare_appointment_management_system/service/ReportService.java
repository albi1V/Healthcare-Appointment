
package com.edutech.healthcare_appointment_management_system.service;

import com.edutech.healthcare_appointment_management_system.entity.MedicalRecord;
import com.edutech.healthcare_appointment_management_system.entity.Patient;
import com.edutech.healthcare_appointment_management_system.entity.Doctor;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Professional Medical Report generator using Apache PDFBox.
 * Now robust against WinAnsi "missing glyph" errors by:
 *  - Preferring embedded Unicode fonts (NotoSans Regular/Bold) if present
 *  - Sanitizing unsupported punctuation to ASCII when falling back to Helvetica
 *  - Ensuring all PDPageContentStreams are properly closed before opening new ones
 */
@Service
public class ReportService {

    private final MedicalRecordService medicalRecordService;

    @Autowired
    public ReportService(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    // --- Style Constants ---
    private static final float MARGIN = 50f;
    private static final float SECTION_SPACING = 14f;
    private static final float LINE_SPACING = 12f;
    private static final float KEY_WIDTH = 90f;

    private static final String HEADER_TITLE = "Healthcare Appointment Management System";
    private static final String HEADER_SUBTITLE = "Official Medical Report";

    // Optional assets (if present on classpath, Unicode support + logo will be used)
    private static final String UNICODE_FONT_REGULAR = "fonts/NotoSans-Regular.ttf"; // optional
    private static final String UNICODE_FONT_BOLD    = "fonts/NotoSans-Bold.ttf";    // optional
    private static final String LOGO_RESOURCE        = "static/logo.png";            // optional

    public byte[] buildMedicalRecordPdf(Long recordId) {
        MedicalRecord r = medicalRecordService.getMedicalRecordById(recordId);
        if (r == null) {
            throw new RuntimeException("MedicalRecord not found: " + recordId);
        }

        Patient p = r.getPatient();
        Doctor d = r.getDoctor();

        String patientName  = safe(p != null ? p.getUsername() : null);
        Long   patientId    = p != null ? p.getId() : null;
        String patientEmail = safe(p != null ? p.getEmail() : null);

        String doctorName = safe(d != null ? d.getUsername() : null);
        Long   doctorId   = d != null ? d.getId() : null;

        String diagnosis = safe(r.getDiagnosis());
        String treatment = safe(r.getTreatment());
        String recordDate = r.getRecordDate() != null
                ? r.getRecordDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                : "N/A";

        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try (PDDocument doc = new PDDocument()) {

            // --- Fonts ---
            FontPack fonts = loadFonts(doc);

            // ✅ Load logo BEFORE opening any content stream
            PDImageXObject logo = tryLoadLogo(doc);

            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            // Header band + text (open/close stream once)
            try (PDPageContentStream cs = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true)) {
                drawHeaderBand(cs, page);
                if (logo != null) drawLogo(cs, page, logo);
                float headerTextX = MARGIN + 10f;
                float headerTextY = page.getMediaBox().getUpperRightY() - MARGIN - 18f;
                writeText(cs, HEADER_TITLE, fonts.h1(), 16, headerTextX, headerTextY, fonts);
                writeText(cs, HEADER_SUBTITLE, fonts.regular(), 11, headerTextX, headerTextY - 18f, fonts);
            }

            float yStart = page.getMediaBox().getUpperRightY() - MARGIN - 70f;

            // Content Writer (keeps ONE stream at a time and closes it on new page)
            ContentWriter writer = new ContentWriter(doc, page, fonts);
            float y = yStart;

            // PATIENT
            y = writer.writeSectionTitle("Patient Details", y);
            y = writer.writeKV("Name", patientName, y);
            y = writer.writeKV("ID", String.valueOf(patientId), y);
            y = writer.writeKV("Email", patientEmail, y);
            y -= SECTION_SPACING;

            // DOCTOR
            y = writer.writeSectionTitle("Doctor Details", y);
            y = writer.writeKV("Name", doctorName, y);
            y = writer.writeKV("ID", String.valueOf(doctorId), y);
            y -= SECTION_SPACING;

            // RECORD
            y = writer.writeSectionTitle("Record Details", y);
            y = writer.writeKV("Record ID", String.valueOf(r.getId()), y);
            y = writer.writeKV("Date & Time", recordDate, y);
            y -= 6f;
            y = writer.writeMultiline("Diagnosis", diagnosis, y);
            y -= 4f;
            y = writer.writeMultiline("Treatment", treatment, y);

            // ✅ Close content writer before footer
            writer.close();

            // Footer + page numbers
            addFooterPageNumbers(doc, fonts.regular());

            doc.save(baos);
        } catch (IOException e) {
            throw new RuntimeException("Failed to build PDF report", e);
        }

        return baos.toByteArray();
    }

    // ---------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------

    private static String safe(String s) {
        return s == null ? "" : s.trim();
    }

    private PDImageXObject tryLoadLogo(PDDocument doc) {
        try {
            ClassPathResource res = new ClassPathResource(LOGO_RESOURCE);
            if (!res.exists()) return null;
            byte[] bytes;
            try (InputStream in = res.getInputStream()) {
                bytes = in.readAllBytes();
            }
            return PDImageXObject.createFromByteArray(doc, bytes, "logo");
        } catch (Exception e) {
            return null;
        }
    }

    private void drawHeaderBand(PDPageContentStream cs, PDPage page) throws IOException {
        PDRectangle box = page.getMediaBox();
        float left = MARGIN;
        float right = box.getUpperRightX() - MARGIN;
        float top = box.getUpperRightY() - MARGIN;
        float height = 50f;

        cs.setNonStrokingColor(235, 243, 255);
        cs.addRect(left, top - height, right - left, height);
        cs.fill();

        cs.setNonStrokingColor(219, 232, 252);
        cs.addRect(left, top - height, right - left, 18f);
        cs.fill();
    }

    private void drawLogo(PDPageContentStream cs, PDPage page, PDImageXObject logo) throws IOException {
        PDRectangle box = page.getMediaBox();
        float right = box.getUpperRightX() - MARGIN;
        float top = box.getUpperRightY() - MARGIN;
        float height = 50f;

        float maxLogoH = 36f;
        float maxLogoW = 120f;
        float scale = Math.min(maxLogoW / logo.getWidth(), maxLogoH / logo.getHeight());
        float logoW = logo.getWidth() * scale;
        float logoH = logo.getHeight() * scale;
        float x = right - logoW;
        float y = top - ((height + logoH) / 2f);
        cs.drawImage(logo, x, y, logoW, logoH);
    }

    private void writeText(PDPageContentStream cs, String text, PDFont font, float fontSize,
                           float x, float y, FontPack fonts) throws IOException {
        cs.beginText();
        cs.setNonStrokingColor(0);
        cs.setFont(font, fontSize);
        cs.newLineAtOffset(x, y);
        // If we’re NOT using Unicode fonts, sanitize to ASCII safe text
        String safeText = fonts.usingUnicode() ? text : sanitizeToAscii(text);
        cs.showText(safeText);
        cs.endText();
    }

    private void addFooterPageNumbers(PDDocument doc, PDFont font) throws IOException {
        int total = doc.getNumberOfPages();
        for (int i = 0; i < total; i++) {
            PDPage page = doc.getPage(i);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true)) {
                String footer = "Page " + (i + 1) + " of " + total + "   |   © " + java.time.Year.now().getValue() + " HAMS";
                float fontSize = 9f;
                float stringWidth = font.getStringWidth(footer) / 1000 * fontSize;
                float x = (page.getMediaBox().getWidth() - stringWidth) / 2;
                float y = MARGIN - 20;
                cs.setNonStrokingColor(130, 130, 130);
                writeText(cs, footer, font, fontSize, x, y, new FontPack(font, font, font, false));
            }
        }
    }

    // ---------------------------------------------------------
    // Fonts and sanitization
    // ---------------------------------------------------------

    private FontPack loadFonts(PDDocument doc) {
        PDFont reg = tryLoadUnicodeFont(doc, UNICODE_FONT_REGULAR);
        PDFont bold = tryLoadUnicodeFont(doc, UNICODE_FONT_BOLD);

        if (reg != null) {
            // If bold missing, reuse regular (visual difference is small)
            if (bold == null) bold = reg;
            return new FontPack(reg, bold, reg, true);
        }

        // Fallback to Helvetica family (non-Unicode) with sanitization
        return new FontPack(PDType1Font.HELVETICA, PDType1Font.HELVETICA_BOLD, PDType1Font.HELVETICA_BOLD, false);
    }

    private PDFont tryLoadUnicodeFont(PDDocument doc, String classpathLocation) {
        try {
            ClassPathResource resource = new ClassPathResource(classpathLocation);
            if (!resource.exists()) return null;
            try (InputStream in = resource.getInputStream()) {
                return PDType0Font.load(doc, in, true);
            }
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Convert common Unicode punctuation to ASCII equivalents so WinAnsi (Helvetica) can render it.
     * This prevents "U+2011 not available in font Helvetica" errors when Unicode fonts are missing.
     */
    private String sanitizeToAscii(String s) {
        if (s == null || s.isEmpty()) return s;

        String out = s;

        // Dashes & hyphens
        out = out
            .replace('\u2011', '-') // non-breaking hyphen
            .replace('\u2012', '-') // figure dash
            .replace('\u2013', '-') // en dash
            .replace('\u2014', '-') // em dash
            .replace('\u2212', '-') // minus sign

            // Quotes
            .replace('\u2018', '\'') // left single
            .replace('\u2019', '\'') // right single / apostrophe
            .replace('\u201B', '\'') // single high-reversed-9 quotation mark
            .replace('\u201A', '\'') // single low-9
            .replace('\u2032', '\'') // prime

            .replace('\u201C', '"') // left double
            .replace('\u201D', '"') // right double
            .replace('\u201E', '"') // double low-9
            .replace('\u2033', '"') // double prime

            // Bullets & symbols
            .replace('\u2022', '*') // bullet
            .replace('\u2023', '*') // triangular bullet
            .replace('\u2043', '-') // hyphen bullet
            .replace('\u25E6', '*') // white bullet

            // Ellipsis
            .replace("\u2026", "...")

            // Spaces
            .replace('\u00A0', ' ') // NBSP
            .replace('\u2007', ' ') // figure space
            .replace('\u2009', ' ') // thin space
            .replace('\u200A', ' ') // hair space
            .replace('\u2002', ' ') // en space
            .replace('\u2003', ' ') // em space
            .replace('\u2004', ' ')
            .replace('\u2005', ' ')
            .replace('\u2006', ' ')
            .replace('\u205F', ' ')
            .replace('\u3000', ' ');

        // Remove any remaining non printable control chars
        StringBuilder cleaned = new StringBuilder(out.length());
        for (int i = 0; i < out.length(); i++) {
            char ch = out.charAt(i);
            if (ch >= 32 || ch == '\n' || ch == '\r' || ch == '\t') {
                cleaned.append(ch);
            }
        }
        return cleaned.toString();
    }

    // ---------------------------------------------------------
    // Inner classes
    // ---------------------------------------------------------

    private static final class FontPack {
        private final PDFont regular;
        private final PDFont bold;
        private final PDFont h1;
        private final boolean usingUnicode;

        FontPack(PDFont regular, PDFont bold, PDFont h1, boolean usingUnicode) {
            this.regular = regular;
            this.bold = bold;
            this.h1 = h1;
            this.usingUnicode = usingUnicode;
        }

        PDFont regular() { return regular; }
        PDFont bold()    { return bold; }
        PDFont h1()      { return h1; }
        boolean usingUnicode() { return usingUnicode; }
    }

    private class ContentWriter {
        final PDDocument doc;
        PDPage page;
        PDPageContentStream cs;
        final FontPack fonts;

        final float left = MARGIN;
        final float right;
        final float width;

        ContentWriter(PDDocument doc, PDPage page, FontPack fonts) throws IOException {
            this.doc = doc;
            this.page = page;
            this.fonts = fonts;
            PDRectangle box = page.getMediaBox();
            this.right = box.getUpperRightX() - MARGIN;
            this.width = right - left;
            // open one writer
            this.cs = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true);
        }

        void close() throws IOException {
            if (cs != null) cs.close();
        }

        float writeSectionTitle(String title, float y) throws IOException {
            y = ensureSpace(y, 24f);
            cs.setStrokingColor(210, 210, 210);
            cs.setLineWidth(0.6f);
            cs.moveTo(left, y + 4f);
            cs.lineTo(right, y + 4f);
            cs.stroke();

            cs.setNonStrokingColor(30, 30, 30);
            writeText(cs, title, fonts.h1(), 12, left, y, fonts);
            return y - SECTION_SPACING;
        }

        float writeKV(String key, String value, float y) throws IOException {
            y = ensureSpace(y, LINE_SPACING);
            writeText(cs, key + ":", fonts.bold(), 10, left, y, fonts);

            float textX = left + KEY_WIDTH;
            float textWidth = width - KEY_WIDTH;
            List<String> lines = wrap(fonts.usingUnicode() ? value : sanitizeToAscii(value),
                                      fonts.regular(), 10, textWidth);

            float yy = y;
            for (String line : lines) {
                yy = ensureSpace(yy, LINE_SPACING);
                writeText(cs, line, fonts.regular(), 10, textX, yy, fonts);
                yy -= LINE_SPACING;
            }
            return Math.min(yy, y - LINE_SPACING);
        }

        float writeMultiline(String key, String text, float y) throws IOException {
            y = ensureSpace(y, LINE_SPACING);
            writeText(cs, key + ":", fonts.bold(), 10, left, y, fonts);

            float textX = left + KEY_WIDTH;
            float textWidth = width - KEY_WIDTH;

            String body = (text == null || text.isBlank()) ? "N/A" : text;
            if (!fonts.usingUnicode()) body = sanitizeToAscii(body);

            List<String> lines = wrap(body, fonts.regular(), 10, textWidth);

            float yy = y;
            for (String line : lines) {
                yy = ensureSpace(yy, LINE_SPACING);
                writeText(cs, line, fonts.regular(), 10, textX, yy, fonts);
                yy -= LINE_SPACING;
            }
            return yy - 4f;
        }

        float ensureSpace(float y, float needed) throws IOException {
            float bottomLimit = MARGIN + 40f; // room for footer
            if (y - needed < bottomLimit) {
                // close current
                if (cs != null) cs.close();

                // new page
                PDPage newPage = new PDPage(PDRectangle.A4);
                doc.addPage(newPage);
                page = newPage;

                // open new writer for new page
                cs = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true);

                // subtle top line on new page
                cs.setStrokingColor(230, 230, 230);
                cs.setLineWidth(0.6f);
                cs.moveTo(left, page.getMediaBox().getUpperRightY() - MARGIN - 6f);
                cs.lineTo(right, page.getMediaBox().getUpperRightY() - MARGIN - 6f);
                cs.stroke();

                return page.getMediaBox().getUpperRightY() - MARGIN - 20f;
            }
            return y;
        }

        List<String> wrap(String text, PDFont f, float fs, float maxWidth) throws IOException {
            List<String> result = new ArrayList<>();
            if (text == null) {
                result.add("N/A");
                return result;
            }
            String[] words = text.trim().split("\\s+");
            StringBuilder line = new StringBuilder();
            for (String word : words) {
                String candidate = line.length() == 0 ? word : line + " " + word;
                float w = f.getStringWidth(candidate) / 1000 * fs;
                if (w > maxWidth) {
                    if (line.length() > 0) {
                        result.add(line.toString());
                        line = new StringBuilder(word);
                    } else {
                        result.add(word);
                        line = new StringBuilder();
                    }
                } else {
                    line = new StringBuilder(candidate);
                }
            }
            if (line.length() > 0) result.add(line.toString());
            if (result.isEmpty()) result.add("N/A");
            return result;
        }
    }
}


