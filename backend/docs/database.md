# Database Documentation

## Overview

SQLAlchemy-based database for storing resumes and version history.

## Files

- `backend/database.py` - Connection configuration
- `backend/models.py` - ORM models
- `backend/crud.py` - CRUD operations

## database.py

### Connection Setup

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./resume_writer.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

### Dependency Injection

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Usage in endpoints:

```python
@app.post("/upload")
def upload(file: UploadFile, db: Session = Depends(get_db)):
    # db session automatically managed
```

## models.py

### User Model

```python
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Resume Model

```python
class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)  # Original filename
    original_filepath = Column(String)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
```

### ResumeVersion Model

```python
class ResumeVersion(Base):
    __tablename__ = "resume_versions"
    id = Column(Integer, primary_key=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    version_number = Column(Integer)
    filepath = Column(String)
    pdf_filepath = Column(String, nullable=True)
    change_summary = Column(String)
    created_at = Column(DateTime)
```

## crud.py Operations

### Create User

```python
def create_user(db: Session, username: str):
    user = models.User(username=username)
    db.add(user)
    db.commit()
    return user
```

### Create Resume

```python
def create_resume(db: Session, user_id: int, title: str, filepath: str):
    resume = models.Resume(user_id=user_id, title=title, original_filepath=filepath)
    db.add(resume)
    db.commit()
    return resume
```

### Create Version

```python
def create_resume_version(db: Session, resume_id: int, filepath: str, change_summary: str):
    # Auto-increment version number
    last_version = db.query(models.ResumeVersion)\
        .filter_by(resume_id=resume_id)\
        .order_by(models.ResumeVersion.version_number.desc())\
        .first()

    new_version = last_version.version_number + 1 if last_version else 1

    version = models.ResumeVersion(
        resume_id=resume_id,
        version_number=new_version,
        filepath=filepath,
        change_summary=change_summary
    )
    db.add(version)
    db.commit()
    return version
```

### Get Version History

```python
def get_resume_versions(db: Session, resume_id: int):
    return db.query(models.ResumeVersion)\
        .filter_by(resume_id=resume_id)\
        .order_by(models.ResumeVersion.version_number.desc())\
        .all()
```

## Database Schema

```
users
├── id (PK)
├── username (unique, indexed)
└── created_at

resumes
├── id (PK)
├── user_id (FK → users.id)
├── title
├── original_filepath
├── created_at
└── updated_at

resume_versions
├── id (PK)
├── resume_id (FK → resumes.id)
├── version_number
├── filepath
├── pdf_filepath
├── change_summary
└── created_at
```

## Migration to PostgreSQL

To switch from SQLite to PostgreSQL:

1. Update `database.py`:

```python
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/resume_db"
```

2. Install driver:

```bash
pip install psycopg2-binary
```

3. No code changes needed (SQLAlchemy abstraction)

## Viewing Data

See [database_viewer_guide.md](../../../.gemini/antigravity/brain/17d2c3e6-75b7-4f7b-b1b9-37de595553ba/database_viewer_guide.md)

## Related

- Used by: [main.py](./main.md) all endpoints
- Schema design: [database_schema.md](../../../.gemini/antigravity/brain/17d2c3e6-75b7-4f7b-b1b9-37de595553ba/database_schema.md)
