"""
Memory Management Utilities

Handles large documents and prevents memory overflow.
Implements streaming, chunking, and memory monitoring.
"""

import logging
import os
import psutil
from typing import Iterator, List, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class MemoryStats:
    """Memory usage statistics"""
    total_mb: float
    available_mb: float
    used_mb: float
    percent_used: float


def get_memory_stats() -> MemoryStats:
    """
    Get current system memory statistics.
    
    Returns:
        MemoryStats object
    """
    try:
        mem = psutil.virtual_memory()
        return MemoryStats(
            total_mb=mem.total / (1024 ** 2),
            available_mb=mem.available / (1024 ** 2),
            used_mb=mem.used / (1024 ** 2),
            percent_used=mem.percent
        )
    except Exception as e:
        logger.error(f"Failed to get memory stats: {e}")
        return MemoryStats(0, 0, 0, 0)


def check_memory_available(required_mb: float = 100) -> bool:
    """
    Check if sufficient memory is available.
    
    Args:
        required_mb (float): Required MB of free memory
        
    Returns:
        bool: True if enough memory available
    """
    stats = get_memory_stats()
    available = stats.available_mb > required_mb
    
    if not available:
        logger.warning(
            f"Insufficient memory: {stats.available_mb:.1f}MB available, "
            f"{required_mb:.1f}MB required"
        )
    
    return available


def estimate_file_memory(file_path: str, multiplier: float = 3.0) -> float:
    """
    Estimate memory required to process a file.
    
    Rule of thumb: File size * 3 (for parsing, processing, output)
    
    Args:
        file_path (str): Path to file
        multiplier (float): Memory multiplier
        
    Returns:
        float: Estimated MB required
    """
    try:
        file_size_bytes = os.path.getsize(file_path)
        file_size_mb = file_size_bytes / (1024 ** 2)
        estimated_mb = file_size_mb * multiplier
        
        logger.info(f"File: {file_size_mb:.1f}MB, Estimated memory: {estimated_mb:.1f}MB")
        return estimated_mb
    except Exception as e:
        logger.error(f"Failed to estimate memory for {file_path}: {e}")
        return 0


def can_process_file(file_path: str, safety_margin_mb: float = 200) -> bool:
    """
    Check if file can be safely processed given current memory.
    
    Args:
        file_path (str): Path to file
        safety_margin_mb (float): Extra safety margin
        
    Returns:
        bool: True if safe to process
    """
    estimated = estimate_file_memory(file_path)
    required = estimated + safety_margin_mb
    
    stats = get_memory_stats()
    can_process = stats.available_mb > required
    
    if not can_process:
        logger.error(
            f"Cannot process file: requires {required:.1f}MB, "
            f"only {stats.available_mb:.1f}MB available"
        )
    
    return can_process


def chunk_list(items: List[Any], chunk_size: int = 100) -> Iterator[List[Any]]:
    """
    Split list into chunks to process in batches.
    
    Useful for processing 1000s of bullets without loading all at once.
    
    Args:
        items (List): Items to chunk
        chunk_size (int): Items per chunk
        
    Yields:
        List of items (chunk)
    """
    for i in range(0, len(items), chunk_size):
        yield items[i:i + chunk_size]


def stream_file_lines(file_path: str, encoding: str = 'utf-8') -> Iterator[str]:
    """
    Stream file line-by-line without loading entire file.
    
    Memory-efficient for large files.
    
    Args:
        file_path (str): Path to file
        encoding (str): File encoding
        
    Yields:
        str: Each line
    """
    try:
        with open(file_path, 'r', encoding=encoding, errors='ignore') as f:
            for line in f:
                yield line.rstrip('\n\r')
    except Exception as e:
        logger.error(f"Error streaming file {file_path}: {e}")


class MemoryMonitor:
    """
    Context manager to monitor memory usage during operation.
    
    Usage:
        with MemoryMonitor("parse_large_pdf") as monitor:
            parse_pdf(large_file)
        print(f"Memory used: {monitor.memory_used_mb}MB")
    """
    
    def __init__(self, operation_name: str, warn_threshold_mb: float = 500):
        self.operation_name = operation_name
        self.warn_threshold_mb = warn_threshold_mb
        self.start_stats: Optional[MemoryStats] = None
        self.end_stats: Optional[MemoryStats] = None
        self.memory_used_mb: float = 0
    
    def __enter__(self):
        self.start_stats = get_memory_stats()
        logger.info(
            f"Starting {self.operation_name} - "
            f"Memory: {self.start_stats.used_mb:.1f}MB used, "
            f"{self.start_stats.available_mb:.1f}MB available"
        )
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_stats = get_memory_stats()
        self.memory_used_mb = self.end_stats.used_mb - self.start_stats.used_mb
        
        logger.info(
            f"Completed {self.operation_name} - "
            f"Memory change: {self.memory_used_mb:+.1f}MB"
        )
        
        if self.memory_used_mb > self.warn_threshold_mb:
            logger.warning(
                f"{self.operation_name} used {self.memory_used_mb:.1f}MB "
                f"(threshold: {self.warn_threshold_mb}MB)"
            )
        
        return False


def memory_safe_operation(
    operation: callable,
    required_mb: float,
    *args,
    **kwargs
) -> Any:
    """
    Execute operation only if sufficient memory available.
    
    Args:
        operation (callable): Function to execute
        required_mb (float): Required free memory
        *args, **kwargs: Arguments for operation
        
    Returns:
        Operation result or None if insufficient memory
    """
    if not check_memory_available(required_mb):
        logger.error(f"Skipping {operation.__name__} - insufficient memory")
        return None
    
    with MemoryMonitor(operation.__name__):
        return operation(*args, **kwargs)


# Export
__all__ = [
    'MemoryStats',
    'get_memory_stats',
    'check_memory_available',
    'estimate_file_memory',
    'can_process_file',
    'chunk_list',
    'stream_file_lines',
    'MemoryMonitor',
    'memory_safe_operation'
]
