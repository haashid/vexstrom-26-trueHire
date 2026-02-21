'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import DepthMeter from '@/components/DepthMeter';
import ContradictionAlert from '@/components/ContradictionAlert';
import SeverityBadge from '@/components/SeverityBadge';
import { TranscriptEntry } from '@/lib/mockData';
import {
    IconMic, IconMicOff, IconUser, IconUsers, IconZap,
    IconCheckCircle, IconAlertTriangle, IconCopy,
    IconArrowRight, IconMessageSquare, IconList,
    IconActivity, IconFlag, IconShieldAlert,
} from '@/components/Icons';
import { evaluateAnswer, identifySpeaker } from '@/lib/api';

type Speaker = 'Panelist' | 'Candidate';

interface QuestionMatch { id: string; confidence: number; index: number; }

function detectQuestion(text: string, questions: any[]): QuestionMatch | null {
    const lower = text.toLowerCase();
    let best: QuestionMatch | null = null;

    questions.forEach((q, idx) => {
        if (!q.keywords?.length) return;
        // Count how many unique keywords are present
        const hits = q.keywords.filter((kw: string) => lower.includes(kw.toLowerCase())).length;
        const confidence = hits / Math.max(q.keywords.length * 0.4, 1);

        // Boost if the exact question text is largely present
        const exactMatchChance = q.full.toLowerCase().split(/\s+/).filter((w: string) => lower.includes(w)).length / q.full.split(/\s+/).length;
        const totalConf = Math.min(confidence + (exactMatchChance * 0.5), 1);

        if (totalConf > 0.25 && (!best || totalConf > best.confidence)) {
            best = { id: q.id, confidence: totalConf, index: idx };
        }
    });

    return best;
}

/* Waveform */
function Waveform({ active }: { active: boolean }) {
    return (
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 24 }}>
            {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} style={{
                    display: 'inline-block', width: 3, borderRadius: 2,
                    background: active ? 'var(--green)' : 'rgba(15,23,42,0.12)',
                    boxShadow: active ? '0 0 4px var(--green)' : 'none',
                    height: `${(Math.sin(i * 0.7) * 0.4 + 0.6) * 16}px`,
                    animation: active ? `wbar 1.4s ease-in-out ${i * 0.1}s infinite` : 'none',
                    transition: 'background 0.3s',
                }} />
            ))}
            <style>{`@keyframes wbar{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}`}</style>
        </div>
    );
}

/* Pulse ring */
function PulseRing({ color = 'var(--green)' }: { color?: string }) {
    return (
        <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10, flexShrink: 0 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: 0.35, animation: 'pring 1.4s ease-out infinite' }} />
            <span style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
            <style>{`@keyframes pring{0%{transform:scale(1);opacity:.5}70%{transform:scale(2.2);opacity:0}100%{transform:scale(2.2);opacity:0}}`}</style>
        </span>
    );
}

