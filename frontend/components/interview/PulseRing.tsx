import React from 'react';

export default function PulseRing({ color = 'var(--green)' }: { color?: string }) {
    return (
        <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10, flexShrink: 0 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: 0.35, animation: 'pring 1.4s ease-out infinite' }} />
            <span style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
            <style>{`@keyframes pring{0%{transform:scale(1);opacity:.5}70%{transform:scale(2.2);opacity:0}100%{transform:scale(2.2);opacity:0}}`}</style>
        </span>
    );
}
