/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, react/display-name */
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useEffect, useState } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { IconCpu, IconTrendingUp, IconActivity, IconAlertTriangle, IconCheckCircle, IconZap } from '@/components/Icons';

export function LandingFeatures() {
    useScrollReveal([]);

    return (
        <div style={{ padding: '120px 0' }}>
            <div className="reveal" style={{ textAlign: 'center', marginBottom: 80 }}>
                <div className="section-label" style={{ marginBottom: 12, color: 'var(--accent-primary)' }}>TrueHire Intelligence</div>
                <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: '-0.04em', marginBottom: 16 }}>
                    Interview smarter. Offer right. Hire with certainty.
                </h2>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
                    Experience the world's most advanced AI interview orchestration. We don't just ask questions; we dissect claims, benchmark compensation, and synthesize a multi-agent verdict.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>

                {/* Feature 1: AI Panel */}
                <div className="reveal-left" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 12, background: 'rgba(var(--glass-accent),0.1)', border: '1px solid rgba(var(--glass-accent),0.25)', marginBottom: 20 }}>
                            <IconCpu size={24} color="var(--accent-primary)" />
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 16 }}>AI Interview Panel</h3>
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                            6 specialized agents analyze the candidate simultaneously. One focuses on code quality, another on communication, while others hunt for red flags. They debate their findings in real-time to compute the final hiring score.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <span className="bento-pill" style={{ background: 'rgba(var(--glass-white),0.05)', color: 'var(--text-primary)', border: '1px solid rgba(var(--glass-white),0.1)' }}>Auto-Scoring</span>
                            <span className="bento-pill" style={{ background: 'rgba(var(--glass-white),0.05)', color: 'var(--text-primary)', border: '1px solid rgba(var(--glass-white),0.1)' }}>Consensus Engine</span>
                        </div>
                    </div>

                    <div className="card-glass" style={{ height: 320, padding: 32, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="animate-pulse-glow" style={{ width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(var(--glass-accent),0.3), transparent)', position: 'absolute', zIndex: 0 }} />

                        {/* Hexagon Nodes */}
                        <div style={{ position: 'relative', width: 240, height: 240, zIndex: 1 }}>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px var(--accent-glow)' }}>
                                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '0.8rem', color: '#fff' }}>HIRE</span>
                            </div>

                            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                                <div key={i} className="animate-float" style={{ animationDelay: `${i * 0.2}s`, position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-100px) rotate(-${deg}deg)`, width: 44, height: 44, borderRadius: '50%', background: 'rgba(var(--glass-white),0.03)', border: `1px solid ${i % 2 === 0 ? 'var(--green)' : 'var(--accent-primary)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                                    {i % 2 === 0 ? <IconCheckCircle size={18} color="var(--green)" /> : <IconZap size={18} color="var(--accent-primary)" />}
                                    {/* Connecting line */}
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: 2, height: 60, background: `linear-gradient(to top, transparent, ${i % 2 === 0 ? 'rgba(var(--glass-green),0.4)' : 'rgba(var(--glass-accent),0.4)'})`, transform: 'translate(-50%, 22px)', zIndex: -1 }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Feature 2: Market Data */}
                <div className="reveal-right" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
                    <div className="card-glass" style={{ height: 320, padding: 32, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Market Average</div>
                                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>$142,500</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Candidate Ask</div>
                                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--yellow)' }}>$160,000</div>
                            </div>
                        </div>

                        {/* SVG Graph */}
                        <svg width="100%" height="160" viewBox="0 0 400 160" preserveAspectRatio="none" style={{ marginTop: 'auto' }}>
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgba(var(--glass-green), 0.4)" />
                                    <stop offset="100%" stopColor="rgba(var(--glass-green), 0)" />
                                </linearGradient>
                            </defs>
                            <path className="chart-path" d="M0,150 L50,130 L100,100 L150,110 L200,70 L250,85 L300,40 L350,50 L400,20" fill="none" stroke="var(--green)" strokeWidth="3" style={{ filter: 'drop-shadow(0 4px 6px rgba(var(--glass-green),0.3))' }} />
                            <path d="M0,150 L50,130 L100,100 L150,110 L200,70 L250,85 L300,40 L350,50 L400,20 L400,160 L0,160 Z" fill="url(#chartGradient)" className="animate-fade-in" style={{ animationDelay: '1s' }} />

                            {/* Highlight point */}
                            <circle cx="200" cy="70" r="5" fill="var(--bg-elevated)" stroke="var(--green)" strokeWidth="3" className="animate-pulse-glow" />
                            <line x1="200" y1="70" x2="200" y2="160" stroke="rgba(var(--glass-white),0.1)" strokeDasharray="4 4" />
                        </svg>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 40, background: 'linear-gradient(to top, rgba(14,14,22,1), transparent)' }} />
                    </div>

                    <div style={{ order: -1 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 12, background: 'rgba(var(--glass-green),0.1)', border: '1px solid rgba(var(--glass-green),0.25)', marginBottom: 20 }}>
                            <IconTrendingUp size={24} color="var(--green)" />
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 16 }}>Live Salary Intel</h3>
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                            Never overpay blindly. As the candidate mentions compensation, TrueHire cross-references real-time market data across 50,000+ localized offers. See exactly where they sit on the bell curve.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <span className="bento-pill-green">Market Pegging</span>
                            <span className="bento-pill" style={{ background: 'rgba(var(--glass-white),0.05)', color: 'var(--text-primary)', border: '1px solid rgba(var(--glass-white),0.1)' }}>Live Data</span>
                        </div>
                    </div>
                </div>

                {/* Feature 3: Contradiction */}
                <div className="reveal-scale" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 12, background: 'rgba(var(--glass-red),0.1)', border: '1px solid rgba(var(--glass-red),0.25)', marginBottom: 20 }}>
                            <IconActivity size={24} color="var(--red)" />
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 16 }}>Zero Bluffing</h3>
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                            Our engine audits everything. If a candidate claims "I led the migration" in the interview but their resume says "Assisted with migration," you get an instant contradiction alert on-screen.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <span className="bento-pill-red">Real-time alerts</span>
                            <span className="bento-pill" style={{ background: 'rgba(var(--glass-white),0.05)', color: 'var(--text-primary)', border: '1px solid rgba(var(--glass-white),0.1)' }}>Audio processing</span>
                        </div>
                    </div>

                    <div className="card-glass" style={{ height: 320, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ padding: 16, background: 'rgba(var(--glass-white),0.03)', borderRadius: 12, border: '1px solid rgba(var(--glass-white),0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-secondary)' }} />
                                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>AUDIO TRANSCRIPT</span>
                                </div>
                                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>"...yeah, I was the lead architect on the Node.js to Go rewrite..."</div>
                            </div>

                            <div className="animate-slide-down" style={{ marginLeft: 24, padding: 16, background: 'rgba(var(--glass-red),0.08)', borderRadius: 12, border: '1px solid rgba(var(--glass-red),0.2)', position: 'relative', boxShadow: '0 8px 32px rgba(var(--glass-red),0.15)' }}>
                                {/* Connecting line */}
                                <div style={{ position: 'absolute', top: -16, left: 16, width: 2, height: 16, background: 'rgba(var(--glass-red),0.3)' }} />

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <IconAlertTriangle size={14} color="var(--red)" />
                                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.7rem', color: 'var(--red)', fontWeight: 600 }}>CONTRADICTION DETECTED</span>
                                </div>
                                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--red)' }}>Resume states: <em>"Junior developer during Go rewrite."</em> No mention of lead architecture duties.</div>
                            </div>
                        </div>

                        {/* Background scanner line */}
                        <div className="glow-line" style={{ position: 'absolute', top: '50%', left: 0, opacity: 0.5, animation: 'grid-pan 3s ease-in-out infinite alternate' }} />
                    </div>
                </div>

            </div>
        </div>
    );
}
