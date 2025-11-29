import math
import pytest

from backend.utils import encoding_utils, timeout_utils, smart_fallback


def test_safe_encode_handles_control_characters():
    raw_text = "Hello\u0000World\u2028with odd chars"
    encoded = encoding_utils.safe_encode_text(raw_text)
    cleaned = encoding_utils.strip_control_characters(encoded)
    assert "Hello" in cleaned and "World" in cleaned
    assert "\u0000" not in cleaned


def test_detect_encoding_defaults_utf8(tmp_path: pytest.TempPathFactory):
    sample = "Résumé – 数据".encode("utf-8")
    path = tmp_path.mktemp("enc") / "resume.txt"
    path.write_bytes(sample)
    detected = encoding_utils.detect_encoding(str(path))
    assert detected in ("utf-8", "UTF-8")


def test_timeout_decorator_times_out(monkeypatch):
    calls = {"count": 0}

    @timeout_utils.timeout(seconds=1)
    def slow_call():
        calls["count"] += 1
        # Busy wait to trigger timeout
        while True:
            pass

    with pytest.raises(timeout_utils.TimeoutError):
        slow_call()
    assert calls["count"] == 1


def test_safe_timeout_call_returns_fallback(monkeypatch):
    def slow():
        while True:
            pass

    result = timeout_utils.safe_timeout_call(slow, timeout_seconds=1, fallback_value="fallback")
    assert result == "fallback"


def test_cascading_fallback_template_path(monkeypatch):
    bullet = "Improved latency"
    keywords = ["Python", "AWS", "Kubernetes"]

    def failing_ai(*args, **kwargs):
        raise RuntimeError("LLM down")

    rewritten, strategy = smart_fallback.cascading_fallback(
        bullet,
        keywords,
        max_length=120,
        ai_rewrite_func=failing_ai,
    )
    assert rewritten != bullet
    assert strategy in {"template", "append", "ai_smart_subset"}


def test_simple_keyword_append_respects_length():
    bullet = "Optimized ETL pipelines."
    keywords = ["Python", "Spark", "AWS Glue", "PostgreSQL"]
    result = smart_fallback.simple_keyword_append(bullet, keywords, max_length=60)
    assert result.endswith(").")
    assert len(result) <= 60

