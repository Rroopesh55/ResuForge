# dashboard/page.tsx Documentation

## Overview

Main application dashboard containing PDF viewer, job description analyzer, and optimization controls.

## Location

`frontend/app/dashboard/page.tsx`

## Key State Variables

### File & Content State

```typescript
const [uploadedFile, setUploadedFile] = useState<File | null>(null); // Original DOCX
const [pdfFile, setPdfFile] = useState<File | null>(null); // PDF for viewing
const [resumeText, setResumeText] = useState(""); // Full text
const [resumeParagraphs, setResumeParagraphs] = useState<string[]>([]); // Parsed bullets
```

### JD Analysis State

```typescript
const [jdText, setJdText] = useState(""); // JD input
const [keywords, setKeywords] = useState<string[]>([]); // Extracted keywords
const [isAnalyzing, setIsAnalyzing] = useState(false); // Loading state
```

### Optimization State

```typescript
const [optimizedParagraphs, setOptimizedParagraphs] = useState<string[]>([]);
const [validationResults, setValidationResults] = useState<boolean[]>([]);
const [style, setStyle] = useState<"safe" | "bold" | "creative">("safe");
```

### Database State

```typescript
const [currentResumeId, setCurrentResumeId] = useState<number | null>(null);
const [sessionFiles, setSessionFiles] = useState<
  { file: File; timestamp: Date }[]
>([]);
```

## Key Functions

### `handleFileUpload(e: React.ChangeEvent<HTMLInputElement>)`

**Purpose**: Upload and parse resume file

**Process**:

1. Extract file from input
2. Send to `/upload` endpoint
3. Parse response for text and `resume_id`
4. Convert DOCX to PDF if needed
5. Update state with parsed content

**Backend API**: `POST /upload`

---

### `convertToPDF(file: File)`

**Purpose**: Convert DOCX to PDF for viewing

**Process**:

1. Send DOCX to `/convert-to-pdf`
2. Receive PDF blob
3. Create File object with unique timestamp
4. Update `pdfFile` state

**Backend API**: `POST /convert-to-pdf`

**Key Detail**: Adds timestamp to force PDF viewer refresh

---

### `handleAnalyzeJD()`

**Purpose**: Extract keywords from job description

**Process**:

1. Send JD text to `/analyze-jd`
2. Receive keywords array
3. Update `keywords` state

**Backend API**: `POST /analyze-jd`

---

### `handleOptimizeContent()`

**Purpose**: AI-rewrite bullets with keywords

**Process**:

1. Build constraints (original length + 20 buffer)
2. Send bullets, keywords, constraints to `/optimize`
3. Receive rewritten bullets + validation results
4. Update `optimizedParagraphs` state

**Backend API**: `POST /optimize`

**Constraints Calculation**:

```typescript
const buildConstraints = (paragraphs: string[]) => {
  return paragraphs.map((para) => ({
    max_chars: Math.max(para.length + 20, 140),
  }));
};
```

---

### `handleSaveContent(originalText: string, newText: string)`

**Purpose**: Save edited content and refresh PDF

**Process**:

1. Send `uploadedFile` (DOCX), original text, new text to `/update-content`
2. Include `resume_id` for database tracking
3. Receive updated DOCX blob
4. Update `uploadedFile` state
5. Convert to PDF and refresh viewer

**Backend API**: `POST /update-content`

**Database Integration**:

```typescript
if (currentResumeId) {
  formData.append("resume_id", currentResumeId.toString());
}
```

---

### `handleExport(format: "docx" | "pdf")`

**Purpose**: Export optimized resume

**Process**:

1. Prepare form data with bullets, keywords, constraints
2. Send to `/optimize-and-export`
3. Download resulting file

**Backend API**: `POST /optimize-and-export`

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: Upload | Export DOCX | Home                │
├──────────────────┬──────────────────────────────────┤
│                  │                                   │
│   PDF Viewer     │  Right Sidebar:                   │
│   (Editable)     │  ├─ JD Input & Analysis           │
│                  │  ├─ Keywords Display              │
│                  │  └─ Optimization Controls         │
│                  │     ├─ Style Selector             │
│                  │     ├─ Optimize Button            │
│                  │     └─ Validation Results         │
│                  │                                   │
└──────────────────┴──────────────────────────────────┘
```

## Component Hierarchy

```
Dashboard
├── Header (upload, export, home buttons)
├── Left Sidebar (session history)
├── PDF Viewer
│   └── EditableOverlay (for each text block)
│       └── TextEditDialog (modal)
└── Right Sidebar
    ├── JD Analysis Tab
    │   ├── Textarea (JD input)
    │   └── Keywords Display
    └── Optimization Controls
        ├── Style Selector
        ├── Optimize Button
        └── Validation Results
```

## Key Features

### 1. PDF Refresh on Save

Forces re-render by changing File's `lastModified`:

```typescript
const timestamp = new Date().getTime();
const pdfFile = new File([pdfBlob], `resume_${timestamp}.pdf`, {
  type: "application/pdf",
  lastModified: timestamp, // Key for forcing refresh
});
```

PDFViewer uses this as key:

```tsx
<PDFViewer key={pdfFile.lastModified} file={pdfFile} />
```

### 2. Session History

Tracks uploaded/edited files in current session:

```typescript
const addToHistory = (file: File) => {
  setSessionFiles((prev) => {
    const filtered = prev.filter((f) => f.file.name !== file.name);
    return [{ file, timestamp: new Date() }, ...filtered];
  });
};
```

### 3. Keyword Coverage

Calculates which JD keywords appear in resume:

```typescript
const keywordCoverage = useMemo(() => {
  return keywords.map((keyword) => {
    const pattern = new RegExp(`\\b${keyword.toLowerCase()}\\b`, "g");
    const matches = resumeText.toLowerCase().match(pattern);
    return { keyword, count: matches ? matches.length : 0 };
  });
}, [keywords, resumeText]);
```

## Integration Points

### Backend APIs

- `POST /upload` - Parse resume
- `POST /convert-to-pdf` - DOCX → PDF
- `POST /analyze-jd` - Extract keywords
- `POST /optimize` - Rewrite bullets
- `POST /update-content` - Save edit
- `POST /optimize-and-export` - Full optimization
- `GET /history/{resume_id}` - Version history

### Child Components

- `<PDFViewer />` - PDF display with editing
- `<Button />` - Shadcn UI button
- `<Card />`, `<CardContent />` - Shadcn UI cards
- `<Tabs />` - JD/Keywords switcher
- `<Textarea />` - JD input

## Related

- [PDFViewer.tsx](./pdfviewer.md)
- [TextEditDialog.tsx](./texteditdialog.md)
- Backend: [main.py](../../backend/docs/main.md)
- Architecture: [ARCHITECTURE.md](../../ARCHITECTURE.md)
