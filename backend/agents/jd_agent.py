"""
Job Description Intelligence Agent

This module provides the JDAgent class which analyzes job descriptions using a local LLM
(via Ollama) to extract structured information including skills, keywords, experience
requirements, and role summaries.

The extracted data is used to optimize resumes for ATS (Applicant Tracking Systems) and
improve keyword matching.

Author: ResuForge Team
Date: 2024
"""

import ollama
from typing import Dict, List, Any, Optional
import json
import logging
import re
from collections import Counter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JDAgent:
    """
    Agent responsible for analyzing job descriptions and extracting key information.
    
    Uses Ollama's local LLM to parse unstructured job description text into
    structured data that can be used for resume optimization.
    """
    
    STOPWORDS = {
        "the", "and", "for", "with", "that", "this", "will", "you", "are",
        "our", "your", "have", "has", "from", "who", "they", "their", "his",
        "her", "she", "him", "its", "but", "not", "all", "any", "per",
        "into", "about", "across", "within", "able", "must", "should",
        "experience", "years", "team", "work", "working", "skills", "job",
        "responsibilities", "ability", "including", "such", "role", "project",
    }

    KNOWN_SKILLS = [
        "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust",
        "sql", "nosql", "aws", "azure", "gcp", "react", "vue", "angular", "node",
        "docker", "kubernetes", "terraform", "ci/cd", "rest", "graphql",
        "machine learning", "data analysis", "excel", "salesforce", "figma",
        "adobe", "power bi", "pandas", "numpy", "tensorflow", "pytorch",
        "spark", "hadoop", "linux", "git", "jira", "confluence",
    ]

    def __init__(self, model_name: str = "llama3"):
        """
        Initialize the JD Intelligence Agent.
        
        Args:
            model_name (str): Name of the Ollama model to use. Default is "llama3".
                             Other options: "qwen", "mistral", etc.
        """
        self.model_name = model_name
        logger.info(f"JDAgent initialized with model: {model_name}")

    def analyze_jd(self, jd_text: str) -> Dict[str, Any]:
        """
        Analyzes a Job Description using a local LLM to extract keywords and requirements.
        
        The analysis extracts:
        - Skills required for the role
        - Years of experience needed
        - Important keywords for ATS optimization
        - Brief summary of the position
        
        Args:
            jd_text (str): The full text of the job description
            
        Returns:
            Dict[str, Any]: Structured analysis containing:
                - skills (List[str]): Required skills
                - experience_years (int | None): Years of experience required
                - keywords (List[str]): Important keywords for ATS
                - summary (str): Brief role summary
                
        Example:
            >>> agent = JDAgent()
            >>> result = agent.analyze_jd("Software Engineer role requiring Python...")
            >>> print(result['skills'])
            ['Python', 'AWS', 'Docker']
            
        Note:
            This method makes a network call to Ollama. Ensure Ollama is running
            with the specified model: `ollama serve`
        """
        logger.info(f"Analyzing job description (length: {len(jd_text)} chars)")
        
        # Construct prompt for LLM
        prompt = f"""
        Analyze the following Job Description and extract the key information in JSON format.
        Return ONLY the JSON object, no other text.
        
        Structure:
        {{
            "skills": ["skill1", "skill2"],
            "experience_years": "integer or null",
            "keywords": ["keyword1", "keyword2"],
            "summary": "brief summary of the role"
        }}

        Job Description:
        {jd_text}
        """

        try:
            logger.debug(f"Calling Ollama model: {self.model_name}")
            
            # Call Ollama API
            response = ollama.chat(model=self.model_name, messages=[
                {'role': 'user', 'content': prompt},
            ])
            
            content = response['message']['content']
            logger.debug(f"Received response from Ollama (length: {len(content)} chars)")
            
            # Clean up markdown code blocks that LLM might add
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
                logger.debug("Stripped JSON markdown wrapper")
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
                logger.debug("Stripped generic markdown wrapper")
            
            # Parse JSON response
            result = json.loads(content.strip())
            
            # Log extracted information
            logger.info(f"Successfully analyzed JD - Found {len(result.get('skills', []))} skills, "
                       f"{len(result.get('keywords', []))} keywords")
            
            if not result.get("keywords"):
                logger.info("LLM returned no keywords, using heuristic fallback")
                return self._fallback_analysis(jd_text, seed=result)

            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            logger.debug(f"Raw LLM response: {content[:200]}...")
            return self._fallback_analysis(jd_text)
        except Exception as e:
            logger.error(f"Error analyzing JD: {type(e).__name__}: {e}")
            return self._fallback_analysis(jd_text)

    def _fallback_analysis(self, jd_text: str, seed: Dict[str, Any] | None = None) -> Dict[str, Any]:
        """
        Simple heuristic-based analysis when the LLM is unavailable.
        """
        logger.info("Running heuristic fallback JD analysis")
        normalized = jd_text.lower()

        keywords = self._extract_keywords(normalized, max_keywords=12)
        skills = self._extract_skills(normalized)
        summary = self._summarize(jd_text)

        result = {
            "skills": skills,
            "experience_years": self._extract_experience_years(normalized),
            "keywords": keywords,
            "summary": summary,
        }

        if seed:
            result.setdefault("skills", seed.get("skills") or skills)
            result.setdefault("summary", seed.get("summary") or summary)
            if not result.get("keywords"):
                result["keywords"] = keywords
        return result

    def _extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        tokens = re.findall(r"[a-z0-9+#/.]+", text)
        filtered = [token for token in tokens if token not in self.STOPWORDS and len(token) > 2]
        freq = Counter(filtered)
        return [word for word, _ in freq.most_common(max_keywords)]

    def _extract_skills(self, text: str) -> List[str]:
        found = []
        for skill in self.KNOWN_SKILLS:
            if skill in text:
                found.append(skill.title())
        return found

    def _extract_experience_years(self, text: str) -> Optional[int]:
        match = re.search(r"(\d+)\+?\s+years?", text)
        if match:
            try:
                return int(match.group(1))
            except ValueError:
                return None
        return None

    def _summarize(self, text: str, max_sentences: int = 2) -> str:
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        summary_sentences = sentences[:max_sentences]
        return " ".join(summary_sentences) if summary_sentences else text[:200]

