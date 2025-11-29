"""
Backend Utils Package

Utility modules for handling edge cases, encoding, timeouts, and more.
"""

# Encoding
from .encoding_utils import (
    safe_encode_text,
    strip_control_characters,
    normalize_whitespace,
    detect_encoding,
    sanitize_for_xml,
    handle_rtl_text
)

# Timeouts
from .timeout_utils import (
    TimeoutError,
    timeout,
    async_timeout,
    with_retry,
    TimeoutContext,
    safe_timeout_call
)

# Partial Failures
from .partial_failure import (
    OperationResult,
    PartialFailureHandler,
    batch_rewrite_with_fallback,
    validate_batch_results
)

# Memory Management
from .memory_utils import (
    MemoryStats,
    get_memory_stats,
    check_memory_available,
    estimate_file_memory,
    can_process_file,
    chunk_list,
    stream_file_lines,
    MemoryMonitor,
    memory_safe_operation
)

# Duplicate Detection
from .duplicate_detection import (
    calculate_file_hash,
    calculate_content_hash,
    check_duplicate_file,
    calculate_text_similarity,
    find_similar_resumes,
    DuplicateDetector
)

__version__ = "1.0.0"

__all__ = [
    # Encoding
    'safe_encode_text',
    'strip_control_characters',
    'normalize_whitespace',
    'detect_encoding',
    'sanitize_for_xml',
    'handle_rtl_text',
    
    # Timeouts
    'TimeoutError',
    'timeout',
    'async_timeout',
    'with_retry',
    'TimeoutContext',
    'safe_timeout_call',
    
    # Partial Failures
    'OperationResult',
    'PartialFailureHandler',
    'batch_rewrite_with_fallback',
    'validate_batch_results',
    
    # Memory
    'MemoryStats',
    'get_memory_stats',
    'check_memory_available',
    'estimate_file_memory',
    'can_process_file',
    'chunk_list',
    'stream_file_lines',
    'MemoryMonitor',
    'memory_safe_operation',
    
    # Duplicates
    'calculate_file_hash',
    'calculate_content_hash',
    'check_duplicate_file',
    'calculate_text_similarity',
    'find_similar_resumes',
    'DuplicateDetector'
]
