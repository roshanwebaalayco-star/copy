import QRCode from "qrcode";

/**
 * Generate QR code as PNG data URL
 */
export async function generateQRCode(content: string, size: number = 256): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(content, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    return dataUrl;
  } catch (error) {
    console.error("QR code generation failed:", error);
    throw error;
  }
}

/**
 * Generate QR code as PNG buffer
 */
export async function generateQRCodeBuffer(content: string, size: number = 256): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(content, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    return buffer;
  } catch (error) {
    console.error("QR code generation failed:", error);
    throw error;
  }
}

/**
 * Convert data URL to Uint8Array
 */
export function dataURLToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Read file as Uint8Array
 */
export async function fileToUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      resolve(new Uint8Array(arrayBuffer));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
