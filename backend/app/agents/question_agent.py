from typing import Optional
from app.core.llm_client import LLMClient
from app.core.logging import get_logger
from app.models.schemas import QuestionBankResponse, ResumeAnalysisResponse

logger = get_logger(__name__)

class QuestionAgent:
    SYSTEM_PROMPT = """
    You are a Staff-level technical interviewer. 
    Based on the resume analysis and the core requirements of the Job Description, 
    generate an interview question bank consisting of exactly 1 highly targeted question focusing on the candidate's claims.
    
    Tier 1: Basic knowledge / foundations
    Tier 2: Applied scenario / problem solving
    Tier 3: Complex system design / deep expertise
    
    (Generate exactly one SINGLE question in total, choosing the most appropriate tier based on their experience).
    
    Output strictly in the following JSON format:
    {
      "questions": [
        {
          "category": "Backend System Design",
          "tier": 3,
          "question_text": "...",
          "expected_signals": ["...", "..."]
        }
      ]
    }
    """

    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    async def generate(self, resume_analysis: ResumeAnalysisResponse, jd_text: str) -> Optional[QuestionBankResponse]:
        """
        Generates a 1-question interview bank.
        """
        logger.info("QuestionAgent generating interview questions...")
        
        user_prompt = (
            f"Resume Analysis:\n{resume_analysis.model_dump_json(indent=2)}\n\n"
            f"Job Description Core:\n{jd_text}\n\n"
            "Build robust questions addressing the strengths and probing the red flags."
        )
        
        json_response = await self.llm_client.generate_json(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3
        )
        
        if not json_response:
            logger.error("QuestionAgent failed to generate questions.")
            return None
            
        try:
            return QuestionBankResponse(**json_response)
        except Exception as e:
            logger.error(f"Failed to validate QuestionBankResponse: {str(e)}")
            return None
