import asyncio
from app.core.config import settings
from app.core.llm_client import LLMClient
from app.services.analysis_service import AnalysisService

async def test():
    client = LLMClient()
    service = AnalysisService(client)
    res = await service.run_full_analysis("Python developer", "Need Python developer")
    print("Success")

if __name__ == "__main__":
    asyncio.run(test())
