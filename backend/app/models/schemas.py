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

class TranscriptPacket(BaseModel):
    speaker: str = Field(..., description="The name of the speaker")
    text: str = Field(..., description="The content of the speech")
    timestamp: int = Field(..., description="Epoch timestamp in milliseconds")
    sessionId: Optional[str] = Field(None, description="Optional session or meeting ID")

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
    follow_up_questions: List[str] = Field(default_factory=list, description="A list of tight follow-up questions to probe weaknesses.")
    technical_feedback: str = Field(..., description="Qualitative feedback on the technical correctness and depth.")
    detailed_assessment: Dict[str, str] = Field(..., description="A breakdown of specific strengths and weaknesses in the answer.")

class IdentifySpeakerRequest(BaseModel):
    utterance: str = Field(..., description="The new spoken text to identify.")
    transcript: List[TranscriptMessage] = Field(..., description="The recent conversational history.")

class IdentifySpeakerResponse(BaseModel):
    speaker: str = Field(..., description="Likely speaker: 'interviewer' or 'candidate'")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in the identification.")
    reasoning: str = Field(..., description="Brief reasoning for the choice.")

# --- Final Verdict Models ---

class VerdictRequest(BaseModel):
    resume_analysis: ResumeAnalysisResponse = Field(..., description="The initial resume and JD analysis.")
    qa_pairs: List[Dict[str, Any]] = Field(..., description="A list of dictionaries containing questions, answers, and evaluations.")

class SalarySuggestion(BaseModel):
    median_salary: int = Field(..., description="Estimated median salary for this role and experience.")
    min_salary: int = Field(..., description="Estimated minimum salary range.")
    max_salary: int = Field(..., description="Estimated maximum salary range.")
    salary_currency: str = Field(..., description="Currency code (e.g. USD, EUR, INR).")

class VerdictResponse(BaseModel):
    verdict: str = Field(..., description="The final decision: 'Hire', 'No-Hire', 'Strong Hire', etc.")
    confidence: int = Field(..., ge=0, le=100, description="Confidence score for the final verdict.")
    reasoning_trace: List[str] = Field(..., description="Step-by-step reasoning trace from multiple agents explaining the verdict.")
    skill_heatmap: Dict[str, int] = Field(..., description="Heatmap of skills mapped to their scores (1-10).")
    discrepancy_log: List[DiscrepancyLogItem] = Field(..., description="Log of any notable discrepancies found during the interview loop.")
    summary: str = Field(..., description="A crisp summary of the entire candidate package.")
    
    inferred_job_title: str = Field(..., description="The most accurate job title inferred from the JD and interview.")
    inferred_years_of_experience: str = Field(..., description="Inferred experience mapping to: 'ALL', '0_TO_1', '1_TO_3', '4_TO_6', '7_PLUS'")
    salary_suggestion: SalarySuggestion = Field(..., description="Market salary estimation generated by the LLM based on job title and experience.")

class SendReportRequest(BaseModel):
    to_email: str = Field(..., description="Email address to send the report to.")
    candidate_name: str = Field(..., description="Name of the candidate.")
    job_title: str = Field(..., description="The inferred job title.")
    verdict: str = Field(..., description="The final hiring verdict.")
    primary_reason: str = Field(..., description="The summary reasoning for the verdict.")
    salary_estimate: str = Field(..., description="The formatted salary estimation string.")
