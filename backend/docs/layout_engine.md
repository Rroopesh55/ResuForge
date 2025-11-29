# layout_engine.py Documentation

## Overview

Core module for DOCX editing and constraint validation. Handles text replacement while preserving formatting and ensuring edits fit within layout constraints.

## File Location

`backend/agents/layout_engine.py`

## Purpose

- Edit DOCX files programmatically
- Preserve all formatting (fonts, styles, bullets)
- Validate text length constraints
- Prevent layout overflow

## Key Classes

### `LayoutEngine`

#### Initialization

```python
layout_engine = LayoutEngine()
```

No configuration required.

#### Key Methods

##### 1. `validate_constraints(original_text, new_text, max_chars)`

**Purpose**: Check if edited text fits within character limit

**Parameters**:

- `original_text` (str): Original text in resume
- `new_text` (str): Proposed replacement text
- `max_chars` (int): Maximum allowed characters

**Returns**: `bool` - True if valid, False if too long

**Implementation**:

```python
def validate_constraints(self, original: str, new_text: str, max_chars: int) -> bool:
    """
    Simple length validation.
    In production, could add:
    - Word count limits
    - Line count limits
    - Pixel width calculations
    """
    return len(new_text) <= max_chars
```

**Usage Example**:

```python
is_valid = layout_engine.validate_constraints(
    original_text="Led a team of 5",
    new_text="Orchestrated a cross-functional team of 5 engineers",
    max_chars=60
)
# Returns: True (49 chars <= 60)
```

---

##### 2. `reconstruct_docx(docx_path, output_path, replacements)`

**Purpose**: Apply text replacements to DOCX file while preserving formatting

**Parameters**:

- `docx_path` (str): Path to input DOCX file
- `output_path` (str): Path to save edited DOCX
- `replacements` (dict or list): Text replacements to apply
  - If dict: `{original: replacement}`
  - If list: `[(original, replacement), ...]`

**Returns**: `str` - Path to output DOCX file

**Implementation Details**:

1. **Open DOCX**:

   ```python
   from docx import Document
   doc = Document(docx_path)
   ```

2. **Iterate through document structure**:

   ```python
   for paragraph in doc.paragraphs:
       for run in paragraph.runs:
           # run = smallest text unit with consistent formatting
   ```

3. **Find and replace**:

   ```python
   if original_text in run.text:
       run.text = run.text.replace(original_text, new_text)
   ```

4. **Preserve formatting**:

   - `run.text = ...` keeps all run properties:
     - Font family (`run.font.name`)
     - Font size (`run.font.size`)
     - Bold (`run.font.bold`)
     - Italic (`run.font.italic`)
     - Color (`run.font.color`)
     - Underline (`run.font.underline`)

5. **Save**:
   ```python
   doc.save(output_path)
   ```

**Usage Example**:

```python
layout_engine.reconstruct_docx(
    docx_path="resume.docx",
    output_path="resume_edited.docx",
    replacements={
        "Led team": "Orchestrated cross-functional team",
        "Managed project": "Spearheaded strategic initiative"
    }
)
```

**Advanced Usage** (list of tuples):

```python
replacements = [
    ("Software Engineer", "Senior Software Engineer"),
    ("2020-2022", "2020-2023"),
    ("Python, JavaScript", "Python, JavaScript, TypeScript, Go")
]
layout_engine.reconstruct_docx("resume.docx", "updated.docx", replacements)
```

## Format Preservation Details

### What Gets Preserved ✅

1. **Font Properties**:
   - Family (Arial, Times New Roman, etc.)
   - Size (10pt, 12pt, etc.)
   - Color

- Weight (bold, normal)
- Style (italic,normal)

2. **Paragraph Properties**:

   - Alignment (left, center, right, justified)
   - Indentation
   - Line spacing
   - Bullets and numbering

3. **Document Structure**:
   - Headers and footers
   - Tables
   - Images (not modified, just preserved)
   - Hyperlinks

### Implementation via python-docx

The `python-docx` library maintains a `Run` object for each text segment with consistent formatting:

