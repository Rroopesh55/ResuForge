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
from typing import Dict, List, Any
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JDAgent:
    """
    Agent responsible for analyzing job descriptions and extracting key information.
    
    Uses Ollama's local LLM to parse unstructured job description text into
    structured data that can be used for resume optimization.
    """
    
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
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            logger.debug(f"Raw LLM response: {content[:200]}...")
            # Return empty structure on JSON parse failure
            return {
                "skills": [],
                "experience_years": None,
                "keywords": [],
                "summary": "Error: Could not parse JD analysis"
            }
        except Exception as e:
            logger.error(f"Error analyzing JD: {type(e).__name__}: {e}")
            # Fallback on any other error
            return {
                "skills": [],
                "experience_years": None,
                "keywords": [],
                "summary": "Error analyzing JD"
            }