/* Chat bubble */
function Bubble({ entry, isNew }: { entry: any; isNew?: boolean }) {
    const isCandidate = entry.speaker === 'Candidate';
    return (
        <div className={isNew ? 'animate-fade-in' : ''} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: isCandidate ? 'flex-end' : 'flex-start', marginBottom: 20 }}>
            {!isCandidate && (
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
                    <IconUsers size={18} color="#fff" />
                </div>
            )}
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', fontWeight: 600, color: isCandidate ? 'var(--text-dim)' : 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, textAlign: isCandidate ? 'right' : 'left' }}>
                {entry.speaker} · {entry.ts}
            </div>
            <div style={{
                maxWidth: '75%',
                padding: '14px 20px',
                borderRadius: isCandidate ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                background: isCandidate ? 'var(--accent-primary)' : 'var(--bg-card)',
                border: isCandidate ? 'none' : '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                color: isCandidate ? '#fff' : 'var(--text-primary)',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.92rem',
                lineHeight: 1.6
            }}>
                {entry.text}
                {entry.flagged && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--red)20', fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconAlertTriangle size={14} /> {entry.flagReason || 'Potential discrepancy detected'}
                    </div>
                )}
            </div>
            {isCandidate && (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: entry.flagged ? 'var(--red)10' : 'var(--border)', border: `1px solid ${entry.flagged ? 'var(--red)30' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <IconUser size={16} color={entry.flagged ? 'var(--red)' : 'var(--text-secondary)'} />
                </div>
            )}
        </div>
    );
}

function InterimBubble({ text, speaker }: { text: string; speaker: Speaker }) {
    if (!text) return null;
    const isCandidate = speaker === 'Candidate';
    return (
        <div style={{ display: 'flex', justifyContent: isCandidate ? 'flex-end' : 'flex-start', marginBottom: 16, opacity: 0.6 }}>
            <div style={{ maxWidth: '75%', fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '12px 18px', borderRadius: 16, background: 'var(--bg-primary)', border: '1px dashed var(--border)', fontStyle: 'italic' }}>
                {text}
                <span className="animate-cursor-blink" style={{ display: 'inline-block', width: 2, height: 16, background: 'var(--accent-primary)', marginLeft: 4, verticalAlign: 'middle' }} />
            </div>
        </div>
    );
}

const tierClr = (t: string) => t === 'T1' ? 'var(--green)' : t === 'T2' ? 'var(--yellow)' : 'var(--red)';
const tierBg = (t: string) => t === 'T1' ? 'var(--green)15' : t === 'T2' ? 'var(--yellow)15' : 'var(--red)15';
const bluffClr: Record<string, string> = { LOW: 'var(--green)', MEDIUM: 'var(--yellow)', HIGH: 'var(--red)' };

export default function InterviewPage() {
    const router = useRouter();
    const feedRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const entryCounter = useRef(0);
    const newIdRef = useRef<string | null>(null);
    const agentRef = useRef(false);
    const speakerRef = useRef<Speaker>('Panelist');

    const [data, setData] = useState<any>(null);
    const [allQ, setAllQ] = useState<any[]>([]);

    const [agentOn, setAgentOn] = useState(false);
    const [autoSwitch, setAutoSwitch] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [micError, setMicError] = useState<string | null>(null);
    const [secs, setSecs] = useState(0);
    const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>('Panelist');
    const [transcript, setTranscript] = useState<any[]>([]);
    const [interim, setInterim] = useState('');
    const [detectedQId, setDetectedQId] = useState<string | null>(null);
    const [nextQIndex, setNextQIndex] = useState<number>(0);
    const [detectedConf, setDetectedConf] = useState(0);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluations, setEvaluations] = useState<Record<string, any>>({});
    const [showContradiction, setShowContradiction] = useState(false);
    const [contradictionData, setContradictionData] = useState<any>(null);
    const [contradictionLog, setContradictionLog] = useState<any[]>([]);
    const [followUps, setFollowUps] = useState<string[]>([]);

    useScrollReveal([data, transcript, followUps]);

    const candidateBuf = useRef<Record<string, string>>({});

    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const progress = allQ.length > 0 ? Math.round((Object.keys(evaluations).length / allQ.length) * 100) : 0;

    useEffect(() => {
        const stored = sessionStorage.getItem('analysisData');
        if (stored) {
            const parsed = JSON.parse(stored);
            setData(parsed);
            setAllQ(parsed.questionBank.flatMap((g: any) => g.questions));
        } else {
            router.push('/');
        }
    }, [router]);

    useEffect(() => {
        if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }, [transcript, interim]);

    useEffect(() => () => { recognitionRef.current?.stop(); if (timerRef.current) clearInterval(timerRef.current); }, []);
    useEffect(() => { agentRef.current = agentOn; }, [agentOn]);
    useEffect(() => { speakerRef.current = currentSpeaker; }, [currentSpeaker]);

    const secsRef = useRef(secs);
    useEffect(() => { secsRef.current = secs; }, [secs]);

    const processUtterance = useCallback(async (text: string, speaker: Speaker, ts: string) => {
        let activeSpeaker = speaker;

        // Auto-switch speaker using backend intelligence
        if (autoSwitch) {
            try {
                const history = transcript.slice(-5).map(e => ({
                    role: e.speaker === 'Panelist' ? 'interviewer' : 'candidate',
                    content: e.text
                }));
                const idResult = await identifySpeaker({ utterance: text, transcript: history });
                if (idResult.confidence > 0.6) {
                    activeSpeaker = idResult.speaker === 'interviewer' ? 'Panelist' : 'Candidate';
                    setCurrentSpeaker(activeSpeaker);
                }
            } catch (err) {
                console.warn("Auto-speaker identification failed, falling back to manual selection.", err);
            }
        }

        const lower = text.toLowerCase();
        const det = detectQuestion(lower, allQ);
        let dQId = detectedQId;
        if (det) {
            dQId = det.id;
            setDetectedQId(det.id);
            setDetectedConf(det.confidence);
            setNextQIndex(det.index + 1); // Suggest next one
            setFollowUps([]); // Reset follow ups when a new main question is detected
        }

        const transcriptId = `e-${++entryCounter.current}`;
        newIdRef.current = transcriptId;

        const newEntry = {
            id: transcriptId,
            speaker: activeSpeaker,
            text,
            ts,
            flagged: false,
        };

        setTranscript(p => [...p, newEntry]);

        if (activeSpeaker === 'Candidate' && dQId) {
            candidateBuf.current[dQId] = (candidateBuf.current[dQId] || '') + ' ' + text;
            const combined = candidateBuf.current[dQId];

            // Only trigger evaluation if we have enough context (30+ words) and aren't already evaluating
            const wordCount = combined.trim().split(/\s+/).length;
            if (wordCount >= 30 && !isEvaluating) {
                try {
                    const currentQ = allQ.find(q => q.id === dQId);
                    const history = [...transcript, newEntry].map(e => ({
                        role: e.speaker === 'Panelist' ? 'interviewer' : 'candidate',
                        content: e.text
                    }));

                    setIsEvaluating(true);
                    const evalResult = await evaluateAnswer({
                        question: currentQ?.full || '',
                        transcript: history,
                        resume_claims: data.redFlags.map((rf: any) => rf.claim)
                    });

                    if (evalResult.contradiction_flag) {
                        setContradictionData({
                            resumeClaimed: evalResult.contradiction_detail || 'Resume claim discrepancy',
                            candidateSaid: text,
                            severity: 'CRITICAL'
                        });
                        setShowContradiction(true);
                    }

                    if (evalResult.follow_up_questions?.length > 0) {
                        setFollowUps(evalResult.follow_up_questions);
                    }

                    setEvaluations(p => ({
                        ...p,
                        [dQId!]: {
                            score: Math.round(evalResult.depth_score * 10),
                            label: evalResult.label,
                            bluff: evalResult.bluff_likelihood > 0.6 ? 'HIGH' : evalResult.bluff_likelihood > 0.3 ? 'MEDIUM' : 'LOW',
                            contradiction: evalResult.contradiction_flag,
                            feedback: evalResult.technical_feedback,
                            assessment: evalResult.detailed_assessment,
                            answeredAt: ts,
                            snippet: text.slice(0, 150) + '...'
                        }
                    }));
                } catch (err) {
                    console.error("Evaluation failed", err);
                } finally {
                    setIsEvaluating(false);
                }
            }
        }
    }, [allQ, detectedQId, transcript, data]);

    const toggleAgent = useCallback(() => {
        if (agentOn) {
            recognitionRef.current?.stop();
            setAgentOn(false); setIsListening(false); setInterim('');
            if (timerRef.current) clearInterval(timerRef.current);
        } else {
            setMicError(null);
            const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SR) { setMicError('Speech recognition requires Chrome or Edge.'); return; }
            const r = new SR();
            r.continuous = true; r.interimResults = true; r.lang = 'en-US';
            r.onstart = () => setIsListening(true);
            r.onresult = (event: any) => {
                let interim_ = '', final_ = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const t = event.results[i][0].transcript;
                    if (event.results[i].isFinal) final_ += t; else interim_ += t;
                }
                setInterim(interim_);
                if (final_.trim()) { setInterim(''); processUtterance(final_.trim(), speakerRef.current, fmt(secsRef.current)); }
            };
            r.onerror = (e: any) => {
                // Ignore non-critical errors like silence, manual aborts, or temporary capture issues
                if (e.error === 'no-speech' || e.error === 'audio-capture' || e.error === 'aborted') return;

                console.error("Speech Recognition Error:", e.error);
                if (e.error === 'not-allowed') {
                    setMicError('Mic access denied. Allow microphone and retry.');
                    setAgentOn(false);
                } else if (e.error === 'network') {
                    setMicError('Network error. Check connection.');
                }
            };
            r.onend = () => {
                if (agentRef.current) {
                    try { r.start(); } catch (e) { console.error("Failed to restart recognition", e); }
                } else {
                    setIsListening(false);
                }
            };
            recognitionRef.current = r; r.start();
            setAgentOn(true);
            timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);
        }
    }, [agentOn, processUtterance, autoSwitch, transcript]);

    const detectedQ = allQ.find((q: any) => q.id === detectedQId);
    const latestEval = detectedQId ? evaluations[detectedQId] : null;

    if (!data) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%' }} className="animate-spin" />
            <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Initializing secure terminal...</p>
        </div>
    );

    return (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', overflow: 'hidden', background: 'var(--bg-primary)' }}>

            {showContradiction && contradictionData && (
                <ContradictionAlert
                    resumeClaimed={contradictionData.resumeClaimed}
                    candidateSaid={contradictionData.candidateSaid}
                    severity={contradictionData.severity}
                    onDismiss={() => { setContradictionLog(p => [...p, contradictionData]); setShowContradiction(false); }}
                />
            )}

            {/* Progress Bar */}
            <div style={{ height: 2, background: 'var(--border)', flexShrink: 0 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-primary)', transition: 'width 0.6s ease', boxShadow: '0 0 10px var(--accent-primary)40' }} />
            </div>

            {/* ── AGENT BAR ─────────────────────────────────── */}
            <div style={{
                height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
                background: agentOn ? 'var(--green)03' : 'var(--bg-secondary)',
                borderBottom: `1px solid ${agentOn ? 'var(--green)20' : 'var(--border)'}`,
                transition: 'all 0.35s ease',
            }}>
                {/* Mic toggle */}
                <button onClick={toggleAgent} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px', borderRadius: 12,
                    background: agentOn ? 'var(--green)10' : 'var(--bg-primary)',
                    border: `1.5px solid ${agentOn ? 'var(--green)40' : 'var(--border)'}`,
                    cursor: 'pointer', transition: 'all 0.25s',
                    boxShadow: agentOn ? '0 0 20px var(--green)15' : 'none',
                }}>
                    <div style={{ width: 36, height: 20, borderRadius: 10, background: agentOn ? 'var(--green)' : 'var(--border)', position: 'relative', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: 3, left: agentOn ? 19 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.25s cubic-bezier(0.16,1,0.3,1)' }} />
                    </div>
                    {agentOn ? <IconMic size={16} color="var(--green)" /> : <IconMicOff size={16} color="var(--text-dim)" />}
                    <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.88rem', color: agentOn ? 'var(--green)' : 'var(--text-secondary)' }}>
                        AI Listening {agentOn ? 'Active' : 'Standby'}
                    </span>
                </button>

                <Waveform active={agentOn && isListening} />

                <div style={{ flex: 1 }}>
                    {agentOn ? (
                        <div className="reveal">
                            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--green)', fontWeight: 500 }}>Real-time Transcription & Intelligence Synthesis</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                                ELI-32 // {fmt(secs)} // {transcript.length} UTTERANCES // {contradictionLog.length} FLAGS
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: micError ? 'var(--red)' : 'var(--text-dim)' }}>
                                {micError ?? 'Enable AI Assistant to begin passive evaluation and bluff detection.'}
                            </span>
                            {!micError && !agentOn && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 20 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>SYSTEM READY</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: autoSwitch ? 'var(--accent-primary)' : 'var(--text-dim)', textTransform: 'uppercase' }}>Auto ID</span>
                        <button onClick={() => setAutoSwitch(!autoSwitch)} style={{ width: 32, height: 16, borderRadius: 10, background: autoSwitch ? 'var(--accent-primary)' : 'var(--border)', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
                            <div style={{ position: 'absolute', top: 2, left: autoSwitch ? 18 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                        </button>
                    </div>

                    {agentOn && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '4px' }}>
                            {(['Panelist', 'Candidate'] as Speaker[]).map(sp => (
                                <button key={sp} onClick={() => setCurrentSpeaker(sp)} style={{
                                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.75rem',
                                    background: currentSpeaker === sp ? (sp === 'Panelist' ? 'var(--accent-primary)15' : 'var(--text-primary)10') : 'transparent',
                                    color: currentSpeaker === sp ? (sp === 'Panelist' ? 'var(--accent-primary)' : 'var(--text-primary)') : 'var(--text-dim)',
                                    transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    {sp === 'Panelist' ? <IconUsers size={14} /> : <IconUser size={14} />}
                                    {sp}
                                </button>
                            ))}
                        </div>
                    )}

                    <button className="btn-accent"
                        onClick={() => { sessionStorage.setItem('verdictData', JSON.stringify({ evaluations, contradictionLog })); router.push('/verdict'); }}
                        style={{ padding: '10px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}
                    >
                        Conclude Interview <IconArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* ── THREE PANELS ──────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr 340px', flex: 1, minHeight: 0, overflow: 'hidden' }}>

                {/* LEFT — Question Bank Sidebar */}
                <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '20px', background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <IconList size={16} color="var(--accent-primary)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                            Question Bank ({Object.keys(evaluations).length}/{allQ.length})
                        </span>
                    </div>

                    {data.questionBank.map((group: any) => (
                        <div key={group.area} style={{ marginBottom: 24 }}>
                            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, paddingBottom: 8, marginBottom: 12, borderBottom: '1px solid var(--border)', textTransform: 'uppercase' }}>
                                {group.area}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {group.questions.map((q: any) => {
                                    const isDetected = q.id === detectedQId;
                                    const eval_ = evaluations[q.id];
                                    return (
                                        <div key={q.id} style={{
                                            padding: '12px', borderRadius: 10,
                                            background: isDetected ? 'var(--green)08' : eval_ ? 'var(--bg-primary)' : 'transparent',
                                            border: `1px solid ${isDetected ? 'var(--green)40' : eval_ ? 'var(--border)' : 'transparent'}`,
                                            transition: 'all 0.3s',
                                            cursor: 'default',
                                            marginBottom: 4
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                {isDetected && agentOn ? <PulseRing /> : eval_ ? <IconCheckCircle size={14} color="var(--green)" /> : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid var(--border)' }} />}
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', padding: '2px 6px', borderRadius: 4, background: tierBg(q.tier), color: tierClr(q.tier) }}>{q.tier}</span>
                                                {isDetected && <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', color: 'var(--green)', fontWeight: 700 }}>ACTIVE</span>}
                                            </div>
                                            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', lineHeight: 1.6, color: isDetected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isDetected ? 500 : 400 }}>
                                                {q.full || q.question_text || q.preview}
                                            </div>
                                            {eval_ && (
                                                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)50' }}>
                                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: eval_.score >= 70 ? 'var(--green)' : eval_.score >= 50 ? 'var(--yellow)' : 'var(--red)', fontWeight: 700 }}>{eval_.score}/100</div>
                                                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>{eval_.label}</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* CENTER — Transcription & AI Suggestions */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 24px 24px' }}>

                    {/* ── AI RECOMMENDATION BAR ── */}
                    {allQ[nextQIndex] && (
                        <div className="reveal delay-1" style={{ marginBottom: 20, padding: '14px 20px', background: 'var(--accent-soft)', border: '1px solid var(--accent-primary)20', borderRadius: 12, display: 'flex', gap: 16, alignItems: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.06)' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <IconZap size={18} color="#fff" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Next Recommended Step</div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{allQ[nextQIndex].full}</div>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(allQ[nextQIndex].full);
                                }}
                                style={{ padding: '8px 14px', background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            >
                                <IconCopy size={14} /> Copy
                            </button>
                        </div>
                    )}

                    {/* Header: Active Context */}
                    <div style={{
                        padding: '16px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0,
                        background: detectedQ && agentOn ? 'var(--green)03' : 'var(--bg-secondary)50',
                        display: 'flex', alignItems: 'center', gap: 16, minHeight: 64,
                    }}>
                        {detectedQ && agentOn ? (
                            <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
                                <IconZap size={20} color="var(--green)" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                                        Analyzing Context // Match: {Math.round(detectedConf * 100)}%
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{detectedQ.preview}</div>
                                </div>
                                <div style={{ padding: '4px 10px', borderRadius: 6, background: tierBg(detectedQ.tier), color: tierClr(detectedQ.tier), fontSize: '0.7rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{detectedQ.tier}</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <IconMessageSquare size={18} color="var(--text-dim)" />
                                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--text-dim)' }}>AI is listening for question context...</span>
                            </div>
                        )}
                    </div>

                    {/* Feed */}
                    <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                        {transcript.length === 0 && !interim && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, textAlign: 'center' }}>
                                <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--accent-primary)05', border: '1px solid var(--accent-primary)20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconMic size={32} color="var(--accent-primary)" />
                                </div>
                                <div style={{ maxWidth: 320 }}>
                                    <h2 style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 8 }}>Terminal Ready</h2>
                                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        Launch AI Assistant to begin real-time transcription and deep technical evaluation.
                                    </p>
                                </div>
                                <button className="btn-accent" onClick={toggleAgent} style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                                    Launch AI Assistant
                                </button>
                            </div>
                        )}
                        {transcript.map(entry => <Bubble key={entry.id} entry={entry} isNew={entry.id === newIdRef.current} />)}
                        <InterimBubble text={interim} speaker={currentSpeaker} />
                    </div>

                    {/* Footer: AI Suggestions */}
                    {followUps.length > 0 && agentOn && (
                        <div className="reveal" style={{ padding: '16px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <IconZap size={14} color="var(--accent-primary)" />
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Suggested Follow-ups</span>
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {followUps.map((q, i) => (
                                    <button key={i} onClick={() => navigator.clipboard.writeText(q)} style={{
                                        background: 'var(--bg-primary)', border: '1px solid var(--accent-primary)30', padding: '8px 14px', borderRadius: 8,
                                        fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                                        fontFamily: 'var(--font-inter)'
                                    }}>
                                        {q} <IconCopy size={12} color="var(--accent-primary)" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT — Deep Analysis */}
                <div style={{ borderLeft: '1px solid var(--border)', overflowY: 'auto', padding: '20px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <IconActivity size={16} color="var(--accent-primary)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>Live Intelligence</span>
                    </div>

                    {!latestEval && !detectedQId && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: '40px 20px', background: 'var(--bg-primary)', borderRadius: 16, border: '1px solid var(--border)' }}>
                            <IconShieldAlert size={32} color="var(--border)" />
                            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                                Strategic analysis will populate here once conversation context is established.
                            </p>
                        </div>
                    )}

                    {detectedQId && !latestEval && agentOn && (
                        <div className="reveal" style={{ padding: '20px', borderRadius: 16, background: 'var(--green)05', border: '1px solid var(--green)20' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <PulseRing />
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--green)' }}>Synthesizing Response...</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                                Evaluating technical depth and checking for inconsistencies against resume profile.
                            </div>
                            <div style={{ height: 4, background: 'var(--green)20', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: 'var(--green)', width: '30%', animation: 'shimmer 1.5s infinite linear', backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', backgroundSize: '100% 100%' }} />
                            </div>
                        </div>
                    )}

                    {isEvaluating && (
                        <div className="animate-fade-in" style={{ padding: '16px', borderRadius: 16, background: 'var(--accent-primary)05', border: '1px solid var(--accent-primary)20', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)' }}>AI is thinking...</span>
                        </div>
                    )}

                    {latestEval && (
                        <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <DepthMeter score={latestEval.score} label={latestEval.label} />

                            <div style={{ padding: '16px', borderRadius: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderLeft: `4px solid ${bluffClr[latestEval.bluff]}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Bluff Risk</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)' }}>{latestEval.answeredAt}</span>
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: bluffClr[latestEval.bluff] }}>{latestEval.bluff}</div>
                            </div>
                            {/* Technical Assessment */}
                            {latestEval?.technical_feedback && (
                                <div style={{ padding: '16px', borderRadius: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderLeft: '4px solid var(--accent-primary)' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: 8 }}>Technical Feedback</div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{latestEval.technical_feedback}</p>

                                    {latestEval.detailed_assessment && (
                                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Detailed Assessment</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', marginBottom: 4 }}>Strengths</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{latestEval.detailed_assessment.strengths}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', marginBottom: 4 }}>Weaknesses</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{latestEval.detailed_assessment.weaknesses}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {latestEval.contradiction && (
                                <div style={{ padding: '16px', borderRadius: 16, background: 'var(--red)05', border: '1px solid var(--red)20', display: 'flex', gap: 12 }}>
                                    <IconShieldAlert size={20} color="var(--red)" style={{ flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>Profile Discrepancy</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Candidate answer conflicts with verified credentials. Flagged for review.</div>
                                    </div>
                                </div>
                            )}

                            <div style={{ padding: '16px', borderRadius: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Evidence Snippet</span>
                                    <button className="btn-icon" onClick={() => navigator.clipboard.writeText(latestEval.snippet)} style={{ width: 28, height: 28, borderRadius: 6 }}>
                                        <IconCopy size={13} />
                                    </button>
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', background: 'var(--bg-secondary)', padding: '12px', borderRadius: 8 }}>
                                    "{latestEval.snippet}"
                                </div>
                            </div>
                        </div>
                    )}

                    {contradictionLog.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <IconFlag size={14} color="var(--red)" />
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase' }}>Contradiction Log ({contradictionLog.length})</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {contradictionLog.map((c, i) => (
                                    <div key={i} style={{ padding: '12px', background: 'var(--red)05', border: '1px solid var(--red)15', borderRadius: 10 }}>
                                        <SeverityBadge severity={c.severity} />
                                        <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.resumeClaimed}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                @keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                .animate-cursor-blink { animation: cursor-blink 1s infinite; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
