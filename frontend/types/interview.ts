export type Speaker = 'Panelist' | 'Candidate';

export interface QuestionMatch {
    id: string;
    confidence: number;
    index: number;
}

export interface TranscriptEntry {
    id: string;
    speaker: Speaker;
    text: string;
    ts: string;
    flagged?: boolean;
    flagReason?: string | null;
    isNew?: boolean;
}

export interface DetailedAssessment {
    strengths: string;
    weaknesses: string;
}

export interface EvaluationResult {
    score: number;
    label: string;
    bluff: 'LOW' | 'MEDIUM' | 'HIGH';
    contradiction: boolean;
    technical_feedback: string;
    detailed_assessment?: DetailedAssessment;
    answeredAt: string;
    snippet: string;
}

export interface ContradictionData {
    resumeClaimed: string;
    candidateSaid: string;
    severity: 'LOW' | 'MEDIUM' | 'CRITICAL';
}

export interface QuestionNode {
    id: string;
    tier: string;
    keywords?: string[];
    full: string;
    preview?: string;
    question_text?: string;
}

export interface QuestionGroup {
    area: string;
    questions: QuestionNode[];
}

export interface AnalysisData {
    questionBank: QuestionGroup[];
    redFlags?: { claim: string }[];
}
