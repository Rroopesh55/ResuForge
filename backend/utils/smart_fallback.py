"""
Smart Fallback Strategies for Resume Bullet Rewriting

Provides cascading fallback mechanisms when AI rewriting fails.
Ensures users always get improved bullets, even if full AI rewrite isn't possible.
"""

import logging
from typing import List, Tuple
import re

logger = logging.getLogger(__name__)


def template_based_rewrite(bullet: str, keywords: List[str], max_length: int) -> str:
    """
    Template-based keyword injection when AI fails.
    
    Uses simple rules to incorporate keywords into the original bullet.
    Better than returning the original unchanged.
    
    Args:
        bullet: Original bullet text
        keywords: Keywords to incorporate
        max_length: Character limit
        
    Returns:
        Enhanced bullet with keywords
    """
    if not bullet.strip():
        return bullet
    
    # Extract action verb (first word)
    words = bullet.split()
    action_verb = words[0] if words else ""
    rest_of_bullet = ' '.join(words[1:]) if len(words) > 1 else ""
    
    # Select keywords that fit
    selected_keywords = []
    current_length = len(bullet)
    
    for kw in keywords:
        # Estimate added length (with "using X, " or similar)
        added_length = len(kw) + 8  # "using X, "
        if current_length + added_length < max_length:
            selected_keywords.append(kw)
            current_length += added_length
    
    if not selected_keywords:
        return bullet  # No keywords fit
    
    # Build enhanced bullet
    keywords_part = ", ".join(selected_keywords)
    
    # Choose template based on original structure
    if rest_of_bullet:
        enhanced = f"{action_verb} {rest_of_bullet} using {keywords_part}"
    else:
        enhanced = f"{action_verb} with {keywords_part}"
    
    # Ensure it fits
    if len(enhanced) > max_length:
        enhanced = enhanced[:max_length].rsplit(' ', 1)[0]
    
    logger.info(f"Template rewrite: {len(selected_keywords)} keywords injected")
    return enhanced


def simple_keyword_append(bullet: str, keywords: List[str], max_length: int) -> str:
    """
    Append keywords to bullet if space allows.
    
    Simpler than template-based, just adds keywords to end.
    
    Args:
        bullet: Original bullet
        keywords: Keywords to add
        max_length: Character limit
        
    Returns:
        Bullet with keywords appended
    """
    if not bullet.strip():
        return bullet
    
    # Clean bullet (remove trailing period)
    clean_bullet = bullet.rstrip('.').strip()
    
    # See how many keywords fit
    keywords_to_add = []
    current_length = len(clean_bullet)
    
    for kw in keywords:
        test_length = current_length + len(kw) + 3  # ", kw"
        if test_length < max_length - 1:  # Leave room for period
            keywords_to_add.append(kw)
            current_length = test_length
    
    if not keywords_to_add:
        return bullet
    
    # Append keywords
    keywords_str = ", ".join(keywords_to_add)
    enhanced = f"{clean_bullet} ({keywords_str})."
    
    logger.info(f"Simple append: {len(keywords_to_add)} keywords added")
    return enhanced


def extract_keywords_from_bullet(bullet: str) -> List[str]:
    """Extract potential keywords already in bullet (for caching)"""
    # Simple extraction: capitalized words, technical terms
    words = re.findall(r'\b[A-Z][a-za-z]*\b|\b[a-z]+(?:[A-Z][a-z]+)+\b', bullet)
    return list(set(words))


def smart_keyword_selection(all_keywords: List[str], bullet: str, max_count: int = 3) -> List[str]:
    """
    Smartly select which keywords to prioritize.
    
    Prioritizes:
    1. Keywords not already in bullet
    2. Shorter keywords (fit easier)
    3. More "technical" keywords
    """
    existing = set(extract_keywords_from_bullet(bullet))
    
    # Filter out keywords already in bullet
    new_keywords = [kw for kw in all_keywords if kw.lower() not in {e.lower() for e in existing}]
    
    if not new_keywords:
        # All keywords already present
        return all_keywords[:max_count]
    
    # Sort by length (shorter first for space efficiency)
    new_keywords.sort(key=len)
    
    return new_keywords[:max_count]


def cascading_fallback(
    bullet: str,
    keywords: List[str],
    max_length: int,
    ai_rewrite_func: callable = None
) -> Tuple[str, str]:
    """
    Cascading fallback strategy with multiple levels.
    
    Tries progressively simpler approaches:
    1. Full AI rewrite (if func provided)
    2. AI rewrite with fewer keywords
    3. Template-based keyword injection
    4. Simple keyword append
    5. Original bullet (last resort)
    
    Args:
        bullet: Original bullet text
        keywords: All available keywords
        max_length: Character limit
        ai_rewrite_func: Optional AI rewrite function
        
    Returns:
        Tuple of (rewritten_bullet, strategy_used)
    """
    logger.info(f"Starting cascading fallback for: {bullet[:40]}...")
    
    # Level 1: Try full AI rewrite with all keywords
    if ai_rewrite_func and keywords:
        try:
            result = ai_rewrite_func(bullet, keywords, max_length)
            if result and result != bullet:
                return result, "ai_full"
        except Exception as e:
            logger.warning(f"Level 1 (AI full) failed: {e}")
    
    # Level 2: Try AI with smartly selected subset of keywords
    if ai_rewrite_func and len(keywords) > 3:
        try:
            smart_keywords = smart_keyword_selection(keywords, bullet, max_count=3)
            result = ai_rewrite_func(bullet, smart_keywords, max_length)
            if result and result != bullet:
                return result, "ai_smart_subset"
        except Exception as e:
            logger.warning(f"Level 2 (AI subset) failed: {e}")
    
    # Level 3: Template-based keyword injection
    try:
        smart_keywords = smart_keyword_selection(keywords, bullet, max_count=3)
        result = template_based_rewrite(bullet, smart_keywords, max_length)
        if result != bullet:
            return result, "template"
    except Exception as e:
        logger.warning(f"Level 3 (template) failed: {e}")
    
    # Level 4: Simple keyword append
    try:
        smart_keywords = smart_keyword_selection(keywords, bullet, max_count=2)
        result = simple_keyword_append(bullet, smart_keywords, max_length)
        if result != bullet:
            return result, "append"
    except Exception as e:
        logger.warning(f"Level 4 (append) failed: {e}")
    
    # Level 5: Return original (last resort)
    logger.warning("All fallback strategies failed, returning original")
    return bullet, "original"


# Export all functions
__all__ = [
    'template_based_rewrite',
    'simple_keyword_append',
    'smart_keyword_selection',
    'cascading_fallback'
]
