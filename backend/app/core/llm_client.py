import asyncio
from typing import Optional, Dict, Any
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.logging import get_logger
from app.utils.json_utils import safe_parse_llm_json

logger = get_logger(__name__)

class LLMClient:
    def __init__(self):
        # Initialize AsyncOpenAI with OpenRouter base URL and the API Key
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )
        self.model_name = settings.MODEL_NAME
        self.temperature = settings.TEMPERATURE
        logger.info(f"Initialized LLMClient (OpenRouter) with model: {self.model_name}")

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        retries: int = 2,
        timeout: int = 30,
        temperature: float = None,
        max_tokens: int = 4096,
    ) -> Optional[Dict[str, Any]]:
        """
        Generates structured JSON output from OpenRouter using the provided system and user prompts.
        Implements specific retry logic, configurable timeout, and safe JSON parsing.
        """
        temp = temperature if temperature is not None else self.temperature
        
        for attempt in range(retries + 1):
            try:
                logger.debug(f"Calling OpenRouter generation (Attempt {attempt + 1}/{retries + 1})...")
                
                # We use asyncio.wait_for to enforce timeout
                response = await asyncio.wait_for(
                    self.client.chat.completions.create(
                        model=self.model_name,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=temp,
                        max_tokens=max_tokens,
                    ),
                    timeout=timeout
                )
                
                raw_text = response.choices[0].message.content
                if not raw_text:
                    raise ValueError("Received empty response from LLM.")
                
                parsed_json = safe_parse_llm_json(raw_text)
                if parsed_json is not None:
                    return parsed_json
                    
                raise ValueError(f"Failed to parse logical JSON out of LLM response: {raw_text[:100]}...")
                
            except asyncio.TimeoutError:
                logger.error(f"Timeout Error after {timeout} seconds on attempt {attempt + 1}.")
            except Exception as e:
                logger.error(f"LLM Generation Error on attempt {attempt + 1}: {str(e)}")
                if "429" in str(e) or "Quota" in str(e) or "rate" in str(e).lower():
                    # Free tier rate limits demand longer explicit waits
                    await asyncio.sleep(10)
                
            if attempt < retries:
                await asyncio.sleep((2 ** attempt) + 2) # Exponential backoff + padding
                
        logger.error(f"Failed to generate JSON after {retries + 1} attempts.")
        return None
