# pdf_converter.py Documentation

## Overview

Converts DOCX files to PDF for viewing in the PDF viewer component.

## Location

`backend/agents/pdf_converter.py`

## Key Methods

### `convert_docx_to_pdf(docx_path: str) -> str`

**Purpose**: Convert DOCX to PDF file

**Dependencies**: `docx2pdf` library (Windows) or `libreoffice` (Linux/Mac)

**Implementation** (Windows):

```python
from docx2pdf import convert

def convert_docx_to_pdf(self, docx_path):
    pdf_path = docx_path.replace('.docx', '.pdf')
    convert(docx_path, pdf_path)
    return pdf_path
```

**Platform Support**:

- **Windows**: Uses `docx2pdf` (COM automation with Microsoft Word)
- **Linux/Mac**: Falls back to LibreOffice command line

**Returns**: Path to generated PDF file

## Usage

```python
from pdf_converter import PDFConverterAgent

converter = PDFConverterAgent()
pdf_path = converter.convert_docx_to_pdf("resume.docx")
# Returns: "resume.pdf"
```

## Performance

- Conversion time: 1-3 seconds per document
- Quality: Pixel-perfect (uses actual Word rendering)

## Error Handling

- Requires Microsoft Word on Windows (or LibreOffice on Linux)
- Falls back gracefully if conversion fails
- Returns error message if dependency missing

## Related

- Called by: [main.py](./main.md) `/convert-to-pdf` and `/optimize-and-export`
- Output used by: Frontend `PDFViewer` component
- See: [ARCHITECTURE.md](../../ARCHITECTURE.md) for PDF vs DOCX strategy
