# Frontend - Next.js Resume Editor Interface

## Overview

Corporate-style web application for resume optimization with split-pane dashboard, real-time preview, and AI-powered editing.

## Architecture

```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Landing page
│   ├── dashboard/
│   │   └── page.tsx        # Main dashboard (Client Component)
│   ├── layout.tsx          # Root layout with metadata
│   └── globals.css         # Tailwind CSS v4 configuration
├── components/
│   └── ui/                 # Shadcn UI components
├── lib/
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
```

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Running

```bash
npm run dev  # Development server on http://localhost:3000
npm run build  # Production build
npm start  # Production server
```

## Pages

### `/` - Landing Page

**File**: `app/page.tsx`

Professional corporate landing page featuring:

- Hero section with tagline
- Feature highlights (Layout Protection, ATS Optimization, Privacy)
- Call-to-action buttons
- Footer with links

**Navigation**: Click "Get Started" → `/dashboard`

### `/dashboard` - Main Application

**File**: `app/dashboard/page.tsx`

**Layout**: Split-pane interface

- **Left pane**: Resume preview and upload
- **Right pane**: Job description input and AI controls

**Features**:

- File upload (PDF/DOCX) via hidden input
- Resume text display
- Job description textarea
- "Analyze & Tailor" button with loading state
- Keyword extraction display
- Tab navigation (Job Description / Keywords)

**State Management**:

- `resumeText`: Uploaded resume content
- `jdText`: Job description (pre-filled from URL param if from extension)
- `keywords`: Extracted keywords from JD analysis
- `isAnalyzing`: Loading state for AI processing

**API Integration**:

- `POST /upload` - File upload handler
- `POST /analyze-jd` - JD analysis trigger

## Components

### Shadcn UI Components

Located in `components/ui/`, these provide consistent corporate styling:

- `button.tsx` - Action buttons with variants
- `card.tsx` - Content containers
- `input.tsx` - Text inputs
- `textarea.tsx` - Multi-line text inputs
- `tabs.tsx` - Tab navigation
- `scroll-area.tsx` - Scrollable containers
- `dialog.tsx` - Modal dialogs
- And more...

All components are:

- Fully typed with TypeScript
- Accessible (ARIA compliant)
- Customizable via Tailwind classes

## Styling

### Tailwind CSS v4

`app/globals.css` uses Tailwind v4 features:

- `@import "tailwindcss"` - Core framework
- `@theme` - CSS variable definitions
- `@custom-variant` - Dark mode support
- Color system using OKLCH for better color perception

### Design System

**Typography**: System fonts (Geist Sans/Mono)
**Colors**: Neutral palette with high contrast
**Spacing**: Consistent with Tailwind scale
**Shadows**: Subtle elevation for depth

## State & Data Flow

1. **User uploads resume**

   ```
   File Input → FormData → fetch(/upload) → setResumeText
   ```

2. **User pastes JD**

   ```
   Textarea onChange → setJdText
   ```

3. **User clicks Analyze**
   ```
   Button onClick → setIsAnalyzing → fetch(/analyze-jd) → setKeywords
   ```

## Chrome Extension Integration

The dashboard accepts a `?jd=` URL parameter to pre-fill the job description when opened from the extension:

```typescript
useEffect(() => {
  const jdParam = searchParams.get("jd");
  if (jdParam) setJdText(jdParam);
}, [searchParams]);
```

## Future Enhancements

### PDF.js Integration

- Display actual resume PDF with pixel-perfect rendering
- Overlay editable regions
- Preserve exact visual appearance

### Rich Text Editor

- Inline editing of resume bullets
- Style preservation
- Undo/redo history

### Export Functionality

- Download as PDF
- Download as DOCX with formatting
- Copy to clipboard

## Development

### Adding New Pages

1. Create `page.tsx` in `app/[route]/`
2. Export default React component
3. Add navigation links

### Adding New Components

```bash
npx shadcn@latest add [component-name]
```

### TypeScript

All files use TypeScript for type safety. Key types:

- `React.ChangeEvent<HTMLInputElement>` - File uploads
- `React.ChangeEvent<HTMLTextAreaElement>` - Text areas

## Common Issues

### Module not found errors

Run: `npx shadcn@latest add [missing-component]`

### "use client" required

Add `"use client"` directive to files using hooks (`useState`, `useEffect`)

### CSS warnings

Tailwind v4 features may show IDE warnings - these are safe to ignore
