"""
Timeout Management Utilities

Prevents the application from hanging on slow operations (LLM calls, file processing).
Implements configurable timeouts with graceful fallbacks.
"""

import logging
import asyncio
from functools import wraps
from typing import Callable, Any, Optional
import signal

logger = logging.getLogger(__name__)


class TimeoutError(Exception):
    """Raised when operation exceeds timeout"""
    pass


def timeout(seconds: int = 30):
    """
    Decorator to add timeout to synchronous functions.
    
    Args:
        seconds (int): Maximum seconds to wait
        
    Usage:
        @timeout(10)
        def slow_function():
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            def timeout_handler(signum, frame):
                raise TimeoutError(f"{func.__name__} exceeded {seconds}s timeout")
            
            # Set timeout alarm (Unix/Linux only)
            try:
                old_handler = signal.signal(signal.SIGALRM, timeout_handler)
                signal.alarm(seconds)
                try:
                    result = func(*args, **kwargs)
                finally:
                    signal.alarm(0)
                    signal.signal(signal.SIGALRM, old_handler)
                return result
            except AttributeError:
                # Windows doesn't support SIGALRM
                logger.warning(f"Timeout not supported on this platform for {func.__name__}")
                return func(*args, **kwargs)
        
        return wrapper
    return decorator


async def async_timeout(seconds: int, coro):
    """
    Add timeout to async coroutine.
    
    Args:
        seconds (int): Timeout in seconds
        coro: Coroutine to execute
        
    Returns:
        Result of coroutine or raises TimeoutError
    """
    try:
        return await asyncio.wait_for(coro, timeout=seconds)
    except asyncio.TimeoutError:
        logger.error(f"Async operation timed out after {seconds}s")
        raise TimeoutError(f"Operation timed out after {seconds}s")


def with_retry(max_attempts: int = 3, timeout_seconds: int = 30):
    """
    Decorator that retries function on timeout.
    
    Args:
        max_attempts (int): Maximum retry attempts
        timeout_seconds (int): Timeout per attempt
        
    Usage:
        @with_retry(max_attempts=3, timeout_seconds=10)
        def unstable_llm_call():
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_error = None
            
            for attempt in range(1, max_attempts + 1):
                try:
                    logger.info(f"Attempt {attempt}/{max_attempts} for {func.__name__}")
                    
                    @timeout(timeout_seconds)
                    def timed_call():
                        return func(*args, **kwargs)
                    
                    return timed_call()
                    
                except TimeoutError as e:
                    last_error = e
                    logger.warning(f"Timeout on attempt {attempt}: {e}")
                    if attempt < max_attempts:
                        logger.info(f"Retrying (attempt {attempt + 1}/{max_attempts})...")
                except Exception as e:
                    logger.error(f"Non-timeout error: {e}")
                    raise
            
            # All attempts failed
            logger.error(f"All {max_attempts} attempts failed for {func.__name__}")
            raise last_error
        
        return wrapper
    return decorator


class TimeoutContext:
    """
    Context manager for timeout operations.
    
    Usage:
        with TimeoutContext(10) as ctx:
            slow_operation()
    """
    
    def __init__(self, seconds: int):
        self.seconds = seconds
        self.timed_out = False
    
    def __enter__(self):
        def timeout_handler(signum, frame):
            self.timed_out = True
            raise TimeoutError(f"Operation exceeded {self.seconds}s")
        
        try:
            self.old_handler = signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(self.seconds)
        except AttributeError:
            logger.warning("Timeout context not supported on this platform")
        
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            signal.alarm(0)
            signal.signal(signal.SIGALRM, self.old_handler)
        except AttributeError:
            pass
        
        if self.timed_out:
            logger.error(f"Timeout occurred ({self.seconds}s)")
        
        return False  # Don't suppress exceptions


def safe_timeout_call(func: Callable, timeout_seconds: int = 30, 
                     fallback_value: Any = None) -> Any:
    """
    Call function with timeout, return fallback on timeout.
    
    Args:
        func (Callable): Function to call
        timeout_seconds (int): Timeout limit
        fallback_value (Any): Value to return on timeout
        
    Returns:
        Function result or fallback_value
    """
    try:
        @timeout(timeout_seconds)
        def timed_call():
            return func()
        
        return timed_call()
    except TimeoutError:
        logger.warning(f"{func.__name__} timed out, using fallback")
        return fallback_value
    except Exception as e:
        logger.error(f"Error in {func.__name__}: {e}")
        return fallback_value


# Export all
__all__ = [
    'TimeoutError',
    'timeout',
    'async_timeout',
    'with_retry',
    'TimeoutContext',
    'safe_timeout_call'
]
