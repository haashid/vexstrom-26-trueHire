import asyncio
from app.core.config import settings
from app.core.llm_client import LLMClient
from app.agents.question_agent import QuestionAgent
from app.models.schemas import ResumeAnalysisResponse
import json

async def test():
    client = LLMClient()
    agent = QuestionAgent(client)
    mock_resume = ResumeAnalysisResponse(
        overall_fit_score=90,
        key_strengths=["Python"],
        red_flags=["None"],
        skills=[]
    )
    result = await agent.generate(mock_resume, "Need Python developer")
    print("Result:", result)

if __name__ == "__main__":
    asyncio.run(test())
