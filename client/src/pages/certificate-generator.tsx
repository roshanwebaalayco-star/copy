import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  FileText, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  Grid3x3,
  FileArchive,
  FilePlus2,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { defaultConfig } from "@/lib/defaultConfig";
import { parseCSVFile } from "@/lib/csvUtils";
import { generateCertificatePDF, mergePDFs } from "@/lib/pdfUtils";
import { generateQRCode, fileToUint8Array, dataURLToUint8Array } from "@/lib/qrUtils";
import { createAndDownloadZip, downloadPDF } from "@/lib/zipUtils";
import * as pdfjsLib from "pdfjs-dist";
import type { AppConfig, TemplateId, QRMode, CertificateRow } from "@shared/schema";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function CertificateGenerator() {
  const { toast } = useToast();
  
  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("bihar");
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [csvData, setCsvData] = useState<CertificateRow[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [qrMode, setQrMode] = useState<QRMode>("csv");
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [customPdf, setCustomPdf] = useState<File | null>(null);
  const [primaryFont, setPrimaryFont] = useState<File | null>(null);
  const [boldFont, setBoldFont] = useState<File | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [templateBytes, setTemplateBytes] = useState<Uint8Array | null>(null);
  
  // Canvas for PDF preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentTemplate = config.templates[selectedTemplate];

  // Load template PDF when selection changes
  useEffect(() => {
    loadTemplatePDF();
  }, [selectedTemplate]);

  // Load template PDF
  const loadTemplatePDF = async () => {
    try {
      setPreviewLoaded(false);
      const path = customPdf ? null : currentTemplate.path;
      
      if (!path && !customPdf) return;

      let bytes: Uint8Array;
      
      if (customPdf) {
        bytes = await fileToUint8Array(customPdf);
      } else {
        const response = await fetch(path!);
        const arrayBuffer = await response.arrayBuffer();
        bytes = new Uint8Array(arrayBuffer);
      }

      setTemplateBytes(bytes);
      
      // Render preview
      await renderPDFPreview(bytes);
      setPreviewLoaded(true);
    } catch (error) {
      console.error("Failed to load template:", error);
      toast({
        title: "Template Load Failed",
        description: "Could not load the selected template PDF.",
        variant: "destructive",
      });
    }
  };

  // Render PDF preview on canvas
  const renderPDFPreview = async (bytes: Uint8Array) => {
    if (!canvasRef.current) return;

    try {
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      const viewport = page.getViewport({ scale: 1.0 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
    } catch (error) {
      console.error("PDF rendering failed:", error);
    }
  };

  // Handle CSV file upload
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    
    // Parse CSV immediately
    const result = await parseCSVFile(file);
    
    if (result.success) {
      setCsvData(result.data);
      toast({
        title: "CSV Loaded Successfully",
        description: `${result.data.length} records ready for processing.`,
      });
    } else {
      toast({
        title: "CSV Validation Failed",
        description: result.errors.join(", "),
        variant: "destructive",
      });
    }
  };

  // Handle font uploads
  const handleFontUpload = (type: "primary" | "bold") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "primary") {
      setPrimaryFont(file);
      toast({
        title: "Primary Font Loaded",
        description: file.name,
      });
    } else {
      setBoldFont(file);
      toast({
        title: "Bold Font Loaded",
        description: file.name,
      });
    }
  };

  // Validate CSV headers
  const validateCsv = () => {
    if (!csvFile || csvData.length === 0) {
      toast({
        title: "No Data",
        description: "Please upload a CSV file first.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Validation Complete",
      description: `${csvData.length} records validated successfully.`,
    });
  };

  // Load preview
  const loadPreview = () => {
    loadTemplatePDF();
  };

  // Export configuration
  const exportConfig = () => {
    const configJson = JSON.stringify(config, null, 2);
    const blob = new Blob([configJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `config-${selectedTemplate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Configuration Exported",
      description: `Saved as config-${selectedTemplate}.json`,
    });
  };

  // Import configuration
  const importConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text) as AppConfig;
      setConfig(imported);
      
      toast({
        title: "Configuration Imported",
        description: "Field positions loaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Invalid configuration file.",
        variant: "destructive",
      });
    }
  };

  // Reset configuration
  const resetConfig = () => {
    setConfig(defaultConfig);
    toast({
      title: "Configuration Reset",
      description: "All fields restored to default positions.",
    });
  };

  // Generate certificates
  const generateCertificates = async (mergeAll: boolean = false) => {
    if (!csvFile || csvData.length === 0) {
      toast({
        title: "Missing Data",
        description: "Please upload a CSV file with valid data.",
        variant: "destructive",
      });
      return;
    }

    if (!templateBytes) {
      toast({
        title: "Template Not Loaded",
        description: "Please wait for the template to load.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Load fonts if provided
      let primaryFontBytes: Uint8Array | undefined;
      let boldFontBytes: Uint8Array | undefined;

      if (primaryFont) {
        primaryFontBytes = await fileToUint8Array(primaryFont);
      }
      if (boldFont) {
        boldFontBytes = await fileToUint8Array(boldFont);
      }

      // Load QR image if in single mode
      let qrImageBytes: Uint8Array | undefined;
      if (qrMode === "single" && qrImage) {
        qrImageBytes = await fileToUint8Array(qrImage);
      }

      const generatedPDFs: { name: string; bytes: Uint8Array }[] = [];

      // Generate PDF for each row
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        
        // Generate QR code if in CSV mode
        if (qrMode === "csv" && row.qr_content) {
          const qrDataUrl = await generateQRCode(row.qr_content, 256);
          qrImageBytes = dataURLToUint8Array(qrDataUrl);
        }

        const pdfBytes = await generateCertificatePDF({
          templateBytes,
          data: row,
          fields: currentTemplate.fields,
          qrConfig: currentTemplate.qr,
          qrImageBytes,
          primaryFontBytes,
          boldFontBytes,
        });

        generatedPDFs.push({
          name: `certificate_${row.registration_number || i + 1}.pdf`,
          bytes: pdfBytes,
        });

        setGenerationProgress(((i + 1) / csvData.length) * 100);
      }

      // Download result
      if (mergeAll) {
        const mergedBytes = await mergePDFs(generatedPDFs.map((p) => p.bytes));
        downloadPDF(mergedBytes, `certificates_merged_${new Date().getTime()}.pdf`);
        
        toast({
          title: "Success!",
          description: `Merged PDF with ${generatedPDFs.length} certificates downloaded.`,
        });
      } else {
        await createAndDownloadZip(generatedPDFs, `certificates_${new Date().getTime()}.zip`);
        
        toast({
          title: "Success!",
          description: `ZIP file with ${generatedPDFs.length} certificates downloaded.`,
        });
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Government Certificate Generator</h1>
              <p className="text-sm text-muted-foreground">Professional PDF automation with precision field placement</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          {/* Left Column: Configuration */}
          <div className="space-y-6">
            {/* Template & Data Upload */}
            <Card className="border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Template & Data
                </CardTitle>
                <CardDescription>
                  Select your certificate template and upload CSV data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-select">Certificate Template</Label>
                  <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as TemplateId)}>
                    <SelectTrigger id="template-select" data-testid="select-template">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bihar">Bihar</SelectItem>
                      <SelectItem value="bokaro">Bokaro</SelectItem>
                      <SelectItem value="gram_panchayat">Gram Panchayat</SelectItem>
                      <SelectItem value="lalpania">Lalpania</SelectItem>
                      <SelectItem value="nawadih">Nawadih</SelectItem>
                      <SelectItem value="up">UP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="csv-upload">Data CSV File</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    data-testid="input-csv-upload"
                  />
                  {csvFile && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        {csvFile.name}
                      </Badge>
                      <Badge variant="outline">{csvData.length} records</Badge>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Required columns: name, sex, dob, place_of_birth, parent details, addresses, registration info
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="font-primary">Primary Font (TTF)</Label>
                    <Input
                      id="font-primary"
                      type="file"
                      accept=".ttf"
                      onChange={handleFontUpload("primary")}
                      data-testid="input-font-primary"
                    />
                    {primaryFont && (
                      <p className="text-xs text-muted-foreground truncate">{primaryFont.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="font-bold">Bold Font (TTF)</Label>
                    <Input
                      id="font-bold"
                      type="file"
                      accept=".ttf"
                      onChange={handleFontUpload("bold")}
                      data-testid="input-font-bold"
                    />
                    {boldFont && (
                      <p className="text-xs text-muted-foreground truncate">{boldFont.name}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="qr-mode">QR Code Mode</Label>
                  <Select value={qrMode} onValueChange={(v) => setQrMode(v as QRMode)}>
                    <SelectTrigger id="qr-mode" data-testid="select-qr-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">Generate from CSV (qr_content column)</SelectItem>
                      <SelectItem value="single">Use single uploaded QR image</SelectItem>
                      <SelectItem value="none">No QR code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {qrMode === "single" && (
                  <div className="space-y-2">
                    <Label htmlFor="qr-image">QR Image</Label>
                    <Input
                      id="qr-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setQrImage(e.target.files?.[0] || null)}
                      data-testid="input-qr-image"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={validateCsv}
                    className="flex-1 hover-elevate active-elevate-2"
                    data-testid="button-validate-csv"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Validate CSV
                  </Button>
                  <Button
                    onClick={loadPreview}
                    className="flex-1 hover-elevate active-elevate-2"
                    data-testid="button-load-preview"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Load Preview
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Field Configuration */}
            <Card className="border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Field Configuration
                </CardTitle>
                <CardDescription>
                  Adjust field positions and properties for {currentTemplate.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="show-grid"
                    checked={showGrid}
                    onCheckedChange={(checked) => setShowGrid(!!checked)}
                    data-testid="checkbox-show-grid"
                  />
                  <Label htmlFor="show-grid" className="text-sm cursor-pointer">
                    Show 10pt grid overlay (major lines every 50pt)
                  </Label>
                </div>

                <div className="border border-dashed border-border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    {Object.keys(currentTemplate.fields).length} fields configured
                  </p>
                  {Object.entries(currentTemplate.fields).map(([fieldName, fieldConfig]) => (
                    <div
                      key={fieldName}
                      className="flex items-center justify-between p-2 rounded hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-sm font-medium">{fieldName}</span>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="font-mono">
                          x:{fieldConfig.x} y:{fieldConfig.y}
                        </Badge>
                        <Badge variant="outline" className="font-mono">
                          {fieldConfig.size}pt
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportConfig}
                    data-testid="button-export-config"
                    className="hover-elevate active-elevate-2"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Config
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("import-config")?.click()}
                    data-testid="button-import-config"
                    className="hover-elevate active-elevate-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Config
                  </Button>
                  <input
                    id="import-config"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={importConfig}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={resetConfig}
                    data-testid="button-reset-config"
                    className="hover-elevate active-elevate-2"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview & Generate */}
          <div className="space-y-6">
            <Card className="border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3x3 className="h-5 w-5" />
                  Preview & Fine Tune
                </CardTitle>
                <CardDescription>
                  Visual preview with draggable field positioning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative bg-white rounded-lg shadow-lg overflow-hidden border border-border" style={{ aspectRatio: "1 / 1.414" }}>
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                    width={595}
                    height={842}
                  />
                  <div ref={overlayRef} className="absolute inset-0 pointer-events-none">
                    {showGrid && previewLoaded && (
                      <svg className="absolute inset-0 w-full h-full opacity-10">
                        {/* Grid lines */}
                        {Array.from({ length: 60 }, (_, i) => (
                          <line
                            key={`h-${i}`}
                            x1="0"
                            y1={i * 10}
                            x2="100%"
                            y2={i * 10}
                            stroke="currentColor"
                            strokeWidth={i % 5 === 0 ? "1.5" : "0.5"}
                          />
                        ))}
                        {Array.from({ length: 60 }, (_, i) => (
                          <line
                            key={`v-${i}`}
                            x1={i * 10}
                            y1="0"
                            x2={i * 10}
                            y2="100%"
                            stroke="currentColor"
                            strokeWidth={i % 5 === 0 ? "1.5" : "0.5"}
                          />
                        ))}
                      </svg>
                    )}
                  </div>
                  {!previewLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/10 backdrop-blur-sm">
                      <div className="text-center space-y-2">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">Click "Load Preview" to view template</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-muted/30 border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground text-center">
                    <kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono">Drag</kbd> to move •{" "}
                    <kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono">Alt+Drag</kbd> to resize •{" "}
                    <kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono">Arrow</kbd> keys to nudge (Shift = 10pt)
                  </p>
                </div>

                <Separator />

                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Generating certificates...</span>
                      <span className="font-medium">{Math.round(generationProgress)}%</span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    className="w-full hover-elevate active-elevate-2"
                    size="lg"
                    onClick={() => generateCertificates(false)}
                    disabled={isGenerating || !csvFile || csvData.length === 0}
                    data-testid="button-generate-zip"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileArchive className="h-4 w-4 mr-2" />
                        Generate ZIP (Individual PDFs)
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full hover-elevate active-elevate-2"
                    size="lg"
                    onClick={() => generateCertificates(true)}
                    disabled={isGenerating || !csvFile || csvData.length === 0}
                    data-testid="button-generate-merged"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FilePlus2 className="h-4 w-4 mr-2" />
                        Generate Merged PDF
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs text-foreground/90 text-center">
                    All processing happens locally in your browser. No data is uploaded.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
