from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import shutil
import os
import uuid
import json
from fastapi import Depends

# Database Imports
from backend import models, crud, database
from sqlalchemy.orm import Session

try:
    from backend.agents.parser_agent import ParserAgent
    from backend.agents.jd_agent import JDAgent
    from backend.agents.rewrite_agent import RewriteAgent
    from backend.agents.layout_engine import LayoutEngine
    from backend.agents.pdf_converter import PDFConverterAgent
except ModuleNotFoundError:
    from agents.parser_agent import ParserAgent
    from agents.jd_agent import JDAgent
    from agents.rewrite_agent import RewriteAgent
    from agents.layout_engine import LayoutEngine
    from agents.pdf_converter import PDFConverterAgent

# Create tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ResuForge API", version="0.1.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agents
parser_agent = ParserAgent()
jd_agent = JDAgent()
rewrite_agent = RewriteAgent()
layout_engine = LayoutEngine()
pdf_converter_agent = PDFConverterAgent()

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class JDRequest(BaseModel):
    text: str

class OptimizeRequest(BaseModel):
    bullets: List[str]
    keywords: List[str]
    constraints: List[Dict[str, Any]]
    style: str = "safe"

@app.get("/")
async def root():
    return {"message": "ResuForge API is running", "status": "healthy"}

@app.post("/upload")
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # Ensure default user exists
        user = crud.get_user_by_username(db, "default_user")
        if not user:
            user = crud.create_user(db, "default_user")

        # Save temp file
        file_ext = os.path.splitext(file.filename)[1].lower()
        temp_filename = f"temp_{uuid.uuid4()}{file_ext}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Store in DB
        resume = crud.create_resume(db, user.id, file.filename, temp_filename)
        # Create initial version
        crud.create_resume_version(db, resume.id, temp_filename, change_summary="Initial upload")

        # Parse
        if file_ext == ".pdf":
            text = parser_agent.extract_text_from_pdf(temp_filename)
            result = {"text": text, "resume_id": resume.id}
        elif file_ext in [".docx", ".doc"]:
            text = parser_agent.extract_text_from_docx(temp_filename)
            result = {"text": text, "raw_content": text.split("\n"), "resume_id": resume.id}
        else:
            # Cleanup if invalid
            os.remove(temp_filename)
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # We keep the file for history, so we don't delete it here immediately
        # In a real app, we'd move it to permanent storage. 
        # For this local version, we keep it in the root or a 'uploads' folder.
        
        return result
    except Exception as e:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/convert-to-pdf")
