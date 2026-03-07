from typing import Optional
from app.core.llm_client import LLMClient
from app.core.logging import get_logger
from app.models.schemas import ResumeAnalysisResponse

logger = get_logger(__name__)

class ResumeAgent:
    SYSTEM_PROMPT = """
    You are an expert technical recruiter and specialized engineering manager.
    Your task is to analyze a candidate's resume against a Job Description.
    
    Output strictly in the following JSON format matching this schema:
    {
      "overall_fit_score": <int 0-100>,
      "key_strengths": ["...", "..."],
      "red_flags": ["...", "..."],
      "skills": [
         {
            "skill_name": "Python",
            "proficiency_level": "Expert",
            "evidence": "..."
         }
      ]
    }
    """

    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    async def analyze(self, resume_text: str, jd_text: str) -> Optional[ResumeAnalysisResponse]:
        """
        Analyzes the resume text and compares it against the job description text.
        """
        logger.info("ResumeAgent started analyzing the candidate...")
        user_prompt = f"Resume:\n{resume_text}\n\nJob Description:\n{jd_text}"
        
        json_response = await self.llm_client.generate_json(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt
        )
        
        if not json_response:
            logger.error("ResumeAgent failed to get a valid JSON response.")
            return None
            
        try:
            return ResumeAnalysisResponse(**json_response)
        except Exception as e:
            logger.error(f"Failed to validate internal ResumeAnalysisResponse: {str(e)}")
            return None
