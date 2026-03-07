/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, react/display-name */
'use client';

import SegmentedBar from './SegmentedBar';

interface DepthMeterProps {
    score: number;
    label: string;
}

export default function DepthMeter({ score, label }: DepthMeterProps) {
    const color = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--yellow)' : 'var(--red)';

    return (
        <div
            style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '16px',
            }}
        >
            <div
                style={{
                    fontFamily: 'var(--font-inter), sans-serif',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '12px',
                }}
            >
                Answer Depth
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '14px' }}>
                <span
                    style={{
                        fontFamily: 'var(--font-dm-mono), monospace',
                        fontSize: '2.4rem',
                        fontWeight: 600,
                        color,
                        lineHeight: 1,
                    }}
                >
                    {score}
                </span>
                <div style={{ marginBottom: '4px' }}>
                    <div
                        style={{
                            fontFamily: 'var(--font-inter), sans-serif',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color,
                        }}
                    >
                        {label}
                    </div>
                    <div
                        style={{
                            fontFamily: 'var(--font-inter), sans-serif',
                            fontSize: '0.72rem',
                            color: 'var(--text-dim)',
                        }}
                    >
                        / 100
                    </div>
                </div>
            </div>

            <SegmentedBar value={score} showLabel={false} segments={25} height={6} />
        </div>
    );
}
