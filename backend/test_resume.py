import asyncio
from app.core.config import settings
from app.core.llm_client import LLMClient
from app.agents.resume_agent import ResumeAgent
import logging

logging.basicConfig(level=logging.INFO)

async def test():
    client = LLMClient()
    agent = ResumeAgent(client)
    res = await agent.analyze("Python developer", "Need Python developer")
    print("Result:", res)

if __name__ == "__main__":
    asyncio.run(test())
