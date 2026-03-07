"use client";

import Link from "next/link";

export default function Footer() {
    return (
        <footer style={{
            position: 'relative',
            zIndex: 10,
            marginTop: 'auto',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            borderTop: '1px solid rgba(15, 23, 42, 0.06)',
            padding: '40px 0 24px',
        }}>
            {/* Subtle glow at the bottom center */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '100px',
                background: 'radial-gradient(ellipse at center, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
                borderRadius: '50%',
            }} />

            <div style={{
                maxWidth: 1200,
                margin: '0 auto',
                padding: '0 clamp(24px, 5vw, 40px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
            }}>

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            trueHire
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: 24 }}>
                        <Link href="/" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                            Privacy Policy
                        </Link>
                        <Link href="/" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                            Terms of Service
                        </Link>
                        <Link href="/" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                            Contact Us
                        </Link>
                    </div>
                </div>

                <div style={{ height: 1, width: '100%', background: 'rgba(15,23,42,0.06)' }} />

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16
                }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        © {new Date().getFullYear()} trueHire Intelligence. World-class evaluation.
                    </div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        All rights reserved by <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>@ Abra Code Abra</span>
                    </div>
                </div>

            </div>
        </footer>
    );
}
