# Design Guidelines: Government Certificate Generator

## Design Approach

**Selected Approach**: Design System - Fluent Design (Microsoft)
**Justification**: This is a utility-focused, data-intensive government document processing application requiring precision, clarity, and professional credibility. Fluent Design's emphasis on depth, clarity, and productivity aligns perfectly with the need to handle official certificates accurately.

**Key Design Principles**:
- **Trust & Credibility**: Professional aesthetic appropriate for government documentation
- **Precision & Accuracy**: Clear visual hierarchy for data-critical tasks
- **Efficiency**: Streamlined workflow from upload to output
- **Clarity**: High contrast, readable interface for form-heavy content

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary)**:
- **Background Primary**: 11 16 32 (deep navy - `#0b1020`)
- **Background Secondary**: 18 23 43 (card background - `#12172b`)
- **Surface**: 18 24 46 (elevated panels - `#12182e`)
- **Border/Lines**: 34 48 86 (subtle borders - `#223056`)
- **Text Primary**: 233 238 251 (high contrast white - `#e9eefb`)
- **Text Muted**: 152 162 179 (secondary text - `#98a2b3`)
- **Accent Primary**: 110 168 254 (calm blue - `#6ea8fe`)
- **Success**: 48 209 88 (confirmation green - `#30d158`)
- **Warning**: 245 165 36 (caution orange - `#f5a524`)

**Light Mode** (if needed):
- Background: 248 249 250
- Surface: 255 255 255
- Text: 33 37 41
- Accent: 13 110 253

### B. Typography

**Font Stack**: System fonts for performance and native feel
- Primary: `system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- Monospace (for data/config): `'SF Mono', Monaco, 'Cascadia Code', 'Consolas', monospace`
- Unicode Support: Noto Sans Devanagari (uploaded TTF) for certificate text

**Scale**:
- **Display/Headings**: 24px bold (H1), 18px semibold (H2), 16px medium (H3)
- **Body**: 14px regular (primary), 13px regular (secondary)
- **Labels**: 12px medium (form labels), 11px regular (helper text)
- **Code/Data**: 12px monospace (config editor, technical details)

**Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### C. Layout System

**Spacing Primitives**: Use Tailwind units of **4, 8, 12, 16, 20, 24, 32** (in pixels)
- Micro spacing: `gap-2` (8px) for tight elements
- Component spacing: `gap-4` (16px) standard, `gap-6` (24px) generous
- Section spacing: `p-4` to `p-8` for cards, `my-6` to `my-8` between sections
- Container: `max-w-7xl` (1280px) main wrapper, `max-w-4xl` (896px) for narrow content

**Grid Patterns**:
- Two-column split: 60/40 ratio for controls/preview (`grid-cols-[1.2fr_1fr]`)
- Form fields: Equal columns for label/input pairs
- Field editor: Multi-column grid for precise coordinate inputs

### D. Component Library

**Core UI Elements**:

1. **Cards/Panels**
   - Background: `var(--card)` with 1px border `var(--line)`
   - Border radius: 16px (generous rounding)
   - Padding: 16-24px
   - Shadow: `0 4px 16px rgba(0,0,0,0.25)` for depth

2. **Buttons**
   - Primary: Accent blue background, dark text, 700 weight
   - Secondary: Neutral dark background with border
   - Success: Green for "Generate" actions
   - Warning: Orange for "Reset/Clear" actions
   - Border radius: 12px
   - Padding: 10px 14px
   - States: Subtle hover brightness (+10%), active scale (0.98)

3. **Form Controls**
   - Inputs/Selects: Dark background `#0e1327`, 1px border, 10px radius
   - Padding: 8-10px
   - Focus: 2px accent border, no outline
   - File inputs: Custom styled with muted text color

4. **Data Displays**
   - Config editor: Full-width textarea, monospace font, dark background
   - Field list: Scrollable container with dashed border (max-height: 260px)
   - Grid helpers: 10pt grid overlay with major lines every 50pt

5. **Navigation/Organization**
   - Section headers: Large text with bottom margin
   - Helper text: Muted color, 12px, positioned near related controls
   - Pills/Tags: Inline-flex with border, rounded-full, compact padding

