from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List
import json

from app.core.llm_client import LLMClient
from app.services.analysis_service import AnalysisService
from app.services.interview_service import InterviewService
from app.utils.pdf_utils import extract_text_from_pdf
from app.models.schemas import (
    EvaluateAnswerRequest, 
    VerdictRequest,
    VerdictResponse,
    IdentifySpeakerRequest,
    IdentifySpeakerResponse,
    TranscriptPacket
)
from pydantic import BaseModel

router = APIRouter()

def get_llm_client() -> LLMClient:
    return LLMClient()

def get_analysis_service(client: LLMClient = Depends(get_llm_client)) -> AnalysisService:
    return AnalysisService(client)

def get_interview_service(client: LLMClient = Depends(get_llm_client)) -> InterviewService:
    return InterviewService(client)

@router.post("/analyze", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def analyze_candidate(
    resume_pdf: UploadFile = File(...),
    jd_pdf: UploadFile = File(...),
    service: AnalysisService = Depends(get_analysis_service)
):
    """
    Analyzes the candidate's uploaded resume vs the Job Description PDFs
    and returns a pre-brief structure alongside a tiered question bank.
    """
    try:
        if not resume_pdf.filename.endswith(".pdf") or not jd_pdf.filename.endswith(".pdf"):
            raise ValueError("Both resume and job description must be PDF files.")
            
        resume_bytes = await resume_pdf.read()
        jd_bytes = await jd_pdf.read()
        
        resume_text = extract_text_from_pdf(resume_bytes)
        jd_text = extract_text_from_pdf(jd_bytes)
        
        result = await service.run_full_analysis(resume_text, jd_text)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during analysis.")

@router.post("/evaluate-answer")
async def evaluate_candidate_answer(
    request: EvaluateAnswerRequest,
    stream: bool = False,
    service: InterviewService = Depends(get_interview_service)
):
    """
    Evaluates a candidate's answer for depth, contradictions, and bluffing.
    Returns a standard JSON response or a StreamingResponse if stream=True.
    """
    try:
        # Convert Request transcript objects to dicts for internal servicing
        transcript_dicts = [msg.model_dump() for msg in request.transcript]
        
        if stream:
            return service.evaluate_answer_streaming(
                request.question,
                transcript_dicts,
                request.resume_claims
            )
        else:
            return await service.evaluate_answer(
                request.question,
                transcript_dicts,
                request.resume_claims
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during evaluation.")

@router.post("/identify-speaker", response_model=IdentifySpeakerResponse)
async def identify_speaker(
    request: IdentifySpeakerRequest,
    service: InterviewService = Depends(get_interview_service)
):
    """
    Identifies if an utterance belongs to the interviewer or candidate.
    """
    try:
        transcript_dicts = [msg.model_dump() for msg in request.transcript]
        return await service.identify_speaker(request.utterance, transcript_dicts)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error identifying speaker.")

@router.post("/verdict", response_model=VerdictResponse, status_code=status.HTTP_200_OK)
async def generate_final_verdict(
    request: VerdictRequest,
    service: InterviewService = Depends(get_interview_service)
):
    """
    Cross-checks all phase data to generate a definitive hire/no-hire verdict 
    complete with reasoning trace and discrepancy logs.
    """
    try:
        result = await service.generate_verdict(request.resume_analysis, request.qa_pairs)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error resolving verdict.")

from app.services.email_service import EmailService

def get_email_service() -> EmailService:
    return EmailService()

class SendReportRequestSchema(BaseModel):
    to_email: str
    candidate_name: str
    job_title: str
    verdict: str
    primary_reason: str
    salary_estimate: str

@router.post("/send-report", status_code=status.HTTP_200_OK)
async def send_verdict_report(
    request: SendReportRequestSchema,
    service: EmailService = Depends(get_email_service)
):
    """
    Sends the final structured candidate report via email using Gmail SMTP.
    """
    success = service.send_report(
        to_email=request.to_email,
        candidate_name=request.candidate_name,
        job_title=request.job_title,
        verdict=request.verdict,
        primary_reason=request.primary_reason,
        salary_estimate=request.salary_estimate
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send the email via backend SMTP.")
    return {"status": "success", "message": "Email sent successfully."}

from app.core.socket_manager import manager
from fastapi import WebSocket

@router.post("/transcript", status_code=status.HTTP_200_OK)
async def receive_transcript(request: TranscriptPacket):
    """
    Receives live transcript packets from the Chrome extension.
    Broadcasts them to any connected frontend clients.
    """
    packet = {
        "speaker": request.speaker,
        "text": request.text,
        "timestamp": request.timestamp,
        "type": "transcript"
    }
    
    # Log it
    print(f"[Extension -> Backend] {request.speaker}: {request.text}")
    
    # Broadcast to frontend
    await manager.broadcast(packet)
    
    return {"status": "ok", "timestamp": request.timestamp}

@router.websocket("/ws/transcript")
async def websocket_transcript(websocket: WebSocket):
    """
    WebSocket endpoint for the frontend to receive real-time updates.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open
            await websocket.receive_text()
    except Exception:
        manager.disconnect(websocket)
