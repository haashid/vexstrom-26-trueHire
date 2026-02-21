import json
import asyncio
from typing import List, Dict, Any
from fastapi.responses import StreamingResponse
from app.core.llm_client import LLMClient
from app.agents.evaluator_agent import EvaluatorAgent
from app.agents.verdict_agent import VerdictAgent
from app.models.schemas import EvaluateAnswerResponse, VerdictResponse, ResumeAnalysisResponse
from app.core.logging import get_logger

logger = get_logger(__name__)

class InterviewService:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client
        self.evaluator_agent = EvaluatorAgent(llm_client)
        self.verdict_agent = VerdictAgent(llm_client)

    async def evaluate_answer(
        self, question: str, transcript: list, resume_claims: list
    ) -> dict:
        """
        Wraps EvaluatorAgent to process real-time continuous conversational evaluations.
        """
        logger.info("InterviewService evaluating continuous transcript...")
        result = await self.evaluator_agent.evaluate(question, transcript, resume_claims)
        if not result: # Corrected from 'evaluation' to 'result' for syntactic correctness
            raise ValueError("Failed to evaluate answer.")
        return result

    def evaluate_answer_streaming(self, question: str, transcript: list, resume_claims: List[str]) -> StreamingResponse:
        """
        A streaming-ready stub for evaluating answers.
        In a full implementation, this would yield JSON tokens as they arrive from Gemini.
        """
        async def generate_evaluation():
            # In a real streaming implementation, we would use the streaming capabilities of the LLM client.
            # Here we resolve it entirely and yield it as a simulated stream.
            evaluation = await self.evaluate_answer(question, transcript, resume_claims)
            
            # Simulate streaming words/tokens
            json_str = evaluation.model_dump_json()
            chunk_size = 15
            for i in range(0, len(json_str), chunk_size):
                yield json_str[i:i+chunk_size]
                await asyncio.sleep(0.01)

        return StreamingResponse(generate_evaluation(), media_type="application/json")

    async def generate_verdict(self, resume_analysis: ResumeAnalysisResponse, qa_pairs: List[Dict[str, Any]]) -> VerdictResponse:
        """
        Generates the final hiring verdict.
        """
        logger.info("Compiling final decision matrix...")
        verdict = await self.verdict_agent.generate_verdict(resume_analysis, qa_pairs)
        if not verdict:
            raise ValueError("Failed to generate final verdict.")
        return verdict
