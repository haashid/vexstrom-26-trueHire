'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SeverityBadge from '@/components/SeverityBadge';
import { MOCK_VERDICT } from '@/lib/mockData';
import {
    IconThumbsUp, IconThumbsDown, IconDownload, IconArrowRight,
    IconChevronDown, IconShieldAlert, IconFlag, IconBarChart,
    IconTarget, IconUsers, IconCpu, IconZap, IconShield,
    IconCheckCircle, IconAlertTriangle, IconStar,
} from '@/components/Icons';

const AGENT_ICONS: Record<string, React.ComponentType<any>> = {
    'A1': IconCpu,
    'A2': IconZap,
    'A3': IconTarget,
    'A4': IconShield,
};

export default function VerdictPage() {
    const router = useRouter();
    const [data, setData] = useState<typeof MOCK_VERDICT | null>(null);
    const [activeAgent, setActiveAgent] = useState<string | null>(null);
    const [confWidth, setConfWidth] = useState(0);

    useScrollReveal([data]);

    useEffect(() => {
        const stored = sessionStorage.getItem('verdictData');
        setData(stored ? JSON.parse(stored) : MOCK_VERDICT);
    }, []);

    useEffect(() => {
        if (data) setTimeout(() => setConfWidth(data.confidence), 200);
    }, [data]);

    if (!data) return null;

    const isHire = data.verdict === 'HIRE';
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
            <div className="reveal" style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--accent-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }} />
                    Interview Complete — Final Verdict
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <h1 style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: 'clamp(1.4rem,4vw,2.2rem)', letterSpacing: '-0.03em' }}>AI Verdict Report</h1>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn-ghost" onClick={handleExport} style={{ padding: '9px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <IconDownload size={15} color="currentColor" /> Export JSON
                        </button>
                        <button className="btn-accent" onClick={() => { sessionStorage.clear(); router.push('/'); }} style={{ padding: '9px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 7 }}>
                            New Interview <IconArrowRight size={15} color="rgba(255,255,255,0.7)" />
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
                        borderRadius: 16, padding: 'clamp(20px,4vw,32px)',
                        background: isHire
                            ? 'linear-gradient(135deg, rgba(7,26,18,0.9) 0%, rgba(16,185,129,0.04) 100%)'
                            : 'linear-gradient(135deg, rgba(26,7,7,0.9) 0%, rgba(239,68,68,0.04) 100%)',
                        border: `1px solid ${isHire ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        borderLeft: `4px solid ${vColor}`,
                        backdropFilter: 'blur(24px)',
                        boxShadow: `0 0 80px ${vGlow}, 0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                            <div>
                                <div className="section-label" style={{ marginBottom: 12 }}>Final Verdict</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 16, background: `${isHire ? 'rgba(16,185,129,' : 'rgba(239,68,68,'}0.12)`, border: `1px solid ${vColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {isHire
                                            ? <IconThumbsUp size={26} color={vColor} />
                                            : <IconThumbsDown size={26} color={vColor} />
                                        }
                                    </div>
                                    <div style={{ fontFamily: 'DM Sans', fontWeight: 900, fontSize: 'clamp(2rem,7vw,4rem)', color: vColor, letterSpacing: '-0.05em', lineHeight: 1, textShadow: `0 0 40px ${vColor}60` }}>
                                        {data.verdict}
                                    </div>
                                </div>
                            </div>
                            {/* Confidence */}
                            <div style={{ textAlign: 'right' }}>
                                <div className="section-label" style={{ marginBottom: 8 }}>Confidence</div>
                                <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: vColor, letterSpacing: '-0.04em' }}>{data.confidence}%</div>
                                <div style={{ marginTop: 10, width: 130, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: `${confWidth}%`, height: '100%', background: `linear-gradient(90deg, ${vColor}, ${isHire ? '#34d399' : '#f87171'})`, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)', boxShadow: `0 0 8px ${vColor}` }} />
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${isHire ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                            <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 'clamp(0.83rem,1.5vw,0.95rem)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>{data.primaryReason}</p>
                        </div>
                    </div>

                    {/* Skill Heatmap */}
                    <div className="reveal">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                            <IconBarChart size={14} color="var(--text-dim)" />
                            <span className="section-label">Skill Heatmap</span>
                        </div>
                        <div className="card-glass" style={{ overflow: 'hidden', borderRadius: 14 }}>
                            {/* Header */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 110px)', padding: '10px 20px', background: 'rgba(10,10,15,0.6)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {['Skill Area', 'Conceptual', 'Applied', 'Deep'].map(h => (
                                    <div key={h} className="section-label" style={{ textAlign: h === 'Skill Area' ? 'left' : 'center' }}>{h}</div>
                                ))}
                            </div>
                            {/* Rows */}
                            {data.skillHeatmap.map((row, i) => (
                                <div key={row.skill} className={`reveal delay-${Math.min(i + 1, 5)}`}
                                    style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 110px)', padding: '13px 20px', borderBottom: i < data.skillHeatmap.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', cursor: 'default', transition: 'background 0.2s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 500 }}>{row.skill}</div>
                                    {[row.conceptual, row.applied, row.deep].map((lvl, j) => (
                                        <div key={j} style={{ textAlign: 'center' }}>
                                            <span style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.68rem', fontWeight: 600, color: heatClr[lvl] || 'var(--text-dim)', background: heatBg[lvl] || 'transparent', padding: '3px 10px', borderRadius: 5, border: `1px solid ${heatClr[lvl] || 'var(--border)'}30` }}>{lvl}</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Discrepancy log */}
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
                                    borderLeft: `3px solid ${d.severity === 'CRITICAL' ? 'var(--red)' : d.severity === 'HIGH' ? 'var(--yellow)' : 'rgba(255,255,255,0.15)'}`,
                                    display: 'flex', flexDirection: 'column', gap: 8,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <SeverityBadge severity={d.severity} />
                                        {d.severity === 'CRITICAL'
                                            ? <IconShieldAlert size={14} color="var(--red)" />
                                            : <IconAlertTriangle size={14} color="var(--yellow)" />
                                        }
                                    </div>
                                    <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Claimed: </span>{d.claim}
                                    </div>
                                    <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        <span style={{ color: 'var(--red)', fontWeight: 600 }}>Finding: </span>{d.finding}
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

                    {data.agentDebate.map((agent, i) => {
                        const AgentIcon = AGENT_ICONS[agent.agent] || IconCpu;
                        const expanded = activeAgent === agent.agent;
                        return (
                            <div key={agent.agent} className={`card-glass reveal delay-${i + 1}`} onClick={() => setActiveAgent(p => p === agent.agent ? null : agent.agent)}
                                style={{
                                    borderRadius: 12, cursor: 'pointer',
                                    borderLeft: `3px solid ${agent.color}`,
                                    background: expanded ? `rgba(${agent.color === '#6366F1' ? '99,102,241' : agent.color === '#10B981' ? '16,185,129' : agent.color === '#F59E0B' ? '245,158,11' : '239,68,68'},0.06)` : undefined,
                                    transition: 'all 0.28s cubic-bezier(0.16,1,0.3,1)',
                                    boxShadow: expanded ? `0 0 24px ${agent.color}14, inset 0 1px 0 ${agent.color}10` : 'none',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Agent header */}
                                <div style={{ padding: 'clamp(13px,2vw,18px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                        <div style={{ width: 38, height: 38, borderRadius: 11, background: `${agent.color}14`, border: `1px solid ${agent.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <AgentIcon size={18} color={agent.color} />
                                        </div>
                                        <div>
                                            <div style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{agent.name}</div>
                                            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: posClr[agent.position] || 'var(--text-dim)', fontWeight: 600 }}>{agent.position}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span className="pill" style={{ background: `${agent.color}12`, border: `1px solid ${agent.color}28`, color: agent.color, fontSize: '0.6rem' }}>{agent.agent}</span>
                                        <IconChevronDown size={15} color="var(--text-dim)"
                                            style={{ transition: 'transform 0.28s', transform: expanded ? 'rotate(180deg)' : 'none' }}
                                        />
                                    </div>
                                </div>

                                {/* Preview / Expanded */}
                                <div style={{ padding: '0 clamp(13px,2vw,18px)', paddingBottom: expanded ? 'clamp(13px,2vw,18px)' : 12 }}>
                                    <p style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.72, display: expanded ? 'block' : '-webkit-box', WebkitLineClamp: expanded ? undefined : (2 as any), WebkitBoxOrient: 'vertical' as any, overflow: expanded ? 'visible' : 'hidden', transition: 'all 0.25s' }}>
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
                        border: '1px solid rgba(99,102,241,0.25)',
                        borderRadius: 14, padding: 'clamp(16px,2vw,22px)',
                        boxShadow: '0 0 32px rgba(99,102,241,0.08), inset 0 1px 0 rgba(99,102,241,0.1)',
                        marginTop: 2,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconStar size={14} color="var(--accent-primary)" />
                            </div>
                            <span className="section-label" style={{ color: 'var(--accent-primary)', letterSpacing: '0.1em' }}>Final Consensus</span>
                        </div>
                        <p style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.82 }}>{data.consensus}</p>
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
                        ].map(row => (
                            <div key={row.label} style={{ marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: row.color, fontWeight: 700 }}>{row.value}</span>
                                </div>
                                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
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
