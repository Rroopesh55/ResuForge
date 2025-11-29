"""
Duplicate Detection Utilities

Detects duplicate resume uploads and prevents redundant processing.
Uses file hashing and content similarity.
"""

import logging
import hashlib
from typing import Optional, List, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def calculate_file_hash(file_path: str, algorithm: str = 'sha256') -> str:
    """
    Calculate cryptographic hash of file.
    
    Args:
        file_path (str): Path to file
        algorithm (str): Hash algorithm (sha256, md5)
        
    Returns:
        str: Hex digest of file hash
    """
    hash_func = hashlib.new(algorithm)
    
    try:
        with open(file_path, 'rb') as f:
            # Read in chunks to handle large files
            for chunk in iter(lambda: f.read(8192), b''):
                hash_func.update(chunk)
        
        file_hash = hash_func.hexdigest()
        logger.debug(f"File hash ({algorithm}): {file_hash}")
        return file_hash
    except Exception as e:
        logger.error(f"Failed to hash file {file_path}: {e}")
        return ""


def calculate_content_hash(text: str) -> str:
    """
    Calculate hash of text content.
    
    Useful for detecting if text content is same even if file is different.
    
    Args:
        text (str): Text content
        
    Returns:
        str: SHA256 hash of normalized text
    """
    # Normalize text (remove extra whitespace, lowercase)
    normalized = ' '.join(text.lower().split())
    
    hash_obj = hashlib.sha256(normalized.encode('utf-8'))
    return hash_obj.hexdigest()


def check_duplicate_file(
    db: Session,
    file_hash: str,
    user_id: int,
    time_window_hours: int = 24
) -> Optional[Tuple[int, datetime]]:
    """
    Check if file was recently uploaded by user.
    
    Args:
        db (Session): Database session
        file_hash (str): Hash of file
        user_id (int): User ID
        time_window_hours (int): Look back this many hours
        
    Returns:
        Optional[Tuple[resume_id, upload_time]]: If duplicate found
    """
    try:
        from models import Resume
        from datetime import datetime, timedelta
        
        cutoff_time = datetime.utcnow() - timedelta(hours=time_window_hours)
        
        # Query for matching hash within time window
        duplicate = db.query(Resume).filter(
            Resume.user_id == user_id,
            Resume.file_hash == file_hash,
            Resume.created_at >= cutoff_time
        ).first()
        
        if duplicate:
            logger.warning(
                f"Duplicate detected: Resume ID {duplicate.id} "
                f"uploaded at {duplicate.created_at}"
            )
            return (duplicate.id, duplicate.created_at)
        
        return None
    except Exception as e:
        logger.error(f"Error checking for duplicates: {e}")
        return None


def calculate_text_similarity(text1: str, text2: str) -> float:
    """
    Calculate similarity between two texts.
    
    Uses simple Jaccard similarity on words.
    
    Args:
        text1 (str): First text
        text2 (str): Second text
        
    Returns:
        float: Similarity score (0.0 to 1.0)
    """
    # Tokenize into words
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 and not words2:
        return 1.0  # Both empty
    if not words1 or not words2:
        return 0.0  # One empty
    
    # Jaccard similarity
    intersection = words1 & words2
    union = words1 | words2
    similarity = len(intersection) / len(union)
    
    return similarity


def find_similar_resumes(
    db: Session,
    text: str,
    user_id: int,
    similarity_threshold: float = 0.9,
    limit: int = 5
) -> List[Tuple[int, float]]:
    """
    Find resumes with similar content.
    
    Args:
        db (Session): Database session
        text (str): Resume text to compare
        user_id (int): User ID
        similarity_threshold (float): Minimum similarity (0-1)
        limit (int): Max results
        
    Returns:
        List of (resume_id, similarity_score) tuples
    """
    try:
        from models import Resume
        
        # Get user's recent resumes
        recent_resumes = db.query(Resume).filter(
            Resume.user_id == user_id
        ).order_by(Resume.created_at.desc()).limit(20).all()
        
        similar = []
        
        for resume in recent_resumes:
            # Would need to store/fetch text content
            # For now, just compare based on file hash
            if resume.content_hash:
                # Placeholder: would compare actual text
                pass
        
        return similar[:limit]
    except Exception as e:
        logger.error(f"Error finding similar resumes: {e}")
        return []


class DuplicateDetector:
    """
    Manager for duplicate detection across uploads.
    
    Usage:
        detector = DuplicateDetector(db_session)
        if detector.is_duplicate(file_path, user_id):
            print("This file was already uploaded!")
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def is_duplicate(
        self,
        file_path: str,
        user_id: int,
        check_content: bool = False
    ) -> bool:
        """
        Check if file is a duplicate.
        
        Args:
            file_path (str): Path to file
            user_id (int): User ID
            check_content (bool): Also check content similarity
            
        Returns:
            bool: True if duplicate
        """
        # Check file hash
        file_hash = calculate_file_hash(file_path)
        if not file_hash:
            return False
        
        duplicate = check_duplicate_file(self.db, file_hash, user_id)
        if duplicate:
            logger.info(f"Exact duplicate found: Resume ID {duplicate[0]}")
            return True
        
        # Optional: check content similarity
        if check_content:
            # Would implement content-based checking here
            pass
        
        return False
    
    def get_or_create_resume(
        self,
        file_path: str,
        user_id: int,
        filename: str
    ) -> Tuple[int, bool]:
        """
        Get existing resume or create new one.
        
        Args:
            file_path (str): Path to file
            user_id (int): User ID
            filename (str): Original filename
            
        Returns:
            Tuple[resume_id, is_new]: ID and whether it was newly created
        """
        file_hash = calculate_file_hash(file_path)
        
        duplicate = check_duplicate_file(self.db, file_hash, user_id)
        if duplicate:
            return (duplicate[0], False)  # Existing
        
        # Create new resume
        # (Would call CRUD function here)
        return (0, True)  # Placeholder


# Export
__all__ = [
    'calculate_file_hash',
    'calculate_content_hash',
    'check_duplicate_file',
    'calculate_text_similarity',
    'find_similar_resumes',
    'DuplicateDetector'
]
