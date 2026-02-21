'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DepthMeter from '@/components/DepthMeter';
import ContradictionAlert from '@/components/ContradictionAlert';
import SeverityBadge from '@/components/SeverityBadge';
import { MOCK_ANALYSIS, MOCK_INTERVIEW_ANALYSIS, TranscriptEntry } from '@/lib/mockData';
import {
    IconMic, IconMicOff, IconUser, IconUsers, IconZap,
    IconCheckCircle, IconAlertTriangle, IconCopy,
    IconArrowRight, IconMessageSquare, IconList,
    IconActivity, IconFlag, IconShieldAlert,
} from '@/components/Icons';

type Speaker = 'Panelist' | 'Candidate';

function detectQuestion(text: string, questions: any[]) {
    const lower = text.toLowerCase();
    let best: { id: string; confidence: number } | null = null;
    for (const q of questions) {
        if (!q.keywords?.length) continue;
        const hits = q.keywords.filter((kw: string) => lower.includes(kw.toLowerCase())).length;
        const confidence = Math.min(hits / Math.max(q.keywords.length * 0.3, 1), 1);
        if (confidence > 0.15 && (!best || confidence > best.confidence)) best = { id: q.id, confidence };
    }
    return best;
}

function mockScore(text: string, qId: string) {
    const len = text.split(/\s+/).length;
    const tech = (text.match(/\b(lru|ttl|redis|kafka|cassandra|latency|throughput|p99|sharding|replication|index|cache|queue|model|inference|api|architecture|database|system|design|trade-off|tradeoff|rollback|monitoring)\b/gi) || []).length;
    const depth = Math.min(len / 60 + tech * 0.08, 1);
    const score = Math.round(30 + depth * 65);
    const label = score >= 75 ? 'Strong' : score >= 55 ? 'Adequate' : score >= 40 ? 'Shallow' : 'Insufficient';
    const bluff = score >= 70 ? 'LOW' : score >= 50 ? 'MEDIUM' : 'HIGH';
    const mock = (MOCK_INTERVIEW_ANALYSIS as any)[qId];
    if (mock) return { score: mock.depthScore, label: mock.depthLabel, bluff: mock.bluffRisk };
    return { score, label, bluff };
}

