# main.py Documentation

## Overview

Entry point for the FastAPI backend server. Handles all HTTP endpoints for resume processing, optimization, and database operations.

## File Location

`backend/main.py`

## Dependencies

```python
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
```

## Architecture

### Application Initialization

```python
app = FastAPI(title="ResuForge API", version="0.1.0")
```

### Database Setup

- Creates database tables on startup using `models.Base.metadata.create_all()`
- Uses dependency injection for database sessions via `get_db()`

### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (restrict in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## API Endpoints

### 1. `/` (GET) - Health Check

**Purpose**: Verify API is running

**Response**:

```json
{
  "message": "ResuForge API is running",
  "status": "healthy"
}
```

---

### 2. `/upload` (POST) - Resume Upload

**Purpose**: Upload and parse a resume (PDF or DOCX)

**Parameters**:

- `file` (UploadFile): Resume file

**Process**:

1. Create/get default user from database
2. Save file temporarily
3. Create Resume entry in database
4. Create initial ResumeVersion
5. Parse text using `parser_agent`
6. Return text and `resume_id`

**Response**:

```json
{
  "text": "Resume full text...",
  "raw_content": ["line 1", "line 2",...],
  "resume_id": 1
}
```

**Database Impact**:

- Inserts into `users` table (if new user)
- Inserts into `resumes` table
- Inserts into `resume_versions` table (version 1)

---

### 3. `/convert-to-pdf` (POST) - DOCX to PDF Conversion

**Purpose**: Convert uploaded DOCXto PDF for viewing

**Parameters**:

- `file` (UploadFile): DOCX file

**Process**:

1. Validate file is DOCX
2. Save temporarily
3. Convert using `pdf_converter_agent.convert_docx_to_pdf()`
4. Return PDF file
5. Schedule cleanup of temp files

**Response**: PDF file (binary)

**Headers**:

- `Content-Type`: `application/pdf`

---

### 4. `/analyze-jd` (POST) - Job Description Analysis

**Purpose**: Extract keywords from a job description

**Request Body** (JSON):

```json
{
  "text": "Full job description text..."
}
```

**Process**:

1. Send to `jd_agent.analyze_jd()`
2. Extract key skills, requirements, and keywords

**Response**:

```json
{
  "keywords": ["Python", "FastAPI", "Docker", ...],
  "skills": [...],
  "requirements": [...]
}
```

---

### 5. `/optimize` (POST) - Optimize Bullets

**Purpose**: Rewrite resume bullets with AI to include keywords

**Request Body** (JSON):

```json
{
  "bullets": ["Original bullet 1", "Original bullet  2"],
  "keywords": ["keyword1", "keyword2"],
  "constraints": [{ "max_chars": 120 }, { "max_chars": 140 }],
  "style": "safe" // or "bold", "creative"
}
```

**Process**:

1. Call `rewrite_agent.batch_rewrite()` with bullets and keywords
2. Validate each rewritten bullet with `layout_engine.validate_constraints()`
3. If validation fails, revert to original bullet

**Response**:

```json
{
  "rewritten_bullets": ["Optimized bullet 1", "Optimized bullet 2"],
  "validation": [true, false] // True if fits constraints
}
```

---

### 6. `/validate-edit` (POST) - Validate Single Edit

**Purpose**: Check if edited text fits within character constraints

**Request Body** (JSON):

```json
{
  "original_text": "Original bullet point",
  "new_text": "New edited text",
  "max_chars": 120
}
```

**Process**:

1. Call `layout_engine.validate_constraints()`
2. Return validation result with metadata

**Response**:

```json
{
  "valid": true,
  "char_count": 95,
  "max_chars": 120,
  "diff": 0 // Characters over limit (0 if valid)
}
```

---

### 7. `/update-content` (POST) - Update Resume Content

**Purpose**: Apply a single text edit to DOCX file

**Parameters**:

- `file` (Form): Original DOCX file
- `original_text` (Form): Text to find and replace
- `new_text` (Form): Replacement text
- `resume_id` (Form, optional): Database ID for version tracking

**Process**:

1. Save uploaded DOCX temporarily
2. Call `layout_engine.reconstruct_docx()` with replacements
3. If `resume_id` provided, create new ResumeVersion in database
4. Return updated DOCX file
5. Schedule cleanup of temp files

