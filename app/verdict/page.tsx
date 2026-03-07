/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, react/display-name */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SeverityBadge from '@/components/SeverityBadge';
import { SalaryPanel } from '@/components/SalaryPanel';
import { generateVerdict, VerdictData, sendEmail, generateReport, AnalysisData } from '@/lib/api';
import {
    IconThumbsUp, IconThumbsDown, IconDownload, IconArrowRight,
    IconChevronDown, IconShieldAlert, IconFlag, IconBarChart,
    IconTarget, IconUsers, IconCpu, IconZap, IconShield,
    IconCheckCircle, IconAlertTriangle, IconStar, IconMail, IconFileCheck
} from '@/components/Icons';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AGENT_ICONS: Record<string, React.ComponentType<any>> = {
    'A1': IconCpu,
    'A2': IconZap,
    'A3': IconTarget,
    'A4': IconShield,
};

export default function VerdictPage() {
    const router = useRouter();
    const [data, setData] = useState<VerdictData | null>(null);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingStep, setLoadingStep] = useState('Convening agent panel...');
    const [error, setError] = useState<string | null>(null);
    const [activeAgent, setActiveAgent] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'verdict' | 'offer' | 'feedback'>('verdict');
    const [confWidth, setConfWidth] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    useScrollReveal([data]);

    useEffect(() => {
        const run = async () => {
            try {
                // Get interview session data populated by the Interview page
                const verdictInput = sessionStorage.getItem('verdictInput');
                const analysisDataRaw = sessionStorage.getItem('analysisData');

                if (!verdictInput || !analysisDataRaw) {
                    setError('No interview session found. Please complete an interview first.');
                    setLoading(false);
                    return;
                }

                const { evaluations, transcript } = JSON.parse(verdictInput);
                const analysis = JSON.parse(analysisDataRaw);
                setAnalysisData(analysis);

                // Check if verdict was already computed (fast path)
                const cached = sessionStorage.getItem('verdictData');
                if (cached) {
                    const d = JSON.parse(cached);
                    if (d.agentDebate && d.verdict) {
                        setData(d);
                        setLoading(false);
                        return;
                    }
                }

                // Animate loading steps while 3-agent API debate runs
                const steps = [
                    'Convening agent panel...',
                    'Agent Sigma analyzing trust signals...',
                    'Agent Delta reviewing candidate potential...',
                    'Agent Tau profiling behavioral patterns...',
                    'Synthesizing consensus verdict...',
                ];
                let stepIdx = 0;
                const stepTimer = setInterval(() => {
                    stepIdx = (stepIdx + 1) % steps.length;
                    setLoadingStep(steps[stepIdx]);
                }, 2200);

                const result = await generateVerdict(evaluations, transcript, analysis);
                clearInterval(stepTimer);

                sessionStorage.setItem('verdictData', JSON.stringify(result));
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Verdict generation failed. Is the backend running on port 8000?');
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    useEffect(() => {
        if (data) setTimeout(() => setConfWidth(data.confidence), 200);
    }, [data]);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', gap: 20 }}>
            <div style={{ width: 52, height: 52, border: '3px solid var(--border)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%' }} className="animate-spin" />
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.94rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{loadingStep}</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.72rem', color: 'var(--text-dim)' }}>3 AI agents debating in parallel via Mistral</div>
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', gap: 16, padding: '0 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--red)' }}>Could not generate verdict</div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: 420 }}>{error}</div>
            <button className="btn-accent" onClick={() => router.push('/')} style={{ marginTop: 8 }}>Return to Upload</button>
        </div>
    );

    if (!data) return null;

    const isHire = data.verdict === 'HIRE';
    const vColor = isHire ? 'var(--green)' : 'var(--red)';
    const vGlow = isHire ? 'rgba(var(--glass-green),0.18)' : 'rgba(var(--glass-red),0.18)';
    const heatClr: Record<string, string> = { HIGH: 'var(--green)', MEDIUM: 'var(--yellow)', LOW: 'var(--red)' };
    const heatBg: Record<string, string> = { HIGH: 'rgba(var(--glass-green),0.1)', MEDIUM: 'rgba(var(--glass-yellow),0.1)', LOW: 'rgba(var(--glass-red),0.1)' };
    const posClr: Record<string, string> = { 'NO-HIRE': 'var(--red)', HIRE: 'var(--green)', CONDITIONAL: 'var(--yellow)' };

    const handleExport = () => {
        const b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: 'truehire-verdict.json' });
        a.click();
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 56px)', padding: 'clamp(24px,5vh,48px) clamp(16px,4vw,40px)', maxWidth: 900, margin: '0 auto' }}>

            {/* ── HEADER ─────────────────────────────────────── */}
            <div className="reveal" style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.65rem', color: 'var(--accent-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }} />
                    Interview Complete — Final Verdict
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(1.4rem,4vw,2.2rem)', letterSpacing: '-0.03em' }}>AI Verdict Report</h1>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn-ghost" onClick={handleExport} style={{ padding: '9px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <IconDownload size={15} color="currentColor" /> Export JSON
                        </button>
                        <button className="btn-accent" onClick={() => { sessionStorage.clear(); router.push('/'); }} style={{ padding: '9px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 7 }}>
                            New Interview <IconArrowRight size={15} color="rgba(var(--glass-white),0.7)" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── MAIN COLUMN ──────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

                {/* Verdict banner */}
                <div className="reveal" style={{
                    borderRadius: 16, padding: 'clamp(20px,4vw,32px)',
                    background: isHire
                        ? 'linear-gradient(135deg, rgba(7,26,18,0.9) 0%, rgba(var(--glass-green),0.04) 100%)'
                        : 'linear-gradient(135deg, rgba(26,7,7,0.9) 0%, rgba(var(--glass-red),0.04) 100%)',
                    border: `1px solid ${isHire ? 'rgba(var(--glass-green),0.3)' : 'rgba(var(--glass-red),0.3)'}`,
                    borderLeft: `4px solid ${vColor}`,
                    backdropFilter: 'blur(24px)',
                    boxShadow: `0 0 80px ${vGlow}, 0 16px 48px rgba(var(--glass-black),0.5), inset 0 1px 0 rgba(var(--glass-white),0.04)`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                            <div className="section-label" style={{ marginBottom: 12 }}>Final Verdict</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: `${isHire ? 'rgba(var(--glass-green),' : 'rgba(var(--glass-red),'}0.12)`, border: `1px solid ${vColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {isHire
                                        ? <IconThumbsUp size={26} color={vColor} />
                                        : <IconThumbsDown size={26} color={vColor} />
                                    }
                                </div>
                                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 900, fontSize: 'clamp(2rem,7vw,4rem)', color: vColor, letterSpacing: '-0.05em', lineHeight: 1, textShadow: `0 0 40px ${vColor}60` }}>
                                    {data.verdict}
                                </div>
                            </div>
                        </div>
                        {/* Confidence */}
                        <div style={{ textAlign: 'right' }}>
                            <div className="section-label" style={{ marginBottom: 8 }}>Confidence</div>
                            <div style={{ fontFamily: 'var(--font-dm-mono)', fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: vColor, letterSpacing: '-0.04em' }}>{data.confidence}%</div>
                            <div style={{ marginTop: 10, width: 130, height: 5, background: 'rgba(var(--glass-white),0.07)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${confWidth}%`, height: '100%', background: `linear-gradient(90deg, ${vColor}, ${isHire ? '#34d399' : '#f87171'})`, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)', boxShadow: `0 0 8px ${vColor}` }} />
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${isHire ? 'rgba(var(--glass-green),0.15)' : 'rgba(var(--glass-red),0.15)'}` }}>
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(0.83rem,1.5vw,0.95rem)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>{data.primaryReason}</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="reveal" style={{ display: 'flex', borderBottom: '1px solid rgba(var(--glass-white),0.08)', marginBottom: 8, marginTop: 4 }}>
                    <button onClick={() => setActiveTab('verdict')} style={{
                        fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '0.9rem',
                        padding: '12px 24px', letterSpacing: '0.01em',
                        color: activeTab === 'verdict' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        borderBottom: `2px solid ${activeTab === 'verdict' ? 'var(--accent-primary)' : 'transparent'}`,
                        transition: 'all 0.2s', background: 'transparent', outline: 'none'
                    }}>
                        Verdict &amp; Reasoning
                    </button>
                    <button onClick={() => setActiveTab('offer')} style={{
                        fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '0.9rem',
                        padding: '12px 24px', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 8,
                        color: activeTab === 'offer' ? 'var(--teal-light)' : 'var(--text-secondary)',
                        borderBottom: `2px solid ${activeTab === 'offer' ? 'var(--teal)' : 'transparent'}`,
                        transition: 'all 0.2s', background: 'transparent', outline: 'none'
                    }}>
                        Offer Intelligence
                    </button>
                    <button onClick={() => setActiveTab('feedback')} style={{
                        fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '0.9rem',
                        padding: '12px 24px', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 8,
                        color: activeTab === 'feedback' ? 'var(--blue)' : 'var(--text-secondary)',
                        borderBottom: `2px solid ${activeTab === 'feedback' ? 'var(--blue)' : 'transparent'}`,
                        transition: 'all 0.2s', background: 'transparent', outline: 'none'
                    }}>
                        Candidate Feedback
                    </button>
                </div>

                {activeTab === 'verdict' ? (
                    <>
                        {/* Skill Heatmap */}
                        <div className="reveal animate-fade-in">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                                <IconBarChart size={14} color="var(--text-dim)" />
                                <span className="section-label">Skill Heatmap</span>
                            </div>
                            <div className="card-glass" style={{ overflow: 'hidden', borderRadius: 14 }}>
                                {/* Header */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 110px)', padding: '10px 20px', background: 'rgba(var(--glass-surface),0.6)', borderBottom: '1px solid rgba(var(--glass-white),0.05)' }}>
                                    {['Skill Area', 'Conceptual', 'Applied', 'Deep'].map(h => (
                                        <div key={h} className="section-label" style={{ textAlign: h === 'Skill Area' ? 'left' : 'center' }}>{h}</div>
                                    ))}
                                </div>
                                {/* Rows */}
                                {(data.skillHeatmap || []).map((row, i) => (
                                    <div key={row.skill} className={`reveal delay-${Math.min(i + 1, 5)}`}
                                        style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 110px)', padding: '13px 20px', borderBottom: i < (data.skillHeatmap?.length - 1) ? '1px solid rgba(var(--glass-white),0.04)' : 'none', alignItems: 'center', cursor: 'default', transition: 'background 0.2s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(var(--glass-accent),0.04)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 500 }}>{row.skill}</div>
                                        {[row.conceptual, row.applied, row.deep].map((lvl, j) => (
                                            <div key={j} style={{ textAlign: 'center' }}>
                                                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', fontWeight: 600, color: heatClr[lvl] || 'var(--text-dim)', background: heatBg[lvl] || 'transparent', padding: '3px 10px', borderRadius: 5, border: `1px solid ${heatClr[lvl] || 'var(--border)'}30` }}>{lvl}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Discrepancy log */}
                        {(data.discrepancies?.length > 0) && (
                            <div className="reveal">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                                    <IconFlag size={14} color="var(--red)" />
                                    <span className="section-label" style={{ color: 'var(--red)' }}>Discrepancy Log</span>
                                    <span className="pill pill-red">{data.discrepancies.length}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {data.discrepancies.map((d, i) => (
                                        <div key={d.id} className={`card-glass card-hover reveal delay-${i + 1}`} style={{
                                            padding: 'clamp(13px,2vw,18px)', borderRadius: 12,
                                            borderLeft: `3px solid ${d.severity === 'CRITICAL' ? 'var(--red)' : d.severity === 'HIGH' ? 'var(--yellow)' : 'rgba(var(--glass-white),0.15)'}`,
                                            display: 'flex', flexDirection: 'column', gap: 8,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <SeverityBadge severity={d.severity} />
                                                {d.severity === 'CRITICAL'
                                                    ? <IconShieldAlert size={14} color="var(--red)" />
                                                    : <IconAlertTriangle size={14} color="var(--yellow)" />
                                                }
                                            </div>
                                            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Claimed: </span>{d.claim}
                                            </div>
                                            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                                <span style={{ color: 'var(--red)', fontWeight: 600 }}>Finding: </span>{d.finding}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Agent Debate ─────────────────────────── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                                <IconUsers size={14} color="var(--text-dim)" />
                                <span className="section-label">Agent Debate</span>
                            </div>

                            {(data.agentDebate || []).map((agent, i) => {
                                const AgentIcon = AGENT_ICONS[agent.agent] || IconCpu;
                                const expanded = activeAgent === agent.agent;
                                return (
                                    <div key={agent.agent} className={`card-glass reveal delay-${i + 1}`} onClick={() => setActiveAgent(p => p === agent.agent ? null : agent.agent)}
                                        style={{
                                            borderRadius: 12, cursor: 'pointer',
                                            borderLeft: `3px solid ${agent.color}`,
                                            transition: 'all 0.28s cubic-bezier(0.16,1,0.3,1)',
                                            boxShadow: expanded ? `0 0 24px ${agent.color}14, inset 0 1px 0 ${agent.color}10` : 'none',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div style={{ padding: 'clamp(13px,2vw,18px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                                <div style={{ width: 38, height: 38, borderRadius: 11, background: `${agent.color}14`, border: `1px solid ${agent.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <AgentIcon size={18} color={agent.color} />
                                                </div>
                                                <div>
                                                    <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{agent.name}</div>
                                                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.62rem', color: posClr[agent.position] || 'var(--text-dim)', fontWeight: 600 }}>{agent.position} — {agent.confidence}% confident</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span className="pill" style={{ background: `${agent.color}12`, border: `1px solid ${agent.color}28`, color: agent.color, fontSize: '0.6rem' }}>{agent.agent}</span>
                                                <IconChevronDown size={15} color="var(--text-dim)"
                                                    style={{ transition: 'transform 0.28s', transform: expanded ? 'rotate(180deg)' : 'none' }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ padding: '0 clamp(13px,2vw,18px)', paddingBottom: expanded ? 'clamp(13px,2vw,18px)' : 12 }}>
                                            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.72, display: expanded ? 'block' : '-webkit-box', WebkitLineClamp: expanded ? undefined : 2, WebkitBoxOrient: 'vertical' as const, overflow: expanded ? 'visible' : 'hidden', transition: 'all 0.25s' }}>
                                                {agent.reasoning}
                                            </p>
                                        </div>
                                        {expanded && <div style={{ height: 1, background: `linear-gradient(90deg, ${agent.color}30, transparent)`, margin: '0 clamp(13px,2vw,18px) 14px' }} />}
                                    </div>
                                );
                            })}

                            {/* Final consensus */}
                            <div className="reveal delay-4" style={{
                                background: 'rgba(18,18,38,0.85)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(var(--glass-accent),0.25)',
                                borderRadius: 14, padding: 'clamp(16px,2vw,22px)',
                                boxShadow: '0 0 32px rgba(var(--glass-accent),0.08), inset 0 1px 0 rgba(var(--glass-accent),0.1)',
                                marginTop: 2,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(var(--glass-accent),0.12)', border: '1px solid rgba(var(--glass-accent),0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <IconStar size={14} color="var(--accent-primary)" />
                                    </div>
                                    <span className="section-label" style={{ color: 'var(--accent-primary)', letterSpacing: '0.1em' }}>Final Consensus</span>
                                </div>
                                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.82 }}>{data.consensus}</p>
                            </div>

                            {/* Score summary bars */}
                            <div className="card-glass reveal delay-5" style={{ padding: 'clamp(13px,2vw,18px)', borderRadius: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                                    <IconCheckCircle size={14} color="var(--text-dim)" />
                                    <span className="section-label">Interview Summary</span>
                                </div>
                                {[
                                    { label: 'Technical Depth', value: Math.round(data.confidence * 0.85), color: 'var(--yellow)' },
                                    { label: 'Claim Validity', value: Math.round(data.confidence * (isHire ? 0.72 : 0.38)), color: isHire ? 'var(--green)' : 'var(--red)' },
                                    { label: 'Communication', value: Math.round(data.confidence * 1.1), color: 'var(--green)' },
                                    { label: 'Overall Score', value: data.confidence, color: 'var(--accent-primary)' },
                                ].map(row => (
                                    <div key={row.label} style={{ marginBottom: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                                            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.72rem', color: row.color, fontWeight: 700 }}>{Math.min(row.value, 100)}</span>
                                        </div>
                                        <div style={{ height: 3, background: 'rgba(var(--glass-white),0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.min(row.value, 100)}%`, background: row.color, transition: 'width 1s ease', opacity: 0.9 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : activeTab === 'offer' ? (
                    <div className="animate-fade-in">
                        <SalaryPanel />
                    </div>
                ) : (
                    <div className="animate-fade-in card-glass reveal" style={{ padding: 24, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(var(--glass-white),0.08)', paddingBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IconMail size={20} color="var(--blue)" />
                                <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>To: {analysisData?.candidate?.email || "candidate@example.com"}</h3>
                            </div>
                            <button
                                className="btn-accent"
                                disabled={isGenerating || hasGenerated}
                                onClick={async () => {
                                    setIsGenerating(true);
                                    try {
                                        await generateReport(data);
                                        setHasGenerated(true);
                                    } catch (err) {
                                        alert("Failed to generate DOCX report.");
                                    }
                                    setIsGenerating(false);
                                }}
                                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, background: hasGenerated ? 'var(--green)' : 'rgba(var(--glass-white),0.05)', color: hasGenerated ? '#000' : 'var(--text-primary)', border: `1px solid ${hasGenerated ? 'transparent' : 'rgba(var(--glass-white),0.2)'}` }}
                            >
                                {hasGenerated ? <><IconCheckCircle size={16} color="#000" /> DOCX Generated</> : isGenerating ? 'Generating Docs...' : <><IconFileCheck size={16} /> Generate DOCX Report</>}
                            </button>
                        </div>

                        {data.candidateFeedback ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <div className="section-label" style={{ marginBottom: 4 }}>Subject</div>
                                    <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{data.candidateFeedback.mailSubject}</div>
                                </div>
                                <div>
                                    <div className="section-label" style={{ marginBottom: 4 }}>Body</div>
                                    <div style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: 'rgba(var(--glass-black),0.3)', padding: 16, borderRadius: 8, border: '1px solid rgba(var(--glass-white),0.05)' }}>
                                        {data.candidateFeedback.mailBody}
                                    </div>
                                </div>
                                <div style={{ marginTop: 8 }}>
                                    <button
                                        className="btn-accent"
                                        disabled={isSending || emailSent}
                                        onClick={async () => {
                                            setIsSending(true);
                                            try {
                                                await sendEmail({
                                                    to: analysisData?.candidate?.email || "candidate@example.com",
                                                    subject: data.candidateFeedback?.mailSubject || "Feedback",
                                                    body: data.candidateFeedback?.mailBody || ""
                                                });
                                                setEmailSent(true);
                                            } catch (e) {
                                                alert("Failed to send email");
                                            }
                                            setIsSending(false);
                                        }}
                                        style={{ padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: 8, background: emailSent ? 'var(--green)' : 'var(--blue)' }}
                                    >
                                        {emailSent ? <><IconCheckCircle size={16} /> Email Sent</> : isSending ? 'Sending...' : <><IconMail size={16} /> Send Email</>}
                                    </button>
                                    <div style={{ marginTop: 12, fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                        Note: Sends a generated feedback email (polite rejection / improvement areas) to the email explicitly parsed from the resume or mock.
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-dim)', background: 'rgba(var(--glass-white),0.02)', padding: 16, borderRadius: 8, border: '1px dashed rgba(var(--glass-white),0.1)' }}>
                                <div style={{ marginBottom: 16 }}>Candidate feedback generation was skipped or is unavailable for this session. Use the Generate DOCX Report button above to produce a comprehensive HR report via Mistral instead. You can also send a standard update email to the candidate.</div>
                                <button
                                    className="btn-accent"
                                    disabled={isSending || emailSent}
                                    onClick={async () => {
                                        setIsSending(true);
                                        try {
                                            await sendEmail({
                                                to: analysisData?.candidate?.email || "candidate@example.com",
                                                subject: "Update on your interview timeline",
                                                body: `Dear ${analysisData?.candidate?.name ? analysisData.candidate.name.split(' ')[0] : 'Candidate'},\n\nThank you for taking the time to complete the technical interview at TrueHire.\n\nOur team has reviewed your evaluation. We appreciate the effort you put in, but we have decided to move forward with other candidates whose profiles more closely align with our current needs.\n\nWe wish you the best of luck in your job search, and we will keep your resume on file for future roles.\n\nBest regards,\nThe Hiring Team`
                                            });
                                            setEmailSent(true);
                                        } catch (e) {
                                            alert("Failed to send email");
                                        }
                                        setIsSending(false);
                                    }}
                                    style={{ padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: 8, background: emailSent ? 'var(--green)' : 'var(--blue)' }}
                                >
                                    {emailSent ? <><IconCheckCircle size={16} /> Candidate Emailed</> : isSending ? 'Sending...' : <><IconMail size={16} /> Mail Candidate</>}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
            @media (max-width: 640px) {
              div[style*="grid-template-columns: 1fr repeat(3, 110px)"] { grid-template-columns: 1fr repeat(3, 70px) !important; }
            }
          `}</style>
        </div>
    );
}
