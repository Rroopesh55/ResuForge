# Chrome Extension - Job Description Capture

## Overview

Browser extension to capture job descriptions from any webpage and automatically populate them in the ResuForge dashboard.

## Structure

```
extension/
├── manifest.json    # Manifest V3 configuration
├── popup.html       # Extension popup UI
└── popup.js         # Main extension logic
```

## Features

- One-click job description capture from any page
- Automatic text extraction from current tab
- Direct integration with ResuForge dashboard via URL parameters

## Installation

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `/extension` folder from ResuForge project
5. Extension icon should appear in Chrome toolbar

## Usage

1. Navigate to any job posting (LinkedIn, Indeed, company career pages, etc.)
2. Click the ResuForge extension icon
3. Click "Tailor for this Job" button
4. Dashboard opens in new tab with job description auto-filled

## Technical Details

### manifest.json

- **Version**: Manifest V3 (latest standard)
- **Permissions**:
  - `activeTab` - Access current page content
  - `scripting` - Execute scripts to extract text

### popup.js

Key functionality:

- Captures current tab
- Executes `getPageText()` function in page context
- Extracts `document.body.innerText`
- URL-encodes text (limited to 5000 chars for URL safety)
- Opens dashboard with `?jd=<encoded_text>` parameter

## Limitations

- **Text length**: Limited to 5000 characters via URL parameter
- **Formatting**: Plain text only (no HTML/styling preserved)
- **Future**: Consider using Chrome storage API for larger content

## Future Enhancements

- Save history of captured job descriptions
- Smart extraction (detect job description section only)
- Support for multiple resume versions per JD
- Direct API integration (bypass URL parameters)
