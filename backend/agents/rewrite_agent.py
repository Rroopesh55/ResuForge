"""
Resume Content Rewrite Agent

This module provides the RewriteAgent class which uses AI to rewrite resume bullet points
to incorporate job-specific keywords while maintaining strict length and style constraints.

NOW WITH SMART FALLBACK STRATEGIES:
- Level 1: Full AI rewrite with all keywords
- Level 2: AI rewrite with smart subset of keywords (if Level 1 fails)
- Level 3: Template-based keyword injection (if AI unavailable)
- Level 4: Simple keyword append (minimal enhancement)
- Level 5: Original bullet (last resort)

Author: ResuForge Team
Date: 2024
"""

import ollama
from typing import List, Dict
import logging
import sys
import os

# Add utils to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from utils.timeout_utils import with_retry
from utils.partial_failure import PartialFailureHandler
from utils.encoding_utils import safe_encode_text, normalize_whitespace
from utils.smart_fallback import cascading_fallback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RewriteAgent:
    """AI-powered resume content optimization with smart fallback"""
    
    def __init__(self, model_name: str = "llama3"):
        """Initialize the Rewrite Agent"""
        self.model_name = model_name
        logger.info(f"RewriteAgent initialized with model: {model_name}")

    @with_retry(max_attempts=2, timeout_seconds=30)
    def rewrite_bullet(self, bullet_text: str, keywords: List[str], max_length: int, style: str = "safe") -> str:
        """
        Rewrite a single bullet with timeout protection and encoding support.
        
        Returns original if AI fails (but batch_rewrite uses smart fallback).
        """
        logger.info(f"Rewriting bullet (style={style}, max_length={max_length})")
        
        # Normalize and encode
        bullet_text = normalize_whitespace(safe_encode_text(bullet_text))
        logger.debug(f"Original: {bullet_text[:50]}...")
        
        # Style prompt
        style_prompts = {
            "bold": "Use strong action verbs.",
            "creative": "Use engaging language.",
            "safe": "Keep it professional."
        }
        style_prompt = style_prompts.get(style, style_prompts["safe"])

        # AI prompt
        prompt = f"""Rewrite this resume bullet to include: {', '.join(keywords)}.
        
Constraints:
1. MUST be under {max_length} chars
2. Do NOT make up facts  
3. {style_prompt}
4. Return ONLY the rewritten bullet

Original: "{bullet_text}"
"""

        try:
            response = ollama.chat(model=self.model_name, messages=[{'role': 'user', 'content': prompt}])
            rewritten = safe_encode_text(response['message']['content'].strip())
            
            # Auto-truncate if needed
            if len(rewritten) > max_length:
                logger.warning(f"AI exceeded limit, truncating")
                rewritten = rewritten[:max_length].rsplit(' ', 1)[0]
            
            logger.info(f"Success: {len(bullet_text)} → {len(rewritten)} chars")
            return rewritten
        except Exception as e:
            logger.error(f"AI rewrite failed: {e}")
            return bullet_text  # Fallback to original

    def batch_rewrite(self, bullets: List[str], keywords: List[str], constraints: List[Dict], style: str = "safe") -> List[str]:
        """
        Batch rewrite with SMART cascading fallback.
        
        If AI fails for a bullet, uses:
        1. Template-based keyword injection
        2. Simple keyword append
        3. Original (last resort)
        
        Ensures users get improved bullets even if AI is unavailable.
        """
        logger.info(f"Batch rewriting {len(bullets)} bullets with smart fallback")
        
        handler = PartialFailureHandler(fail_fast=False)
        
        def rewrite_single(item: tuple) -> str:
            """Try AI rewrite"""
            i, bullet = item
            max_len = constraints[i].get('max_chars', 200) if i < len(constraints) else 200
            return self.rewrite_bullet(bullet, keywords, max_len, style=style)
        
        def smart_fallback_wrapper(item: tuple) -> str:
            """Smart cascading fallback"""
            i, bullet = item
            max_len = constraints[i].get('max_chars', 200) if i < len(constraints) else 200
            
            # Cascading fallback tries template/append strategies
            enhanced, strategy = cascading_fallback(bullet, keywords, max_len, ai_rewrite_func=None)
            
            logger.info(f"Bullet {i}: used '{strategy}' strategy")
            return enhanced
        
        # Process batch
        indexed_bullets = list(enumerate(bullets))
        results = handler.process_batch(indexed_bullets, rewrite_single, fallback=smart_fallback_wrapper)
        
        # Results
        rewritten = handler.get_successful(results)
        summary = handler.get_summary(results)
        
        logger.info(f"Complete: {summary['successful']}/{summary['total']} AI rewrites ({summary['success_rate']:.0%})")
        if summary['failed'] > 0:
            logger.info(f"{summary['failed']} bullets used fallback (template/append)")
        
        return rewritten