/* Waveform */
function Waveform({ active }: { active: boolean }) {
    return (
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 24 }}>
            {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} style={{
                    display: 'inline-block', width: 3, borderRadius: 2,
                    background: active ? 'var(--green)' : 'rgba(255,255,255,0.12)',
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
function Bubble({ entry, isNew }: { entry: TranscriptEntry; isNew?: boolean }) {
    const isCandidate = entry.speaker === 'Candidate';
    return (
        <div className={isNew ? 'animate-fade-in' : ''} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', justifyContent: isCandidate ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
            {!isCandidate && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <IconUsers size={15} color="var(--accent-primary)" />
                </div>
            )}
            <div style={{ maxWidth: '78%' }}>
                <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.6rem', fontWeight: 600, color: isCandidate ? 'var(--text-secondary)' : 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, textAlign: isCandidate ? 'right' : 'left' }}>
                    {entry.speaker} · {entry.ts}
                </div>
                <div style={{
                    fontFamily: 'IBM Plex Sans', fontSize: '0.88rem', lineHeight: 1.72, padding: '12px 15px',
                    borderRadius: isCandidate ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isCandidate
                        ? (entry.flagged ? 'rgba(239,68,68,0.08)' : 'rgba(22,22,34,0.9)')
                        : 'rgba(99,102,241,0.07)',
                    border: entry.flagged ? '1px solid rgba(239,68,68,0.4)' : isCandidate ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(99,102,241,0.18)',
                    color: 'var(--text-primary)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: entry.flagged ? '0 0 20px rgba(239,68,68,0.1)' : isCandidate ? '0 2px 12px rgba(0,0,0,0.3)' : 'none',
                }}>
                    {entry.text}
                    {entry.flagged && (
                        <div style={{ marginTop: 9, paddingTop: 9, borderTop: '1px solid rgba(239,68,68,0.25)', fontFamily: 'IBM Plex Sans', fontSize: '0.7rem', color: 'var(--red)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <IconAlertTriangle size={13} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
                            {entry.flagReason}
                        </div>
                    )}
                </div>
            </div>
            {isCandidate && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: entry.flagged ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${entry.flagged ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <IconUser size={15} color={entry.flagged ? 'var(--red)' : 'var(--text-secondary)'} />
                </div>
            )}
        </div>
    );
}

function InterimBubble({ text, speaker }: { text: string; speaker: Speaker }) {
    if (!text) return null;
    const isCandidate = speaker === 'Candidate';
    return (
        <div style={{ display: 'flex', justifyContent: isCandidate ? 'flex-end' : 'flex-start', marginBottom: 13, opacity: 0.5 }}>
            <div style={{ maxWidth: '78%', fontFamily: 'IBM Plex Sans', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', fontStyle: 'italic' }}>
                {text}
                <span className="animate-cursor-blink" style={{ display: 'inline-block', width: 5, height: 14, background: 'var(--text-dim)', marginLeft: 3, verticalAlign: 'middle' }} />
            </div>
        </div>
    );
}

const tierClr = (t: string) => t === 'T1' ? 'var(--green)' : t === 'T2' ? 'var(--yellow)' : 'var(--red)';
const tierBg = (t: string) => t === 'T1' ? 'rgba(16,185,129,0.1)' : t === 'T2' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
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

    const [data] = useState(MOCK_ANALYSIS);
    const allQ = data.questionBank.flatMap((g: any) => g.questions);

    const [agentOn, setAgentOn] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [micError, setMicError] = useState<string | null>(null);
    const [secs, setSecs] = useState(0);
    const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>('Panelist');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [interim, setInterim] = useState('');
    const [detectedQId, setDetectedQId] = useState<string | null>(null);
    const [detectedConf, setDetectedConf] = useState(0);
    const [evaluations, setEvaluations] = useState<Record<string, any>>({});
    const [showContradiction, setShowContradiction] = useState(false);
    const [contradictionData, setContradictionData] = useState<any>(null);
    const [contradictionLog, setContradictionLog] = useState<any[]>([]);
    const candidateBuf = useRef<Record<string, string>>({});

    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const progress = Math.round((Object.keys(evaluations).length / allQ.length) * 100);

    useEffect(() => {
        if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }, [transcript, interim]);

    useEffect(() => () => { recognitionRef.current?.stop(); if (timerRef.current) clearInterval(timerRef.current); }, []);
    useEffect(() => { agentRef.current = agentOn; }, [agentOn]);
    useEffect(() => { speakerRef.current = currentSpeaker; }, [currentSpeaker]);

    const secsRef = useRef(secs);
    useEffect(() => { secsRef.current = secs; }, [secs]);

    const processUtterance = useCallback((text: string, speaker: Speaker, ts: string) => {
        const lower = text.toLowerCase();
        const det = detectQuestion(lower, allQ);
        let dQId = detectedQId;
        if (det) { dQId = det.id; setDetectedQId(det.id); setDetectedConf(det.confidence); }

        if (speaker === 'Candidate' && dQId) {
            candidateBuf.current[dQId] = (candidateBuf.current[dQId] || '') + ' ' + text;
            const combined = candidateBuf.current[dQId];
            if (combined.trim().split(/\s+/).length >= 12) {
                const { score, label, bluff } = mockScore(combined, dQId);
                const flagged = lower.includes('vendor') || lower.includes('integration side') || lower.includes('the team handled');
                if (flagged && dQId === 'q3') {
                    const cd = { resumeClaimed: 'Architected a real-time ML serving system handling 50M req/day at Scale AI', candidateSaid: text, severity: 'CRITICAL' };
                    setContradictionData(cd); setShowContradiction(true);
                }
                setEvaluations(p => ({ ...p, [dQId!]: { score, label, bluff, contradiction: flagged && dQId === 'q3', answeredAt: ts, snippet: text.slice(0, 130) } }));
            }
        }

        const suspicious = speaker === 'Candidate' && (lower.includes('vendor') || lower.includes('integration side') || lower.includes('the team handled') || lower.includes('i was more on'));
        const id = `e-${++entryCounter.current}`;
        newIdRef.current = id;
        setTranscript(p => [...p, { id, speaker, text, ts, flagged: suspicious, flagReason: suspicious ? 'Potential ownership discrepancy' : undefined }]);
    }, [allQ, detectedQId]);

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
            r.onerror = (e: any) => { if (e.error === 'not-allowed') { setMicError('Mic access denied. Allow microphone and retry.'); setAgentOn(false); } };
            r.onend = () => { if (agentRef.current) r.start(); else setIsListening(false); };
            recognitionRef.current = r; r.start();
            setAgentOn(true);
            timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);
        }
    }, [agentOn, processUtterance]);

    const detectedQ = allQ.find((q: any) => q.id === detectedQId);
    const latestEval = detectedQId ? evaluations[detectedQId] : null;

    return (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

            {showContradiction && contradictionData && (
                <ContradictionAlert resumeClaimed={contradictionData.resumeClaimed} candidateSaid={contradictionData.candidateSaid} severity={contradictionData.severity}
                    onDismiss={() => { setContradictionLog(p => [...p, contradictionData]); setShowContradiction(false); }} />
            )}

            {/* Progress */}
            <div style={{ height: 2, background: 'var(--border)', flexShrink: 0 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,var(--accent-primary),var(--accent-secondary))', transition: 'width 0.6s ease', boxShadow: '0 0 8px var(--accent-primary)' }} />
            </div>

            {/* ── AGENT BAR ─────────────────────────────────── */}
            <div style={{
                height: 58, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14,
                background: agentOn ? 'rgba(16,185,129,0.04)' : 'rgba(10,10,15,0.9)',
                backdropFilter: 'blur(20px)',
                borderBottom: `1px solid ${agentOn ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.05)'}`,
                transition: 'all 0.35s ease',
            }}>
                {/* Mic toggle button */}
                <button onClick={toggleAgent} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px', borderRadius: 10, flexShrink: 0,
                    background: agentOn ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${agentOn ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.1)'}`,
                    cursor: 'pointer', transition: 'all 0.28s ease',
                    boxShadow: agentOn ? '0 0 24px rgba(16,185,129,0.18), inset 0 1px 0 rgba(16,185,129,0.1)' : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}>
                    {/* Toggle pill */}
                    <div style={{ width: 40, height: 22, borderRadius: 11, background: agentOn ? 'var(--green)' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s', position: 'relative', flexShrink: 0, boxShadow: agentOn ? '0 0 10px rgba(16,185,129,0.4)' : 'none' }}>
                        <div style={{ position: 'absolute', top: 3, left: agentOn ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.28s cubic-bezier(0.16,1,0.3,1)', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
                    </div>
                    {agentOn ? <IconMic size={15} color="var(--green)" /> : <IconMicOff size={15} color="var(--text-dim)" />}
                    <span style={{ fontFamily: 'IBM Plex Sans', fontWeight: 700, fontSize: '0.85rem', color: agentOn ? 'var(--green)' : 'var(--text-secondary)' }}>
                        Agent {agentOn ? 'ON' : 'OFF'}
                    </span>
                    {agentOn && <PulseRing />}
                </button>

                {/* Waveform */}
                <Waveform active={agentOn && isListening} />

                {/* Status text */}
                <div style={{ flex: 1 }}>
                    {agentOn ? (
                        <div className="animate-fade-in">
                            <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.8rem', color: 'var(--green)', fontWeight: 500 }}>Listening & Transcribing Conversation...</div>
                            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: 'var(--text-dim)' }}>
                                Agent 3 · {fmt(secs)} · {transcript.length} utterances{contradictionLog.length > 0 && <span style={{ color: 'var(--red)', marginLeft: 8 }}>· {contradictionLog.length} flag{contradictionLog.length > 1 ? 's' : ''}</span>}
                            </div>
                        </div>
                    ) : (
                        <span style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.78rem', color: micError ? 'var(--red)' : 'var(--text-dim)' }}>
                            {micError ?? 'Enable Agent to begin passive listening & real-time evaluation'}
                        </span>
                    )}
                </div>

                {/* Speaker selector */}
                {agentOn && (
                    <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(17,17,24,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '5px 8px' }}>
                        <span className="section-label" style={{ paddingRight: 4, borderRight: '1px solid rgba(255,255,255,0.07)', marginRight: 4 }}>Speaker</span>
                        {(['Panelist', 'Candidate'] as Speaker[]).map(sp => (
                            <button key={sp} onClick={() => setCurrentSpeaker(sp)} style={{
                                padding: '4px 11px', borderRadius: 7, border: 'none', cursor: 'pointer',
                                fontFamily: 'IBM Plex Sans', fontWeight: 600, fontSize: '0.72rem',
                                background: currentSpeaker === sp ? (sp === 'Panelist' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.07)') : 'transparent',
                                color: currentSpeaker === sp ? (sp === 'Panelist' ? 'var(--accent-primary)' : 'var(--text-primary)') : 'var(--text-dim)',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: 5,
                            }}>
                                {sp === 'Panelist' ? <IconUsers size={12} color="currentColor" /> : <IconUser size={12} color="currentColor" />}
                                {sp}
                            </button>
                        ))}
                    </div>
                )}

                <button className="btn-accent" onClick={() => { sessionStorage.setItem('verdictData', JSON.stringify({ evaluations, contradictionLog })); router.push('/verdict'); }}
                    style={{ padding: '8px 16px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto', flexShrink: 0 }}>
                    Generate Verdict <IconArrowRight size={14} color="rgba(255,255,255,0.7)" />
                </button>
            </div>

            {/* ── THREE PANELS ──────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '234px 1fr 292px', flex: 1, minHeight: 0, overflow: 'hidden' }}>

                {/* LEFT — Question Bank */}
                <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', padding: '14px 12px', background: 'rgba(8,8,12,0.5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                        <IconList size={13} color="var(--text-dim)" />
                        <span className="section-label">Questions · <span style={{ color: 'var(--accent-primary)' }}>{Object.keys(evaluations).length}/{allQ.length}</span></span>
                    </div>
                    <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.5, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        Auto-detected from live conversation
                    </div>

                    {data.questionBank.map((group: any) => (
                        <div key={group.area} style={{ marginBottom: 14 }}>
                            <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 500, paddingBottom: 5, marginBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{group.area}</div>
                            {group.questions.map((q: any) => {
                                const isDetected = q.id === detectedQId;
                                const eval_ = evaluations[q.id];
                                return (
                                    <div key={q.id} style={{
                                        padding: '10px 11px', borderRadius: 10, marginBottom: 4,
                                        background: isDetected ? 'rgba(16,185,129,0.07)' : eval_ ? 'rgba(99,102,241,0.05)' : 'transparent',
                                        border: `1px solid ${isDetected ? 'rgba(16,185,129,0.3)' : eval_ ? 'rgba(99,102,241,0.18)' : 'transparent'}`,
                                        transition: 'all 0.3s ease',
                                        boxShadow: isDetected ? '0 0 16px rgba(16,185,129,0.08)' : 'none',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                            {isDetected && agentOn
                                                ? <PulseRing />
                                                : eval_
                                                    ? <IconCheckCircle size={12} color="var(--green)" />
                                                    : <div style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)' }} />
                                            }
                                            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', padding: '1px 5px', borderRadius: 4, background: tierBg(q.tier), color: tierClr(q.tier) }}>{q.tier}</span>
                                            {isDetected && agentOn && <span style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.58rem', color: 'var(--green)', fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>}
                                            {eval_ && !isDetected && <span style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.58rem', color: 'var(--accent-primary)', fontWeight: 700 }}>SCORED</span>}
                                        </div>
                                        <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.75rem', lineHeight: 1.45, color: isDetected ? 'var(--text-primary)' : eval_ ? 'var(--text-secondary)' : 'var(--text-dim)' }}>{q.preview}</div>
                                        {eval_ && (
                                            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.66rem', color: eval_.score >= 70 ? 'var(--green)' : eval_.score >= 50 ? 'var(--yellow)' : 'var(--red)', fontWeight: 600 }}>{eval_.score}/100</div>
                                                <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.6rem', color: 'var(--text-dim)' }}>{eval_.label}</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    <div style={{ padding: '10px 12px', background: 'rgba(10,10,15,0.6)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', marginTop: 4 }}>
                        <div className="section-label" style={{ marginBottom: 6 }}>{Object.keys(evaluations).length}/{allQ.length} addressed</div>
                        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-primary)', transition: 'width 0.5s ease' }} />
                        </div>
                    </div>
                </div>

                {/* CENTER — Transcript */}
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                    {/* Detected topic banner */}
                    <div style={{
                        padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0,
                        background: detectedQ && agentOn ? 'rgba(16,185,129,0.04)' : 'rgba(8,8,12,0.7)',
                        backdropFilter: 'blur(16px)',
                        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                        transition: 'background 0.4s', minHeight: 52,
                    }}>
                        {detectedQ && agentOn ? (
                            <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                                <PulseRing />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                                        Detected Q{detectedQ.id.slice(1)} · {Math.round(detectedConf * 100)}% match
                                    </div>
                                    <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 500 }}>{detectedQ.preview}</div>
                                </div>
                                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', padding: '2px 8px', borderRadius: 5, background: tierBg(detectedQ.tier), color: tierClr(detectedQ.tier) }}>{detectedQ.tier}</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <IconMessageSquare size={15} color="var(--text-dim)" />
                                {agentOn
                                    ? <span style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.78rem', color: 'var(--green)' }}>Listening — matching question from bank...</span>
                                    : <span style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.78rem', color: 'var(--text-dim)' }}>Enable Agent to start passive evaluation</span>
                                }
                            </div>
                        )}
                        <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'var(--text-dim)' }}>{transcript.length} utterances</span>
                    </div>

                    {/* Feed */}
                    <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
                        {transcript.length === 0 && !interim && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, textAlign: 'center' }}>
                                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconMic size={28} color="rgba(99,102,241,0.4)" />
                                </div>
                                <div style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '1rem', color: 'var(--text-secondary)' }}>Agent is standing by</div>
                                <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.83rem', color: 'var(--text-dim)', maxWidth: 300, lineHeight: 1.7 }}>
                                    Enable the Agent to begin passive listening. The AI will auto-detect which questions are being answered and score responses in real-time.
                                </div>
                                <button className="btn-accent" onClick={toggleAgent} style={{ padding: '10px 22px', fontSize: '0.87rem', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                    <IconMic size={16} color="rgba(255,255,255,0.8)" /> Enable Passive Listening
                                </button>
                            </div>
                        )}
                        {transcript.map(entry => <Bubble key={entry.id} entry={entry} isNew={entry.id === newIdRef.current} />)}
                        <InterimBubble text={interim} speaker={currentSpeaker} />
                        {agentOn && transcript.length > 0 && !interim && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.14)', marginTop: 4 }}>
                                <PulseRing />
                                <span style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.74rem', color: 'var(--green)' }}>
                                    Listening · <span style={{ color: 'var(--text-dim)' }}>currently labeling as</span> <strong style={{ color: 'var(--text-secondary)' }}>{currentSpeaker}</strong>
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT — AI Analysis */}
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', padding: '14px 16px', background: 'rgba(8,8,12,0.4)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <IconActivity size={13} color="var(--text-dim)" />
                        <span className="section-label">Live Analysis · Agent 3</span>
                    </div>

                    {!latestEval && !detectedQId && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: '28px 0' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconZap size={20} color="rgba(99,102,241,0.4)" />
                            </div>
                            <p style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.65, maxWidth: 180 }}>Analysis appears automatically as candidate answers questions</p>
                        </div>
                    )}

                    {detectedQId && !latestEval && agentOn && (
                        <div className="animate-fade-in glass-green" style={{ padding: '14px', borderRadius: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <PulseRing />
                                <span style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.76rem', color: 'var(--green)', fontWeight: 600 }}>Evaluating response...</span>
                            </div>
                            <p style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Listening to candidate answer: <em style={{ color: 'var(--text-primary)' }}>{detectedQ?.preview}</em>
                            </p>
                            <div style={{ marginTop: 12, height: 2, borderRadius: 1, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                                <div style={{ height: '100%', background: 'var(--green)', animation: 'shimmer 1.8s linear infinite', backgroundImage: 'linear-gradient(90deg, transparent 25%, rgba(16,185,129,0.6) 50%, transparent 75%)', backgroundSize: '200% 100%' }} />
                            </div>
                        </div>
                    )}

                    {latestEval && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                            <DepthMeter score={latestEval.score} label={latestEval.label} />

                            {/* Bluff risk */}
                            <div className="card-glass" style={{ padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: `2px solid ${bluffClr[latestEval.bluff] || 'var(--yellow)'}` }}>
                                <div style={{ width: 11, height: 11, borderRadius: '50%', background: bluffClr[latestEval.bluff] || 'var(--yellow)', boxShadow: `0 0 10px ${bluffClr[latestEval.bluff]}`, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div className="section-label" style={{ marginBottom: 2 }}>Bluff Risk</div>
                                    <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '0.95rem', color: bluffClr[latestEval.bluff] || 'var(--yellow)' }}>{latestEval.bluff}</div>
                                </div>
                                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                                    <div className="section-label" style={{ marginBottom: 2 }}>Scored</div>
                                    {latestEval.answeredAt}
                                </div>
                            </div>

                            {/* Contradiction */}
                            {latestEval.contradiction && (
                                <div className="glass-red" style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <IconShieldAlert size={18} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
                                    <div>
                                        <div style={{ fontFamily: 'IBM Plex Sans', fontWeight: 600, fontSize: '0.78rem', color: 'var(--red)', marginBottom: 5 }}>Contradiction Detected</div>
                                        <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>Answer conflicts with resume. Flagged in transcript.</div>
                                    </div>
                                </div>
                            )}

                            {/* Snippet */}
                            {latestEval.snippet && (
                                <div className="card-glass" style={{ padding: '13px 15px', borderLeft: '2px solid var(--accent-primary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span className="section-label" style={{ color: 'var(--accent-primary)' }}>Evaluated Snippet</span>
                                        <button className="btn-icon" onClick={() => navigator.clipboard.writeText(latestEval.snippet)} style={{ width: 28, height: 28 }}>
                                            <IconCopy size={13} color="currentColor" />
                                        </button>
                                    </div>
                                    <p style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.78rem', lineHeight: 1.65, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{latestEval.snippet}"</p>
                                </div>
                            )}

                            {/* Contradiction log */}
                            {contradictionLog.length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                        <IconFlag size={13} color="var(--red)" />
                                        <span className="section-label" style={{ color: 'var(--red)' }}>Contradictions ({contradictionLog.length})</span>
                                    </div>
                                    {contradictionLog.map((c, i) => (
                                        <div key={i} style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 9, padding: '10px 12px', marginBottom: 6 }}>
                                            <SeverityBadge severity={c.severity} />
                                            <div style={{ marginTop: 6, fontFamily: 'IBM Plex Sans', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.resumeClaimed?.slice(0, 62)}...</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {Object.keys(evaluations).length > 1 && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                        <IconActivity size={13} color="var(--text-dim)" />
                                        <span className="section-label">All Scores</span>
                                    </div>
                                    {allQ.filter((q: any) => evaluations[q.id]).map((q: any) => {
                                        const e = evaluations[q.id];
                                        return (
                                            <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, padding: '7px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                                                <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.73rem', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.preview.slice(0, 32)}...</div>
                                                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', fontWeight: 700, color: e.score >= 70 ? 'var(--green)' : e.score >= 50 ? 'var(--yellow)' : 'var(--red)', flexShrink: 0 }}>{e.score}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`@media(max-width:1000px){div[style*="grid-template-columns: 234px"]{grid-template-columns:1fr!important}}`}</style>
        </div>
    );
}
