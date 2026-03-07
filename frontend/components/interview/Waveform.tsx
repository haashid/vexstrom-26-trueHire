import React from 'react';

export default function Waveform({ active }: { active: boolean }) {
    return (
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 24 }}>
            {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} style={{
                    display: 'inline-block', width: 3, borderRadius: 2,
                    background: active ? 'var(--green)' : 'rgba(15,23,42,0.12)',
                    boxShadow: active ? '0 0 4px var(--green)' : 'none',
                    height: `${(Math.sin(i * 0.7) * 0.4 + 0.6) * 16}px`,
                    animation: active ? `wbar 1.4s ease-in-out ${i * 0.1}s infinite` : 'none',
                    transition: 'background 0.3s',
                }} />
            ))}
            <style>{`@keyframes wbar{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}`}</style>
        </div>
    );
}
