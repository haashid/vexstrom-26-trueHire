from typing import Optional, List, Dict
from app.core.llm_client import LLMClient
from app.core.logging import get_logger
from app.models.schemas import EvaluateAnswerResponse

logger = get_logger(__name__)

class EvaluatorAgent:
    SYSTEM_PROMPT = """
    You are a rigorous technical interviewer evaluating a candidate's answer in real-time.
    Compare the candidate's active conversational transcript against the original question and their resume claims.
    
    Identify:
    - Depth score (1-10)
    - Knowledge score (0.0 to 1.0 confidence in their fundamentals)
    - Contradictions between the answer and what they claimed on their resume.
    - Likelihood they are bluffing mathematically (0.0 to 1.0).
    - Confidence level of their verbal delivery / logic (0.0 to 1.0).
    - Suggested follow up.
    
    Output strictly in the following JSON format:
    {
      "depth_score": 7,
      "knowledge_score": 0.8,
      "label": "Adequate",
      "contradiction_flag": true/false,
      "contradiction_detail": "If true, explain exactly what contradicts.",
      "bluff_likelihood": 0.2,
      "confidence_level": 0.9,
      "suggested_follow_up": "Can you elaborate on..."
    }
    """

    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    async def evaluate(self, question: str, transcript: List[Dict[str, str]], resume_claims: List[str]) -> Optional[EvaluateAnswerResponse]:
        """
        Evaluates a candidate's running transcript against their resume claims.
        """
        logger.info("EvaluatorAgent evaluating candidate response...")
        
        claims_str = "- " + "\n- ".join(resume_claims) if resume_claims else "None"
        
        # Format the transcript gracefully
        transcript_str = ""
        for msg in transcript:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            transcript_str += f"{role.upper()}: {content}\n"
        
        user_prompt = (
            f"Question Asked: {question}\n\n"
            f"Running Transcript:\n{transcript_str}\n\n"
            f"Resume Claims Reference:\n{claims_str}"
        )
        
        json_response = await self.llm_client.generate_json(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3
        )
        
        if not json_response:
            logger.error("EvaluatorAgent failed to evaluate answer.")
            return None
            
        try:
            return EvaluateAnswerResponse(**json_response)
        except Exception as e:
            logger.error(f"Failed to validate EvaluateAnswerResponse: {str(e)}")
            return None
