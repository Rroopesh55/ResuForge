"""
PDF Converter Agent

Converts DOCX files to PDF format using LibreOffice (unoconv) for pixel-perfect
format preservation. This ensures consistent visual rendering in the PDF viewer.

Dependencies:
- LibreOffice (must be installed on system)
- python-docx (for validation)

Author: ResuForge Team
Date: 2024
"""

import os
import subprocess
import tempfile
import logging
from typing import Optional
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFConverterAgent:
    """
    Agent responsible for converting DOCX files to PDF format.
    
    Uses LibreOffice headless mode for conversion to ensure high-quality,
    layout-preserving PDF generation.
    """
    
    def __init__(self):
        """Initialize the PDF Converter Agent."""
        logger.info("PDFConverterAgent initialized")
        self.validate_dependencies()
    
    def validate_dependencies(self) -> bool:
        """
        Check if required dependencies (LibreOffice) are available.
        
        Returns:
            bool: True if dependencies are met
            
        Raises:
            RuntimeError: If LibreOffice is not found
        """
        # Check for LibreOffice/soffice
        try:
            result = subprocess.run(
                ['soffice', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                logger.info(f"LibreOffice detected: {result.stdout.strip()}")
                return True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            logger.warning("LibreOffice not found - DOCX to PDF conversion may fail")
            logger.warning("Install LibreOffice: https://www.libreoffice.org/download/")
            return False
        
        return False
    
    def convert_docx_to_pdf(self, docx_path: str, output_dir: Optional[str] = None) -> str:
        """
        Convert a DOCX file to PDF using LibreOffice.
        
        Args:
            docx_path (str): Path to the input DOCX file
            output_dir (str, optional): Directory for output PDF. 
                                       If None, uses temp directory.
        
        Returns:
            str: Path to the generated PDF file
            
        Raises:
            FileNotFoundError: If input DOCX doesn't exist
            RuntimeError: If conversion fails
            
        Example:
            >>> converter = PDFConverterAgent()
            >>> pdf_path = converter.convert_docx_to_pdf("/path/to/resume.docx")
            >>> print(f"PDF created at: {pdf_path}")
        """
        logger.info(f"Converting DOCX to PDF: {docx_path}")
        
        # Validate input file exists
        if not os.path.exists(docx_path):
            logger.error(f"Input file not found: {docx_path}")
            raise FileNotFoundError(f"DOCX file not found: {docx_path}")
        
        # Determine output directory
        if output_dir is None:
            output_dir = tempfile.gettempdir()
        
        # Get base filename without extension
        base_name = Path(docx_path).stem
        expected_pdf = os.path.join(output_dir, f"{base_name}.pdf")
        
        try:
            # Use LibreOffice headless mode for conversion
            # --headless: Run without GUI
            # --convert-to pdf: Convert to PDF format
            # --outdir: Output directory
            cmd = [
                'soffice',
                '--headless',
                '--convert-to',
                'pdf',
                '--outdir',
                output_dir,
                docx_path
            ]
            
            logger.debug(f"Running command: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30  # 30 second timeout
            )
            
            if result.returncode != 0:
                logger.error(f"Conversion failed: {result.stderr}")
                raise RuntimeError(f"PDF conversion failed: {result.stderr}")
            
            # Verify PDF was created
            if not os.path.exists(expected_pdf):
                logger.error(f"PDF not created at expected location: {expected_pdf}")
                raise RuntimeError("PDF file was not created")
            
            logger.info(f"PDF created successfully: {expected_pdf}")
            return expected_pdf
            
        except subprocess.TimeoutExpired:
            logger.error("Conversion timeout exceeded (30s)")
            raise RuntimeError("PDF conversion timed out")
        except Exception as e:
            logger.error(f"Unexpected error during conversion: {str(e)}")
            raise
    
    def convert_docx_bytes_to_pdf(self, docx_bytes: bytes) -> bytes:
        """
        Convert DOCX bytes to PDF bytes (for in-memory processing).
        
        Args:
            docx_bytes (bytes): DOCX file content as bytes
            
        Returns:
            bytes: PDF file content as bytes
            
        Note:
            This creates temporary files for conversion and cleans them up.
        """
        logger.info("Converting DOCX bytes to PDF bytes")
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as temp_docx:
            temp_docx.write(docx_bytes)
            temp_docx_path = temp_docx.name
        
        try:
            # Convert to PDF
            pdf_path = self.convert_docx_to_pdf(temp_docx_path)
            
            # Read PDF bytes
            with open(pdf_path, 'rb') as pdf_file:
                pdf_bytes = pdf_file.read()
            
            # Cleanup
            os.remove(pdf_path)
            
            logger.info(f"Converted {len(docx_bytes)} bytes DOCX to {len(pdf_bytes)} bytes PDF")
            return pdf_bytes
            
        finally:
            # Always cleanup temp DOCX
            if os.path.exists(temp_docx_path):
                os.remove(temp_docx_path)
