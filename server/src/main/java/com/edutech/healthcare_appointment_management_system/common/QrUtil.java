

package com.edutech.healthcare_appointment_management_system.common;
 
import com.google.zxing.BarcodeFormat;

import com.google.zxing.client.j2se.MatrixToImageWriter;

import com.google.zxing.common.BitMatrix;

import com.google.zxing.qrcode.QRCodeWriter;
 
import java.io.ByteArrayOutputStream;
 
public class QrUtil {
 
    /** Creates a PNG QR code image (in-memory) for the given text. */

    public static byte[] toPng(String text, int size) throws Exception {

        QRCodeWriter writer = new QRCodeWriter();

        BitMatrix matrix = writer.encode(text, BarcodeFormat.QR_CODE, size, size);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            MatrixToImageWriter.writeToStream(matrix, "PNG", baos);

            return baos.toByteArray();

        }

    }

}

 