# TextEditDialog.tsx Documentation

## Overview

Modal dialog for editing resume text with real-time character count and validation.

## Location

`frontend/components/pdf-viewer/TextEditDialog.tsx`

## Purpose

- Display original text
- Allow editing with constraints
- Show character count (current/max)
- Validate before saving
- Trigger AI rewrite (future feature)

## Props

```typescript
interface TextEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  onSave: (newText: string) => void;
  maxLength?: number; // Character limit
}
```

## Implementation

```tsx
export function TextEditDialog({
  isOpen,
  onClose,
  originalText,
  onSave,
  maxLength = 200,
}: Props) {
  const [editedText, setEditedText] = useState(originalText);
  const charCount = editedText.length;
  const isOverLimit = charCount > maxLength;

  const handleSave = () => {
    if (isOverLimit) {
      // Show error or truncate
      return;
    }
    onSave(editedText);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Text</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Original:</Label>
            <p className="text-sm text-gray-600">{originalText}</p>
          </div>

          <div>
            <Label>Edit:</Label>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className={isOverLimit ? "border-red-500" : ""}
            />
          </div>

          <div className="text-sm">
            Characters: {charCount} / {maxLength}
            {isOverLimit && (
              <span className="text-red-500 ml-2">
                ({charCount - maxLength} over limit)
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isOverLimit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Features

### 1. Real-time Character Count

```typescript
const charCount = editedText.length;
const remaining = maxLength - charCount;
```

Displays:

- Current count
- Maximum allowed
- Characters over limit (if exceeds)

### 2. Visual Feedback

```typescript
className={isOverLimit ? "border-red-500" : "border-gray-300"}
```

- Red border when over limit
- Disabled save button

### 3. Max Length Calculation

Passed from EditableOverlay based on original text:

```typescript
const maxLength = originalText.length + 20; // 20 char buffer
```

## Future Enhancements

### AI Rewrite Button

```tsx
<Button onClick={handleAIRewrite} disabled={isRewriting}>
  {isRewriting ? (
    <>
      <Loader2 className="animate-spin mr-2" />
      Rewriting...
    </>
  ) : (
    <>
      <Sparkles className="mr-2" />
      AI Rewrite
    </>
  )}
</Button>
```

Would call backend:

```typescript
const handleAIRewrite = async () => {
  const response = await fetch("/rewrite", {
    method: "POST",
    body: JSON.stringify({
      text: originalText,
      keywords: extractedKeywords,
      max_chars: maxLength,
    }),
  });
  const { rewritten } = await response.json();
  setEditedText(rewritten);
};
```

### Validation Against Backend

```typescript
const validateEdit = async () => {
  const response = await fetch("/validate-edit", {
    method: "POST",
    body: JSON.stringify({
      original_text: originalText,
      new_text: editedText,
      max_chars: maxLength,
    }),
  });
  const { valid, diff } = await response.json();

  if (!valid) {
    setError(`Text is ${diff} characters too long`);
  }
};
```

## Related

- Parent: [editableoverlay.md](./editableoverlay.md)
- Backend validation: [main.py](../../backend/docs/main.md) `/validate-edit`
- Future AI rewrite: [rewrite_agent.md](../../backend/docs/rewrite_agent.md)
