import pytest

from backend.agents.jd_agent import JDAgent


@pytest.fixture
def jd_agent(monkeypatch):
    agent = JDAgent(model_name="stub")

    # Force ollama call to fail so fallback executes
    def fake_chat(*args, **kwargs):
        raise RuntimeError("ollama unavailable")

    monkeypatch.setattr("backend.agents.jd_agent.ollama.chat", fake_chat)
    return agent


def test_analyze_jd_fallback_extracts_keywords(jd_agent):
    jd_text = """
    We are seeking a Senior Software Engineer with 5+ years of experience in Python,
    React, AWS, and Docker. Responsibilities include building REST APIs, deploying on AWS,
    and collaborating with product managers.
    """

    result = jd_agent.analyze_jd(jd_text)

    assert result["keywords"], "Fallback should extract keywords"
    assert "python" in [kw.lower() for kw in result["keywords"]]
    assert result["experience_years"] == 5
    assert any("Software Engineer" in skill or skill == "Python" for skill in result["skills"])