**Interactive Elements**:

6. **PDF Preview System**
   - Canvas: White background (document simulation), 8px radius, shadow
   - Overlay: Absolute positioned draggable boxes
   - Field boxes: 2px accent border, 15% opacity fill, 6px radius
   - Active state: 3px white outline
   - Resize handles: 10px white circles with black border at corners
   - Grid overlay: Semi-transparent lines when enabled

7. **Modals/Overlays** (if needed)
   - Backdrop: rgba(0,0,0,0.7)
   - Panel: Card styling, centered, max-width constrained
   - Close: X button top-right

### E. Animations

**Minimal & Purposeful**:
- Button press: `scale(0.98)` on active (100ms)
- Focus states: Border color transition (150ms ease)
- Drag feedback: Cursor change only, no transform
- Loading: Simple spinner if needed (no elaborate animations)
- Avoid: Page transitions, scroll effects, decorative motion

---

## Layout Specifications

**Application Structure**:

1. **Header Section** (top)
   - App title (H1) + subtitle/description
   - Full-width, modest padding (24px)

2. **Main Content Area** (two-column grid)
   - **Left Column (60%)**: Controls & Configuration
     - Template selector card
     - File upload controls (CSV, fonts, QR)
     - Field layout editor with scrollable list
     - Config import/export buttons
   - **Right Column (40%)**: Preview & Output
     - PDF canvas preview
     - Draggable overlay system
     - Generate buttons (ZIP/Merged PDF)

3. **Advanced Section** (below, full-width)
   - Config editor (JSON textarea)
   - Collapsible or always-visible based on space

**Responsive Breakpoints**:
- Desktop (>1024px): Two-column layout as described
- Tablet (768-1024px): Narrower columns, stack if needed
- Mobile (<768px): Single column, preview scaled down

---

## Component Patterns

**File Upload Area**:
- Label + file input pairs in grid (label 160px, input flexible)
- Clear visual grouping (related uploads together)
- Helper text below each input explaining format/purpose

**Field Configuration Editor**:
- Multi-column grid header: Field Name | X | Y | W | H | Size | Font | Align | Clear
- Column widths: 120px (name), 90px each for coordinates/size, flexible for font/align
- Inputs inline, compact spacing (6px gap)
- Scrollable container with fixed header
- Add field button below list

**Preview Controls**:
- Checkbox + label for grid toggle (inline-flex, 6px gap)
- Instructional pill showing keyboard shortcuts
- Controls positioned above canvas, buttons below

**Action Buttons**:
- Primary actions (Generate): Success color, prominent
- Secondary actions (Validate, Export Config): Neutral with border
- Destructive actions (Reset): Warning color
- Group related buttons with 8px gap

---

## Images

**No Hero Images**: This is a utility application - no marketing imagery needed

**Functional Graphics**:
- QR code placeholder: Gray square or icon when no QR uploaded
- PDF template thumbnail: Small preview of selected template (if feasible)
- Icons: Use Material Icons or Heroicons for file types, actions (upload, download, reset, etc.)

---

## Special Considerations

**PDF-Specific UI**:
- Canvas must maintain aspect ratio (A4: 595 x 842 points or similar)
- Coordinate system visual aid: Show (0,0) origin indicator
- Ruler/measurement guides: Subtle pt markings on canvas edges
- Zoom controls: If preview is too large/small

**Data Validation Feedback**:
- Success messages: Green pill/banner when CSV validates
- Error states: Red border on problematic inputs, inline error text
- Loading states: Disable buttons, show progress for PDF generation

**Accessibility**:
- Maintain high contrast ratios (WCAG AA minimum)
- Focus indicators on all interactive elements
- Keyboard navigation for draggable fields (arrow keys implemented)
- Screen reader labels for file inputs and buttons

---

## Key Constraints

- **Professional & Trustworthy**: Government context requires serious, credible design
- **Data Density**: Many form fields, coordinates, configurations - clarity essential
- **Precision Tools**: Draggable boxes, numeric inputs for exact positioning
- **No Distractions**: Minimal decorative elements, focus on functionality
- **Performance**: Fast preview rendering, responsive controls despite complexity