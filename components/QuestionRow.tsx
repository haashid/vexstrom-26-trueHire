/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, react/display-name */
'use client';

import { useState } from 'react';

interface Question {
    id: string;
    tier: string;
    preview: string;
    full: string;
    why_ask: string;
}

interface QuestionRowProps {
    question: Question;
    isActive?: boolean;
    status?: 'completed' | 'active' | 'pending';
    onSelect?: () => void;
    showCopy?: boolean;
}

const tierColors: Record<string, string> = {
    T1: 'var(--green)',
    T2: 'var(--yellow)',
    T3: 'var(--red)',
};

const statusIcons: Record<string, string> = {
    completed: '✅',
    active: '→',
    pending: '○',
};

export default function QuestionRow({ question, isActive, status = 'pending', onSelect, showCopy = true }: QuestionRowProps) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(question.full);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const tierColor = tierColors[question.tier] || 'var(--text-secondary)';

    return (
        <div
            style={{
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border)'}`,
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'border-color 0.2s, background 0.2s',
                boxShadow: isActive ? '0 0 0 1px var(--accent-glow)' : 'none',
            }}
        >
            {/* Row header */}
            <div
                onClick={() => { setExpanded(!expanded); onSelect?.(); }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                }}
            >
                {/* Status icon */}
                {status && (
                    <span
                        style={{
                            fontFamily: 'var(--font-inter), sans-serif',
                            fontSize: '0.85rem',
                            color: status === 'completed' ? 'var(--green)' : status === 'active' ? 'var(--accent-primary)' : 'var(--text-dim)',
                            minWidth: '20px',
                            textAlign: 'center',
                        }}
                    >
                        {statusIcons[status]}
                    </span>
                )}

                {/* Tier badge */}
                <span
                    className="badge"
                    style={{
                        background: `${tierColor}18`,
                        color: tierColor,
                        border: `1px solid ${tierColor}40`,
                        minWidth: '30px',
                        textAlign: 'center',
                        fontSize: '0.65rem',
                    }}
                >
                    {question.tier}
                </span>

                {/* Preview */}
                <span
                    style={{
                        fontFamily: 'var(--font-inter), sans-serif',
                        fontSize: '0.83rem',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        flex: 1,
                        lineHeight: 1.4,
                    }}
                >
                    {question.preview}
                </span>

                {/* Chevron */}
                <span
                    style={{
                        color: 'var(--text-dim)',
                        fontSize: '0.75rem',
                        transform: expanded ? 'rotate(90deg)' : 'none',
                        transition: 'transform 0.2s',
                    }}
                >
                    ›
                </span>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div
                    className="animate-fade-in"
                    style={{
                        borderTop: '1px solid var(--border)',
                        padding: '14px 14px',
                    }}
                >
                    <p
                        style={{
                            fontFamily: 'var(--font-inter), sans-serif',
                            fontSize: '0.85rem',
                            color: 'var(--text-primary)',
                            lineHeight: 1.7,
                            marginBottom: '12px',
                        }}
                    >
                        {question.full}
                    </p>
                    <div
                        style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: '6px',
                            padding: '10px 12px',
                            marginBottom: '12px',
                            borderLeft: '2px solid var(--accent-primary)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '0.68rem',
                                fontFamily: 'var(--font-inter), sans-serif',
                                color: 'var(--accent-primary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                fontWeight: 600,
                                marginBottom: '4px',
                            }}
                        >
                            Why Ask This
                        </div>
                        <p
                            style={{
                                fontFamily: 'var(--font-inter), sans-serif',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.6,
                            }}
                        >
                            {question.why_ask}
                        </p>
                    </div>
                    {showCopy && (
                        <button
                            onClick={handleCopy}
                            className="btn-ghost"
                            style={{
                                padding: '6px 14px',
                                fontSize: '0.78rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            {copied ? '✓ Copied' : '⎘ Copy Question'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
