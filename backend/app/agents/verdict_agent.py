from typing import Optional, List, Dict, Any
import json
from app.core.llm_client import LLMClient
from app.core.logging import get_logger
from app.models.schemas import VerdictResponse, ResumeAnalysisResponse

logger = get_logger(__name__)

class VerdictAgent:
    SYSTEM_PROMPT = """
    You are the final Hiring Committee Lead. Review all collected data: 
    the initial resume analysis, the generated questions, and the candidate's answers & evaluations.
    
    Your deliverable is a firm hiring verdict with an analytical reasoning trace and a percentage confidence score.
    
    Output strictly in the following JSON format:
    {
      "verdict": "Strong Hire | Hire | Leaning Hire | Leaning No-Hire | No-Hire",
      "confidence": 85,
      "reasoning_trace": [
        "Analyzed resume matching 80% of core JD.",
        "Detected strong grasp in Tier 2 backend questions.",
        "Candidate bluffed faintly on Kubernetes but recovered in system design."
      ],
      "skill_heatmap": {
        "Python": 8,
        "System Design": 6
      },
      "discrepancy_log": [
        {
          "claim": "Expert in K8s",
          "contradiction": "Failed basic pod lifecycle question.",
          "severity": "Medium"
        }
      ],
      "summary": "..."
    }
    """

    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    async def generate_verdict(self, resume_analysis: ResumeAnalysisResponse, qa_pairs: List[Dict[str, Any]]) -> Optional[VerdictResponse]:
        """
        Produces final hire/no-hire decision cross-checking all phase data.
        """
        logger.info("VerdictAgent generating final hiring committee verdict...")
        
        # Serialize inputs safely
        try:
            qa_str = json.dumps(qa_pairs, indent=2)
            resume_str = resume_analysis.model_dump_json(indent=2)
        except Exception as e:
            logger.error(f"Error serializing data for VerdictAgent: {e}")
            return None

        user_prompt = (
            f"INITIAL RESUME ANALYSIS:\n{resume_str}\n\n"
            f"INTERVIEW Q&A PAIRS AND EVALUATIONS:\n{qa_str}\n\n"
            "Produce the final, binding verdict."
        )
        
        json_response = await self.llm_client.generate_json(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.4
        )
        
        if not json_response:
            logger.error("VerdictAgent failed to form a verdict.")
            return None
            
        try:
            return VerdictResponse(**json_response)
        except Exception as e:
            logger.error(f"Failed to validate VerdictResponse: {str(e)}")
            return None
