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
    When generating the 'salary_suggestion', explicitly calibrate the numbers to reflect the ACTUAL local tech market in India. 
    For example, Frontend Developer baselines:
    - Entry-level (0-1 year): ₹3,30,000 - ₹5,00,000  (330000 to 500000 INR)
    - Experienced (3-6+ years): ₹7,30,000 - ₹20,00,000+ (730000 to 2000000+ INR)
    Scale up or down realistically based on the role (e.g., Backend, DevOps) and candidate performance.
    
    Verdict Categories:
    - HIRE (STRONG): Outstanding candidate, exceeds technical bar, no flags.
    - HIRE (RELIABLE): Meets requirements, solid technical grasp.
    - NO-HIRE (BORDERLINE): Inconsistent technical depth, missing key signals.
    - NO-HIRE (RISK): Major technical gaps, inconsistencies, or integrity issues.
    
    Output strictly in the following JSON format:
    {
      "verdict": "HIRE (STRONG) | HIRE (RELIABLE) | NO-HIRE (BORDERLINE) | NO-HIRE (RISK)",
      "confidence": int (0-100),
      "reasoning_trace": [
        "Analyzed resume matching...",
        "Detected strong grasp in...",
        "Candidate bluffed on..."
      ],
      "skill_heatmap": {
        "SkillName": int (1-10)
      },
      "discrepancy_log": [
        {
          "claim": str,
          "contradiction": str,
          "severity": "Low | Medium | High"
        }
      ],
      "summary": "Crisp executive summary explaining the final recommendation.",
      "inferred_job_title": "e.g., nodejs developer, frontend engineer",
      "inferred_years_of_experience": "ALL", // Must be one of: "ALL", "0_TO_1", "1_TO_3", "4_TO_6", "7_PLUS"
      "salary_suggestion": {
        "median_salary": 1200000,
        "min_salary": 900000,
        "max_salary": 1500000,
        "salary_currency": "INR"
      }
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
