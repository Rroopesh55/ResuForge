"""
Encoding Support Utilities

Handles international characters, special characters, and various text encodings
to ensure the application works globally.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def safe_encode_text(text: str) -> str:
    """
    Safely encode text handling various character sets.
    
    Supports: UTF-8, Chinese (中文), Arabic (العربية), Cyrillic (Русский),
    Emoji (😀), and special characters.
    
    Args:
        text (str): Input text with potentially problematic characters
        
    Returns:
        str: Safely encoded text
    """
    try:
        # Try UTF-8 encoding/decoding to verify
        text.encode('utf-8').decode('utf-8')
        return text
    except UnicodeEncodeError as e:
        logger.warning(f"Encoding error, attempting to fix: {e}")
        # Replace problematic characters
        return text.encode('utf-8', errors='replace').decode('utf-8')
    except Exception as e:
        logger.error(f"Unexpected encoding error: {e}")
        return text


def strip_control_characters(text: str) -> str:
    """
    Remove control characters that might break parsers.
    
    Removes: \\x00-\\x1F except \\n, \\r, \\t
    
    Args:
        text (str): Input text
        
    Returns:
        str: Cleaned text
    """
    import string
    
    # Keep newline, carriage return, tab
    allowed = set(['\n', '\r', '\t'])
    printable = set(string.printable)
    
    cleaned = ''.join(
        char for char in text 
        if char in printable or char in allowed or ord(char) >= 32
    )
    
    if cleaned != text:
        logger.debug(f"Stripped {len(text) - len(cleaned)} control characters")
    
    return cleaned


def normalize_whitespace(text: str) -> str:
    """
    Normalize various whitespace characters.
    
    Converts: non-breaking spaces, multiple spaces, tabs, etc.
    
    Args:
        text (str): Input text
        
    Returns:
        str: Normalized text
    """
    import re
    
    # Replace non-breaking spaces
    text = text.replace('\xa0', ' ')
    text = text.replace('\u200b', '')  # Zero-width space
    
    # Normalize multiple spaces
    text = re.sub(r' +', ' ', text)
    
    # Normalize newlines
    text = re.sub(r'\n\n+', '\n\n', text)
    
    return text.strip()


def detect_encoding(file_path: str) -> Optional[str]:
    """
    Detect file encoding for text files.
    
    Args:
        file_path (str): Path to file
        
    Returns:
        Optional[str]: Detected encoding (e.g., 'utf-8', 'latin-1')
    """
    try:
        import chardet
        
        with open(file_path, 'rb') as f:
            raw_data = f.read()
            result = chardet.detect(raw_data)
            encoding = result['encoding']
            confidence = result['confidence']
            
            logger.info(f"Detected encoding: {encoding} (confidence: {confidence})")
            return encoding if confidence > 0.7 else 'utf-8'
    except ImportError:
        logger.warning("chardet not installed, defaulting to UTF-8")
        return 'utf-8'
    except Exception as e:
        logger.error(f"Encoding detection failed: {e}")
        return 'utf-8'


def sanitize_for_xml(text: str) -> str:
    """
    Sanitize text for XML/DOCX compatibility.
    
    DOCX files use XML internally, so certain characters must be escaped.
    
    Args:
        text (str): Input text
        
    Returns:
        str: XML-safe text
    """
    import html
    
    # Escape XML special characters
    text = html.escape(text, quote=False)
    
    # Remove characters invalid in XML 1.0
    invalid_xml_chars = [
        (0x00, 0x08), (0x0B, 0x0C), (0x0E, 0x1F),
        (0x7F, 0x84), (0x86, 0x9F),
        (0xFDD0, 0xFDDF), (0xFFFE, 0xFFFF)
    ]
    
    for start, end in invalid_xml_chars:
        for char_code in range(start, end + 1):
            text = text.replace(chr(char_code), '')
    
    return text


def handle_rtl_text(text: str) -> str:
    """
    Handle right-to-left text (Arabic, Hebrew).
    
    Args:
        text (str): Text that might contain RTL
        
    Returns:
        str: Properly handled text
    """
    # Python's built-in Unicode support handles RTL
    # Just ensure proper encoding
    return safe_encode_text(text)


# Export all functions
__all__ = [
    'safe_encode_text',
    'strip_control_characters',
    'normalize_whitespace',
    'detect_encoding',
    'sanitize_for_xml',
    'handle_rtl_text'
]
