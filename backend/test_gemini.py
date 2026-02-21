import asyncio
from app.core.config import settings
import google.generativeai as genai
import logging

logging.basicConfig(level=logging.INFO)

async def test_llm():
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
    try:
        response = await model.generate_content_async("Tell me a joke in JSON format: {'joke': '...'} ")
        print("SUCCESS:")
        print(response.text)
    except Exception as e:
        print(f"ERROR: {type(e).__name__} - {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_llm())
