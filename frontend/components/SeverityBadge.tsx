'use client';

const severityConfig: Record<string, { bg: string; color: string; border: string }> = {
    CRITICAL: { bg: 'var(--red-glow)', color: 'var(--red)', border: 'var(--red)' },
    HIGH: { bg: '#F59E0B18', color: 'var(--yellow)', border: '#F59E0B60' },
    LOW: { bg: 'var(--green-glow)', color: 'var(--green)', border: '#10B98160' },
    MEDIUM: { bg: '#6366F118', color: 'var(--accent-primary)', border: '#6366F160' },
};

interface SeverityBadgeProps {
    severity: string;
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
    const config = severityConfig[severity] || severityConfig.LOW;

    return (
        <span
            className="badge"
            style={{
                background: config.bg,
                color: config.color,
                border: `1px solid ${config.border}`,
            }}
        >
            {severity}
        </span>
    );
}
