import { useState, useRef, useCallback } from 'react';
import { evaluateAnswer, identifySpeaker } from '@/lib/api';
import {
    AnalysisData, TranscriptEntry, EvaluationResult,
    ContradictionData, Speaker, QuestionMatch, QuestionNode
} from '@/types/interview';

function detectQuestion(text: string, questions: QuestionNode[]): QuestionMatch | null {
    const lower = text.toLowerCase();
    let best: QuestionMatch | null = null;

    questions.forEach((q, idx) => {
        if (!q.keywords?.length) return;
        const hits = q.keywords.filter(kw => lower.includes(kw.toLowerCase())).length;
        const confidence = hits / Math.max(q.keywords.length * 0.4, 1);

        const exactMatchChance = q.full.toLowerCase().split(/\s+/).filter(w => lower.includes(w)).length / q.full.split(/\s+/).length;
        const totalConf = Math.min(confidence + (exactMatchChance * 0.5), 1);

        if (totalConf > 0.25 && (!best || totalConf > best.confidence)) {
            best = { id: q.id, confidence: totalConf, index: idx };
        }
    });

    return best;
}

export function useInterviewLogic(data: AnalysisData | null, allQ: QuestionNode[]) {
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>('Panelist');
    const [autoSwitch, setAutoSwitch] = useState(true);
    const [detectedQId, setDetectedQId] = useState<string | null>(null);
    const [nextQIndex, setNextQIndex] = useState<number>(0);
    const [detectedConf, setDetectedConf] = useState(0);

    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluations, setEvaluations] = useState<Record<string, EvaluationResult>>({});

    const [showContradiction, setShowContradiction] = useState(false);
    const [contradictionData, setContradictionData] = useState<ContradictionData | null>(null);
    const [contradictionLog, setContradictionLog] = useState<ContradictionData[]>([]);
    const [followUps, setFollowUps] = useState<string[]>([]);

    const entryCounter = useRef(0);
    const candidateBuf = useRef<Record<string, string>>({});
    const isEvaluatingRef = useRef(false);
    const transcriptRef = useRef<TranscriptEntry[]>([]);
    const lastSpeakerRef = useRef<Speaker>('Panelist');
    const autoSwitchRef = useRef(autoSwitch);
    const detectedQIdRef = useRef<string | null>(detectedQId);

    // Sync refs that are used in callbacks
    autoSwitchRef.current = autoSwitch;
    detectedQIdRef.current = detectedQId;
    transcriptRef.current = transcript;

    const processUtterance = useCallback(async (text: string, speaker: Speaker, ts: string) => {
        if (!data) return;

        let activeSpeaker = speaker;
        const activeQId = detectedQIdRef.current;
        const transcriptId = `e-${++entryCounter.current}`;

        const initialEntry: TranscriptEntry = {
            id: transcriptId, speaker: activeSpeaker, text, ts,
            flagged: false, flagReason: null, isNew: true
        };

        setTranscript(prev => {
            const next = [...prev.slice(-49), initialEntry];
            transcriptRef.current = next;
            return next;
        });

        // Run intelligence async
        setTimeout(async () => {
            try {
                if (autoSwitchRef.current) {
                    try {
                        const history = transcriptRef.current.slice(-5).map(e => ({
                            role: e.speaker === 'Panelist' ? 'interviewer' : 'candidate',
                            content: e.text
                        }));
                        const idResult = await identifySpeaker({ utterance: text, transcript: history });
                        if (idResult.confidence > 0.6) {
                            activeSpeaker = idResult.speaker === 'interviewer' ? 'Panelist' : 'Candidate';
                            setCurrentSpeaker(activeSpeaker);
                            setTranscript(prev => prev.map(e => e.id === transcriptId ? { ...e, speaker: activeSpeaker } : e));
                        }
                    } catch (err) {
                        console.warn("Auto-speaker ID failed.", err);
                    }
                }

                const prevSpeaker = lastSpeakerRef.current;
                lastSpeakerRef.current = activeSpeaker;

                const det = detectQuestion(text, allQ);
                let dQId = activeQId;
                if (det) {
                    dQId = det.id;
                    setDetectedQId(det.id);
                    setDetectedConf(det.confidence);
                    setNextQIndex(det.index + 1);
                    setFollowUps([]);
                }

                const qIdToEvaluate = (activeSpeaker === 'Panelist' && prevSpeaker === 'Candidate') ? activeQId : dQId;

                if (qIdToEvaluate) {
                    if (activeSpeaker === 'Candidate') {
                        candidateBuf.current[qIdToEvaluate] = (candidateBuf.current[qIdToEvaluate] || '') + ' ' + text;
                    }

                    const combined = candidateBuf.current[qIdToEvaluate] || '';
                    const wordCount = combined.trim().split(/\s+/).length;
                    const shouldEvaluate = (activeSpeaker === 'Candidate' && wordCount >= 15) ||
                        (activeSpeaker === 'Panelist' && prevSpeaker === 'Candidate' && wordCount > 0);

                    if (shouldEvaluate && !isEvaluatingRef.current) {
                        try {
                            const currentQ = allQ.find(q => q.id === qIdToEvaluate);
                            const history = transcriptRef.current.map(e => ({
                                role: e.speaker === 'Panelist' ? 'interviewer' : 'candidate',
                                content: e.text
                            }));

                            setIsEvaluating(true);
                            isEvaluatingRef.current = true;

                            const evalResult = await evaluateAnswer({
                                question: currentQ?.full || '', transcript: history,
                                resume_claims: data.redFlags?.map(rf => rf.claim) || []
                            });

                            if (evalResult.contradiction_flag) {
                                setContradictionData({
                                    resumeClaimed: evalResult.contradiction_detail || 'Resume claim discrepancy',
                                    candidateSaid: text, severity: 'CRITICAL'
                                });
                                setShowContradiction(true);
                            }

                            if (evalResult.follow_up_questions?.length > 0) {
                                setFollowUps(evalResult.follow_up_questions);
                            }

                            setEvaluations(p => ({
                                ...p,
                                [qIdToEvaluate!]: {
                                    score: Math.round(evalResult.depth_score * 10),
                                    label: evalResult.label,
                                    bluff: evalResult.bluff_likelihood > 0.6 ? 'HIGH' : evalResult.bluff_likelihood > 0.3 ? 'MEDIUM' : 'LOW',
                                    contradiction: evalResult.contradiction_flag,
                                    technical_feedback: evalResult.technical_feedback,
                                    detailed_assessment: evalResult.detailed_assessment,
                                    answeredAt: ts,
                                    snippet: text.slice(0, 150) + '...'
                                }
                            }));
                        } catch (err) {
                            console.error("Evaluation failed", err);
                        } finally {
                            setIsEvaluating(false);
                            isEvaluatingRef.current = false;
                        }
                    }
                }
            } catch (err) {
                console.error("Background intelligence failed", err);
            }
        }, 0);
    }, [data, allQ]);

    return {
        transcript, currentSpeaker, autoSwitch, setAutoSwitch, setCurrentSpeaker,
        detectedQId, nextQIndex, detectedConf, isEvaluating, evaluations,
        showContradiction, setShowContradiction, contradictionData, contradictionLog, setContradictionLog,
        followUps, processUtterance
    };
}
