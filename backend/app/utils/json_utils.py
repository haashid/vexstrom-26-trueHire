import json
import re
from typing import Any, Dict, Optional
from app.core.logging import get_logger

logger = get_logger(__name__)

def extract_json_block(text: str) -> str:
    """
    Extracts a JSON block from a markdown-formatted or raw string.
    Handles ```json ... ``` enclosures.
    """
    if not text:
        return ""
        
    text = text.strip()
    
    # Try to find JSON within markdown backticks
    match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
        
    # Fallback to finding the first { and last }
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        return text[start_idx:end_idx+1]
        
    # List parsing fallback
    start_idx = text.find("[")
    end_idx = text.rfind("]")
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        return text[start_idx:end_idx+1]

    return text

def safe_parse_llm_json(text: str) -> Optional[Dict[str, Any]]:
    """
    Safely parses extracting JSON from potentially malformed LLM outputs.
    """
    try:
        json_str = extract_json_block(text)
        if not json_str:
            logger.warning("No JSON block found to extract.")
            return None
            
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.error(f"JSON Parsing Error: {str(e)} - Raw string: {text}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error during JSON parsing: {str(e)}")
        return None
