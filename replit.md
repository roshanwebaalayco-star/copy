# Government Certificate Generator

## Overview
A professional web application for automatically generating government birth certificates from CSV data. The application supports 6 different certificate templates (Bihar, Bokaro, Gram Panchayat, Lalpania, Nawadih, UP) with precise field positioning, QR code generation, and Unicode font support for Indian scripts.

## Key Features

### Core Functionality
- **Template Support**: 6 pre-configured government certificate templates with pixel-perfect field positioning
- **CSV Data Import**: Bulk certificate generation from CSV files with automatic validation
- **QR Code Integration**: Generate QR codes from CSV data or use a single uploaded image
- **Unicode Fonts**: Support for TTF font upload to display Indian language text (Devanagari, etc.)
- **PDF Manipulation**: Client-side PDF generation using pdf-lib with no server uploads
- **Batch Processing**: Generate individual PDFs (ZIP download) or single merged PDF
- **Field Configuration**: Export/import field position configurations per template

### Technical Features
- **Client-side Processing**: All PDF generation happens in the browser (privacy-focused)
- **Visual Preview**: PDF.js powered preview with grid overlay for precise positioning
- **Dark Mode**: Professional dark theme optimized for government document work
- **Responsive Design**: Works on desktop and tablet devices
- **Real-time Validation**: CSV validation with helpful error messages

## Recent Changes (2025-01-22)

### Phase 1: Schema & Frontend ✓
- Created comprehensive data models for certificates and field configurations
- Implemented professional dark mode color scheme (deep navy, calm blue accents)
- Built template selector, CSV uploader, font manager, and QR mode selector
- Created field configuration editor with visual field list
- Implemented PDF preview canvas with grid overlay
- Added theme toggle and responsive layout

### Phase 2: Backend & PDF Libraries ✓
- Set up static file serving for certificate templates
- Installed pdf-lib, @pdf-lib/fontkit, pdfjs-dist, papaparse, jszip, qrcode, file-saver
- Created utility modules for PDF generation, CSV parsing, QR codes, and ZIP creation
- Implemented in-memory configuration storage

### Phase 3: Integration ✓
- Integrated PDF.js for template preview rendering
- Connected CSV parser with validation
- Implemented full PDF generation pipeline with clearBox feature
- Added Aadhaar number masking (show only last 4 digits)
- Implemented progress tracking during batch generation
- Added error handling and user-friendly toast notifications

## Project Structure

```
client/
├── public/
│   ├── templates/          # Certificate PDF templates
│   │   ├── BIHAR_*.pdf
│   │   ├── BOKARO_*.pdf
│   │   ├── GRAM PRANCHAT_*.pdf
│   │   ├── LALPANIA_*.pdf
│   │   ├── NAWADIH_*.pdf
│   │   └── UP_*.pdf
│   └── sample.csv          # Sample data for testing
├── src/
│   ├── components/
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   └── ui/             # Shadcn UI components
│   ├── lib/
│   │   ├── defaultConfig.ts    # Default field positions per template
│   │   ├── pdfUtils.ts         # PDF generation logic
│   │   ├── csvUtils.ts         # CSV parsing and validation
│   │   ├── qrUtils.ts          # QR code generation
│   │   └── zipUtils.ts         # ZIP file creation
│   └── pages/
│       └── certificate-generator.tsx  # Main application page
shared/
└── schema.ts               # TypeScript schemas and types
```

## CSV Format

Required columns:
- `name` - Full name of the person
- `sex` - Gender (MALE/FEMALE)
- `dob` - Date of birth (DD-MM-YYYY)
- `place_of_birth` - Birth place
- `name_of_mother` - Mother's full name
- `aadhaar_mother` - Mother's Aadhaar number (optional)
- `name_of_father` - Father's full name
- `aadhaar_father` - Father's Aadhaar number (optional)
- `address_at_birth` - Address at time of birth
- `permanent_address` - Permanent address
- `registration_number` - Certificate registration number
- `date_of_registration` - Registration date
- `date_of_issue` - Issue date
- `updated_on` - Last update timestamp (optional)
- `qr_content` - QR code content (optional, for CSV QR mode)
- `remarks` - Additional remarks (optional)

See `client/public/sample.csv` for example data.

## Usage Instructions

1. **Select Template**: Choose from 6 available certificate templates
2. **Upload CSV**: Select your CSV file with certificate data
3. **Upload Fonts** (optional): Add custom TTF fonts for Unicode support
4. **Configure QR Mode**: 
   - Generate from CSV (uses `qr_content` column)
   - Upload single QR image for all certificates
   - No QR code
5. **Validate**: Click "Validate CSV" to check data
6. **Preview**: Click "Load Preview" to see the template
7. **Generate**: 
   - Click "Generate ZIP" for individual PDFs
   - Click "Generate Merged PDF" for single combined file

## Field Configuration

Each template has pre-configured field positions (x, y coordinates in PDF points):
- **clearBox**: Removes pre-filled text before adding new content
- **align**: Text alignment (left, center, right)
- **multiline**: Enables text wrapping for long addresses
- **font**: Primary or bold font selection

Configurations can be exported/imported as JSON files for sharing.

## Technology Stack

**Frontend**:
- React + TypeScript
- Tailwind CSS + Shadcn UI
- Wouter (routing)
- TanStack Query (state management)

**PDF Processing**:
- pdf-lib (PDF generation)
- @pdf-lib/fontkit (custom fonts)
- pdfjs-dist (PDF preview)
- papaparse (CSV parsing)
- jszip (ZIP file creation)
- qrcode (QR code generation)
- file-saver (downloads)

**Backend**:
- Express.js (minimal - static file serving only)
- In-memory storage for configurations

## Future Enhancements

- Draggable field positioning UI
- Live field preview on canvas
- Template auto-detection from CSV
- Batch processing status with pause/resume
- PDF comparison view (before/after)
- Export preset configurations
- Support for additional certificate types

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app will be available at http://localhost:5000
```

All certificate templates are located in `client/public/templates/`.
Sample CSV data is available at `client/public/sample.csv`.

## Notes

- All PDF processing happens client-side in the browser
- No data is uploaded to any server (privacy-focused)
- Templates must be A4 size (595 x 842 points)
- Coordinates use bottom-left origin (PDF standard)
- Aadhaar numbers are automatically masked (XXXX-XXXX-1234)
