const API_BASE_URL = 'http://localhost:8000/api/v1';

export async function analyzeCandidate(resumeFile: File, jdFile: File) {
    const formData = new FormData();
    formData.append('resume_pdf', resumeFile);
    formData.append('jd_pdf', jdFile);

    const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        const detail = typeof error.detail === 'object' ? JSON.stringify(error.detail) : error.detail;
        throw new Error(detail || 'Analysis failed');
    }

    return response.json();
}

export interface TranscriptMessage {
    role: string;
    content: string;
}

export interface EvaluateAnswerRequest {
    question: string;
    transcript: TranscriptMessage[];
    resume_claims: string[];
}

export async function evaluateAnswer(request: EvaluateAnswerRequest) {
    const response = await fetch(`${API_BASE_URL}/evaluate-answer`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        const detail = typeof error.detail === 'object' ? JSON.stringify(error.detail) : error.detail;
        throw new Error(detail || 'Evaluation failed');
    }

    return response.json();
}

export interface IdentifySpeakerRequest {
    utterance: string;
    transcript: TranscriptMessage[];
}

export async function identifySpeaker(request: IdentifySpeakerRequest) {
    const response = await fetch(`${API_BASE_URL}/identify-speaker`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        const detail = typeof error.detail === 'object' ? JSON.stringify(error.detail) : error.detail;
        throw new Error(detail || 'Speaker identification failed');
    }

    return response.json();
}

export interface VerdictRequest {
    resume_analysis: any;
    qa_pairs: any[];
}

export async function generateVerdict(request: VerdictRequest) {
    const response = await fetch(`${API_BASE_URL}/verdict`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        const detail = typeof error.detail === 'object' ? JSON.stringify(error.detail) : error.detail;
        throw new Error(detail || 'Verdict generation failed');
    }

    return response.json();
}
