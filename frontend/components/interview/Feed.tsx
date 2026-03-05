import React from 'react';
import { IconMic, IconZap, IconCopy, IconMessageSquare } from '@/components/Icons';
import { Bubble, InterimBubble } from './TranscriptBubble';
import { TranscriptEntry, QuestionNode, Speaker } from '@/types/interview';

const tierClr = (t: string) => t === 'T1' ? 'var(--green)' : t === 'T2' ? 'var(--yellow)' : 'var(--red)';
const tierBg = (t: string) => t === 'T1' ? 'var(--green)15' : t === 'T2' ? 'var(--yellow)15' : 'var(--red)15';

interface FeedProps {
    transcript: TranscriptEntry[];
    interim: string;
    currentSpeaker: Speaker;
    agentOn: boolean;
    detectedQ: QuestionNode | undefined;
    detectedConf: number;
    nextQ: QuestionNode | undefined;
    followUps: string[];
    feedRef: React.RefObject<HTMLDivElement | null>;
    newIdRef: React.RefObject<string | null>;
    toggleAgent: () => void;
}

export default function Feed({
    transcript, interim, currentSpeaker, agentOn, detectedQ, detectedConf,
    nextQ, followUps, feedRef, newIdRef, toggleAgent
}: FeedProps) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 24px 24px' }}>
            {/* ── AI RECOMMENDATION BAR ── */}
            {nextQ && (
                <div className="reveal delay-1" style={{ marginBottom: 20, padding: '14px 20px', background: 'var(--accent-soft)', border: '1px solid var(--accent-primary)20', borderRadius: 12, display: 'flex', gap: 16, alignItems: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.06)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconZap size={18} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Next Recommended Step</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{nextQ.full}</div>
                    </div>
                    <button
                        onClick={() => navigator.clipboard.writeText(nextQ.full)}
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
    );
}
