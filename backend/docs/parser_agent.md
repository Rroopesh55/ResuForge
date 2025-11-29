# parser_agent.py Documentation

## Overview

Extracts text content from resume files (PDF and DOCX).

## Location

`backend/agents/parser_agent.py`

## Key Methods

### `extract_text_from_pdf(pdf_path: str) -> str`

**Purpose**: Extract text from PDF files

**Dependencies**: `PyPDF2` library

**Implementation**:

```python
from PyPDF2 import PdfReader

def extract_text_from_pdf(self, pdf_path):
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text
```

**Returns**: String containing all text from PDF (page-order preserved)

---

### `extract_text_from_docx(docx_path: str) -> str`

**Purpose**: Extract text from DOCX files

**Dependencies**: `python-docx` library

**Implementation**:

```python
from docx import Document

def extract_text_from_docx(self, docx_path):
    doc = Document(docx_path)
    paragraphs = [para.text for parafor para in doc.paragraphs]
    return "\\n".join(paragraphs)
```

**Returns**: String with each paragraph on new line

**Note**: Also supports extracting from tables if present

---

## Usage

```python
from parser_agent import ParserAgent

parser = ParserAgent()

# PDF
text = parser.extract_text_from_pdf("resume.pdf")

# DOCX
text = parser.extract_text_from_docx("resume.docx")
```

## Related

- Called by: [main.py](./main.md) `/upload` endpoint
- See also: [ARCHITECTURE.md](../../ARCHITECTURE.md) for why we parse PDFs but edit DOCXs
