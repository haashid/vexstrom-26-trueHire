from typing import Optional, List, Dict
from app.core.llm_client import LLMClient
from app.core.logging import get_logger

logger = get_logger(__name__)

class SpeakerAgent:
    SYSTEM_PROMPT = """
    You are a transcription assistant for a technical interview.
    Your task is to identify whether a new utterance belongs to the 'interviewer' or the 'candidate'.
    
    Context:
    - Interviewer: Asking technical questions, probing depth, clarifying resume claims.
    - Candidate: Providing technical answers, explaining experience, responding to follow-ups.
    
    Previous Transcript Context:
    {transcript_context}
    
    New Utterance:
    "{utterance}"
    
    Rules:
    1. If the utterance is a question directed at someone's experience, it's the interviewer.
    2. If the utterance is an explanation of a technology or project, it's the candidate.
    3. If the utterance is short (e.g., "Yes", "Exactly", "Sure"), follow the flow of the previous speaker or the context of the question.
    
    Output strictly in the following JSON format:
    {{
      "speaker": "interviewer" | "candidate",
      "confidence": 0.0 to 1.0,
      "reasoning": "short explanation"
    }}
    """

    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    async def identify_speaker(self, utterance: str, transcript: List[Dict[str, str]]) -> Optional[Dict[str, any]]:
        """
        Identifies the likely speaker of a new utterance based on conversational context.
        """
        logger.info(f"SpeakerAgent identifying speaker for: {utterance[:50]}...")
        
        # Format the transcript context for the prompt
        transcript_context = ""
        for msg in transcript[-5:]: # Look at last 5 messages for context
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            transcript_context += f"{role.upper()}: {content}\n"
        
        if not transcript_context:
            transcript_context = "No previous history (Starting the interview)."

        user_prompt = (
            f"Please identify the speaker for this new utterance:\n"
            f"Utterance: \"{utterance}\""
        )
        
        json_response = await self.llm_client.generate_json(
            system_prompt=self.SYSTEM_PROMPT.format(
                transcript_context=transcript_context,
                utterance=utterance
            ),
            user_prompt=user_prompt,
            temperature=0.1 # Low temperature for classification
        )
        
        if not json_response:
            logger.error("SpeakerAgent failed to identify speaker.")
            return None
            
        return json_response
