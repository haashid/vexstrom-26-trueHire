from typing import Dict, Any
from app.core.llm_client import LLMClient
from app.agents.resume_agent import ResumeAgent
from app.agents.question_agent import QuestionAgent
from app.core.logging import get_logger

logger = get_logger(__name__)

class AnalysisService:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client
        self.resume_agent = ResumeAgent(llm_client)
        self.question_agent = QuestionAgent(llm_client)

    async def run_full_analysis(self, resume_text: str, jd_text: str) -> Dict[str, Any]:
        """
        Orchestrates the ResumeAgent and QuestionAgent.
        Returns the pre-brief (resume analysis) and the generated question bank.
        """
        logger.info("Starting full analysis workflow...")
        
        # Step 1: Analyze Resume
        resume_analysis = await self.resume_agent.analyze(resume_text, jd_text)
        if not resume_analysis:
            raise ValueError("Failed to generate resume analysis.")
            
        # Step 2: Generate Questions based on Analysis
        question_bank = await self.question_agent.generate(resume_analysis, jd_text)
        if not question_bank:
            raise ValueError("Failed to generate question bank.")
            
        logger.info("Successfully completed full analysis workflow.")
        
        return {
            "pre_brief": resume_analysis,
            "question_bank": question_bank
        }
