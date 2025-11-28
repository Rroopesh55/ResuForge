from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import shutil
import os
import uuid

from agents.parser_agent import ParserAgent
from agents.jd_agent import JDAgent
from agents.rewrite_agent import RewriteAgent
from agents.layout_engine import LayoutEngine
from agents.pdf_converter import PDFConverterAgent

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
async def upload_resume(file: UploadFile = File(...)):
    try:
        # Save temp file
        file_ext = os.path.splitext(file.filename)[1]
        temp_filename = f"temp_{uuid.uuid4()}{file_ext}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse
        result = parser_agent.parse_file(temp_filename)
        
        # Cleanup
        os.remove(temp_filename)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/convert-to-pdf")
async def convert_to_pdf(file: UploadFile = File(...)):
    """
    Convert a DOCX file to PDF for rendering in the PDF viewer.
    
    Accepts: DOCX file
    Returns: PDF file
    """
    try:
        # Validate file type
        if not file.filename.endswith(('.docx', '.doc')):
            raise HTTPException(status_code=400, detail="Only DOCX files are supported")
        
        # Save temp DOCX file
        temp_docx = f"temp_{uuid.uuid4()}.docx"
        with open(temp_docx, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Convert to PDF
        pdf_path = pdf_converter_agent.convert_docx_to_pdf(temp_docx)
        
        # Cleanup temp DOCX
        os.remove(temp_docx)
        
        # Return PDF file
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"{os.path.splitext(file.filename)[0]}.pdf"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-jd")
async def analyze_jd(request: JDRequest):
    return jd_agent.analyze_jd(request.text)

@app.post("/optimize")
async def optimize_bullets(request: OptimizeRequest):
    rewritten = rewrite_agent.batch_rewrite(
        request.bullets, 
        request.keywords, 
        request.constraints
    )
    return {"rewritten_bullets": rewritten}

@app.post("/validate")
async def validate_layout(original: str = Body(...), new_text: str = Body(...), max_chars: int = Body(...)):
    is_valid = layout_engine.validate_constraints(original, new_text, max_chars)
    return {"valid": is_valid}