async def convert_to_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Convert a DOCX file to PDF for rendering in the PDF viewer.
    """
    try:
        # Validate file type
        if not file.filename.endswith(('.docx', '.doc')):
            raise HTTPException(status_code=400, detail="Only DOCX files are supported")
        
        # Save temp DOCX file
        temp_docx = f"temp_{uuid.uuid4()}.docx"
        with open(temp_docx, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        pdf_path = pdf_converter_agent.convert_docx_to_pdf(temp_docx)
        
        # Cleanup temp DOCX immediately, schedule PDF cleanup after response is sent
        os.remove(temp_docx)
        background_tasks.add_task(os.remove, pdf_path)
        
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"{os.path.splitext(file.filename)[0]}.pdf",
            background=background_tasks,
        )
        
    except Exception as e:
        if "temp_docx" in locals() and os.path.exists(temp_docx):
            try: os.remove(temp_docx)
            except: pass
        if "pdf_path" in locals() and os.path.exists(pdf_path):
            try: os.remove(pdf_path)
            except: pass
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-jd")
async def analyze_jd(request: JDRequest):
    return jd_agent.analyze_jd(request.text)

@app.post("/optimize")
async def optimize_bullets(request: OptimizeRequest):
    rewritten = rewrite_agent.batch_rewrite(
        request.bullets,
        request.keywords,
        request.constraints,
        style=request.style,
    )

    validated_bullets = []
    validations = []
    for idx, new_text in enumerate(rewritten):
        max_chars = request.constraints[idx].get("max_chars", 200) if idx < len(request.constraints) else 200
        original = request.bullets[idx] if idx < len(request.bullets) else ""
        is_valid = layout_engine.validate_constraints(original, new_text, max_chars)
        validations.append(is_valid)
        validated_bullets.append(new_text if is_valid else original)

    return {"rewritten_bullets": validated_bullets, "validation": validations}

@app.post("/validate")
async def validate_layout(original: str = Body(...), new_text: str = Body(...), max_chars: int = Body(...)):
    is_valid = layout_engine.validate_constraints(original, new_text, max_chars)
    return {"valid": is_valid}

@app.post("/optimize-and-export")
async def optimize_and_export(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    bullets_json: str = Form(...),
    constraints_json: str = Form(...),
    keywords_json: str = Form(...),
    style: str = Form("safe"),
    output_format: str = Form("docx"),
    final_bullets_json: Optional[str] = Form(None),
):
    if output_format not in {"docx", "pdf"}:
        raise HTTPException(status_code=400, detail="output_format must be 'docx' or 'pdf'")

    try:
        bullets = json.loads(bullets_json)
        constraints = json.loads(constraints_json)
        keywords = json.loads(keywords_json)
        final_bullets_override = json.loads(final_bullets_json) if final_bullets_json else None
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {exc}") from exc

    # ... (validation logic remains same)

    optimized_path = None
    pdf_path = None

    # Persist uploaded DOCX temporarily
    original_ext = os.path.splitext(file.filename)[1] or ".docx"
    temp_original = f"temp_original_{uuid.uuid4()}{original_ext}"
    with open(temp_original, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        if final_bullets_override is not None:
            candidate_bullets = final_bullets_override
        else:
            candidate_bullets = rewrite_agent.batch_rewrite(bullets, keywords, constraints, style=style)

        final_bullets = []
        validation_results = []
        for idx, rewritten_text in enumerate(candidate_bullets):
            max_chars = constraints[idx].get("max_chars", 200) if idx < len(constraints) else 200
            original_text = bullets[idx] if idx < len(bullets) else ""
            if layout_engine.validate_constraints(original_text, rewritten_text, max_chars):
                final_bullets.append(rewritten_text)
                validation_results.append(True)
            else:
                final_bullets.append(original_text)
                validation_results.append(False)

        replacements = list(zip(bullets, final_bullets))
        validation_header = json.dumps(validation_results)

        optimized_path = f"optimized_{uuid.uuid4()}.docx"
        layout_engine.reconstruct_docx(temp_original, optimized_path, replacements)

        if output_format == "docx":
            background_tasks.add_task(os.remove, optimized_path)
            background_tasks.add_task(os.remove, temp_original)
            return FileResponse(
                optimized_path,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                filename="resume_optimized.docx",
                headers={"X-Validation-Results": validation_header},
                background=background_tasks,
            )

        pdf_path = pdf_converter_agent.convert_docx_to_pdf(optimized_path)
        background_tasks.add_task(os.remove, optimized_path)
        background_tasks.add_task(os.remove, pdf_path)
        background_tasks.add_task(os.remove, temp_original)
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename="resume_optimized.pdf",
            headers={"X-Validation-Results": validation_header},
            background=background_tasks,
        )
    except Exception as exc:
        for path in [temp_original, optimized_path, pdf_path]:
            if path and os.path.exists(path):
                try: os.remove(path)
                except: pass
        raise HTTPException(status_code=500, detail=str(exc)) from exc

@app.post("/validate-edit")
async def validate_edit(
    original_text: str = Body(...), 
    new_text: str = Body(...), 
    max_chars: int = Body(...)
):
    is_valid = layout_engine.validate_constraints(original_text, new_text, max_chars)
    return {
        "valid": is_valid,
        "char_count": len(new_text),
        "max_chars": max_chars,
        "diff": len(new_text) - max_chars if not is_valid else 0
    }

@app.post("/update-content")
async def update_content(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    original_text: str = Form(...),
    new_text: str = Form(...),
    resume_id: int = Form(None),
    db: Session = Depends(get_db)
):
    try:
        # Save uploaded file temporarily
        temp_input = f"temp_input_{uuid.uuid4()}.docx"
        with open(temp_input, "wb") as f:
            shutil.copyfileobj(file.file, f)
            
        # Perform replacement
        output_docx = f"updated_{uuid.uuid4()}.docx"
        layout_engine.reconstruct_docx(
            docx_path=temp_input,
            replacements={original_text: new_text},
            output_path=output_docx
        )
        
        # Record version if resume_id is provided
        if resume_id:
            crud.create_resume_version(
                db, 
                resume_id, 
                output_docx, 
                change_summary=f"Updated text: '{original_text[:20]}...' to '{new_text[:20]}...'"
            )

        # Cleanup input file
        background_tasks.add_task(os.remove, temp_input)
        
        return FileResponse(
            output_docx, 
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
            filename="updated_resume.docx"
        )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/{resume_id}")
def get_history(resume_id: int, db: Session = Depends(get_db)):
    versions = crud.get_resume_versions(db, resume_id)
    return [{"version": v.version_number, "date": v.created_at, "summary": v.change_summary} for v in versions]

