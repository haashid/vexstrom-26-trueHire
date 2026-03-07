'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SegmentedBar from '@/components/SegmentedBar';
import QuestionRow from '@/components/QuestionRow';
import SeverityBadge from '@/components/SeverityBadge';
import {
    IconTarget, IconFlag, IconStar, IconCpu,
    IconActivity, IconList, IconArrowRight, IconAlertTriangle
} from '@/components/Icons';

export default function PreBriefPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [expandedFlags, setExpandedFlags] = useState<Record<string, boolean>>({});
    const [copiedFlag, setCopiedFlag] = useState<string | null>(null);

    useScrollReveal([data]);

    useEffect(() => {
        const stored = sessionStorage.getItem('analysisData');
        if (stored) {
            setData(JSON.parse(stored));
        } else {
            // If no data, send back to home
            router.push('/');
        }
    }, [router]);

    if (!data) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%' }} className="animate-spin" />
            <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Generating intelligence brief...</p>
        </div>
    );

    const copyQ = async (q: string, id: string) => {
        await navigator.clipboard.writeText(q);
        setCopiedFlag(id);
        setTimeout(() => setCopiedFlag(null), 2000);
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

            {/* ── HEADER ── */}
            <div className="reveal" style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ padding: '6px 12px', background: 'var(--accent-soft)', border: '1px solid var(--accent-primary)30', borderRadius: 6, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Intelligence Brief
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-inter)', fontWeight: 600 }}>
                        <IconCpu size={14} /> Agent Pipeline Synthesis
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
                    <div>
                        <h1 style={{ fontFamily: 'var(--font-inter)', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 2.5rem)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8, color: 'var(--text-primary)' }}>
                            Candidate Assessment
                        </h1>
                        <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>
                            {data.candidate.role} — Profile ID: <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-primary)' }}>{new Date().getTime().toString(36).toUpperCase()}</span>
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>Engagement Fit</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-inter)', color: data.fitScore > 70 ? 'var(--green)' : 'var(--accent-primary)', lineHeight: 1 }}>{data.fitScore}%</div>
                        </div>
                        <div style={{ width: 1, background: 'var(--border)', height: 32, alignSelf: 'center' }} />
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>Risk Signals</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-inter)', color: data.redFlags.length > 0 ? 'var(--red)' : 'var(--text-primary)', lineHeight: 1 }}>{data.redFlags.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── GRID LAYOUT ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24, flex: 1 }}>

                {/* LEFT COLUMN: Profile & Skills */}
                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Key Highlights */}
                    <div className="card-glass reveal delay-1" style={{ padding: 24, borderRadius: 16 }}>
                        <h3 className="section-label" style={{ marginBottom: 16 }}>
                            <IconStar color="var(--yellow)" size={16} /> Technical Strengths
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {data.strengths.map((s: string, i: number) => (
                                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', marginTop: 8, flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fit Context */}
                    <div className="card-glass reveal delay-2" style={{ padding: 24, borderRadius: 16, background: 'var(--accent-soft)', border: '1px solid var(--accent-primary)10' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                                <IconActivity size={24} color="var(--accent-primary)" />
                            </div>
                            <div>
                                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analysis</div>
                                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Engagement Pipeline</div>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                            The agent pipeline has determined a <strong>{data.fitScore}%</strong> match for the {data.candidate.role} position based on technical depth and experience alignment.
                        </p>
                    </div>
                </div>

                {/* RIGHT COLUMN: Red Flags & Questions */}
                <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Tactical Risk Log */}
                    <div className="card-glass reveal delay-1" style={{ borderRadius: 16, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                            <h3 className="section-label" style={{ color: 'var(--text-primary)' }}>
                                <IconFlag color="var(--red)" size={16} /> Integrity Check Log
                            </h3>
                            <span style={{ fontSize: '0.65rem', background: 'var(--red)10', color: 'var(--red)', padding: '4px 10px', borderRadius: 20, fontWeight: 800 }}>{data.redFlags.length} ANOMALIES</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {data.redFlags.map((flag: any, i: number) => (
                                <div key={flag.id} style={{ borderBottom: i === data.redFlags.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                    <div
                                        onClick={() => setExpandedFlags(p => ({ ...p, [flag.id]: !p[flag.id] }))}
                                        style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--red)05', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <IconAlertTriangle color="var(--red)" size={16} />
                                        </div>
                                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{flag.claim}</span>
                                        <IconArrowRight size={18} color="var(--text-dim)" style={{ transform: expandedFlags[flag.id] ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                                    </div>
                                    {expandedFlags[flag.id] && (
                                        <div style={{ padding: '0 24px 20px 68px', marginTop: -4 }}>
                                            <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{flag.concern}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Strategy & Action */}
                    <div className="reveal delay-3" style={{ marginTop: 'auto', display: 'flex', gap: 24, alignItems: 'center', padding: '24px 0' }}>
                        <div style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', paddingLeft: 16, borderLeft: '3px solid var(--accent-primary)', lineHeight: 1.6 }}>
                            " {data.interviewStrategy} "
                        </div>
                        <button
                            className="btn-accent"
                            onClick={() => router.push('/interview')}
                            style={{ padding: '16px 32px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap', borderRadius: 12 }}
                        >
                            Start Final Evaluation <IconArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 1024px) {
                    div[style*="grid-template-columns: repeat(12"] {
                        display: flex !important;
                        flex-direction: column !important;
                    }
                }
            `}</style>
        </div>
    );
}
