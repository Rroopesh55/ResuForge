"""
Partial Failure Handling

Handles scenarios where some operations succeed while others fail,
ensuring graceful degradation and informative error reporting.
"""

import logging
from typing import List, Dict, Any, Callable, Tuple, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class OperationResult:
    """Result of a partial operation"""
    success: bool
    data: Any
    error: Optional[str] = None
    index: Optional[int] = None


class PartialFailureHandler:
    """
    Manages batch operations where some items may fail.
    
    Example usage for bullet rewriting where some bullets might fail:
        handler = PartialFailureHandler()
        results = handler.process_batch(bullets, rewrite_function)
        successful = handler.get_successful(results)
        failed = handler.get_failed(results)
    """
    
    def __init__(self, fail_fast: bool = False):
        """
        Args:
            fail_fast (bool): If True, stop on first failure.
                            If False, continue and collect all errors.
        """
        self.fail_fast = fail_fast
        self.results: List[OperationResult] = []
    
    def process_batch(
        self, 
        items: List[Any], 
        processor: Callable[[Any], Any],
        fallback: Optional[Callable[[Any], Any]] = None
    ) -> List[OperationResult]:
        """
        Process a batch of items, handling partial failures.
        
        Args:
            items: List of items to process
            processor: Function to apply to each item
            fallback: Optional fallback function if processor fails
            
        Returns:
            List of OperationResult objects
        """
        results = []
        
        for i, item in enumerate(items):
            try:
                logger.debug(f"Processing item {i+1}/{len(items)}")
                data = processor(item)
                results.append(OperationResult(
                    success=True,
                    data=data,
                    index=i
                ))
            except Exception as e:
                logger.warning(f"Item {i} failed: {e}")
                
                if self.fail_fast:
                    logger.error("Fail-fast enabled, stopping batch")
                    raise
                
                # Try fallback
                if fallback:
                    try:
                        data = fallback(item)
                        results.append(OperationResult(
                            success=True,
                            data=data,
                            error=f"Used fallback after error: {str(e)}",
                            index=i
                        ))
                        continue
                    except Exception as fallback_error:
                        logger.error(f"Fallback also failed: {fallback_error}")
                
                # Record failure
                results.append(OperationResult(
                    success=False,
                    data=item,  # Return original
                    error=str(e),
                    index=i
                ))
        
        self.results = results
        return results
    
    def get_successful(self, results: List[OperationResult] = None) -> List[Any]:
        """Get all successful results"""
        results = results or self.results
        return [r.data for r in results if r.success]
    
    def get_failed(self, results: List[OperationResult] = None) -> List[Tuple[int, str]]:
        """Get failed items with their errors"""
        results = results or self.results
        return [(r.index, r.error) for r in results if not r.success]
    
    def get_summary(self, results: List[OperationResult] = None) -> Dict[str, Any]:
        """Get summary statistics"""
        results = results or self.results
        total = len(results)
        successful = len([r for r in results if r.success])
        failed = total - successful
        
        return {
            "total": total,
            "successful": successful,
            "failed": failed,
            "success_rate": successful / total if total > 0 else 0,
            "errors": [r.error for r in results if not r.success]
        }


def batch_rewrite_with_fallback(
    bullets: List[str],
    rewrite_func: Callable,
    **kwargs
) -> Tuple[List[str], Dict[str, Any]]:
    """
    Rewrite bullets with fallback to original on failure.
    
    Args:
        bullets: List of bullet points
        rewrite_func: Function that rewrites a bullet
        **kwargs: Additional arguments for rewrite_func
        
    Returns:
        Tuple of (rewritten_bullets, summary_dict)
    """
    handler = PartialFailureHandler(fail_fast=False)
    
    def safe_rewrite(bullet: str) -> str:
        return rewrite_func(bullet, **kwargs)
    
    def fallback(bullet: str) -> str:
        logger.warning(f"Using original bullet as fallback: {bullet[:30]}...")
        return bullet
    
    results = handler.process_batch(bullets, safe_rewrite, fallback=fallback)
    
    return handler.get_successful(results), handler.get_summary(results)


def validate_batch_results(
    results: List[Any],
    validators: List[Callable[[Any], bool]]
) -> List[bool]:
    """
    Validate batch results against multiple validators.
    
    Args:
        results: List of results to validate
        validators: List of validation functions
        
    Returns:
        List of booleans indicating if each result passes all validators
    """
    validation_results = []
    
    for i, result in enumerate(results):
        all_valid = True
        
        for validator in validators:
            try:
                if not validator(result):
                    all_valid = False
                    logger.warning(f"Result {i} failed validation: {validator.__name__}")
                    break
            except Exception as e:
                logger.error(f"Validator {validator.__name__} crashed on result {i}: {e}")
                all_valid = False
                break
        
        validation_results.append(all_valid)
    
    return validation_results


# Export
__all__ = [
    'OperationResult',
    'PartialFailureHandler',
    'batch_rewrite_with_fallback',
    'validate_batch_results'
]
