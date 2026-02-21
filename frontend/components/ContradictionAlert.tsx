'use client';

import { useState } from 'react';

interface ContradictionAlertProps {
    resumeClaimed: string;
    candidateSaid: string;
    severity?: string;
    onDismiss: () => void;
}

export default function ContradictionAlert({
    resumeClaimed,
    candidateSaid,
    severity = 'CRITICAL',
    onDismiss,
}: ContradictionAlertProps) {
    return (
        <div
            className="animate-slide-down"
            style={{
                position: 'sticky',
                top: '56px',
                zIndex: 90,
                background: 'linear-gradient(135deg, #1a0505 0%, #120808 100%)',
                borderBottom: '1px solid var(--red)',
                borderLeft: '4px solid var(--red)',
                padding: '16px 24px',
                boxShadow: '0 8px 32px var(--red-glow)',
            }}
        >
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.1rem' }}>🚨</span>
                        <span
                            style={{
                                fontFamily: 'DM Sans, sans-serif',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                color: 'var(--red)',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                            }}
                        >
                            Contradiction Detected
                        </span>
                        <span
                            className="badge"
                            style={{
                                background: 'var(--red-glow)',
                                color: 'var(--red)',
                                border: '1px solid var(--red)',
                            }}
                        >
                            {severity}
                        </span>
                    </div>
                    <button
                        onClick={onDismiss}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--red)',
                            color: 'var(--red)',
                            fontFamily: 'IBM Plex Sans, sans-serif',
                            fontSize: '0.78rem',
                            fontWeight: 500,
                            padding: '5px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            letterSpacing: '0.04em',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-glow)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        Log & Continue
                    </button>
                </div>

                {/* Evidence */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div
                        style={{
                            background: 'rgba(239,68,68,0.06)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                        }}
                    >
                        <div
                            style={{
                                fontFamily: 'IBM Plex Sans, sans-serif',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: 'var(--text-dim)',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                marginBottom: '8px',
                            }}
                        >
                            Resume Claimed
                        </div>
                        <div
                            style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '0.82rem',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.6,
                            }}
                        >
                            "{resumeClaimed}"
                        </div>
                    </div>
                    <div
                        style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                        }}
                    >
                        <div
                            style={{
                                fontFamily: 'IBM Plex Sans, sans-serif',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: 'var(--red)',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                marginBottom: '8px',
                            }}
                        >
                            Candidate Said
                        </div>
                        <div
                            style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '0.82rem',
                                color: '#ff9999',
                                lineHeight: 1.6,
                            }}
                        >
                            "{candidateSaid}"
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
