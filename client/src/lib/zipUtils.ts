import JSZip from "jszip";
import { saveAs } from "file-saver";

/**
 * Create ZIP file from multiple PDF bytes and download
 */
export async function createAndDownloadZip(
  pdfBytesArray: { name: string; bytes: Uint8Array }[],
  zipFileName: string = "certificates.zip"
): Promise<void> {
  const zip = new JSZip();

  // Add each PDF to the ZIP
  pdfBytesArray.forEach(({ name, bytes }) => {
    zip.file(name, bytes);
  });

  // Generate ZIP and download
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, zipFileName);
}

/**
 * Download single PDF
 */
export function downloadPDF(pdfBytes: Uint8Array, fileName: string): void {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  saveAs(blob, fileName);
}
