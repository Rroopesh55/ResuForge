# Backend Documentation Index

This folder contains detailed documentation for all backend components.

## Core Modules

1. **[main.py](./main.md)** - FastAPI application entry point, API endpoints
2. **[database.py](./database.md)** - SQLAlchemy database configuration and connection
3. **[models.py](./models.md)** - Database models (User, Resume, ResumeVersion)
4. **[crud.py](./crud.md)** - Database CRUD operations

## Agents

1. **[parser_agent.py](./parser_agent.md)** - Resume text extraction from PDF/DOCX
2. **[jd_agent.py](./jd_agent.md)** - Job description analysis and keyword extraction
3. **[re write_agent.py](./rewrite_agent.md)** - AI-powered bullet point rewriting
4. **[layout_engine.py](./layout_engine.md)** - DOCX editing and constraint validation
5. **[pdf_converter.py](./pdf_converter.md)** - DOCX to PDF conversion

## Architecture

See [../ARCHITECTURE.md](../../ARCHITECTURE.md) for high-level architecture decisions.

## Quick Navigation

- **Starting point**: Begin with [main.md](./main.md) to understand the API structure
- **Editing logic**: See [layout_engine.md](./layout_engine.md) for DOCX editing
- **AI features**: Check [rewrite_agent.md](./rewrite_agent.md) for LLM integration
- **Database**: Review [database.md](./database.md) and [models.md](./models.md)
