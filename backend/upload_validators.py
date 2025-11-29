"""
Upload Validation Helpers

Helper functions for validating file uploads with memory checks and duplicate detection.
"""

import os
import logging
from typing import Tuple, Optional

try:
    from backend.utils.memory_utils import can_process_file, get_memory_stats
    from backend.utils.duplicate_detection import calculate_file_hash
except ModuleNotFoundError:
    from utils.memory_utils import can_process_file, get_memory_stats
    from utils.duplicate_detection import calculate_file_hash

logger = logging.getLogger(__name__)

# Constants
MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def validate_file_upload(file_path: str, original_size: int) -> Tuple[bool, Optional[str]]:
    """
    Validate uploaded file for size and memory requirements.
    
    Args:
        file_path: Path to uploaded file
        original_size: File size in bytes
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check file size
    if original_size > MAX_FILE_SIZE_BYTES:
        size_mb = original_size / (1024 ** 2)
        return False, f"File too large: {size_mb:.1f}MB (max {MAX_FILE_SIZE_MB}MB)"
    
    # Check memory availability
    if not can_process_file(file_path, safety_margin_mb=100):
        mem_stats = get_memory_stats()
        return False, f"Insufficient memory: {mem_stats.available_mb:.1f}MB available"
    
    return True, None


def log_upload_stats(file_path: str, filename: str):
    """Log upload statistics for monitoring."""
    file_size = os.path.getsize(file_path)
    file_hash = calculate_file_hash(file_path)
    mem_stats = get_memory_stats()
    
    logger.info(f"📄 Upload: {filename}")
    logger.info(f"   Size: {file_size / (1024**2):.2f}MB")
    logger.info(f"   Hash: {file_hash[:12]}...")
    logger.info(f"   Memory: {mem_stats.available_mb:.1f}MB available ({mem_stats.percent_used:.1f}% used)")
    
    return file_hash
