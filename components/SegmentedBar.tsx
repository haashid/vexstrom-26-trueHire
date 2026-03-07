/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, react/display-name */
'use client';

interface SegmentedBarProps {
    value: number; // 0–100
    showLabel?: boolean;
    label?: string;
    height?: number;
    segments?: number;
}

export default function SegmentedBar({ value, showLabel = true, label, height = 8, segments = 20 }: SegmentedBarProps) {
    const filled = Math.round((value / 100) * segments);
    const color = value >= 70 ? 'var(--green)' : value >= 40 ? 'var(--yellow)' : 'var(--red)';
    const glowColor = value >= 70 ? 'var(--green-glow)' : value >= 40 ? '#F59E0B20' : 'var(--red-glow)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {showLabel && label && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {label}
                    </span>
                    <span
                        style={{
                            fontFamily: 'var(--font-dm-mono), monospace',
                            fontSize: '0.75rem',
                            color,
                            fontWeight: 500,
                        }}
                    >
                        {value}
                    </span>
                </div>
            )}
            <div
                style={{
                    display: 'flex',
                    gap: '2px',
                    alignItems: 'center',
                }}
            >
                {Array.from({ length: segments }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            flex: 1,
                            height: `${height}px`,
                            borderRadius: '2px',
                            background: i < filled ? color : 'var(--border)',
                            boxShadow: i < filled ? `0 0 4px ${glowColor}` : 'none',
                            transition: `background 0.3s ease ${i * 20}ms`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
