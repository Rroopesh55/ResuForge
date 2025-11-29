# rewrite_agent.py Documentation

## Overview

AI-powered agent that rewrites resume bullets to include target keywords while maintaining specified constraints.

## Location

`backend/agents/rewrite_agent.py`

## Key Methods

### `batch_rewrite(bullets, keywords, constraints, style='safe')`

**Purpose**: Rewrite multiple bullets with keyword optimization

**Parameters**:

- `bullets` (List[str]): Original bullet points
- `keywords` (List[str]): Keywords to include (from JD analysis)
- `constraints` (List[Dict]): Max character limits for each bullet
- `style` (str): Writing style - "safe", "bold", or "creative"

**Process**:

1. For each bullet, create prompt with keywords and constraints
2. Send to LLM (Ollama) with style instructions
3. Validate response length
4. Return rewritten bullets

**Styles**:

- **safe**: Professional, conservative language
- **bold**: Action-oriented, impactful verbs
- **creative**: Descriptive, engaging language

**Example**:

```python
rewrite_agent = RewriteAgent()

bullets = ["Led team of 5 engineers"]
keywords = ["cross-functional", "agile"]
constraints = [{"max_chars": 100}]

result = rewrite_agent.batch_rewrite(bullets, keywords, constraints, "bold")
# Result: ["Spearheaded cross-functional agile team of 5 engineers..."]
```

## LLM Integration

Uses Ollama (local) with `llama3` model:

```python
import requests

response = requests.post("http://localhost:11434/api/generate", json={
    "model": "llama3",
    "prompt": prompt,
    "stream": False
})
```

**Prompt Structure**:

```
Rewrite this resume bullet to include keywords: {keywords}
Style: {style}
Max length: {max_chars} characters
Original: {bullet}
```

## Error Handling

- Falls back to original bullet if LLM fails
- Validates length before returning
- Logs all operations

## Related

- Used by: [main.py](./main.md) `/optimize` and `/optimize-and-export`
- Works with: [layout_engine.md](./layout_engine.md) for constraint validation
- Keywords from: [jd_agent.md](./jd_agent.md)
