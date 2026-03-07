import React from 'react';
import { IconUser, IconUsers, IconAlertTriangle } from '@/components/Icons';
import { TranscriptEntry, Speaker } from '@/types/interview';

export function Bubble({ entry, isNew }: { entry: TranscriptEntry; isNew?: boolean }) {
    const isCandidate = entry.speaker === 'Candidate';
    return (
        <div className={isNew ? 'animate-fade-in' : ''} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: isCandidate ? 'flex-end' : 'flex-start', marginBottom: 20 }}>
            {!isCandidate && (
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
                    <IconUsers size={18} color="#fff" />
                </div>
            )}
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', fontWeight: 600, color: isCandidate ? 'var(--text-dim)' : 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, textAlign: isCandidate ? 'right' : 'left' }}>
                {entry.speaker} · {entry.ts}
            </div>
            <div style={{
                maxWidth: '75%',
                padding: '14px 20px',
                borderRadius: isCandidate ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                background: isCandidate ? 'var(--accent-primary)' : 'var(--bg-card)',
                border: isCandidate ? 'none' : '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                color: isCandidate ? '#fff' : 'var(--text-primary)',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.92rem',
                lineHeight: 1.6
            }}>
                {entry.text}
                {entry.flagged && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--red)20', fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconAlertTriangle size={14} /> {entry.flagReason || 'Potential discrepancy detected'}
                    </div>
                )}
            </div>
            {isCandidate && (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: entry.flagged ? 'var(--red)10' : 'var(--border)', border: `1px solid ${entry.flagged ? 'var(--red)30' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <IconUser size={16} color={entry.flagged ? 'var(--red)' : 'var(--text-secondary)'} />
                </div>
            )}
        </div>
    );
}

export function InterimBubble({ text, speaker }: { text: string; speaker: Speaker }) {
    if (!text) return null;
    const isCandidate = speaker === 'Candidate';
    return (
        <div style={{ display: 'flex', justifyContent: isCandidate ? 'flex-end' : 'flex-start', marginBottom: 16, opacity: 0.6 }}>
            <div style={{ maxWidth: '75%', fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '12px 18px', borderRadius: 16, background: 'var(--bg-primary)', border: '1px dashed var(--border)', fontStyle: 'italic' }}>
                {text}
                <span className="animate-cursor-blink" style={{ display: 'inline-block', width: 2, height: 16, background: 'var(--accent-primary)', marginLeft: 4, verticalAlign: 'middle' }} />
            </div>
        </div>
    );
}
