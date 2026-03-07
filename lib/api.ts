/**
 * TrueHire API client
 * All communication with the FastAPI backend (localhost:8000)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type AnalysisData = {
    candidate: {
        name: string;
        email?: string;
        role: string;
        credibility: "HIGH" | "MEDIUM" | "LOW";
        credibilityLabel: string;
    };
    fitScore: number;
    fitLabel: string;
    fitBreakdown: {
        technicalSkills: number;
        experience: number;
        domainKnowledge: number;
        leadershipCultural: number;
    };
    redFlags: Array<{
        id: string;
        claim: string;
        concern: string;
        verificationQuestion: string;
        severity: "CRITICAL" | "HIGH" | "LOW";
    }>;
    skills: Array<{
        name: string;
        level: number;
        tier: "HIGH" | "MEDIUM" | "LOW";
    }>;
    questionBank: Array<{
        area: string;
        questions: Array<{
            id: string;
            tier: "T1" | "T2" | "T3";
            preview: string;
            full: string;
            why_ask: string;
            keywords: string[];
        }>;
    }>;
    interviewStrategy: string;
    salaryIntelligence?: {
        currencySymbol: string;
        currencySuffix: string;
        bands: {
            entry: number;
            mid: number;
            senior: number;
        };
        recommended: {
            band: number;
            trend: string;
            drivingSkills: string[];
        };
        offerConfidenceNote: string;
    };
    onlinePresence?: {
        riskLevel: "HIGH" | "MEDIUM" | "LOW";
        averageToxicity: number;
        flaggedPosts: number;
        recentPosts: Array<{
            content: string;
            scores: Record<string, number>;
            flagged: boolean;
        }>;
    };
    _resumeText?: string;
};

export type ScoreResult = {
    depthScore: number;
    depthLabel: string;
    bluffRisk: "LOW" | "MEDIUM" | "HIGH";
    bluffReason: string;
    contradiction: {
        detected: boolean;
        resumeClaimed: string;
        candidateSaid: string;
        severity: "CRITICAL" | "HIGH" | "LOW";
    };
    followUp: {
        question: string;
        why: string;
    };
    snippet: string;
};

export type VerdictData = {
    verdict: "HIRE" | "NO-HIRE";
    confidence: number;
    primaryReason: string;
    skillHeatmap: Array<{
        skill: string;
        conceptual: "HIGH" | "MEDIUM" | "LOW";
        applied: "HIGH" | "MEDIUM" | "LOW";
        deep: "HIGH" | "MEDIUM" | "LOW";
    }>;
    discrepancies: Array<{
        id: string;
        claim: string;
        finding: string;
        severity: "CRITICAL" | "HIGH" | "LOW";
    }>;
    agentDebate: Array<{
        agent: string;
        name: string;
        color: string;
        position: "HIRE" | "NO-HIRE" | "CONDITIONAL";
        confidence: number;
        reasoning: string;
    }>;
    consensus: string;
    candidateFeedback?: {
        mailSubject: string;
        mailBody: string;
    };
};

export async function sendEmail(payload: { to: string; subject: string; body: string }) {
    const res = await fetch(`${API_BASE}/send_email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        throw new Error("Failed to send email");
    }
    return res.json();
}

export async function generateReport(verdictData: VerdictData) {
    const res = await fetch(`${API_BASE}/generate_report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verdict_data: verdictData }),
    });
    if (!res.ok) {
        throw new Error("Failed to generate report");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TrueHire_Candidate_Report.docx";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

/**
 * Upload resume + JD files, run Agent 1 + 2, get candidate intelligence brief.
 */
export async function analyzeDocuments(
    resumeFile: File,
    jdFile: File
): Promise<AnalysisData> {
    const formData = new FormData();
    formData.append("resume_file", resumeFile);
    formData.append("jd_file", jdFile);

    const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "Analysis failed");
    }

    return res.json();
}

/**
 * Score a candidate's spoken answer in real-time via Agent 3.
 */
export async function scoreAnswer(
    question: string,
    answer: string,
    resumeContext: string,
    redFlags: AnalysisData["redFlags"]
): Promise<ScoreResult> {
    const res = await fetch(`${API_BASE}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            question,
            answer,
            resume_context: resumeContext,
            red_flags: redFlags,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "Scoring failed");
    }

    return res.json();
}

/**
 * Generate final HIRE/NO-HIRE verdict via Agent 4 (3-persona debate).
 */
export async function generateVerdict(
    evaluations: Record<string, unknown>,
    transcript: unknown[],
    analysisData: AnalysisData
): Promise<VerdictData> {
    const res = await fetch(`${API_BASE}/verdict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            evaluations,
            transcript,
            analysisData,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "Verdict generation failed");
    }

    return res.json();
}

/**
 * Send an audio Blob to the backend for transcription via Groq Whisper.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "chunk.webm");

    const res = await fetch(`${API_BASE}/transcribe`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "Transcription failed");
    }

    const json = await res.json();
    return json.text || "";
}

/**
 * Route raw text through LangGraph to infer the speaker/intent, 
 * detect the question (if panelist), and score the answer (if candidate).
 */
export async function processTurn(payload: {
    text: string;
    last_speaker: string;
    active_question_id: string | null;
    question_bank: any[];
    recent_transcript: string;
}) {
    const res = await fetch(`${API_BASE}/process_turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "Agent graph processing failed");
    }

    return await res.json();
}
