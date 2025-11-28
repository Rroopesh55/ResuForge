# ResuForge - Project Structure Documentation

## Overview

ResuForge is a Resume Format-Aware AI Optimization System that optimizes resumes for job descriptions while preserving original layout and formatting.

## Directory Structure

```
Resume_writer/
├── backend/              # FastAPI Python backend
│   ├── agents/           # AI agents for resume processing
│   │   ├── parser_agent.py      # Extracts text and layout metadata from resumes
│   │   ├── jd_agent.py          # Analyzes job descriptions for keywords
│   │   ├── rewrite_agent.py     # Rewrites resume bullets using AI
│   │   └── layout_engine.py     # Validates layout constraints
│   ├── main.py           # FastAPI application entry point
│   └── requirements.txt  # Python dependencies
│
├── frontend/             # Next.js React frontend
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx              # Landing page
│   │   ├── dashboard/            # Dashboard application
│   │   │   └── page.tsx          # Main dashboard with resume editor
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles and Tailwind configuration
│   ├── components/       # Reusable React components
│   │   └── ui/                   # Shadcn UI components
│   └── lib/              # Utility functions
│
├── extension/            # Chrome Extension for JD capture
│   ├── manifest.json     # Extension configuration (Manifest V3)
│   ├── popup.html        # Extension popup UI
│   └── popup.js          # Extension logic for capturing job descriptions
│
└── README.md             # Project overview and setup instructions
```

## Backend (`/backend`)

### Purpose

Handles resume parsing, AI-powered analysis, and content optimization using local LLMs (Ollama).

### Key Components

#### `main.py`

- **Purpose**: FastAPI application entry point
- **Endpoints**:
  - `POST /upload` - Upload and parse resume files
  - `POST /analyze-jd` - Analyze job description for keywords
  - `POST /optimize` - Rewrite resume bullets
  - `POST /validate` - Validate layout constraints

#### `agents/` Directory

Contains AI agents that perform specific tasks:

1. **`parser_agent.py`** - Resume Parser Agent

   - Extracts text from PDF/DOCX files
   - Captures layout metadata (margins, fonts, page count)
   - Returns structured resume data

2. **`jd_agent.py`** - Job Description Intelligence Agent

   - Uses Ollama LLM to analyze job postings
   - Extracts keywords, skills, and requirements
   - Returns structured analysis

3. **`rewrite_agent.py`** - Content Rewrite Agent

   - Rewrites resume bullets using AI
   - Enforces character/line length constraints
   - Supports multiple styles (Safe, Bold, Creative)

4. **`layout_engine.py`** - Layout Validation Engine
   - Validates rewritten content against constraints
   - Simulates layout to detect overflow
   - Reconstructs DOCX files with preserved formatting

### Dependencies

See `requirements.txt` for full list. Key dependencies:

- `fastapi` - Web framework
- `python-docx` - DOCX file handling
- `pypdf` - PDF file parsing
- `ollama` - Local LLM integration

## Frontend (`/frontend`)

### Purpose

Provides a corporate-style web interface for resume optimization with real-time preview and editing.

### Key Components

#### `app/page.tsx` - Landing Page

- Professional landing page
- Feature highlights
- Call-to-action buttons

#### `app/dashboard/page.tsx` - Main Dashboard

- **Split-pane layout**:
  - Left: Resume preview and editor
  - Right: Job description input and AI controls
- **Features**:
  - File upload (PDF/DOCX)
  - Job description analysis
  - Keyword extraction and display
  - Real-time API communication with backend

#### `components/ui/` - UI Components

Shadcn UI components for consistent design:

- buttons, inputs, cards, dialogs, tabs, etc.

### Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS v4
- **UI Library**: Shadcn UI
- **Icons**: Lucide React

## Extension (`/extension`)

### Purpose

Browser extension to capture job descriptions from any webpage and send them to ResuForge.

### Components

#### `manifest.json`

- Manifest V3 configuration
- Permissions: activeTab, scripting
- Defines popup interface

#### `popup.html` & `popup.js`

- Simple UI with "Tailor for this Job" button
- Scrapes current page text
- Opens dashboard with JD pre-filled via URL parameter

## Development Workflow

1. **Backend**: Start FastAPI server

   ```bash
   cd backend
   python -m uvicorn main:app --reload --port 8000
   ```

2. **Frontend**: Start Next.js dev server

   ```bash
   cd frontend
   npm run dev
   ```

3. **Extension**: Load in Chrome
   - Navigate to `chrome://extensions`
   - Enable Developer mode
   - Load unpacked from `/extension` folder

## Data Flow

1. User uploads resume → `POST /upload` → Parser Agent extracts text + metadata
2. User pastes JD → `POST /analyze-jd` → JD Agent extracts keywords
3. User clicks optimize → `POST /optimize` → Rewrite Agent generates new content
4. System validates → Layout Engine checks constraints → Return optimized resume

## Core Principles ("Iron Rules")

1. **Zero Layout Shift** - Original margins, fonts, sections preserved
2. **Page Count Invariant** - 1-page resume stays 1-page
3. **Visual Consistency** - Bullet counts and line lengths maintained
4. **Overflow Protection** - Content shrinking if needed to fit

## Future Enhancements

- PDF.js visual editor for pixel-perfect rendering
- DOCX export with exact formatting preservation
- Multi-version generation (Safe/Bold/Creative variants)
- Version history and comparison
- Batch processing for multiple resumes
