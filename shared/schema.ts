import { z } from "zod";

// Certificate data from CSV
export const certificateRowSchema = z.object({
  category: z.string().optional(),
  name: z.string(),
  sex: z.string(),
  dob: z.string(), // date of birth
  place_of_birth: z.string(),
  name_of_mother: z.string(),
  aadhaar_mother: z.string().optional(),
  name_of_father: z.string(),
  aadhaar_father: z.string().optional(),
  address_at_birth: z.string(),
  permanent_address: z.string(),
  registration_number: z.string(),
  date_of_registration: z.string(),
  date_of_issue: z.string(),
  updated_on: z.string().optional(),
  qr_content: z.string().optional(),
  remarks: z.string().optional(),
});

export type CertificateRow = z.infer<typeof certificateRowSchema>;

// Field configuration for PDF positioning
export const fieldConfigSchema = z.object({
  x: z.number(), // X coordinate in points (bottom-left origin)
  y: z.number(), // Y coordinate in points
  w: z.number(), // Width in points
  h: z.number(), // Height in points
  size: z.number(), // Font size
  font: z.enum(["primary", "bold"]).default("primary"),
  align: z.enum(["left", "center", "right"]).default("left"),
  clearBox: z.boolean().default(false), // Whether to clear pre-filled content
  multiline: z.boolean().default(false), // Whether to wrap text
});

export type FieldConfig = z.infer<typeof fieldConfigSchema>;

// QR code configuration
export const qrConfigSchema = z.object({
  x: z.number(),
  y: z.number(),
  sizePt: z.number(), // Size in points
});

export type QRConfig = z.infer<typeof qrConfigSchema>;

// Template configuration
export const templateConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string().optional(), // Path to PDF file (for built-in templates)
  qr: qrConfigSchema,
  fields: z.record(fieldConfigSchema), // Map of field name to config
});

export type TemplateConfig = z.infer<typeof templateConfigSchema>;

// Application configuration
export const appConfigSchema = z.object({
  pageOrigin: z.enum(["bottom-left", "top-left"]).default("bottom-left"),
  defaultFontSize: z.number().default(12),
  dateFormat: z.string().default("dd-MM-yyyy"),
  templates: z.record(templateConfigSchema),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

// QR mode options
export type QRMode = "csv" | "single" | "none";

// Field names used in certificates
export const FIELD_NAMES = [
  "name",
  "sex",
  "dob",
  "place_of_birth",
  "name_of_mother",
  "aadhaar_mother",
  "name_of_father",
  "aadhaar_father",
  "address_at_birth",
  "permanent_address",
  "registration_number",
  "date_of_registration",
  "date_of_issue",
  "updated_on",
  "remarks",
] as const;

export type FieldName = typeof FIELD_NAMES[number];

// Template IDs
export const TEMPLATE_IDS = [
  "bihar",
  "bokaro",
  "gram_panchayat",
  "lalpania",
  "nawadih",
  "up",
] as const;

export type TemplateId = typeof TEMPLATE_IDS[number];
