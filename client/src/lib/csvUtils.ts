import Papa from "papaparse";
import type { CertificateRow } from "@shared/schema";

export interface CSVParseResult {
  success: boolean;
  data: CertificateRow[];
  errors: string[];
}

/**
 * Parse CSV file and validate data
 */
export async function parseCSVFile(file: File): Promise<CSVParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, "_"),
      complete: (results) => {
        const errors: string[] = [];
        const data: CertificateRow[] = [];

        // Validate required fields
        const requiredFields = [
          "name",
          "sex",
          "dob",
          "place_of_birth",
          "name_of_mother",
          "name_of_father",
          "registration_number",
        ];

        if (results.data.length === 0) {
          errors.push("CSV file is empty");
          resolve({ success: false, data: [], errors });
          return;
        }

        // Check if all required fields are present
        const headers = Object.keys(results.data[0] as any);
        const missingFields = requiredFields.filter((field) => !headers.includes(field));

        if (missingFields.length > 0) {
          errors.push(`Missing required fields: ${missingFields.join(", ")}`);
        }

        // Process each row
        results.data.forEach((row: any, index) => {
          try {
            const certificateRow: CertificateRow = {
              category: row.category || "",
              name: row.name || "",
              sex: row.sex || "",
              dob: row.dob || "",
              place_of_birth: row.place_of_birth || "",
              name_of_mother: row.name_of_mother || "",
              aadhaar_mother: row.aadhaar_mother || "",
              name_of_father: row.name_of_father || "",
              aadhaar_father: row.aadhaar_father || "",
              address_at_birth: row.address_at_birth || "",
              permanent_address: row.permanent_address || "",
              registration_number: row.registration_number || "",
              date_of_registration: row.date_of_registration || "",
              date_of_issue: row.date_of_issue || "",
              updated_on: row.updated_on || "",
              qr_content: row.qr_content || "",
              remarks: row.remarks || "",
            };

            // Validate required fields for this row
            const rowErrors: string[] = [];
            requiredFields.forEach((field) => {
              if (!certificateRow[field as keyof CertificateRow]) {
                rowErrors.push(`Row ${index + 1}: Missing ${field}`);
              }
            });

            if (rowErrors.length > 0) {
              errors.push(...rowErrors);
            } else {
              data.push(certificateRow);
            }
          } catch (error) {
            errors.push(`Row ${index + 1}: Failed to parse - ${error}`);
          }
        });

        resolve({
          success: errors.length === 0,
          data,
          errors,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          data: [],
          errors: [`CSV parsing failed: ${error.message}`],
        });
      },
    });
  });
}

/**
 * Validate CSV headers
 */
export function validateCSVHeaders(headers: string[]): { valid: boolean; missing: string[] } {
  const requiredFields = [
    "name",
    "sex",
    "dob",
    "place_of_birth",
    "name_of_mother",
    "name_of_father",
    "registration_number",
  ];

  const normalizedHeaders = headers.map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_")
  );

  const missing = requiredFields.filter((field) => !normalizedHeaders.includes(field));

  return {
    valid: missing.length === 0,
    missing,
  };
}
