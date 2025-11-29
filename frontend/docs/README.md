# Frontend Documentation Index

This folder contains detailed documentation for all frontend components.

## Core Pages

1. **[dashboard/page.tsx](./dashboard.md)** - Main dashboard with PDF viewer and controls
2. **[landing/page.tsx](./landing.md)** - Landing page (if exists)

## PDF Viewer Components

1. **[PDFViewer.tsx](./pdfviewer.md)** - PDF rendering and editable overlay management
2. **[EditableOverlay.tsx](./editableoverlay.md)** - Clickable text overlays on PDF
3. **[TextEditDialog.tsx](./texteditdialog.md)** - Modal for editing text with constraints

## Utilities

1. **[pdf-utils.ts](./pdf_utils.md)** - Helper functions for file type detection

## Architecture

See [../ARCHITECTURE.md](../../ARCHITECTURE.md) for high-level architecture decisions.

## State Management

The dashboard uses React `useState` for:

- Resume content (`resumeText`, `resumeParagraphs`)
- PDF file (`pdfFile`)
- Keywords extracted from JD
- Optimization results
- Database tracking (`currentResumeId`)

## Quick Navigation

- **Starting point**: Begin with [dashboard.md](./dashboard.md) to understand the main UI
- **PDF editing**: See [pdfviewer.md](./pdfviewer.md) and [texteditdialog.md](./texteditdialog.md)
- **API integration**: Check [dashboard.md](./dashboard.md) for endpoint usage
