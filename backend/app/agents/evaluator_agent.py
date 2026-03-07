from typing import Optional, List, Dict
from app.core.llm_client import LLMClient
from app.core.logging import get_logger
from app.models.schemas import EvaluateAnswerResponse

logger = get_logger(__name__)

class EvaluatorAgent:
    SYSTEM_PROMPT = """
    You are a senior technical architect. Evaluate the candidate's answer for technical accuracy and depth.
    
    Requirements:
    - depth_score (1-10): Technical detail level.
    - knowledge_score (0.0-1.0): First-principles understanding.
    - technical_feedback: 2 sentences of dense qualitative critique.
    - detailed_assessment: {"strengths": "...", "weaknesses": "..."}
    - contradiction_flag: Conflict with resume?
    - bluff_likelihood: (0.0-1.0) Buzzword-to-logic ratio.
    - follow_up_questions: 2 target questions for weaknesses.
    
    Maintain high technical standards. Be concise to minimize latency.
    
    Output Format (JSON):
    {
      "depth_score": int,
      "knowledge_score": float,
      "label": "Expert/Adequate/Surface-level",
      "contradiction_flag": bool,
      "contradiction_detail": str | null,
      "bluff_likelihood": float,
      "confidence_level": float,
      "follow_up_questions": [str],
      "technical_feedback": str,
      "detailed_assessment": {"strengths": str, "weaknesses": str}
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
