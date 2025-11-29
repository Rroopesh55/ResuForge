# Utils Package

Utility modules for robust error handling and edge case management.

## Modules

- **encoding_utils**: International character support, encoding detection
- **timeout_utils**: Timeout management for slow operations (LLM calls)
- **partial_failure**: Graceful handling of batch operation failures
- **memory_utils**: Memory monitoring and large file handling
- **duplicate_detection**: File hash-based duplicate detection

## Installation

```bash
pip install psutil chardet
```

## Usage Examples

### Encoding Support

```python
from utils.encoding_utils import safe_encode_text, normalize_whitespace

# Handle international characters
text = safe_encode_text("中文简历 Resume عربي")

# Clean whitespace
clean = normalize_whitespace(text)
```

### Timeout Management

```python
from utils.timeout_utils import timeout, with_retry

@timeout(30)  # 30 second limit
def slow_llm_call():
    return llm.generate(...)

@with_retry(max_attempts=3, timeout_seconds=10)
def unstable_operation():
    ...
```

### Partial Failures

```python
from utils.partial_failure import PartialFailureHandler

handler = PartialFailureHandler()
results = handler.process_batch(bullets, rewrite_func, fallback=lambda x: x)
summary = handler.get_summary()
# {"total": 10, "successful": 8, "failed": 2, "success_rate": 0.8}
```

### Memory Management

```python
from utils.memory_utils import MemoryMonitor, can_process_file

if can_process_file("large_resume.pdf"):
    with MemoryMonitor("parse_pdf") as monitor:
        parse_pdf(...)
    print(f"Used {monitor.memory_used_mb}MB")
```

### Duplicate Detection

```python
from utils.duplicate_detection import DuplicateDetector

detector = DuplicateDetector(db_session)
if detector.is_duplicate(file_path, user_id):
    print("Already uploaded!")
```

## Medium Priority Edge Cases - IMPLEMENTED ✅

1. ✅ **Encoding issues** - Full UTF-8/international support
2. ✅ **Timeout handling** - Decorators with retry logic
3. ✅ **Partial failures** - Batch processing with graceful degradation
4. ✅ **Memory management** - Monitoring and limits
5. ✅ **Duplicate detection** - File hash comparison
