/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SegmentedBar from '@/components/SegmentedBar';
import QuestionRow from '@/components/QuestionRow';
import SeverityBadge from '@/components/SeverityBadge';
import { AnalysisData } from '@/lib/api';
import SalaryIntelligence from '@/components/SalaryIntelligence';
import { IconFlag, IconShieldAlert, IconAlertTriangle, IconZap, IconArrowRight, IconCheckCircle, IconUser, IconGlobe } from '@/components/Icons';

// ── Fit score gauge ──────────────────────────────────────────────────
function FitGauge({ score, label }: { score: number; label: string }) {
    const r = 56, c = 2 * Math.PI * r;
    const clr = score >= 75 ? 'var(--green)' : score >= 55 ? 'var(--yellow)' : 'var(--red)';
    const trackAngle = 240; // degrees of arc
    const dashLen = (trackAngle / 360) * c;
    const gap = c - dashLen;
    const filled = (score / 100) * dashLen;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <svg width={150} height={100} viewBox="0 0 150 100">
                {/* Track */}
                <circle cx={75} cy={83} r={r} fill="none" stroke="rgba(var(--glass-white),0.05)" strokeWidth={10}
                    strokeDasharray={`${dashLen} ${gap}`} strokeLinecap="round"
                    transform="rotate(150 75 83)" />
                {/* Fill */}
                <circle cx={75} cy={83} r={r} fill="none" stroke={clr} strokeWidth={10}
                    strokeDasharray={`${filled} ${c - filled}`} strokeLinecap="round"
                    transform="rotate(150 75 83)"
                    style={{ filter: `drop-shadow(0 0 8px ${clr})`, transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
                {/* Score text */}
                <text x={75} y={76} dominantBaseline="middle" textAnchor="middle" fill={clr}
                    fontSize={24} fontWeight={800} fontFamily="var(--font-dm-mono)">{score}</text>
                <text x={75} y={93} dominantBaseline="middle" textAnchor="middle" fill="rgba(var(--glass-white),0.35)"
                    fontSize={8} fontFamily="var(--font-inter)" letterSpacing={1}>{label.toUpperCase()}</text>
            </svg>
        </div>
    );
}

// Breakdown bar
function BreakdownBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.72rem', color, fontWeight: 700 }}>{value}%</span>
            </div>
            <div style={{ height: 5, background: 'rgba(var(--glass-white),0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${value}%`, background: `linear-gradient(90deg, ${color}cc, ${color})`, borderRadius: 3, boxShadow: `0 0 6px ${color}55`, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
        </div>
    );
}

// Spider chart for skills
function SkillRadar({ skills }: { skills: Array<{ name: string; level: number }> }) {
    if (!skills.length) return null;
    const size = 160, cx = 80, cy = 80, r = 62;
    const top6 = skills.slice(0, 6);
    const pts = (scale: number) => top6.map((_, i) => {
        const angle = (i / top6.length) * 2 * Math.PI - Math.PI / 2;
        return { x: cx + Math.cos(angle) * r * scale, y: cy + Math.sin(angle) * r * scale };
    });
    const polyline = (pts_: { x: number; y: number }[]) => pts_.map(p => `${p.x},${p.y}`).join(' ');
    const filledPts = top6.map((s, i) => {
        const angle = (i / top6.length) * 2 * Math.PI - Math.PI / 2;
        const scale = s.level / 100;
        return { x: cx + Math.cos(angle) * r * scale, y: cy + Math.sin(angle) * r * scale };
    });
    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Grid rings */}
                {[0.25, 0.5, 0.75, 1].map(s => (
                    <polygon key={s} points={polyline(pts(s))} fill="none" stroke="rgba(var(--glass-white),0.05)" strokeWidth={1} />
                ))}
                {/* Spokes */}
                {top6.map((_, i) => {
                    const p = pts(1)[i];
                    return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(var(--glass-white),0.05)" strokeWidth={1} />;
                })}
                {/* Data */}
                <polygon points={polyline(filledPts)} fill="rgba(var(--glass-accent),0.2)" stroke="var(--accent-primary)" strokeWidth={1.5} />
                {/* Dots */}
                {filledPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--accent-primary)" />)}
                {/* Labels */}
                {top6.map((s, i) => {
                    const angle = (i / top6.length) * 2 * Math.PI - Math.PI / 2;
                    const x = cx + Math.cos(angle) * (r + 14);
                    const y = cy + Math.sin(angle) * (r + 14);
                    return <text key={i} x={x} y={y} dominantBaseline="middle" textAnchor="middle" fill="rgba(var(--glass-white),0.45)" fontSize={6.5} fontFamily="var(--font-inter)">{s.name.slice(0, 8)}</text>;
                })}
            </svg>
        </div>
    );
}

