'use client';

import { IconTrendingUp } from './Icons';

type SalaryIntlProps = {
    data: {
        currencySymbol: string;
        currencySuffix: string;
        bands: { entry: number; mid: number; senior: number };
        recommended: { band: number; trend: string; drivingSkills: string[] };
        offerConfidenceNote: string;
    };
};

export default function SalaryIntelligence({ data }: SalaryIntlProps) {
    if (!data) return null;

    const { currencySymbol, currencySuffix, bands, recommended, offerConfidenceNote } = data;
    const isUp = recommended.trend.includes('+');

    const formatNum = (n: number) => `${currencySymbol}${n.toFixed(1)}${currencySuffix}`;

    // Calculate slider position based on mid-market to senior range logic
    const totalRange = (bands.senior * 1.2) - (bands.entry * 0.8);
    const minVal = bands.entry * 0.8;
    const progressPct = Math.max(0, Math.min(100, ((recommended.band - minVal) / totalRange) * 100));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div className="card-glass" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px',
                background: 'rgba(var(--glass-surface),0.7)'
            }}>
                <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600,
                    letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-primary)'
                }}>
                    Live Salary Intelligence
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', animation: 'pulse-glow 2s infinite' }} />
                    Data pulled live • Updated &lt;2 min ago
                </div>
            </div>

            {/* Main Band Display */}
            <div className="card-glass" style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '1px', marginBottom: 12 }}>ENTRY LEVEL</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                            {formatNum(bands.entry)}
                        </div>
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 12 }}>RapidAPI / Glassdoor</div>
                    </div>

                    <div style={{ width: 1, height: 80, background: 'var(--border)' }} />

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '1px', marginBottom: 12 }}>MID-MARKET</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                            {formatNum(bands.mid)}
                        </div>
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 12 }}>RapidAPI / LinkedIn</div>
                    </div>

                    <div style={{ width: 1, height: 80, background: 'var(--border)' }} />

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '1px', marginBottom: 12 }}>SENIOR LEVEL</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                            {formatNum(bands.senior)}
                        </div>
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 12 }}>RapidAPI Live</div>
                    </div>

                </div>

                {/* Tracking Slider */}
                <div style={{ padding: '0 20px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -20, left: `${progressPct}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'left 1s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div style={{ background: 'rgba(var(--glass-teal),0.15)', border: '1px solid rgba(var(--glass-teal),0.3)', padding: '4px 10px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#fff', marginBottom: 6 }}>
                            Recommended Band
                        </div>
                        <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid rgba(var(--glass-teal),0.5)' }} />
                    </div>

                    <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                        <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progressPct}%`,
                            background: 'linear-gradient(90deg, rgba(var(--glass-teal),0.4) 0%, rgba(var(--glass-teal),0.8) 100%)',
                            borderRadius: 4, boxShadow: '0 0 10px rgba(var(--glass-teal),0.3)',
                            transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
                        }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        <span>{formatNum(bands.entry)}</span>
                        <span>{formatNum(bands.senior)}+</span>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Trends & Skills */}
                <div className="card-glass" style={{ padding: 24, display: 'flex' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '1px', marginBottom: 16 }}>90-DAY TREND</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: isUp ? 'var(--green)' : 'var(--red)' }}>
                            <IconTrendingUp size={24} color="currentColor" />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 600 }}>{recommended.trend}</span>
                        </div>
                    </div>

                    <div style={{ width: 1, background: 'var(--border)', margin: '0 24px' }} />

                    <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '1px', marginBottom: 16 }}>DRIVING SKILLS</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {recommended.drivingSkills.map(s => (
                                <div key={s} style={{ padding: '6px 12px', background: 'rgba(var(--glass-white),0.03)', border: '1px solid rgba(var(--glass-white),0.08)', borderRadius: 16, fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Offer Note */}
                <div className="card-glass" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(var(--glass-teal),0.03) 0%, rgba(var(--glass-surface),0.5) 100%)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '1px', marginBottom: 16 }}>OFFER CONFIDENCE NOTE</div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                        {offerConfidenceNote}
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-ghost" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Copy Range</button>
                        <button className="btn-ghost" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Full Report</button>
                    </div>
                </div>
            </div>

            {/* Footer Sources */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                {['Levels.fyi Dataset', 'LinkedIn Salary API', 'Glassdoor API', 'BLS Database'].map((src, i) => (
                    <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(var(--glass-white),0.02)', border: '1px solid rgba(var(--glass-white),0.05)', borderRadius: 16 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: i % 2 === 0 ? 'var(--yellow)' : 'var(--green)' }} />
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>{src}</span>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes pulse-glow {
                    0% { box-shadow: 0 0 0 0 rgba(var(--glass-green),0.4); }
                    70% { box-shadow: 0 0 0 6px rgba(var(--glass-green),0); }
                    100% { box-shadow: 0 0 0 0 rgba(var(--glass-green),0); }
                }
            `}</style>
        </div>
    );
}
