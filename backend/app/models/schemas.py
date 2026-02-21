from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# --- Core Competency/Skills Schemas ---

class SkillAssessment(BaseModel):
    skill_name: str = Field(..., description="The name of the skill.")
    proficiency_level: str = Field(..., description="Assessed proficiency level (e.g., 'Beginner', 'Intermediate', 'Expert').")
    evidence: str = Field(..., description="Evidence found in the resume or answers supporting this proficiency.")

class DiscrepancyLogItem(BaseModel):
    claim: str = Field(..., description="The original claim made in the resume or preceding answer.")
    contradiction: str = Field(..., description="The contradicting statement or signal.")
    severity: str = Field(..., description="Severity of the contradiction: 'Low', 'Medium', 'High'.")

# --- Analysis Models ---

class ResumeAnalysisRequest(BaseModel):
    resume_text: str = Field(..., description="The raw or parsed text of the candidate's resume.")
    job_description: str = Field(..., description="The raw text of the Job Description.")

class ResumeAnalysisResponse(BaseModel):
    overall_fit_score: int = Field(..., ge=0, le=100, description="Overall fit score from 0 to 100.")
    key_strengths: List[str] = Field(..., description="List of the candidate's key strengths relative to the JD.")
    red_flags: List[str] = Field(..., description="List of potential red flags or missing requirements.")
    skills: List[SkillAssessment] = Field(..., description="Detailed assessment of required skills.")
    
# --- Question Models ---
    
class QuestionBankItem(BaseModel):
    category: str = Field(..., description="The category or skill being tested.")
    tier: int = Field(..., ge=1, le=3, description="Difficulty tier: 1 (Basic), 2 (Applied), 3 (Complex/System).")
    question_text: str = Field(..., description="The actual question to ask the candidate.")
    expected_signals: List[str] = Field(..., description="Key points or signals expected in a strong answer.")
    
class QuestionBankResponse(BaseModel):
    questions: List[QuestionBankItem]

# --- Evaluation Models ---

class TranscriptMessage(BaseModel):
    role: str = Field(..., description="Either 'interviewer' or 'candidate'")
    content: str = Field(..., description="The spoken text")

class EvaluateAnswerRequest(BaseModel):
    question: str = Field(..., description="The core technical question being addressed.")
    transcript: List[TranscriptMessage] = Field(..., description="The running conversational history of the candidate answering.")
    resume_claims: List[str] = Field(default_factory=list, description="Relevant claims parsed directly from the candidate's resume.")

class EvaluateAnswerResponse(BaseModel):
    depth_score: int = Field(..., ge=1, le=10, description="Overall depth of technical answer.")
    knowledge_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in candidate's fundamental knowledge on this topic.")
    label: str = Field(..., description="Short classification string (e.g. Excellent, Missing Fundamentals).")
    contradiction_flag: bool = Field(..., description="True if answer contradicts resume claims.")
    contradiction_detail: Optional[str] = Field(None, description="Explanation if contradiction found.")
    bluff_likelihood: float = Field(..., ge=0.0, le=1.0, description="Probability candidate is bluffing or guessing.")
    confidence_level: float = Field(..., ge=0.0, le=1.0, description="Assessed confidence level of candidate's verbal delivery logic.")
    suggested_follow_up: str = Field(..., description="A tight follow-up question to probe weaknesses.")

# --- Final Verdict Models ---

class VerdictRequest(BaseModel):
    resume_analysis: ResumeAnalysisResponse = Field(..., description="The initial resume and JD analysis.")
    qa_pairs: List[Dict[str, Any]] = Field(..., description="A list of dictionaries containing questions, answers, and evaluations.")

class VerdictResponse(BaseModel):
    verdict: str = Field(..., description="The final decision: 'Hire', 'No-Hire', 'Strong Hire', etc.")
    reasoning_trace: List[str] = Field(..., description="Step-by-step reasoning trace from multiple agents explaining the verdict.")
    skill_heatmap: Dict[str, int] = Field(..., description="Heatmap of skills mapped to their scores (1-10).")
    discrepancy_log: List[DiscrepancyLogItem] = Field(..., description="Log of any notable discrepancies found during the interview loop.")
    summary: str = Field(..., description="A crisp summary of the entire candidate package.")