```python
# Example run structure
run.text = "Senior Software Engineer"
run.font.name = "Arial"
run.font.size = Pt(11)
run.font.bold = True
run.font.color.rgb = RGBColor(0, 0, 0)
```

When we do `run.text = new_text`, all other properties remain unchanged.

## Constraint Validation Strategy

### Current Implementation

Simple character count:

```python
len(new_text) <= max_chars
```

### How max_chars is Calculated

In `main.py`:

```python
def buildConstraints(paragraphs: List[str]) -> List[Dict]:
    return [{"max_chars": len(para) + 20} for para in paragraphs]
```

**Logic**:

- Original paragraph length + 20 character buffer
- Allows for slight expansion while preventing overflow
- Example: "Led team of 5" (14 chars) → max_chars = 34

### Advanced Validation (Future Enhancement)

```python
def validate_constraints_advanced(self, original, new_text, max_chars, font_size=11):
    """
    More sophisticated validation considering:
    - Character count
    - Word count
    - Estimated pixel width (approximation)
    """
    # Character count
    if len(new_text) > max_chars:
        return False

    # Word count (prevent too many words creating multiple lines)
    if len(new_text.split()) > len(original.split()) + 3:
        return False

    # Approximate width (characters * avg_char_width)
    avg_char_width = font_size * 0.6  # Rough approximation
    estimated_width = len(new_text) * avg_char_width
    max_width = max_chars * avg_char_width

    return estimated_width <= max_width
```

## Error Handling

### Common Issues and Solutions

1. **File Not Found**:

   ```python
   if not os.path.exists(docx_path):
       raise FileNotFoundError(f"DOCX file not found: {docx_path}")
   ```

2. **Invalid DOCX**:

   ```python
   try:
       doc = Document(docx_path)
   except Exception as e:
       raise ValueError(f"Invalid DOCX file: {e}")
   ```

3. **Replacement Not Found**:
   - Current: Silent (no error if text not found)
   - Could add logging to track unsuccessful replacements

## Integration with Other Components

### Called By

1. **`main.py`** - `/update-content` endpoint
2. **`main.py`** - `/optimize-and-export` endpoint

### Dependencies

- `python-docx` library for DOCX manipulation
- Standard `os` module for file operations

## Performance Considerations

### Speed

- DOCX parsing: ~100-500ms for typical resume
- Text replacement: O(n) where n = number of runs in document
- Saving: ~200-1000ms depending on file size

### Memory

- Entire document loaded into memory
- Typical resume: 1-5 MB
- Memory usage: 10-50 MB during processing

### Optimization Tips

1. **Batch Replacements**: Use single call with multiple replacements instead of multiple calls
2. **Reuse Instance**: `LayoutEngine()` is stateless, can be reused
3. **Async Processing**: For multiple documents, process in parallel

## Testing

### Unit Test Example

```python
import pytest
from layout_engine import LayoutEngine

def test_validate_constraints():
    engine = LayoutEngine()

    # Valid: within limit
    assert engine.validate_constraints("short", "slightly longer", 20) == True

    # Invalid: exceeds limit
    assert engine.validate_constraints("short", "this is way too long to fit", 10) == False

def test_reconstruct_docx(tmp_path):
    engine = LayoutEngine()

    # Create test DOCX (would use a fixture in real tests)
    input_path = "test_resume.docx"
    output_path = tmp_path / "output.docx"

    replacements = {"Engineer": "Senior Engineer"}

    result = engine.reconstruct_docx(input_path, str(output_path), replacements)

    assert os.path.exists(result)
    # Could verify content was actually replaced
```

## Related Documentation

- [main.py](./main.md) - API endpoints using layout_engine
- [rewrite_agent.py](./rewrite_agent.md) - Generates text that must fit constraints
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Why DOCX editing, not PDF

## Future Enhancements

1. **Table Support**: Edit text within tables
2. **Multi-Column Layouts**: Handle complex layouts
3. **Font Metrics**: Calculate actual pixel width for precise fitting
4. **Undo/Redo**: Track change history
5. **Diff View**: Show what changed between versions
6. **Style Templates**: Apply consistent formatting across edits