// Red flag card
function FlagCard({ flag, expanded, onToggle, onCopy, copied }: any) {
    const clr = flag.severity === 'CRITICAL' ? 'var(--red)' : flag.severity === 'HIGH' ? 'var(--yellow)' : 'var(--border-bright)';
    return (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${clr}28`, background: 'rgba(var(--glass-surface),0.7)', backdropFilter: 'blur(12px)', transition: 'border-color 0.2s' }}>
            <div onClick={onToggle} style={{ padding: '11px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 9, borderLeft: `3px solid ${clr}` }}>
                <SeverityBadge severity={flag.severity} />
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1, lineHeight: 1.5 }}>{flag.claim}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none', marginTop: 3, flexShrink: 0 }}>▼</span>
            </div>
            {expanded && (
                <div className="animate-fade-in" style={{ padding: '11px 14px', borderTop: `1px solid ${clr}15` }}>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 10 }}>{flag.concern}</p>
                    <div style={{ background: 'rgba(var(--glass-surface-elevated),0.7)', borderRadius: 7, padding: '10px 12px', marginBottom: 10, fontFamily: 'var(--font-inter)', fontSize: '0.79rem', color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic', borderLeft: '2px solid var(--accent-primary)' }}>
                        &quot;{flag.verificationQuestion}&quot;
                    </div>
                    <button className="btn-ghost" onClick={() => onCopy(flag.verificationQuestion, flag.id)} style={{ fontSize: '0.72rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {copied === flag.id ? <><IconCheckCircle size={11} color="var(--green)" /> Copied!</> : 'Copy Question'}
                    </button>
                </div>
            )}
        </div>
    );
}

const bdColors = ['var(--accent-primary)', 'var(--green)', 'var(--yellow)', '#a78bfa'];

export default function PreBriefPage() {
    const router = useRouter();
    const [data, setData] = useState<AnalysisData | null>(null);
    const [expandedFlags, setExpandedFlags] = useState<Record<string, boolean>>({});
    const [copiedFlag, setCopiedFlag] = useState<string | null>(null);
    const [showAllFlags, setShowAllFlags] = useState(false);

    useScrollReveal([data]);

    useEffect(() => {
        const stored = sessionStorage.getItem('analysisData');
        setData(stored ? JSON.parse(stored) : null);
    }, []);

    if (!data) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 38, height: 38, border: '3px solid var(--border)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%' }} className="animate-spin" />
            <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No analysis data found.</p>
            <button className="btn-ghost" onClick={() => router.push('/')} style={{ fontSize: '0.78rem', padding: '6px 14px' }}>← Return to Upload</button>
        </div>
    );

    const credColors: Record<string, string> = { HIGH: 'var(--green)', MEDIUM: 'var(--yellow)', LOW: 'var(--red)' };
    const credColor = credColors[data.candidate.credibility] || 'var(--yellow)';
    const fitScore = data.fitScore ?? 0;
    const fitLabel = data.fitLabel ?? 'Analysing...';
    const fitClr = fitScore >= 75 ? 'var(--green)' : fitScore >= 55 ? 'var(--yellow)' : 'var(--red)';
    const bd = data.fitBreakdown ?? { technicalSkills: 0, experience: 0, domainKnowledge: 0, leadershipCultural: 0 };
    const criticalFlags = (data.redFlags || []).filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
    const shownFlags = showAllFlags ? (data.redFlags || []) : (data.redFlags || []).slice(0, 3);
    const totalQ = (data.questionBank || []).reduce((acc, g) => acc + g.questions.length, 0);

    const copyQ = async (q: string, id: string) => {
        await navigator.clipboard.writeText(q);
        setCopiedFlag(id);
        setTimeout(() => setCopiedFlag(null), 2000);
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* ── PAGE HEADER ─────────────────────────────────── */}
            <div style={{ padding: '20px clamp(16px,3vw,32px) 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, flexShrink: 0 }}>
                <div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.62rem', color: 'var(--accent-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>Intelligence Brief</div>
                    <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 'clamp(1.1rem,2.5vw,1.45rem)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <IconUser size={18} color="var(--accent-primary)" />
                        {data.candidate.name}
                        <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 400, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{data.candidate.role}</span>
                    </h2>
                </div>

                {/* Header badges */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Fit score badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: `${fitClr}10`, border: `1px solid ${fitClr}35`, borderRadius: 9, padding: '8px 14px' }}>
                        <IconZap size={14} color={fitClr} />
                        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '1rem', color: fitClr, fontWeight: 800 }}>{fitScore}%</span>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: fitClr }}>Fit Score</span>
                    </div>
                    {/* Credibility badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: `${credColor}10`, border: `1px solid ${credColor}35`, borderRadius: 9, padding: '8px 14px' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: credColor, boxShadow: `0 0 7px ${credColor}`, flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: credColor, fontWeight: 600 }}>{data.candidate.credibilityLabel}</span>
                    </div>
                    {/* Red flags counter — top right */}
                    {criticalFlags.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(var(--glass-red),0.08)', border: '1px solid rgba(var(--glass-red),0.3)', borderRadius: 9, padding: '8px 14px', cursor: 'pointer' }}
                            onClick={() => document.getElementById('red-flags-section')?.scrollIntoView({ behavior: 'smooth' })}>
                            <IconShieldAlert size={14} color="var(--red)" />
                            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.78rem', color: 'var(--red)', fontWeight: 700 }}>{criticalFlags.length} flag{criticalFlags.length > 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--border), transparent)', margin: '14px clamp(16px,3vw,32px)' }} />

            {/* ── DASHBOARD STRIP ─────────────────────────────── */}
            <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '0 clamp(16px,3vw,32px)', marginBottom: 14, flexShrink: 0 }}>
                {/* Fit gauge */}
                <div className="card-glass" style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, borderTop: `2px solid ${fitClr}50` }}>
                    <FitGauge score={fitScore} label={fitLabel} />
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Job Fit Match</div>
                </div>
                {/* Breakdown bars */}
                <div className="card-glass" style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Score Breakdown</div>
                    <BreakdownBar label="Technical Skills" value={bd.technicalSkills} color={bdColors[0]} />
                    <BreakdownBar label="Experience" value={bd.experience} color={bdColors[1]} />
                    <BreakdownBar label="Domain Knowledge" value={bd.domainKnowledge} color={bdColors[2]} />
                    <BreakdownBar label="Leadership / Culture" value={bd.leadershipCultural} color={bdColors[3]} />
                </div>
                {/* Skill radar */}
                <div className="card-glass" style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Skill Radar</div>
                    <SkillRadar skills={data.skills || []} />
                </div>
            </div>

            {/* ── MAIN CONTENT (L + R panels) ─────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'clamp(260px, 32%, 380px) 1fr', flex: 1, minHeight: 0, overflow: 'hidden' }}>

                {/* LEFT PANEL */}
                <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', padding: 'clamp(14px,2vw,20px)' }}>

                    {/* Skill Inventory */}
                    <section style={{ marginBottom: 22 }}>
                        <div className="reveal" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 11, display: 'flex', alignItems: 'center', gap: 7 }}>
                            Skills Inventory
                        </div>
                        <div className="card-glass reveal" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 13 }}>
                            {(data.skills || []).map((skill, i) => (
                                <div key={skill.name} className={`reveal delay-${Math.min(i + 1, 6)}`}>
                                    <SegmentedBar value={skill.level} label={skill.name} segments={14} height={6} />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Online Presence */}
                    {data.onlinePresence && data.onlinePresence.recentPosts.length > 0 && (
                        <section style={{ marginBottom: 22 }}>
                            <div className="reveal" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 11, display: 'flex', alignItems: 'center', gap: 7 }}>
                                <IconGlobe size={12} color={data.onlinePresence.riskLevel === 'HIGH' ? 'var(--red)' : data.onlinePresence.riskLevel === 'MEDIUM' ? 'var(--yellow)' : 'var(--green)'} />
                                Online Presence Risk
                                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.68rem', background: 'rgba(var(--glass-white),0.05)', color: data.onlinePresence.riskLevel === 'HIGH' ? 'var(--red)' : 'var(--text-secondary)', padding: '1px 6px', borderRadius: 4 }}>{data.onlinePresence.riskLevel}</span>
                            </div>
                            <div className="card-glass reveal" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>Avg Toxicity</div>
                                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.85rem', color: data.onlinePresence.averageToxicity > 0.4 ? 'var(--red)' : 'var(--text-secondary)' }}>{(data.onlinePresence.averageToxicity * 100).toFixed(1)}%</div>
                                </div>
                                {data.onlinePresence.recentPosts.map((post, i) => (
                                    <div key={i} style={{ borderTop: i > 0 ? '1px solid rgba(var(--glass-white),0.05)' : 'none', paddingTop: i > 0 ? 12 : 0 }}>
                                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 6 }}>"{post.content}"</div>
                                        {post.flagged && (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--red-glow)', padding: '2px 6px', borderRadius: 4 }}>
                                                <IconShieldAlert size={10} color="var(--red)" />
                                                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.60rem', fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase' }}>Perspective Flagged</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Red Flags */}
                    <section id="red-flags-section">
                        <div className="reveal" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 11, display: 'flex', alignItems: 'center', gap: 7 }}>
                            <IconFlag size={10} color="var(--red)" />
                            Red Flags
                            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.68rem', background: 'var(--red-glow)', color: 'var(--red)', padding: '1px 6px', borderRadius: 4 }}>{(data.redFlags || []).length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            {shownFlags.map((flag, i) => (
                                <div key={flag.id} className={`reveal delay-${i + 1}`}>
                                    <FlagCard flag={flag} expanded={expandedFlags[flag.id]}
                                        onToggle={() => setExpandedFlags(p => ({ ...p, [flag.id]: !p[flag.id] }))}
                                        onCopy={copyQ} copied={copiedFlag} />
                                </div>
                            ))}
                            {(data.redFlags || []).length > 3 && (
                                <button className="btn-ghost" onClick={() => setShowAllFlags(v => !v)} style={{ fontSize: '0.72rem', padding: '5px 12px', marginTop: 2 }}>
                                    {showAllFlags ? 'Show Less' : `Show ${(data.redFlags || []).length - 3} More`}
                                </button>
                            )}
                        </div>
                    </section>
                </div>

                {/* RIGHT PANEL — Question Bank */}
                <div style={{ overflowY: 'auto', padding: 'clamp(14px,2vw,20px)' }}>
                    <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Question Bank
                        </div>
                        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.7rem', color: 'var(--accent-primary)', background: 'rgba(var(--glass-accent),0.1)', padding: '2px 8px', borderRadius: 4 }}>{totalQ}q</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                            {['T1', 'T2', 'T3'].map(t => {
                                const clr = t === 'T1' ? 'var(--green)' : t === 'T2' ? 'var(--yellow)' : 'var(--red)';
                                const bg = t === 'T1' ? 'rgba(var(--glass-green),0.1)' : t === 'T2' ? 'rgba(var(--glass-yellow),0.1)' : 'rgba(var(--glass-red),0.1)';
                                const descriptions: any = { T1: 'Baseline', T2: 'Deep Probe', T3: 'Red Flag' };
                                return <span key={t} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.62rem', color: clr, background: bg, padding: '3px 8px', borderRadius: 4 }}>{t} · {descriptions[t]}</span>;
                            })}
                        </div>
                    </div>

                    {(data.questionBank || []).map((group, gi) => (
                        <section key={group.area} className={`reveal delay-${gi + 1}`} style={{ marginBottom: 22 }}>
                            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 7, borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--accent-primary)' }}>◆</span>{group.area}
                                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.62rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>{group.questions.length}q</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                {group.questions.map((q: any) => <QuestionRow key={q.id} question={q} status="pending" />)}
                            </div>
                        </section>
                    ))}

                    {/* Live Salary Intelligence */}
                    {data.salaryIntelligence && (
                        <div className="reveal fade-up">
                            <SalaryIntelligence data={data.salaryIntelligence} />
                        </div>
                    )}

                    {/* Interview Strategy */}
                    <div className="card-glass reveal fade-up" style={{
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, rgba(82,113,255,0.06) 0%, rgba(var(--glass-surface),0.6) 100%)',
                        borderLeft: '3px solid var(--accent-primary)'
                    }}>
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.6rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                            Interview Strategy
                        </div>
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.78 }}>{data.interviewStrategy}</p>
                    </div>

                    <button
                        className="btn-accent reveal delay-4"
                        onClick={() => { sessionStorage.setItem('preBriefData', JSON.stringify(data)); router.push('/interview'); }}
                        style={{ width: '100%', padding: '14px 28px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                    >
                        Begin Interview <IconArrowRight size={15} color="rgba(var(--glass-white),0.8)" />
                    </button>
                </div>
            </div>

            {/* RESPONSIVE */}
            <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: clamp(260px"] {
            display: flex !important; flex-direction: column !important;
          }
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </div>
    );
}