**Response**: Updated DOCX file (binary)

**Database Impact** (if resume_id provided):

- Inserts new row into `resume_versions` table

---

### 8. `/optimize-and-export` (POST) - Full Optimization Pipeline

**Purpose**: End-to-end optimization and export

**Parameters**:

- `file` (Form): Original DOCX
- `bullets_json` (Form): JSON array of original bullets
- `constraints_json` (Form): JSON array of constraints
- `keywords_json` (Form): JSON array of keywords
- `style` (Form): Rewriting style ("safe", "bold", "creative")
- `output_format` (Form): "docx" or "pdf"
- `final_bullets_json` (Form, optional): Pre-validated bullets to use

**Process**:

1. Parse JSON inputs
2. If no `final_bullets`, rewrite with `rewrite_agent`
3. Validate all bullets againstconstraints
4. Create replacements map
5. Reconstruct DOCX with `layout_engine`
6. If PDF requested, convert with `pdf_converter_agent`
7. Return file with validation results in header

**Response**: DOCX or PDF file

**Headers**:

- `X-Validation-Results`: JSON array of validation booleans

---

### 9. `/history/{resume_id}` (GET) - Get Version History

**Purpose**: Retrieve all versions of a specific resume

**Parameters**:

- `resume_id` (path): Database ID of resume

**Process**:

1. Query database for all `ResumeVersion` entries
2. Order by version number (descending)
3. Return metadata for each version

**Response**:

```json
[
  {
    "version": 3,
    "date": "2025-11-29T10:25:00Z",
    "summary": "Updated text: 'Led team...' to 'Orchestrated team...'"
  },
  {
    "version": 2,
    "date": "2025-11-29T10:20:00Z",
    "summary": "Updated text: 'Managed...' to 'Spearheaded...'"
  },
  {
    "version": 1,
    "date": "2025-11-29T10:15:00Z",
    "summary": "Initial upload"
  }
]
```

## Agent Initialization

All agents are initialized once at startup:

```python
parser_agent = ParserAgent()
jd_agent = JDAgent()
rewrite_agent = RewriteAgent()
layout_engine = LayoutEngine()
pdf_converter_agent = PDFConverterAgent()
```

This singleton pattern ensures:

- Agents load their models once
- Memory efficient
- Faster response times (no re-initialization per request)

## Error Handling

All endpoints use try-except blocks:

```python
try:
    # Processing logic
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
```

Cleanup ensures temporary files are removed even on errors:

```python
finally:
    if os.path.exists(temp_file):
        os.remove(temp_file)
```

## Background Tasks

Used for async file cleanup:

```python
background_tasks.add_task(os.remove, pdf_path)
```

This ensures:

- Response sent immediately
- Files cleaned after response is transmitted
- No memory leaks from temp files

## Database Dependency Injection

```python
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Usage in endpoints:

```python
@app.post("/upload")
async def upload_resume(file: UploadFile, db: Session = Depends(get_db)):
    # db session automatically managed
```

Benefits:

- Automatic connection opening/closing
- One connection per request
- Thread-safe

## Testing the API

### Using curl

```bash
# Health check
curl http://localhost:8000/

# Upload resume
curl -X POST http://localhost:8000/upload \
  -F "file=@resume.docx"

# Get version history
curl http://localhost:8000/history/1
```

### Using Swagger UI

Navigate to: http://localhost:8000/docs

- Interactive API documentation
- Test endpoints directly in browser
- View request/response schemas

## Performance Considerations

1. **File Storage**: Temporary files stored on disk, cleaned via background tasks
2. **Database Connections**: Pooled and managed by SQLAlchemy
3. **Agent Initialization**: Done once at startup, not per request
4. **CORS**: Configured for development (restrict in production)

## Security Notes

**Current (Development)**:

- CORS allows all origins
- No authentication/authorization
- Files stored locally

**Production Recommendations**:

- Add JWT authentication
- Restrict CORS to specific domains
- Use cloud storage (S3, GCS) for files
- Add rate limiting
- Implement file size limits
- Validate file types beyond extension check

## Related Documentation

- [Database Models](./models.md)
- [CRUD Operations](./crud.md)
- [Layout Engine](./layout_engine.md)
- [Rewrite Agent](./rewrite_agent.md)
