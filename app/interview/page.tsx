/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DepthMeter from '@/components/DepthMeter';
import ContradictionAlert from '@/components/ContradictionAlert';
import SeverityBadge from '@/components/SeverityBadge';
import { TranscriptEntry } from '@/lib/mockData';
import { processTurn, transcribeAudio } from '@/lib/api';
import {
    IconMic, IconMicOff, IconUser, IconUsers, IconZap,
    IconCheckCircle, IconAlertTriangle, IconCopy,
    IconArrowRight, IconMessageSquare, IconList,
    IconActivity, IconFlag, IconShieldAlert,
} from '@/components/Icons';

type Speaker = 'Panelist' | 'Candidate';

// ── UI sub-components ───────────────────────────────────────────────

function Waveform({ active }: { active: boolean }) {
    return (
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 24 }}>
            {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} style={{
                    display: 'inline-block', width: 3, borderRadius: 2,
                    background: active ? 'var(--green)' : 'rgba(255,255,255,0.1)',
                    boxShadow: active ? '0 0 4px var(--green)' : 'none',
                    height: `${(Math.sin(i * 0.8) * 0.4 + 0.6) * 18}px`,
                    animation: active ? `wbar 1.4s ease-in-out ${i * 0.1}s infinite` : 'none',
                }} />
            ))}
            <style>{`@keyframes wbar{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}`}</style>
        </div>
    );
}

function PulseRing({ color = 'var(--green)' }: { color?: string }) {
    return (
        <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10, flexShrink: 0 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: 0.35, animation: 'pring 1.4s ease-out infinite' }} />
            <span style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
            <style>{`@keyframes pring{0%{transform:scale(1);opacity:.5}70%{transform:scale(2.4);opacity:0}100%{transform:scale(2.4);opacity:0}}`}</style>
        </span>
    );
}

