"""
Resume Content Rewrite Agent

This module provides the RewriteAgent class which uses AI to rewrite resume bullet points
to incorporate job-specific keywords while maintaining strict length and style constraints.

The agent supports multiple writing styles (Safe, Bold, Creative) and enforces character
limits to prevent layout overflow.

Author: ResuForge Team
Date: 2024
"""

import ollama
from typing import List, Dict, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RewriteAgent:
    """
    Agent responsible for AI-powered resume content optimization.
    
    Uses Ollama's local LLM to rewrite bullet points with job-specific keywords
    while respecting length constraints and maintaining factual accuracy.
    """
    
    def __init__(self, model_name: str = "llama3"):
        """
        Initialize the Rewrite Agent.
        
        Args:
            model_name (str): Name of the Ollama model to use. Default is "llama3".
        """
        self.model_name = model_name
        logger.info(f"RewriteAgent initialized with model: {model_name}")

    def rewrite_bullet(self, bullet_text: str, keywords: List[str], max_length: int, style: str = "safe") -> str:
        """
        Rewrites a single bullet point to include keywords while respecting length constraints.
        
        The rewrite maintains the original facts while optimizing for ATS keyword matching.
        Different styles adjust the tone and confidence of the language used.
        
        Args:
            bullet_text (str): Original resume bullet point text
            keywords (List[str]): Keywords to incorporate (from job description)
            max_length (int): Maximum character count (enforces layout constraints)
            style (str): Writing style - "safe" (default), "bold", or "creative"
                - safe: Professional and concise
                - bold: Strong action verbs and confident language
                - creative: Engaging and descriptive language
                
        Returns:
            str: Rewritten bullet point (falls back to original if rewrite fails)
            
        Example:
            >>> agent = RewriteAgent()
            >>> original = "Developed web applications"
            >>> rewritten = agent.rewrite_bullet(original, ["React", "AWS"], 150, "bold")
            >>> print(rewritten)
            "Architected scalable web applications using React and deployed on AWS..."
            
        Note:
            Character limit is strictly enforced by the AI prompt. If the AI
            fails to respect it, consider using a shrink pass or manual editing.
        """
        logger.info(f"Rewriting bullet (style={style}, max_length={max_length})")
        logger.debug(f"Original text: {bullet_text[:50]}...")
        logger.debug(f"Keywords to incorporate: {keywords}")
        
        # Determine style-specific prompt guidance
        style_prompt = ""
        if style == "bold":
            style_prompt = "Use strong action verbs and confident language."
        elif style == "creative":
            style_prompt = "Use more engaging and descriptive language."
        else:  # safe
            style_prompt = "Keep it professional and concise."

        # Construct AI prompt with strict constraints
        prompt = f"""
        Rewrite the following resume bullet point to include these keywords: {', '.join(keywords)}.
        
        Constraints:
        1. MUST be less than {max_length} characters.
        2. Do NOT make up facts.
        3. {style_prompt}
        4. Return ONLY the rewritten bullet point, no quotes or explanations.

        Original Bullet: "{bullet_text}"
        """

        try:
            logger.debug(f"Calling Ollama model: {self.model_name}")
            
            # Call Ollama API
            response = ollama.chat(model=self.model_name, messages=[
                {'role': 'user', 'content': prompt},
            ])
            
            rewritten = response['message']['content'].strip()
            
            # Validate length (log warning if AI didn't respect constraint)
            if len(rewritten) > max_length:
                logger.warning(f"AI exceeded max_length: {len(rewritten)} > {max_length}")
                logger.warning("Consider using a shrink pass or stricter prompt")
            
            logger.info(f"Rewrite successful: {len(bullet_text)} → {len(rewritten)} chars")
            return rewritten
            
        except Exception as e:
            logger.error(f"Error rewriting bullet: {type(e).__name__}: {e}")
            logger.info("Falling back to original text")
            return bullet_text  # Fail safe: return original

    def batch_rewrite(self, bullets: List[str], keywords: List[str], constraints: List[Dict]) -> List[str]:
        """
        Rewrites multiple bullets in batch.
        
        Processes a list of bullet points sequentially, applying individual
        constraints to each one.
        
        Args:
            bullets (List[str]): List of original bullet points
            keywords (List[str]): Keywords to incorporate (applied to all bullets)
            constraints (List[Dict]): Per-bullet constraints, e.g.:
                [{"max_chars": 200}, {"max_chars": 180}, ...]
                
        Returns:
            List[str]: List of rewritten bullet points
            
        Example:
            >>> agent = RewriteAgent()
            >>> bullets = ["Built API", "Deployed services"]
            >>> keywords = ["Python", "Docker"]
            >>> constraints = [{"max_chars": 150}, {"max_chars": 150}]
            >>> rewritten = agent.batch_rewrite(bullets, keywords, constraints)
            
        Note:
            This is a sequential operation. For large batches, consider
            implementing parallel processing or rate limiting.
        """
        logger.info(f"Batch rewriting {len(bullets)} bullets")
        
        rewritten = []
        for i, bullet in enumerate(bullets):
            # Extract max length from constraints (default to 200 if not specified)
            max_len = constraints[i].get('max_chars', 200) if i < len(constraints) else 200
            
            logger.debug(f"Processing bullet {i+1}/{len(bullets)}")
            rewritten_bullet = self.rewrite_bullet(bullet, keywords, max_len)
            rewritten.append(rewritten_bullet)
        
        logger.info(f"Batch rewrite complete: {len(rewritten)} bullets processed")
        return rewritten

