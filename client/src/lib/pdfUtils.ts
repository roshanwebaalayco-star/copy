import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { FieldConfig, CertificateRow } from "@shared/schema";

export interface PDFGenerationOptions {
  templateBytes: Uint8Array;
  data: CertificateRow;
  fields: Record<string, FieldConfig>;
  qrConfig?: { x: number; y: number; sizePt: number };
  qrImageBytes?: Uint8Array;
  primaryFontBytes?: Uint8Array;
  boldFontBytes?: Uint8Array;
}

/**
 * Generate a single certificate PDF from template and data
 */
export async function generateCertificatePDF(options: PDFGenerationOptions): Promise<Uint8Array> {
  const {
    templateBytes,
    data,
    fields,
    qrConfig,
    qrImageBytes,
    primaryFontBytes,
    boldFontBytes,
  } = options;

  // Load the template PDF
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  // Load fonts
  let primaryFont;
  let boldFont;

  if (primaryFontBytes) {
    primaryFont = await pdfDoc.embedFont(primaryFontBytes);
  } else {
    primaryFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  if (boldFontBytes) {
    boldFont = await pdfDoc.embedFont(boldFontBytes);
  } else {
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const page = pdfDoc.getPage(0);
  const { height } = page.getSize();

  // Draw each field
  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    const value = getFieldValue(data, fieldName);
    
    const font = fieldConfig.font === "bold" ? boldFont : primaryFont;
    const { x, y, w, h, size, align, clearBox, multiline } = fieldConfig;

    // Convert y coordinate from bottom-left to top-left if needed
    const yCoord = y;

    // Clear box if specified (draw white rectangle) - do this even if value is empty
    if (clearBox) {
      page.drawRectangle({
        x,
        y: yCoord,
        width: w,
        height: h,
        color: rgb(1, 1, 1),
      });
    }

    // Skip drawing text if value is empty
    if (!value) continue;

    // Draw text
    if (multiline) {
      // Wrap text to fit width
      const lines = wrapText(value, font, size, w);
      let lineY = yCoord + h - size;
      
      for (const line of lines) {
        const textWidth = font.widthOfTextAtSize(line, size);
        let textX = x;
        
        if (align === "center") {
          textX = x + (w - textWidth) / 2;
        } else if (align === "right") {
          textX = x + w - textWidth;
        }
        
        page.drawText(line, {
          x: textX,
          y: lineY,
          size,
          font,
          color: rgb(0, 0, 0),
        });
        
        lineY -= size * 1.2; // Line height
      }
    } else {
      // Single line text
      const textWidth = font.widthOfTextAtSize(value, size);
      let textX = x;
      
      if (align === "center") {
        textX = x + (w - textWidth) / 2;
      } else if (align === "right") {
        textX = x + w - textWidth;
      }
      
      page.drawText(value, {
        x: textX,
        y: yCoord + (h - size) / 2,
        size,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  // Add QR code if provided
  if (qrConfig && qrImageBytes) {
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    page.drawImage(qrImage, {
      x: qrConfig.x,
      y: qrConfig.y,
      width: qrConfig.sizePt,
      height: qrConfig.sizePt,
    });
  }

  // Save and return
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Get field value from certificate data
 */
function getFieldValue(data: CertificateRow, fieldName: string): string {
  const value = data[fieldName as keyof CertificateRow];
  
  // Handle Aadhaar masking
  if (fieldName.includes("aadhaar") && value) {
    return maskAadhaar(String(value));
  }
  
  return String(value || "");
}

/**
 * Mask Aadhaar number (show only last 4 digits)
 */
function maskAadhaar(aadhaar: string): string {
  const digits = aadhaar.replace(/\D/g, "");
  if (digits.length >= 4) {
    return `XXXX-XXXX-${digits.slice(-4)}`;
  }
  return "XXXX-XXXX-XXXX";
}

/**
 * Wrap text to fit within specified width
 */
function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, size);
    
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Merge multiple PDFs into one
 */
export async function mergePDFs(pdfBytesArray: Uint8Array[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const pdfBytes of pdfBytesArray) {
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}
