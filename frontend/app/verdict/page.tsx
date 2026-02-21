'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SeverityBadge from '@/components/SeverityBadge';
import {
    IconThumbsUp, IconThumbsDown, IconDownload, IconArrowRight,
    IconChevronDown, IconShieldAlert, IconFlag, IconBarChart,
    IconTarget, IconUsers, IconCpu, IconZap, IconShield,
    IconCheckCircle, IconAlertTriangle, IconStar,
} from '@/components/Icons';
import { generateVerdict } from '@/lib/api';

const AGENT_ICONS: Record<string, React.ComponentType<any>> = {
    'A1': IconCpu,
    'A2': IconZap,
    'A3': IconTarget,
    'A4': IconShield,
};

export default function VerdictPage() {
    const router = useRouter();
    const [data, setData] = useState<any | null>(null);
    const [activeAgent, setActiveAgent] = useState<string | null>(null);
    const [confWidth, setConfWidth] = useState(0);

    useScrollReveal([data]);

    useEffect(() => {
        const fetchVerdict = async () => {
            const storedVerdict = sessionStorage.getItem('verdictData');
            const storedAnalysis = sessionStorage.getItem('analysisData');

            if (!storedVerdict || !storedAnalysis) {
                router.push('/');
                return;
            }

            try {
                const verdictData = JSON.parse(storedVerdict);
                const analysisData = JSON.parse(storedAnalysis);

                // Map UI evaluations to backend QA pairs
                const qa_pairs = Object.entries(verdictData.evaluations).map(([qId, eval_]) => ({
                    question: qId,
                    answer: (eval_ as any).snippet, // We don't have the full answer, but snippet works for demo
                    evaluation: eval_
                }));

                // Reconstruct raw analysis for backend compatibility
                const rawAnalysis = {
                    overall_fit_score: analysisData.fitScore,
                    key_strengths: analysisData.strengths,
                    red_flags: analysisData.redFlags.map((rf: any) => rf.claim),
                    skills: analysisData.skills.map((s: any) => ({
                        skill_name: s.name,
                        proficiency_level: s.tier === 'HIGH' ? 'Expert' : s.tier === 'MEDIUM' ? 'Intermediate' : 'Beginner',
                        evidence: "Verified during initial analysis."
                    }))
                };

                // Call backend
                const result = await generateVerdict({
                    resume_analysis: rawAnalysis,
                    qa_pairs: qa_pairs
                });

                // Map Result to UI state shape
                const mapped: any = {
                    verdict: result.verdict,
                    confidence: result.confidence || 0,
                    primaryReason: result.summary,
                    skillHeatmap: Object.entries(result.skill_heatmap || {}).map(([skill, score]) => ({
                        skill,
                        conceptual: (score as any) > 7 ? 'HIGH' : (score as any) > 4 ? 'MEDIUM' : 'LOW',
                        applied: (score as any) > 7 ? 'HIGH' : (score as any) > 4 ? 'MEDIUM' : 'LOW',
                        deep: (score as any) > 8 ? 'HIGH' : 'MEDIUM'
                    })),
                    discrepancies: result.discrepancy_log.map((d: any, i: number) => ({
                        id: `d-${i}`,
                        claim: d.claim,
                        finding: d.contradiction,
                        severity: d.severity
                    })),
                    agentDebate: result.reasoning_trace.map((trace: string, i: number) => ({
                        agent: `A${i + 1}`,
                        name: `Agent ${String.fromCharCode(65 + i)}`,
                        color: i === 0 ? 'var(--accent-primary)' : i === 1 ? 'var(--yellow)' : 'var(--red)',
                        position: result.verdict,
                        reasoning: trace
                    })),
                    consensus: result.summary
                };

                setData(mapped);
            } catch (err) {
                console.error("Verdict failed", err);
                setData({ error: true, message: err instanceof Error ? err.message : 'Unknown error' });
            }
        };

        fetchVerdict();
    }, []);

    if (!data) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%' }} className="animate-spin" />
            <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Generating final verdict...</p>
        </div>
    );

    if (data.error) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', flexDirection: 'column', gap: 20, padding: 40, textAlign: 'center' }}>
            <div style={{ padding: 20, borderRadius: '50%', background: 'var(--red)10' }}>
                <IconAlertTriangle size={40} color="var(--red)" />
            </div>
            <div>
                <h2 style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: '1.5rem', marginBottom: 8 }}>Verdict Engine Error</h2>
                <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 450, lineHeight: 1.6 }}>
                    The AI debate committee encountered an issue: <br />
                    <code style={{ fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: 4, display: 'inline-block', marginTop: 10 }}>{data.message}</code>
                </p>
            </div>
            <button className="btn-accent" onClick={() => router.push('/interview')} style={{ padding: '12px 24px' }}>
                Return to Interview
            </button>
        </div>
    );

    const isHire = data.verdict?.startsWith('HIRE');
    const vColor = isHire ? 'var(--green)' : 'var(--red)';
    const vGlow = isHire ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)';
    const heatClr: Record<string, string> = { HIGH: 'var(--green)', MEDIUM: 'var(--yellow)', LOW: 'var(--red)' };
    const heatBg: Record<string, string> = { HIGH: 'rgba(16,185,129,0.1)', MEDIUM: 'rgba(245,158,11,0.1)', LOW: 'rgba(239,68,68,0.1)' };
    const posClr: Record<string, string> = { 'NO-HIRE': 'var(--red)', HIRE: 'var(--green)', CONDITIONAL: 'var(--yellow)' };

    const handleExport = () => {
        const b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: 'truehire-verdict.json' });
        a.click();
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 56px)', padding: 'clamp(24px,5vh,48px) clamp(16px,4vw,40px)', maxWidth: 1300, margin: '0 auto' }}>

            {/* ── HEADER ─────────────────────────────────────── */}
            <div className="reveal" style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ padding: '6px 12px', borderRadius: 6, background: 'var(--accent-primary)10', border: '1px solid var(--accent-primary)20', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--accent-primary)', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase' }}>Report #V-{new Date().toISOString().slice(2, 10).replace(/-/g, '')}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontFamily: 'var(--font-inter)', fontWeight: 800, fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8, color: 'var(--text-primary)' }}>Executive Verdict</h1>
                        <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Final consolidation of candidate intelligence and agent consensus.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                        <button className="btn-ghost" onClick={handleExport} style={{ padding: '10px 20px', fontSize: '0.85rem', fontWeight: 600 }}>
                            <IconDownload size={16} /> Export Dossier
                        </button>
                        <button className="btn-accent" onClick={() => { sessionStorage.clear(); router.push('/'); }} style={{ padding: '10px 24px', fontSize: '0.85rem', fontWeight: 600 }}>
                            New Evaluation
                        </button>
                    </div>
                </div>
            </div>

            {/* ── MAIN GRID ──────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 22 }}>

                {/* LEFT ─────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Verdict banner */}
                    <div className="reveal" style={{
                        borderRadius: 20, padding: 'clamp(24px, 5vw, 40px)',
                        background: isHire
                            ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)'
                            : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)',
                        border: `1px solid ${isHire ? 'var(--green)20' : 'var(--red)20'}`,
                        borderLeft: `6px solid ${vColor}`,
                        boxShadow: `0 20px 60px -20px ${vGlow}`,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: vGlow, filter: 'blur(60px)', opacity: 0.5, pointerEvents: 'none' }} />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 64, height: 64, borderRadius: 16, background: isHire ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${isHire ? 'var(--green)30' : 'var(--red)30'}` }}>
                                        {isHire ? <IconThumbsUp size={32} color="#fff" /> : <IconThumbsDown size={32} color="#fff" />}
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 800, fontSize: 'clamp(2.4rem, 6vw, 3.8rem)', color: 'var(--text-primary)', letterSpacing: '-0.05em', lineHeight: 1 }}>
                                            {data.verdict}
                                        </div>
                                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: vColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Committee Consensus</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 800, fontSize: '2.5rem', color: 'var(--text-primary)', lineHeight: 1 }}>{data.confidence}%</div>
                                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 4 }}>Confidence Score</div>
                                    <div style={{ marginTop: 10, width: 120, height: 6, background: 'rgba(15,23,42,0.08)', borderRadius: 10, overflow: 'hidden', marginLeft: 'auto' }}>
                                        <div style={{ width: `${confWidth}%`, height: '100%', background: vColor, borderRadius: 10, boxShadow: `0 0 10px ${vColor}40` }} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ borderRadius: 12, background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(15,23,42,0.04)', padding: 20 }}>
                                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>{data.primaryReason}</p>
                            </div>
                        </div>
                    </div>

                    {/* Skill Heatmap */}
                    <div className="reveal">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-primary)10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconBarChart size={14} color="var(--accent-primary)" />
                            </div>
                            <span className="section-label" style={{ color: 'var(--text-primary)', textTransform: 'none', fontSize: '0.9rem', fontWeight: 700 }}>Technical Attribute Grid</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                            {data.skillHeatmap?.map((row: any, i: number) => (
                                <div key={row.skill} className={`card-glass reveal delay-${Math.min(i + 1, 5)}`}
                                    style={{ padding: 20, borderRadius: 16, border: '1px solid rgba(15,23,42,0.06)', position: 'relative' }}>
                                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>{row.skill}</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {[
                                            { label: 'Conceptual', val: row.conceptual },
                                            { label: 'Applied', val: row.applied },
                                            { label: 'Deep', val: row.deep }
                                        ].map((attr, j) => (
                                            <div key={j} style={{
                                                flex: '1 1 80px', padding: '10px 8px', borderRadius: 10, textAlign: 'center',
                                                background: heatBg[attr.val] || 'var(--bg-secondary)',
                                                border: `1px solid ${heatClr[attr.val]}30`
                                            }}>
                                                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.62rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>{attr.label}</div>
                                                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', fontWeight: 800, color: heatClr[attr.val] }}>{attr.val}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Discrepancy log */}
                    <div className="reveal">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--red)10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconFlag size={14} color="var(--red)" />
                            </div>
                            <span className="section-label" style={{ color: 'var(--red)', textTransform: 'none', fontSize: '0.9rem', fontWeight: 700 }}>Integrity & Consistency Log</span>
                            <span style={{ marginLeft: 'auto', background: 'var(--red)10', color: 'var(--red)', fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>{data.discrepancies?.length} Signals</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {data.discrepancies?.map((d: any, i: number) => (
                                <div key={d.id} className={`card-glass reveal delay-${i + 1}`} style={{
                                    padding: 24, borderRadius: 16,
                                    borderLeft: `4px solid ${d.severity === 'CRITICAL' ? 'var(--red)' : d.severity === 'HIGH' ? 'var(--yellow)' : 'var(--border)'}`,
                                    display: 'flex', gap: 20, alignItems: 'flex-start'
                                }}>
                                    <div style={{ marginTop: 2 }}>
                                        <SeverityBadge severity={d.severity} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 12 }}>
                                            <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>CANDIDATE CLAIM:</span> <br />
                                            <span style={{ fontWeight: 500 }}>"{d.claim}"</span>
                                        </div>
                                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--red)', lineHeight: 1.6, background: 'var(--red)05', padding: '12px 16px', borderRadius: 8, border: '1px dashed var(--red)20' }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Agent Finding:</div>
                                            {d.finding}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT — Agent Debate ─────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <IconUsers size={14} color="var(--text-dim)" />
                        <span className="section-label">Agent Debate</span>
                    </div>

                    {data.agentDebate?.map((agent: any, i: number) => {
                        const AgentIcon = AGENT_ICONS[agent.agent] || IconCpu;
                        const expanded = activeAgent === agent.agent;
                        return (
                            <div key={agent.agent} className={`card-glass reveal delay-${i + 1}`} onClick={() => setActiveAgent(p => p === agent.agent ? null : agent.agent)}
                                style={{
                                    borderRadius: 16, cursor: 'pointer',
                                    border: expanded ? `1px solid ${agent.color}40` : '1px solid rgba(15,23,42,0.06)',
                                    background: expanded ? `${agent.color}05` : undefined,
                                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                                    boxShadow: expanded ? `0 12px 24px -8px ${agent.color}20` : 'none',
                                    overflow: 'hidden',
                                }}
                            >
                                <div style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${agent.color}15`, border: `1px solid ${agent.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <AgentIcon size={20} color={agent.color} />
                                        </div>
                                        <div>
                                            <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{agent.name}</div>
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 4,
                                                background: agent.position?.startsWith('HIRE') ? 'var(--green)15' : 'var(--red)15',
                                                color: agent.position?.startsWith('HIRE') ? 'var(--green)' : 'var(--red)',
                                                fontFamily: 'JetBrains Mono', fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', marginTop: 4
                                            }}>
                                                {agent.position}
                                            </div>
                                        </div>
                                    </div>
                                    <IconChevronDown size={18} color="var(--text-dim)"
                                        style={{ transition: 'transform 0.3s', transform: expanded ? 'rotate(180deg)' : 'none' }}
                                    />
                                </div>

                                <div style={{ padding: '0 20px 20px', display: expanded ? 'block' : 'none' }}>
                                    <div style={{ padding: 20, background: 'rgba(255,255,255,0.5)', borderRadius: 12, border: '1px solid rgba(15,23,42,0.04)' }}>
                                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.8, fontWeight: 500 }}>
                                            {agent.reasoning}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Final consensus */}
                    <div className="reveal delay-4" style={{
                        background: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 20, padding: 28,
                        boxShadow: '0 24px 48px -12px rgba(0,0,0,0.4)',
                        marginTop: 8,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconStar size={16} color="#fff" />
                            </div>
                            <span className="section-label" style={{ color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Executive Summary</span>
                        </div>
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, fontWeight: 500 }}>{data.consensus}</p>
                    </div>

                    {/* Score summary */}
                    <div className="card-glass reveal delay-5" style={{ padding: 'clamp(13px,2vw,18px)', borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                            <IconCheckCircle size={14} color="var(--text-dim)" />
                            <span className="section-label">Interview Summary</span>
                        </div>
                        {[
                            { label: 'Technical Depth', value: 61, color: 'var(--yellow)' },
                            { label: 'Claim Validity', value: 38, color: 'var(--red)' },
                            { label: 'Communication', value: 75, color: 'var(--green)' },
                            { label: 'Overall Score', value: 52, color: 'var(--accent-primary)' },
                        ].map((row: any) => (
                            <div key={row.label} style={{ marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: row.color, fontWeight: 700 }}>{row.value}</span>
                                </div>
                                <div style={{ height: 3, background: 'rgba(15,23,42,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${row.value}%`, background: row.color, transition: 'width 1s ease', opacity: 0.9 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 380px"] { display: flex !important; flex-direction: column !important; }
        }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr repeat(3, 110px)"] { grid-template-columns: 1fr repeat(3, 70px) !important; }
        }
      `}</style>
        </div>
    );
}
