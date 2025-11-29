# PDFViewer.tsx Documentation

## Overview

Renders PDF files and manages editable text overlays for interactive editing.

## Location

`frontend/components/pdf-viewer/PDFViewer.tsx`

## Purpose

- Display PDF with pixel-perfect rendering
- Extract text positions from PDF
- Create clickable overlays for each text element
- Trigger edit dialog on click

## Key Props

```typescript
interface PDFViewerProps {
  file: File; // PDF file to display
  onSaveContent: (originalText: string, newText: string) => void; // Save callback
  key?: number; // Force re-render when changed
}
```

## Implementation

### PDF Rendering with pdf.js

```typescript
import { pdfjs, Document, Page } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function PDFViewer({ file }: PDFViewerProps) {
  return (
    <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
      {Array.from(new Array(numPages), (el, index) => (
        <Page key={`page_${index + 1}`} pageNumber={index + 1} />
      ))}
    </Document>
  );
}
```

### Text Extraction

```typescript
const extractTextItems = async (page) => {
  const textContent = await page.getTextContent();

  return textContent.items.map((item) => ({
    text: item.str,
    x: item.transform[4],
    y: item.transform[5],
    width: item.width,
    height: item.height,
  }));
};
```

### Editable Overlays

For each extracted text item, create an overlay:

```tsx
{
  textItems.map((item, idx) => (
    <EditableOverlay
      key={idx}
      text={item.text}
      position={{ x: item.x, y: item.y }}
      dimensions={{ width: item.width, height: item.height }}
      onEdit={(newText) => handleEdit(item.text, newText)}
    />
  ));
}
```

## State Management

```typescript
const [numPages, setNumPages] = useState<number>(0);
const [textItems, setTextItems] = useState<TextItem[]>([]);
const [selectedText, setSelectedText] = useState<string | null>(null);
```

## Key Functions

### `onDocumentLoadSuccess({ numPages })`

Called when PDF loads successfully. Sets page count.

### `handlePageRenderSuccess(page)`

Called after each page renders:

1. Extract text items with positions
2. Store in `textItems` state
3. Trigger overlay creation

### `handleEdit(originalText, newText)`

Called when user saves an edit:

1. Validate edit (character limits)
2. Call `onSaveContent` prop (passed from dashboard)
3. Dashboard handles backend save and PDF refresh

## Force Re-render Strategy

Dashboard passes `key={pdfFile.lastModified}`:

```tsx
<PDFViewer key={pdfFile.lastModified} file={pdfFile} />
```

When `lastModified` changes:

- React unmounts old PDFViewer
- Mounts new instance
- Forces complete re-render with updated PDF

## Performance Considerations

- **Text extraction**: O(n) where n = characters in PDF
- **Overlay rendering**: O(n) DOM elements
- **Large PDFs**: May have 100s-1000s of text items

**Optimization** (if needed):

- Virtualization for large documents
- Lazy loading of pages
- Canvas-based overlays instead of DOM

## Related

- Parent: [dashboard.md](./dashboard.md)
- Child: [editableoverlay.md](./editableoverlay.md)
- Dialog: [texteditdialog.md](./texteditdialog.md)