// Mini inline bar graph for bluff level
function BluffBar({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' }) {
    const pct = level === 'LOW' ? 25 : level === 'MEDIUM' ? 60 : 92;
    const clr = level === 'LOW' ? 'var(--green)' : level === 'MEDIUM' ? 'var(--yellow)' : 'var(--red)';
    return (
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bluff Risk</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.72rem', color: clr, fontWeight: 700 }}>{level}</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: clr, borderRadius: 3, transition: 'width 0.6s ease', boxShadow: `0 0 6px ${clr}` }} />
            </div>
        </div>
    );
}

// Confidence donut ring
function ConfidenceRing({ score, label }: { score: number; label: string }) {
    const r = 28, c = 2 * Math.PI * r;
    const clr = score >= 70 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width={70} height={70} viewBox="0 0 70 70" style={{ flexShrink: 0 }}>
                <circle cx={35} cy={35} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                <circle cx={35} cy={35} r={r} fill="none" stroke={clr} strokeWidth={6}
                    strokeDasharray={c} strokeDashoffset={c - (c * score / 100)}
                    strokeLinecap="round" transform="rotate(-90 35 35)"
                    style={{ filter: `drop-shadow(0 0 6px ${clr})`, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                <text x={35} y={35} dominantBaseline="middle" textAnchor="middle" fill={clr}
                    fontSize={13} fontWeight={700} fontFamily="monospace">{score}</text>
            </svg>
            <div>
                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Depth Score</div>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.88rem', color: clr }}>{label}</div>
            </div>
        </div>
    );
}

function Bubble({ entry, isNew }: { entry: TranscriptEntry; isNew?: boolean }) {
    const isCandidate = entry.speaker === 'Candidate';
    const isPanelist = !isCandidate;
    return (
        <div className={isNew ? 'animate-fade-in' : ''} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', justifyContent: isCandidate ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
            {isPanelist && (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <IconUsers size={14} color="var(--accent-primary)" />
                </div>
            )}
            <div style={{ maxWidth: '80%' }}>
                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.58rem', fontWeight: 600, color: isCandidate ? 'var(--text-secondary)' : 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3, textAlign: isCandidate ? 'right' : 'left' }}>
                    {entry.speaker} · {entry.ts}
                </div>
                <div style={{
                    fontFamily: 'var(--font-inter)', fontSize: '0.87rem', lineHeight: 1.7, padding: '11px 14px',
                    borderRadius: isCandidate ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isCandidate
                        ? (entry.flagged ? 'rgba(239,68,68,0.07)' : 'rgba(20,20,30,0.95)')
                        : 'rgba(99,102,241,0.07)',
                    border: entry.flagged ? '1px solid rgba(239,68,68,0.4)' : isCandidate ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(99,102,241,0.18)',
                    color: isPanelist ? 'rgba(200,200,230,0.9)' : 'var(--text-primary)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: entry.flagged ? '0 0 18px rgba(239,68,68,0.1)' : 'none',
                }}>
                    {entry.text}
                    {entry.flagged && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(239,68,68,0.2)', fontFamily: 'var(--font-inter)', fontSize: '0.68rem', color: 'var(--red)', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                            <IconAlertTriangle size={12} color="var(--red)" /> {entry.flagReason}
                        </div>
                    )}
                </div>
            </div>
            {isCandidate && (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: entry.flagged ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${entry.flagged ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <IconUser size={14} color={entry.flagged ? 'var(--red)' : 'var(--text-dim)'} />
                </div>
            )}
        </div>
    );
}

function InterimBubble({ text, speaker }: { text: string; speaker: Speaker }) {
    if (!text) return null;
    const isCandidate = speaker === 'Candidate';
    return (
        <div style={{ display: 'flex', justifyContent: isCandidate ? 'flex-end' : 'flex-start', marginBottom: 12, opacity: 0.45 }}>
            <div style={{ maxWidth: '80%', fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '10px 13px', borderRadius: 11, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)', fontStyle: 'italic' }}>
                {text}<span style={{ display: 'inline-block', width: 4, height: 14, background: 'var(--text-dim)', marginLeft: 3, verticalAlign: 'middle', animation: 'cursor-blink 1.1s step-end infinite' }} />
                <style>{`@keyframes cursor-blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
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
    const agentRef = useRef(false);
    const lastSpeakerRef = useRef<Speaker>('Panelist');
    const secsRef = useRef(0);
    const candidateBuf = useRef<Record<string, string>>({});
    const answerWordCount = useRef<Record<string, number>>({});
    const lastQIdRef = useRef<string | null>(null);
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const interimBufRef = useRef('');

    const [data, setData] = useState<any>({ questionBank: [], redFlags: [], candidate: {}, interviewStrategy: '', _resumeText: '' });

    useEffect(() => {
        const stored = sessionStorage.getItem('preBriefData') || sessionStorage.getItem('analysisData');
        if (stored) {
            setData(JSON.parse(stored));
        }
    }, []);

    const allQ = data.questionBank?.flatMap((g: any) => g.questions) ?? [];

    const [agentOn, setAgentOn] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [micError, setMicError] = useState<string | null>(null);
    const [secs, setSecs] = useState(0);
    const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>('Panelist');
    const [autoMode, setAutoMode] = useState(true);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [interim, setInterim] = useState('');
    const [detectedQId, setDetectedQId] = useState<string | null>(null);
    const [detectedConf, setDetectedConf] = useState(0);
    const [evaluations, setEvaluations] = useState<Record<string, any>>({});
    const [showContradiction, setShowContradiction] = useState(false);
    const [contradictionData, setContradictionData] = useState<any>(null);
    const [contradictionLog, setContradictionLog] = useState<any[]>([]);
    const [scoringQId, setScoringQId] = useState<string | null>(null);
    const [latestEval, setLatestEval] = useState<any>(null);

    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const progress = allQ.length > 0 ? Math.round((Object.keys(evaluations).length / allQ.length) * 100) : 0;

    useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [transcript, interim]);
    useEffect(() => () => {
        if (recognitionRef.current) {
            recognitionRef.current.stream?.getTracks().forEach((t: any) => t.stop());
            recognitionRef.current.micStream?.getTracks().forEach((t: any) => t.stop());
            recognitionRef.current.tabStream?.getTracks().forEach((t: any) => t.stop());
            recognitionRef.current.audioContext?.close().catch(() => { });
        }
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);
    useEffect(() => { agentRef.current = agentOn; }, [agentOn]);
    useEffect(() => { lastSpeakerRef.current = currentSpeaker; }, [currentSpeaker]);
    useEffect(() => { secsRef.current = secs; }, [secs]);

    const processUtterance = useCallback(async (text: string, manualSpeaker: Speaker | null, ts: string) => {
        const currentTranscriptObj = transcript;
        const recentStr = currentTranscriptObj.slice(-10).map((t: any) => `${t.speaker}: ${t.text}`).join('\n');

        if (manualSpeaker) {
            // Hard override, don't use auto-inference
            setCurrentSpeaker(manualSpeaker);
            lastSpeakerRef.current = manualSpeaker;
        }

        try {
            setScoringQId(lastQIdRef.current || 'processing');
            // Pipe text to LangGraph state machine
            const res = await processTurn({
                text,
                last_speaker: lastSpeakerRef.current,
                active_question_id: lastQIdRef.current,
                question_bank: allQ,
                recent_transcript: recentStr
            });

            // 1. Check if Hallucination
            if (res.speaker === 'Hallucination' && !manualSpeaker) {
                console.log('[LangGraph] Filtered hallucination:', text);
                return; // drop
            }

            const activeSpeaker = manualSpeaker || (res.speaker as Speaker) || lastSpeakerRef.current;
            if (autoMode && activeSpeaker && activeSpeaker !== lastSpeakerRef.current) {
                setCurrentSpeaker(activeSpeaker);
                lastSpeakerRef.current = activeSpeaker;
            }

            // 2. Add Transcript entry
            const suspicious = activeSpeaker === 'Candidate' && (/vendor|the team handled|integration side|i was more on|someone else/i.test(text));
            const id = `e-${++entryCounter.current}`;
            const newEntry = { id, speaker: activeSpeaker, text, ts, flagged: suspicious, flagReason: suspicious ? 'Potential ownership discrepancy' : undefined };
            setTranscript(p => [...p, newEntry]);

            // 3. Update Question
            if (activeSpeaker === 'Panelist' && res.detected_question_id) {
                setDetectedQId(res.detected_question_id);
                setDetectedConf(1.0);
                lastQIdRef.current = res.detected_question_id;
            }

            // 4. Update Evaluation
            if (activeSpeaker === 'Candidate' && res.evaluation && lastQIdRef.current) {
                const qId = lastQIdRef.current;
                const evalResult = res.evaluation;
                if (!evaluations[qId]) { // Only lock in score once (for now)
                    if (evalResult.contradiction?.detected) {
                        setContradictionData({ resumeClaimed: evalResult.contradiction.resumeClaimed, candidateSaid: evalResult.contradiction.candidateSaid, severity: evalResult.contradiction.severity });
                        setShowContradiction(true);
                        setContradictionLog(p => [...p, { resumeClaimed: evalResult.contradiction.resumeClaimed, candidateSaid: evalResult.contradiction.candidateSaid, severity: evalResult.contradiction.severity }]);
                    }
                    const ev = {
                        score: evalResult.depthScore, label: evalResult.depthLabel,
                        bluff: evalResult.bluffRisk, bluffReason: evalResult.bluffReason,
                        contradiction: evalResult.contradiction?.detected || false,
                        followUp: evalResult.followUp, answeredAt: ts,
                        snippet: evalResult.snippet || text.slice(0, 120),
                    };
                    setEvaluations(p => ({ ...p, [qId]: ev }));
                    setLatestEval(ev);
                }
            }

        } catch (err) {
            console.error('[LangGraph] Error:', err);
            // fallback transcript addition on error
            const id = `e-${++entryCounter.current}`;
            setTranscript(p => [...p, { id, speaker: manualSpeaker || lastSpeakerRef.current, text, ts }]);
        } finally {
            setScoringQId(null);
        }
    }, [allQ, evaluations, autoMode, transcript]);

    const toggleAgent = useCallback(async () => {
        if (agentOn) {
            if (recognitionRef.current) {
                recognitionRef.current.stream?.getTracks().forEach((t: any) => t.stop());
                recognitionRef.current.micStream?.getTracks().forEach((t: any) => t.stop());
                recognitionRef.current.tabStream?.getTracks().forEach((t: any) => t.stop());
                recognitionRef.current.audioContext?.close().catch(() => { });
            }
            setAgentOn(false); setIsListening(false); setInterim('');
            if (timerRef.current) clearInterval(timerRef.current);
        } else {
            setMicError(null);
            try {
                // To fetch both Panelist (Mic) and Candidate (Google Meet), we use both streams
                const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const tabStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { displaySurface: 'browser' },
                    audio: true
                });

                // We only need the audio from the candidate's tab
                tabStream.getVideoTracks().forEach(track => track.stop());

                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                await audioContext.resume();

                // Mix both streams so the VAD and Transcription get both voices
                const dest = audioContext.createMediaStreamDestination();
                const mixer = audioContext.createGain();
                mixer.connect(dest);

                if (micStream.getAudioTracks().length > 0) {
                    const micSource = audioContext.createMediaStreamSource(micStream);
                    micSource.connect(mixer);
                }

                if (tabStream.getAudioTracks().length === 0) {
                    throw new Error("Missing tab audio. Please check 'Share tab audio' when selecting the Meet tab.");
                } else {
                    const tabSource = audioContext.createMediaStreamSource(tabStream);
                    tabSource.connect(mixer);
                }

                const stream = dest.stream;

                // We analyze the mixed stream for speech activity
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;
                mixer.connect(analyser); // Connect the mixed node to the analyser

                const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';

                let currentRecorder: MediaRecorder | null = null;

                const startNewRecording = () => {
                    const recorder = new MediaRecorder(stream, { mimeType });
                    let chunks: Blob[] = [];

                    recorder.ondataavailable = (e) => {
                        if (e.data.size > 0) chunks.push(e.data);
                    };

                    recorder.onstop = async () => {
                        const blob = new Blob(chunks, { type: mimeType });
                        chunks = [];
                        console.log(`[VAD] Audio blob captured, size: ${blob.size} bytes`);

                        // Only transcribe if there is substantial audio
                        if (blob.size > 1000) {
                            setInterim('Transcribing...');
                            try {
                                const text = await transcribeAudio(blob);
                                console.log(`[VAD] Transcribed: "${text}"`);
                                if (text && text.trim()) {
                                    const txt = text.trim();
                                    const manualSpeaker = autoMode ? null : lastSpeakerRef.current;
                                    // Let LangGraph fully handle Speaker classification and question orchestration!
                                    processUtterance(txt, manualSpeaker, fmt(secsRef.current));
                                }
                            } catch (err) {
                                console.error("[VAD] Transcription API error:", err);
                            }
                            setInterim('');
                        }
                    };

                    recorder.start();
                    currentRecorder = recorder;
                };

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                let silentFrames = 0;
                let speaking = false;

                const checkAudio = () => {
                    if (!agentRef.current) return;
                    analyser.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;

                    if (avg > 18) { // Speech threshold (raised to entirely ignore loud fan/room noise)
                        silentFrames = 0;
                        if (!speaking) {
                            speaking = true;
                            console.log("[VAD] Speech Detected - Starting new recording (Volume:", avg.toFixed(1), ")");
                            startNewRecording();
                        }
                    } else { // Silence threshold
                        silentFrames++;
                        if (speaking && silentFrames > 60) { // ~960ms silence flush
                            speaking = false;
                            console.log("[VAD] Silence Detected - Stopping recording");
                            if (currentRecorder && currentRecorder.state === 'recording') {
                                currentRecorder.stop();
                            }
                        }
                    }
                    requestAnimationFrame(checkAudio);
                };

                recognitionRef.current = { stream, micStream, tabStream, audioContext };
                agentRef.current = true; // Synchronously update ref so checkAudio doesn't die immediately
                setAgentOn(true);
                setIsListening(true);
                timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);

                checkAudio(); // start VAD loop

            } catch (err: any) {
                console.error("Mic/Tab error:", err);
                // Clean up streams if partially initialized
                if (recognitionRef.current) {
                    recognitionRef.current.stream?.getTracks().forEach((t: any) => t.stop());
                    recognitionRef.current.micStream?.getTracks().forEach((t: any) => t.stop());
                    recognitionRef.current.tabStream?.getTracks().forEach((t: any) => t.stop());
                    recognitionRef.current.audioContext?.close().catch(() => { });
                }
                setMicError(err.message || 'Mic access denied. Allow microphone and retry.');
            }
        }
    }, [agentOn, processUtterance, autoMode]);

    const detectedQ = allQ.find((q: any) => q.id === detectedQId);
    const isScoring = !!scoringQId;

    const handleGenerateVerdict = () => {
        const analysisData = JSON.parse(sessionStorage.getItem('analysisData') || '{}');
        sessionStorage.setItem('verdictInput', JSON.stringify({ evaluations, transcript, analysisData, contradictionLog }));
        router.push('/verdict');
    };

    return (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

            {showContradiction && contradictionData && (
                <ContradictionAlert resumeClaimed={contradictionData.resumeClaimed} candidateSaid={contradictionData.candidateSaid} severity={contradictionData.severity}
                    onDismiss={() => setShowContradiction(false)} />
            )}

            {/* Progress bar */}
            <div style={{ height: 3, background: 'var(--border)', flexShrink: 0 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,var(--accent-primary),var(--accent-secondary))', transition: 'width 0.6s ease', boxShadow: '0 0 8px var(--accent-primary)' }} />
            </div>

            {/* ── AGENT BAR ────────────────────────────────────── */}
            <div style={{
                height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12,
                background: agentOn ? 'rgba(16,185,129,0.04)' : 'rgba(10,10,15,0.9)',
                backdropFilter: 'blur(20px)',
                borderBottom: `1px solid ${agentOn ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
                transition: 'all 0.35s ease',
            }}>
                {/* Mic toggle */}
                <button onClick={toggleAgent} style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '7px 15px', borderRadius: 10, flexShrink: 0,
                    background: agentOn ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${agentOn ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.1)'}`,
                    cursor: 'pointer', transition: 'all 0.25s',
                    boxShadow: agentOn ? '0 0 24px rgba(16,185,129,0.18)' : 'none',
                }}>
                    <div style={{ width: 38, height: 21, borderRadius: 10.5, background: agentOn ? 'var(--green)' : 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0, boxShadow: agentOn ? '0 0 8px rgba(16,185,129,0.4)' : 'none', transition: 'background 0.3s' }}>
                        <div style={{ position: 'absolute', top: 2.5, left: agentOn ? 18 : 2.5, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.28s cubic-bezier(0.16,1,0.3,1)', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
                    </div>
                    {agentOn ? <IconMic size={14} color="var(--green)" /> : <IconMicOff size={14} color="var(--text-dim)" />}
                    <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: '0.82rem', color: agentOn ? 'var(--green)' : 'var(--text-secondary)' }}>
                        Agent {agentOn ? 'ON' : 'OFF'}
                    </span>
                    {agentOn && <PulseRing />}
                </button>

                <Waveform active={agentOn && isListening} />

                <div style={{ flex: 1, minWidth: 0 }}>
                    {agentOn ? (
                        <div>
                            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--green)', fontWeight: 500 }}>
                                Listening · <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>Auto-detecting speaker</span>
                            </div>
                            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.62rem', color: 'var(--text-dim)' }}>
                                {fmt(secs)} · {transcript.length} utterances · {Object.keys(evaluations).length}/{allQ.length} scored
                                {contradictionLog.length > 0 && <span style={{ color: 'var(--red)', marginLeft: 8 }}>· {contradictionLog.length} flag{contradictionLog.length > 1 ? 's' : ''}</span>}
                            </div>
                        </div>
                    ) : (
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: micError ? 'var(--red)' : 'var(--text-dim)' }}>
                            {micError ?? 'Enable Agent — auto-detects Panelist vs Candidate from speech patterns'}
                        </span>
                    )}
                </div>

                {/* Auto / Manual speaker toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '4px 8px', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.6rem', color: 'var(--text-dim)' }}>SPEAKER</span>
                    <button onClick={() => setAutoMode(true)} style={{ padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.68rem', background: autoMode ? 'rgba(16,185,129,0.2)' : 'transparent', color: autoMode ? 'var(--green)' : 'var(--text-dim)', transition: 'all 0.2s' }}>AUTO</button>
                    {!autoMode && (['Panelist', 'Candidate'] as Speaker[]).map(sp => (
                        <button key={sp} onClick={() => { setCurrentSpeaker(sp); lastSpeakerRef.current = sp; }} style={{
                            padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.68rem',
                            background: currentSpeaker === sp ? (sp === 'Panelist' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.07)') : 'transparent',
                            color: currentSpeaker === sp ? (sp === 'Panelist' ? 'var(--accent-primary)' : 'var(--text-primary)') : 'var(--text-dim)',
                            transition: 'all 0.2s',
                        }}>{sp === 'Panelist' ? 'PANEL' : 'CAND'}</button>
                    ))}
                    <button onClick={() => setAutoMode(false)} style={{ padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.68rem', background: !autoMode ? 'rgba(99,102,241,0.2)' : 'transparent', color: !autoMode ? 'var(--accent-primary)' : 'var(--text-dim)', transition: 'all 0.2s' }}>MANUAL</button>
                </div>

                {/* Current speaker indicator */}
                {agentOn && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(10,10,15,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, flexShrink: 0 }}>
                        <PulseRing color={currentSpeaker === 'Panelist' ? 'var(--accent-primary)' : 'var(--green)'} />
                        <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.72rem', color: currentSpeaker === 'Panelist' ? 'var(--accent-primary)' : 'var(--green)' }}>{currentSpeaker}</span>
                    </div>
                )}

                <button className="btn-accent" onClick={handleGenerateVerdict}
                    style={{ padding: '8px 15px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto', flexShrink: 0 }}>
                    Verdict <IconArrowRight size={13} color="rgba(255,255,255,0.7)" />
                </button>
            </div>

            {/* ── THREE PANELS ─────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 300px', flex: 1, minHeight: 0, overflow: 'hidden' }}>

                {/* LEFT — Question Bank */}
                <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', padding: '14px 11px', background: 'rgba(8,8,12,0.5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <IconList size={12} color="var(--text-dim)" />
                        <span className="section-label">Questions · <span style={{ color: 'var(--accent-primary)' }}>{Object.keys(evaluations).length}/{allQ.length}</span></span>
                    </div>

                    {allQ.length === 0 && (
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.74rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                            No session data. Return to upload first.
                        </p>
                    )}

                    {data.questionBank?.map((group: any) => (
                        <div key={group.area} style={{ marginBottom: 13 }}>
                            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.67rem', color: 'var(--text-secondary)', fontWeight: 600, paddingBottom: 4, marginBottom: 5, borderBottom: '1px solid rgba(255,255,255,0.05)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{group.area}</div>
                            {group.questions.map((q: any) => {
                                const isActive = q.id === detectedQId;
                                const ev = evaluations[q.id];
                                return (
                                    <div key={q.id} style={{
                                        padding: '9px 10px', borderRadius: 9, marginBottom: 4,
                                        background: isActive ? 'rgba(16,185,129,0.07)' : ev ? 'rgba(99,102,241,0.05)' : 'transparent',
                                        border: `1px solid ${isActive ? 'rgba(16,185,129,0.3)' : ev ? 'rgba(99,102,241,0.18)' : 'transparent'}`,
                                        transition: 'all 0.3s',
                                        boxShadow: isActive ? '0 0 14px rgba(16,185,129,0.08)' : 'none',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                                            {isActive && agentOn ? <PulseRing />
                                                : ev ? <IconCheckCircle size={11} color="var(--green)" />
                                                    : <div style={{ width: 9, height: 9, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)' }} />
                                            }
                                            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.58rem', padding: '1px 5px', borderRadius: 3, background: tierBg(q.tier), color: tierClr(q.tier) }}>{q.tier}</span>
                                            {isActive && agentOn && <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.56rem', color: 'var(--green)', fontWeight: 700 }}>LIVE</span>}
                                        </div>
                                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.74rem', lineHeight: 1.45, color: isActive ? 'var(--text-primary)' : ev ? 'var(--text-secondary)' : 'var(--text-dim)' }}>{q.preview}</div>
                                        {ev && (
                                            <div style={{ marginTop: 6, padding: '5px 7px', borderRadius: 6, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.66rem', color: ev.score >= 70 ? 'var(--green)' : ev.score >= 50 ? 'var(--yellow)' : 'var(--red)', fontWeight: 700 }}>{ev.score}</div>
                                                <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${ev.score}%`, background: ev.score >= 70 ? 'var(--green)' : ev.score >= 50 ? 'var(--yellow)' : 'var(--red)', transition: 'width 0.6s ease' }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Overall progress */}
                    {allQ.length > 0 && (
                        <div style={{ padding: '9px 11px', background: 'rgba(10,10,15,0.6)', borderRadius: 9, border: '1px solid rgba(255,255,255,0.05)', marginTop: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span className="section-label">Coverage</span>
                                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.68rem', color: 'var(--accent-primary)' }}>{progress}%</span>
                            </div>
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', transition: 'width 0.5s ease', boxShadow: '0 0 6px var(--accent-primary)' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* CENTER — Transcript */}
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                    {/* Detected topic banner */}
                    <div style={{
                        padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0,
                        background: detectedQ && agentOn ? 'rgba(16,185,129,0.04)' : 'rgba(8,8,12,0.7)',
                        backdropFilter: 'blur(16px)',
                        display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'background 0.4s', minHeight: 52,
                    }}>
                        {detectedQ && agentOn ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                                <PulseRing />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.59rem', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                                        Detected Q{detectedQ.id.slice(1)} · {Math.round(detectedConf * 100)}% match
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 500 }}>{detectedQ.preview}</div>
                                </div>
                                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.6rem', padding: '2px 7px', borderRadius: 4, background: tierBg(detectedQ.tier), color: tierClr(detectedQ.tier) }}>{detectedQ.tier}</span>
                                {isScoring && <div style={{ width: 14, height: 14, border: '2px solid var(--green)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
                                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IconMessageSquare size={14} color="var(--text-dim)" />
                                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.77rem', color: agentOn ? 'var(--green)' : 'var(--text-dim)' }}>
                                    {agentOn ? 'Listening — matching questions from bank...' : 'Enable Agent to begin'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Feed */}
                    <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                        {transcript.length === 0 && !interim && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, textAlign: 'center' }}>
                                <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconMic size={26} color="rgba(99,102,241,0.4)" />
                                </div>
                                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '0.96rem', color: 'var(--text-secondary)' }}>Agent is standing by</div>
                                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'var(--text-dim)', maxWidth: 300, lineHeight: 1.7 }}>
                                    Auto-detect mode will intelligently label each utterance as Panelist or Candidate based on speech patterns — no manual switching needed.
                                </div>
                                <button className="btn-accent" onClick={toggleAgent} style={{ padding: '10px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <IconMic size={15} color="rgba(255,255,255,0.8)" /> Start Listening
                                </button>
                            </div>
                        )}
                        {transcript.map(entry => <Bubble key={entry.id} entry={entry} isNew={entry.id === transcript[transcript.length - 1]?.id} />)}
                        <InterimBubble text={interim} speaker={currentSpeaker} />
                        {agentOn && transcript.length > 0 && !interim && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 9, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)', marginTop: 4 }}>
                                <PulseRing />
                                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'var(--green)' }}>
                                    {autoMode ? `Auto-detecting speaker · last: ${currentSpeaker}` : `Manual · ${currentSpeaker}`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT — Live Analysis */}
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', padding: '14px 15px', background: 'rgba(8,8,12,0.4)', display: 'flex', flexDirection: 'column', gap: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconActivity size={12} color="var(--text-dim)" />
                        <span className="section-label">Live Analysis</span>
                        {isScoring && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}><PulseRing color="var(--yellow)" /><span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.6rem', color: 'var(--yellow)' }}>Scoring...</span></div>}
                    </div>

                    {!latestEval && !detectedQId && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconZap size={18} color="rgba(99,102,241,0.4)" />
                            </div>
                            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.76rem', color: 'var(--text-dim)', lineHeight: 1.65, maxWidth: 170 }}>Analysis appears automatically as candidate answers</p>
                        </div>
                    )}

                    {/* Scoring spinner */}
                    {detectedQId && !latestEval && agentOn && (
                        <div className="glass-green" style={{ padding: '13px', borderRadius: 11 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <PulseRing />
                                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>
                                    {isScoring ? 'AI scoring in progress...' : 'Listening for answer...'}
                                </span>
                            </div>
                            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {detectedQ?.preview}
                            </p>
                        </div>
                    )}

                    {/* Eval results */}
                    {latestEval && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {/* Confidence ring + depth */}
                            <div className="card-glass" style={{ padding: '14px' }}>
                                <ConfidenceRing score={latestEval.score} label={latestEval.label} />
                                <div style={{ marginTop: 12 }}>
                                    <BluffBar level={latestEval.bluff} />
                                </div>
                                {latestEval.bluffReason && (
                                    <div style={{ marginTop: 8, fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.55, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        {latestEval.bluffReason}
                                    </div>
                                )}
                            </div>

                            {/* Follow-up suggestion */}
                            {latestEval.followUp?.question && (
                                <div className="card-glass" style={{ padding: '12px 13px', borderLeft: '2px solid var(--yellow)' }}>
                                    <div className="section-label" style={{ marginBottom: 7, color: 'var(--yellow)' }}>Ask Next</div>
                                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.79rem', lineHeight: 1.65, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                        &quot;{latestEval.followUp.question}&quot;
                                    </p>
                                    {latestEval.followUp.why && <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 5, lineHeight: 1.5 }}>{latestEval.followUp.why}</p>}
                                    <button className="btn-ghost" style={{ marginTop: 7, fontSize: '0.68rem', padding: '4px 9px' }}
                                        onClick={() => navigator.clipboard.writeText(latestEval.followUp.question)}>
                                        <IconCopy size={11} color="currentColor" /> Copy
                                    </button>
                                </div>
                            )}

                            {/* Contradiction */}
                            {latestEval.contradiction && (
                                <div className="glass-red" style={{ padding: '11px 13px', display: 'flex', gap: 9 }}>
                                    <IconShieldAlert size={16} color="var(--red)" />
                                    <div>
                                        <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.76rem', color: 'var(--red)', marginBottom: 4 }}>Contradiction Detected</div>
                                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.71rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Answer conflicts with resume claim.</div>
                                    </div>
                                </div>
                            )}

                            {/* Snippet */}
                            {latestEval.snippet && (
                                <div className="card-glass" style={{ padding: '11px 13px', borderLeft: '2px solid var(--accent-primary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span className="section-label" style={{ color: 'var(--accent-primary)' }}>Snippet</span>
                                        <button className="btn-icon" onClick={() => navigator.clipboard.writeText(latestEval.snippet)} style={{ width: 26, height: 26 }}>
                                            <IconCopy size={11} color="currentColor" />
                                        </button>
                                    </div>
                                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.76rem', lineHeight: 1.65, color: 'var(--text-secondary)', fontStyle: 'italic' }}>&quot;{latestEval.snippet}&quot;</p>
                                </div>
                            )}

                            {/* All scores mini-chart */}
                            {Object.keys(evaluations).length > 0 && (
                                <div className="card-glass" style={{ padding: '12px 13px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                                        <IconActivity size={12} color="var(--text-dim)" />
                                        <span className="section-label">Score History</span>
                                    </div>
                                    {allQ.filter((q: any) => evaluations[q.id]).map((q: any) => {
                                        const e = evaluations[q.id];
                                        const sc = e.score;
                                        const clr = sc >= 70 ? 'var(--green)' : sc >= 50 ? 'var(--yellow)' : 'var(--red)';
                                        return (
                                            <div key={q.id} style={{ marginBottom: 8 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.preview.slice(0, 30)}…</span>
                                                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.68rem', color: clr, fontWeight: 700 }}>{sc}</span>
                                                </div>
                                                <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${sc}%`, background: clr, transition: 'width 0.6s ease' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Contradiction log */}
                            {contradictionLog.length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
                                        <IconFlag size={12} color="var(--red)" />
                                        <span className="section-label" style={{ color: 'var(--red)' }}>Flags ({contradictionLog.length})</span>
                                    </div>
                                    {contradictionLog.map((c, i) => (
                                        <div key={i} style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, padding: '8px 11px', marginBottom: 5 }}>
                                            <SeverityBadge severity={c.severity} />
                                            <div style={{ marginTop: 5, fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.resumeClaimed?.slice(0, 70)}...</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
