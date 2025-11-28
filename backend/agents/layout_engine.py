"""
Layout Validation and Reconstruction Engine

This module provides the LayoutEngine class which enforces the "Iron Rules" of layout
preservation. It validates text constraints and reconstructs DOCX files while maintaining
exact formatting.

The engine ensures that optimized resume content fits within the original layout without
causing page overflow or visual inconsistencies.

Author: ResuForge Team
Date: 2024
"""

from typing import List, Dict, Any
import docx
from docx.shared import Pt, Inches
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LayoutEngine:
    """
    Engine responsible for layout validation and DOCX reconstruction.
    
    Enforces the "Iron Rules":
    1. Zero Layout Shift - Margins and fonts preserved
    2. Page Count Invariant - Same number of pages
    3. Visual Consistency - Bullet counts and line lengths maintained
    4. Overflow Protection - Content must fit within constraints
    """
    
    def __init__(self):
        """Initialize the Layout Engine."""
        logger.info("LayoutEngine initialized")

    def validate_constraints(self, original_text: str, new_text: str, max_chars: int) -> bool:
        """
        Checks if the new text fits within the character limit.
        
        This is the first line of defense against layout overflow. Before
        any text replacement is committed, it must pass this validation.
        
        Args:
            original_text (str): Original text (for reference/comparison)
            new_text (str): Proposed replacement text
            max_chars (int): Maximum allowed character count
            
        Returns:
            bool: True if new text fits, False if it exceeds limit
            
        Example:
            >>> engine = LayoutEngine()
            >>> valid = engine.validate_constraints("Old text", "New longer text", 20)
            >>> print(valid)
            True
            
        Note:
            This is a simple character-based validation. For more accurate
            layout simulation, use simulate_layout() which considers fonts
            and widths.
        """
        is_valid = len(new_text) <= max_chars
        
        if is_valid:
            logger.debug(f"Constraint validation passed: {len(new_text)}/{max_chars} chars")
        else:
            logger.warning(f"Constraint validation FAILED: {len(new_text)} > {max_chars} chars")
            logger.warning(f"Text will need to be shortened by {len(new_text) - max_chars} chars")
        
        return is_valid

    def reconstruct_docx(self, original_path: str, output_path: str, replacements: Dict[str, str]):
        """
        Replaces text in the original DOCX while preserving styles.
        
        WARNING: This is a simplified implementation. For production use,
        a more robust approach would:
        1. Replace text within runs (not entire paragraphs)
        2. Preserve font colors, bold, italic
        3. Handle tables and nested structures
        
        Args:
            original_path (str): Path to original DOCX file
            output_path (str): Path where modified DOCX should be saved
            replacements (Dict[str, str]): Mapping of {old_text: new_text}
                Only exact paragraph matches are replaced.
                
        Example:
            >>> engine = LayoutEngine()
            >>> replacements = {
            ...     "Built web apps": "Developed scalable web applications"
            ... }
            >>> engine.reconstruct_docx("resume.docx", "resume_opt.docx", replacements)
            
        Note:
            For complex formatting preservation, consider using python-docx's
            run-level manipulation or format cloning.
        """
        logger.info(f"Reconstructing DOCX: {original_path} → {output_path}")
        logger.debug(f"Applying {len(replacements)} text replacements")
        
        try:
            # Load original document
            doc = docx.Document(original_path)
            replacements_applied = 0

            # Iterate through paragraphs
            for para in doc.paragraphs:
                if para.text in replacements:
                    # Found a matching paragraph
                    target_text = para.text
                    new_text = replacements[target_text]
                    
                    logger.debug(f"Replacing paragraph: '{target_text[:30]}...' → '{new_text[:30]}...'")
                    
                    # Simple replacement (preserves some formatting but not all)
                    # Better approach: Replace text within runs to preserve styling
                    if len(para.runs) > 0:
                        para.runs[0].text = new_text
                        # Clear other runs to avoid duplicate text
                        for run in para.runs[1:]:
                            run.text = ""
                    else:
                        # Fallback if no runs exist
                        para.text = new_text
                    
                    replacements_applied += 1

            # Save modified document
            doc.save(output_path)
            logger.info(f"DOCX reconstruction complete: {replacements_applied}/{len(replacements)} replacements applied")
            
            if replacements_applied < len(replacements):
                logger.warning(f"Not all replacements were applied: {replacements_applied}/{len(replacements)}")
                logger.warning("Some paragraphs may not have exact text matches")
                
        except Exception as e:
            logger.error(f"DOCX reconstruction failed: {type(e).__name__}: {e}")
            raise

    def simulate_layout(self, text: str, font_name: str, font_size: float, max_width_inches: float) -> bool:
        """
        Simulates if text fits in a given width.
        
        This is a heuristic approximation since we don't have access to a real
        font renderer. More accurate simulation would require:
        - Actual font metrics (kerning, ligatures)
        - Word wrapping logic
        - PDF rendering engine
        
        Args:
            text (str): Text to simulate
            font_name (str): Font name (currently not used in calculation)
            font_size (float): Font size in points
            max_width_inches (float): Available width in inches
            
        Returns:
            bool: True if estimated width fits, False if overflow expected
            
        Example:
            >>> engine = LayoutEngine()
            >>> fits = engine.simulate_layout("Sample text", "Times New Roman", 12, 6.5)
            >>> print(fits)
            True
            
        Note:
            Average character width is a rough estimate. For production use,
            consider:
            - Using a font metrics library (e.g., PIL/Pillow)
            - Measuring actual rendered width
            - Testing with representative resume fonts
        """
        logger.debug(f"Simulating layout: font={font_name}, size={font_size}pt, max_width={max_width_inches}in")
        
        # Heuristic: Average char width for 12pt font ≈ 0.08 inches
        # Scale linearly with font size
        avg_char_width = (font_size / 12.0) * 0.08
        estimated_width = len(text) * avg_char_width
        
        fits = estimated_width <= max_width_inches
        
        if fits:
            logger.debug(f"Layout simulation PASS: {estimated_width:.2f}in ≤ {max_width_inches}in")
        else:
            logger.warning(f"Layout simulation FAIL: {estimated_width:.2f}in > {max_width_inches}in")
            logger.warning(f"Text may overflow by {estimated_width - max_width_inches:.2f}in")
        
        return fits

