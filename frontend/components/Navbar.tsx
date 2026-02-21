'use client';

import { usePathname } from 'next/navigation';
import { IconUpload, IconList, IconMic, IconTarget, IconSettings, IconInfo, IconUser } from '@/components/Icons';

const steps = [
    { label: 'Upload', path: '/', Icon: IconUpload },
    { label: 'Analysis', path: '/prebrief', Icon: IconList },
    { label: 'Interview', path: '/interview', Icon: IconMic },
    { label: 'Verdict', path: '/verdict', Icon: IconTarget },
];

export default function Navbar() {
    const pathname = usePathname();
    const currentIndex = steps.findIndex(s => s.path === pathname);

    return (
        <nav style={{
            position: 'sticky', top: 0, zIndex: 100, height: 56,
            background: 'rgba(248,250,252, 0.88)',
            backdropFilter: 'blur(24px) saturate(140%)',
            WebkitBackdropFilter: 'blur(24px) saturate(140%)',
            borderBottom: '1px solid rgba(15,23,42,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 22px',
            boxShadow: '0 1px 0 rgba(15,23,42,0.03), 0 4px 24px rgba(0,0,0,0.3)',
        }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 170 }}>
                <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))',
                    border: '1px solid rgba(99,102,241,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(99,102,241,0.2)',
                }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L22 12 12 22 2 12z" fill="rgba(99,102,241,0.8)" stroke="rgba(99,102,241,1)" strokeWidth="1" />
                    </svg>
                </div>
                <div>
                    <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>TrueHire</span>
                    <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 400, fontSize: '0.72rem', color: 'var(--accent-primary)', marginLeft: 5, letterSpacing: '0.04em' }}>by DataVex</span>
                </div>
            </div>

            {/* Breadcrumb steps */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {steps.map((step, i) => {
                    const isActive = i === currentIndex;
                    const isDone = i < currentIndex;
                    const isPending = i > currentIndex;
                    const StepIcon = step.Icon;
                    return (
                        <div key={step.path} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '5px 11px', borderRadius: 8,
                                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                                border: `1px solid ${isActive ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                                transition: 'all 0.25s',
                            }}>
                                {/* Step number dot */}
                                <div style={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: isActive
                                        ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                                        : isDone ? 'rgba(16,185,129,0.15)' : 'rgba(15,23,42,0.05)',
                                    border: `1px solid ${isActive ? 'transparent' : isDone ? 'rgba(16,185,129,0.35)' : 'rgba(15,23,42,0.08)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    boxShadow: isActive ? '0 0 10px rgba(99,102,241,0.4)' : 'none',
                                    transition: 'all 0.25s',
                                }}>
                                    <StepIcon
                                        size={11}
                                        color={isActive ? '#fff' : isDone ? 'var(--green)' : 'var(--text-dim)'}
                                        strokeWidth={2}
                                    />
                                </div>
                                <span style={{
                                    fontFamily: 'var(--font-inter)', fontWeight: isActive ? 600 : 400, fontSize: '0.8rem',
                                    color: isActive ? 'var(--text-primary)' : isDone ? 'var(--green)' : 'var(--text-dim)',
                                    transition: 'color 0.25s',
                                }}>{step.label}</span>
                            </div>
                            {/* Connector */}
                            {i < steps.length - 1 && (
                                <div style={{
                                    width: 24, height: 1,
                                    background: isDone ? 'linear-gradient(90deg, var(--green), rgba(16,185,129,0.3))' : 'rgba(15,23,42,0.07)',
                                    borderRadius: 1, transition: 'background 0.3s',
                                    flexShrink: 0,
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Right actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 170, justifyContent: 'flex-end' }}>
                <button className="btn-icon" title="Help">
                    <IconInfo size={15} color="currentColor" />
                </button>
                <button className="btn-icon" title="Settings">
                    <IconSettings size={15} color="currentColor" />
                </button>
                {/* Avatar */}
                <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #5355d4, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                    boxShadow: '0 0 12px rgba(99,102,241,0.3)',
                    border: '1.5px solid rgba(99,102,241,0.3)',
                }}>
                    <IconUser size={15} color="rgba(15,23,42,0.9)" />
                </div>
            </div>
        </nav>
    );
}
