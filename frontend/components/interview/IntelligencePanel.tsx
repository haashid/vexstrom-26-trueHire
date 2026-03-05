import React from 'react';
import { IconActivity, IconShieldAlert, IconFlag, IconCopy } from '@/components/Icons';
import DepthMeter from '@/components/DepthMeter';
import SeverityBadge from '@/components/SeverityBadge';
import PulseRing from './PulseRing';
import { EvaluationResult, ContradictionData } from '@/types/interview';

const bluffClr: Record<string, string> = { LOW: 'var(--green)', MEDIUM: 'var(--yellow)', HIGH: 'var(--red)' };

interface IntelligencePanelProps {
    detectedQId: string | null;
    latestEval: EvaluationResult | null;
    isEvaluating: boolean;
    agentOn: boolean;
    contradictionLog: ContradictionData[];
}

export default function IntelligencePanel({
    detectedQId, latestEval, isEvaluating, agentOn, contradictionLog
}: IntelligencePanelProps) {
    return (
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
                    {latestEval.technical_feedback && (
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
    );
}
