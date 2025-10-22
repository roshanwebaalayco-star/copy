import { ChangeEvent, FormEvent, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { TemplateId } from "@shared/schema";

const TEMPLATE_OPTIONS: { value: TemplateId; label: string }[] = [
  { value: "bihar", label: "Bihar" },
  { value: "bokaro", label: "Bokaro" },
  { value: "gram_panchayat", label: "Gram Panchayat" },
  { value: "lalpania", label: "Lalpania" },
  { value: "nawadih", label: "Nawadih" },
  { value: "up", label: "Uttar Pradesh" },
];

const CSV_COLUMNS = [
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
] as const;

const DEFAULT_ENDPOINT = "/api/generate";
const ENV_ENDPOINT =
  (import.meta.env.VITE_GENERATE_ENDPOINT as string | undefined) ?? DEFAULT_ENDPOINT;
const ENV_API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const GENERATE_ENDPOINT = `${ENV_API_BASE}${
  ENV_ENDPOINT.startsWith("/") ? ENV_ENDPOINT : `/${ENV_ENDPOINT}`
}`;

function getFilenameFromDisposition(header: string | null, fallback: string) {
  if (!header) return fallback;
  const encodedMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch (error) {
      console.warn("Failed to decode filename*", error);
    }
  }
  const quotedMatch = header.match(/filename="?([^";]+)"?/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }
  return fallback;
}

export default function CertificateGenerator() {
  const [template, setTemplate] = useState<TemplateId>("bihar");
  const [csvName, setCsvName] = useState("");
  const [qrName, setQrName] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTemplateChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setTemplate(event.target.value as TemplateId);
  };

  const handleCsvChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setCsvName(file ? file.name : "");
  };

  const handleQrChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setQrName(file ? file.name : "");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus("Uploading…");
    setIsSubmitting(true);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    formData.set("template", template);

    try {
      const response = await fetch(GENERATE_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const contentType = response.headers.get("Content-Type") ?? "";
        if (contentType.includes("application/json")) {
          const payload = await response.json();
          const message =
            typeof payload?.message === "string"
              ? payload.message
              : `Server error ${response.status}`;
          throw new Error(message);
        }
        const text = await response.text();
        throw new Error(text || `Server error ${response.status}`);
      }

      const blob = await response.blob();
      const fallbackName = blob.type.includes("zip") ? "certificates.zip" : "certificates.pdf";
      const filename = getFilenameFromDisposition(
        response.headers.get("Content-Disposition"),
        fallbackName,
      );

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setStatus(`Download ready: ${filename}`);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Unexpected error occurred.";
      setError(message);
      setStatus("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
        <section className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Government Certificate Generator
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload your CSV data and optional QR image. We will send the generated certificates back
            as a download from the server.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Generate certificates</CardTitle>
            <CardDescription>
              Choose a template, provide your CSV, and optionally attach a QR image that will be used
              for every record.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <select
                  id="template"
                  name="template"
                  value={template}
                  onChange={handleTemplateChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  {TEMPLATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csv">Data CSV</Label>
                <Input
                  id="csv"
                  name="csv"
                  type="file"
                  accept=".csv"
                  required
                  onChange={handleCsvChange}
                />
                {csvName ? (
                  <p className="text-sm text-muted-foreground">Selected file: {csvName}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr">QR image (optional)</Label>
                <Input
                  id="qr"
                  name="qr"
                  type="file"
                  accept="image/*"
                  onChange={handleQrChange}
                />
                {qrName ? (
                  <p className="text-sm text-muted-foreground">Selected file: {qrName}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Leave blank to let the server generate a QR payload per row or omit the code.
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending to server…" : "Generate certificates"}
              </Button>
            </form>

            <div className="mt-4 space-y-2" aria-live="polite">
              {status ? <p className="text-sm text-foreground">{status}</p> : null}
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CSV requirements</CardTitle>
            <CardDescription>
              Keep the header row exactly as shown so the backend can map every field reliably.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <code className="block break-words">
                {CSV_COLUMNS.join(", ")}
              </code>
            </div>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                Dates can be provided in formats like <code>DD-MM-YYYY</code> or <code>YYYY-MM-DD</code>;
                the server normalises them for you.
              </li>
              <li>
                Aadhaar values are truncated to the last four digits when building QR payloads — never
                include the full number.
              </li>
              <li>
                The response is usually a ZIP archive containing one PDF per row. Some deployments may
                also support a merged PDF download.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
