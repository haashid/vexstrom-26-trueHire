'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SegmentedBar from '@/components/SegmentedBar';
import QuestionRow from '@/components/QuestionRow';
import SeverityBadge from '@/components/SeverityBadge';
import { MOCK_ANALYSIS } from '@/lib/mockData';

export default function PreBriefPage() {
    const router = useRouter();
    const [data, setData] = useState<typeof MOCK_ANALYSIS | null>(null);
    const [expandedFlags, setExpandedFlags] = useState<Record<string, boolean>>({});
    const [copiedFlag, setCopiedFlag] = useState<string | null>(null);

    useScrollReveal([data]);

    useEffect(() => {
        const stored = sessionStorage.getItem('analysisData');
        setData(stored ? JSON.parse(stored) : MOCK_ANALYSIS);
    }, []);

    if (!data) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%' }} className="animate-spin" />
            <p style={{ fontFamily: 'IBM Plex Sans', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Loading intelligence brief...</p>
        </div>
    );

    const credColors: Record<string, string> = { HIGH: 'var(--green)', MEDIUM: 'var(--yellow)', LOW: 'var(--red)' };
    const credColor = credColors[data.candidate.credibility] || 'var(--yellow)';

    const copyQ = async (q: string, id: string) => {
        await navigator.clipboard.writeText(q);
        setCopiedFlag(id);
        setTimeout(() => setCopiedFlag(null), 2000);
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>

            {/* ── PAGE HEADER ─────────────────────────────────── */}
            <div className="reveal" style={{ padding: '28px clamp(16px,4vw,36px) 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: 'var(--accent-primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>◆ Pre-Interview Intelligence Brief</div>
                    <h2 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 'clamp(1.2rem,3vw,1.6rem)', letterSpacing: '-0.02em' }}>
                        {data.candidate.name}
                        <span style={{ fontFamily: 'IBM Plex Sans', fontWeight: 400, fontSize: '1rem', color: 'var(--text-secondary)', marginLeft: 12 }}>{data.candidate.role}</span>
                    </h2>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${credColor}12`, border: `1px solid ${credColor}40`, borderRadius: 8, padding: '7px 14px' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: credColor, boxShadow: `0 0 8px ${credColor}`, flexShrink: 0 }} />
                        <span style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.78rem', color: credColor, fontWeight: 500 }}>{data.candidate.credibilityLabel}</span>
                    </div>
                </div>
            </div>

            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--border), transparent)', margin: '0 clamp(16px,4vw,36px)' }} />

            {/* ── TWO-PANEL LAYOUT ─────────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'clamp(300px, 33%, 420px) 1fr',
                flex: 1,
                minHeight: 0,
            }}>
                {/* LEFT PANEL */}
                <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', padding: 'clamp(16px,3vw,24px)' }}>

                    {/* Skill Inventory */}
                    <section style={{ marginBottom: 28 }}>
                        <div className="reveal" style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>◈</span> Skills Inventory
                        </div>
                        <div className="card-glass reveal" style={{ padding: 'clamp(14px,2vw,20px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {data.skills.map((skill, i) => (
                                <div key={skill.name} className={`reveal delay-${Math.min(i + 1, 6)}`}>
                                    <SegmentedBar value={skill.level} label={skill.name} segments={15} height={7} />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Red Flags */}
                    <section>
                        <div className="reveal" style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--red)' }}>⚑</span> Red Flags
                            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', background: 'var(--red-glow)', color: 'var(--red)', padding: '1px 7px', borderRadius: 4 }}>{data.redFlags.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {data.redFlags.map((flag, i) => (
                                <div
                                    key={flag.id}
                                    className={`card-glass card-hover reveal delay-${i + 1}`}
                                    style={{ borderLeft: `3px solid ${flag.severity === 'CRITICAL' ? 'var(--red)' : flag.severity === 'HIGH' ? 'var(--yellow)' : 'var(--border-bright)'}`, overflow: 'hidden' }}
                                >
                                    <div onClick={() => setExpandedFlags(p => ({ ...p, [flag.id]: !p[flag.id] }))} style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        <SeverityBadge severity={flag.severity} />
                                        <span style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.82rem', color: 'var(--text-secondary)', flex: 1, lineHeight: 1.5 }}>{flag.claim}</span>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', transition: 'transform 0.2s', transform: expandedFlags[flag.id] ? 'rotate(180deg)' : 'none', marginTop: 2 }}>▼</span>
                                    </div>
                                    {expandedFlags[flag.id] && (
                                        <div className="animate-fade-in" style={{ borderTop: '1px solid var(--border)', padding: '12px 14px' }}>
                                            <p style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 12 }}>{flag.concern}</p>
                                            <div style={{ background: 'rgba(17,17,24,0.7)', borderRadius: 6, padding: '10px 12px', marginBottom: 10, fontFamily: 'IBM Plex Sans', fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic', borderLeft: '2px solid var(--accent-primary)' }}>
                                                "{flag.verificationQuestion}"
                                            </div>
                                            <button className="btn-ghost" onClick={() => copyQ(flag.verificationQuestion, flag.id)} style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
                                                {copiedFlag === flag.id ? '✓ Copied' : '⎘ Copy Question'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* RIGHT PANEL */}
                <div style={{ overflowY: 'auto', padding: 'clamp(16px,3vw,24px)' }}>
                    <div className="reveal" style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>
                        Question Bank
                    </div>

                    {data.questionBank.map((group, gi) => (
                        <section key={group.area} className={`reveal delay-${gi + 1}`} style={{ marginBottom: 28 }}>
                            <div style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--accent-primary)' }}>◆</span>{group.area}
                                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>{group.questions.length}q</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {group.questions.map(q => <QuestionRow key={q.id} question={q} status="pending" />)}
                            </div>
                        </section>
                    ))}

                    {/* Strategy */}
                    <div className="reveal delay-3" style={{ background: 'linear-gradient(135deg, rgba(26,26,46,0.8), rgba(22,22,42,0.8))', border: '1px solid var(--accent-primary)', borderRadius: 12, padding: 'clamp(16px,3vw,22px)', marginBottom: 20, backdropFilter: 'blur(12px)' }}>
                        <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.68rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                            ◆ Interview Strategy
                        </div>
                        <p style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>{data.interviewStrategy}</p>
                    </div>

                    <button
                        className="btn-accent reveal delay-4"
                        onClick={() => { sessionStorage.setItem('preBriefData', JSON.stringify(data)); router.push('/interview'); }}
                        style={{ width: '100%', padding: '15px 32px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                    >
                        Begin Interview →
                    </button>
                </div>
            </div>

            {/* ── RESPONSIVE OVERRIDE ─────────────────────────── */}
            <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: clamp"] {
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}</style>
        </div>
    );
}
