# jd_agent.py Documentation

## Overview

Analyzes job descriptions to extract keywords, required skills, and qualifications.

## Location

`backend/agents/jd_agent.py`

## Key Methods

### `analyze_jd(text: str) -> Dict`

**Purpose**: Extract structured information from job description text

**Process**:

1. Send JD text to LLM with structured extraction prompt
2. Parse response for keywords, skills, requirements
3. Return structured JSON

**Returns**:

```json
{
  "keywords": ["Python", "FastAPI", "Docker", "AWS"],
  "skills": ["Backend development", "API design", "Cloud deployment"],
  "requirements": ["5+ years experience", "Bachelor's degree"]
}
```

**LLM Prompt Template**:

```
Analyze this job description and extract:
1. Technical keywords (technologies, tools, frameworks)
2. Required skills
3. Qualifications

Job Description:
{text}

Return as JSON.
```

## Usage

```python
from jd_agent import JDAgent

agent = JDAgent()
result = agent.analyze_jd(job_description_text)

keywords = result['keywords']  # Use for resume optimization
```

## Integration

- Called by: [main.py](./main.md) `/analyze-jd` endpoint
- Keywords used by: [rewrite_agent.md](./rewrite_agent.md) for optimization
- Frontend displays in dashboard Keywords tab

## Related

- See [main.md](./main.md) for API endpoint details
