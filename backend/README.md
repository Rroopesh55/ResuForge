# Backend - FastAPI Resume Processing Engine

## Overview

The backend is a FastAPI application that handles resume parsing, AI-powered analysis, and content optimization using local LLMs via Ollama.

## Architecture

```
backend/
├── main.py              # FastAPI app with API endpoints
├── agents/              # AI processing agents
│   ├── __init__.py
│   ├── parser_agent.py      # Resume parsing (PDF/DOCX)
│   ├── jd_agent.py          # Job description analysis
│   ├── rewrite_agent.py     # AI-powered content rewriting
│   └── layout_engine.py     # Layout validation and reconstruction
└── requirements.txt     # Python dependencies
```

## Setup

### Prerequisites

- Python 3.10+
- Ollama installed and running (`ollama serve`)
- Model pulled (e.g., `ollama pull llama3`)

### Installation

```bash
cd backend
pip install -r requirements.txt
```

### Running

```bash
python -m uvicorn main:app --reload --port 8000
```

## API Endpoints

### `GET /`

Health check endpoint.

**Response**:

```json
{
  "message": "ResuForge API is running",
  "status": "healthy"
}
```

### `POST /upload`

Upload and parse a resume file (PDF or DOCX).

**Request**: multipart/form-data with `file` field

**Response**:

```json
{
  "text": "Extracted resume text...",
  "metadata": {
    "page_count": 1,
    "margins": [...],
    "fonts": [...]
  },
  "raw_content": ["paragraph1", "paragraph2", ...]
}
```

### `POST /analyze-jd`

Analyze a job description using AI to extract keywords and requirements.

**Request**:

```json
{
  "text": "Job description text..."
}
```

**Response**:

```json
{
  "skills": ["Python", "React", "AWS"],
  "experience_years": 3,
  "keywords": ["scalable", "microservices"],
  "summary": "Backend developer role..."
}
```

### `POST /optimize`

Rewrite resume bullets based on keywords and constraints.

**Request**:

```json
{
  "bullets": ["Original bullet 1", "Original bullet 2"],
  "keywords": ["Python", "AWS"],
  "constraints": [{ "max_chars": 200 }, { "max_chars": 180 }],
  "style": "safe"
}
```

**Response**:

```json
{
  "rewritten_bullets": ["Optimized bullet 1", "Optimized bullet 2"]
}
```

### `POST /validate`

Validate if new text fits within layout constraints.

**Request**:

```json
{
  "original": "Original text",
  "new_text": "New text",
  "max_chars": 200
}
```

**Response**:

```json
{
  "valid": true
}
```

## Agents

### ParserAgent

Extracts text and layout metadata from resume files.

**Supported formats**: PDF, DOCX

**Key features**:

- Text extraction
- Layout metadata (margins, fonts, page count)
- Paragraph-level content preservation

### JDAgent

Analyzes job descriptions using local LLM.

**Key features**:

- Keyword extraction
- Skill identification
- Experience level detection
- Job role summarization

### RewriteAgent

Rewrites resume content using AI under strict constraints.

**Key features**:

- Character limit enforcement
- Style variations (safe, bold, creative)
- Keyword integration
- Batch processing

### LayoutEngine

Validates and reconstructs formatted documents.

**Key features**:

- Constraint validation
- Layout simulation
- DOCX reconstruction
- Overflow detection

## Logging

All agents and endpoints log important events:

- File uploads and parsing
- AI model calls
- Validation results
- Errors and exceptions

Logs include timestamps and operation details for debugging.

## Error Handling

- 400: Bad request (invalid file format, missing parameters)
- 500: Server error (parsing failure, AI model unavailable)

All errors return JSON with `detail` field explaining the issue.

## Development

### Adding New Agents

1. Create new file in `agents/` directory
2. Implement agent class with clear methods
3. Import and initialize in `main.py`
4. Add endpoint in `main.py` to expose functionality

### Testing

```bash
pytest  # Run backend tests
```
