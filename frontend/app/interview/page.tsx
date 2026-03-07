'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import ContradictionAlert from '@/components/ContradictionAlert';

// Hooks
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useInterviewLogic } from '@/hooks/useInterviewLogic';
import { useInterviewWebSocket } from '@/hooks/useInterviewWebSocket';

// Components
import ControlBar from '@/components/interview/ControlBar';
import QuestionBank from '@/components/interview/QuestionBank';
import Feed from '@/components/interview/Feed';
import IntelligencePanel from '@/components/interview/IntelligencePanel';

// Types
import { AnalysisData, QuestionNode } from '@/types/interview';

export default function InterviewPage() {
    const router = useRouter();
    const feedRef = useRef<HTMLDivElement>(null);
    const newIdRef = useRef<string | null>(null);

    const [data, setData] = useState<AnalysisData | null>(null);
    const [allQ, setAllQ] = useState<QuestionNode[]>([]);

    useEffect(() => {
        const stored = sessionStorage.getItem('analysisData');
        if (stored) {
            const parsed: AnalysisData = JSON.parse(stored);
            setData(parsed);
            const qs = parsed.questionBank.flatMap(g => g.questions);
            setAllQ(qs);
        } else {
            router.push('/');
        }
    }, [router]);

    // 1. Core Logic Hook
    const logic = useInterviewLogic(data, allQ);

    // Track scroll and reveal animations
    useScrollReveal([data, logic.transcript, logic.followUps]);
    useEffect(() => {
        if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
        if (logic.transcript.length > 0) {
            newIdRef.current = logic.transcript[logic.transcript.length - 1].id;
        }
    }, [logic.transcript, logic.interim]);

    // 2. Speech Recognition Hook
    const speech = useSpeechRecognition({
        onUtterance: logic.processUtterance
    });

    // 3. WebSocket Bridge Hook
    useInterviewWebSocket({
        onUtterance: (text, speaker) => logic.processUtterance(text, speaker, speech.fmt(speech.secs))
    });

    if (!data) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%' }} className="animate-spin" />
            <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Initializing secure terminal...</p>
        </div>
    );

    const detectedQ = allQ.find((q) => q.id === logic.detectedQId);
    const latestEval = logic.detectedQId ? logic.evaluations[logic.detectedQId] : null;
    const progress = allQ.length > 0 ? Math.round((Object.keys(logic.evaluations).length / allQ.length) * 100) : 0;

    return (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', overflow: 'hidden', background: 'var(--bg-primary)' }}>

            {logic.showContradiction && logic.contradictionData && (
                <ContradictionAlert
                    resumeClaimed={logic.contradictionData.resumeClaimed}
                    candidateSaid={logic.contradictionData.candidateSaid}
                    severity={logic.contradictionData.severity}
                    onDismiss={() => {
                        logic.setContradictionLog(p => [...p, logic.contradictionData!]);
                        logic.setShowContradiction(false);
                    }}
                />
            )}

            {/* Progress Bar */}
            <div style={{ height: 2, background: 'var(--border)', flexShrink: 0 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-primary)', transition: 'width 0.6s ease', boxShadow: '0 0 10px var(--accent-primary)40' }} />
            </div>

            <ControlBar
                agentOn={speech.agentOn}
                isListening={speech.isListening}
                micError={speech.micError}
                secs={speech.secs}
                fmt={speech.fmt}
                transcriptLength={logic.transcript.length}
                flagsLength={logic.contradictionLog.length}
                autoSwitch={logic.autoSwitch}
                setAutoSwitch={logic.setAutoSwitch}
                currentSpeaker={logic.currentSpeaker}
                setCurrentSpeaker={logic.setCurrentSpeaker}
                toggleAgent={() => speech.toggleAgent(logic.currentSpeaker)}
                onConclude={() => {
                    sessionStorage.setItem('verdictData', JSON.stringify({
                        evaluations: logic.evaluations,
                        contradictionLog: logic.contradictionLog
                    }));
                    router.push('/verdict');
                }}
            />

            {/* ── THREE PANELS ──────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr 340px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <QuestionBank
                    data={data}
                    allQ={allQ}
                    evaluations={logic.evaluations}
                    detectedQId={logic.detectedQId}
                    agentOn={speech.agentOn}
                />

                <Feed
                    transcript={logic.transcript}
                    interim={speech.interim}
                    currentSpeaker={logic.currentSpeaker}
                    agentOn={speech.agentOn}
                    detectedQ={detectedQ}
                    detectedConf={logic.detectedConf}
                    nextQ={allQ[logic.nextQIndex]}
                    followUps={logic.followUps}
                    feedRef={feedRef}
                    newIdRef={newIdRef}
                    toggleAgent={() => speech.toggleAgent(logic.currentSpeaker)}
                />

                <IntelligencePanel
                    detectedQId={logic.detectedQId}
                    latestEval={latestEval}
                    isEvaluating={logic.isEvaluating}
                    agentOn={speech.agentOn}
                    contradictionLog={logic.contradictionLog}
                />
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
