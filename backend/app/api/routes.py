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
    VerdictResponse
)

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
