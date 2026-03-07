/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, react/display-name */
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
            background: 'rgba(var(--glass-surface-dark), 0.88)',
            backdropFilter: 'blur(24px) saturate(140%)',
            WebkitBackdropFilter: 'blur(24px) saturate(140%)',
            borderBottom: '1px solid rgba(var(--glass-white),0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 32px',
            boxShadow: '0 1px 0 rgba(var(--glass-white),0.03), 0 4px 24px rgba(var(--glass-black),0.3)',
        }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 170 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    <span style={{ color: 'var(--electric)' }}>true</span>
                    <span style={{ color: 'var(--green)' }}>Hire</span>
                </div>
            </div>

            {/* Breadcrumb steps */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {steps.map((step, i) => {
                    const isActive = i === currentIndex;
                    const isDone = i < currentIndex;
                    const StepIcon = step.Icon;
                    return (
                        <div key={step.path} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '6px 14px', borderRadius: 10,
                                background: isActive ? 'rgba(var(--glass-accent),0.12)' : 'transparent',
                                border: `1px solid ${isActive ? 'rgba(var(--glass-accent),0.3)' : 'transparent'}`,
                                transition: 'all 0.25s',
                            }}>
                                {/* Step number dot */}
                                <div style={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: isActive
                                        ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                                        : isDone ? 'rgba(var(--glass-green),0.15)' : 'rgba(var(--glass-white),0.05)',
                                    border: `1px solid ${isActive ? 'transparent' : isDone ? 'rgba(var(--glass-green),0.35)' : 'rgba(var(--glass-white),0.08)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    boxShadow: isActive ? '0 0 10px rgba(var(--glass-accent),0.4)' : 'none',
                                    transition: 'all 0.25s',
                                }}>
                                    <StepIcon
                                        size={11}
                                        color={isActive ? '#fff' : isDone ? 'var(--green)' : 'var(--text-dim)'}
                                        strokeWidth={2}
                                    />
                                </div>
                                <span style={{
                                    fontFamily: 'var(--font-inter)', fontWeight: isActive ? 500 : 400, fontSize: '0.85rem',
                                    color: isActive ? 'var(--text-primary)' : isDone ? 'var(--green)' : 'var(--text-dim)',
                                    transition: 'color 0.25s',
                                }}>{step.label}</span>
                            </div>
                            {/* Connector */}
                            {i < steps.length - 1 && (
                                <div style={{
                                    width: 32, height: 2,
                                    background: isDone ? 'linear-gradient(90deg, var(--green), rgba(var(--glass-green),0.3))' : 'rgba(var(--glass-white),0.07)',
                                    borderRadius: 1, transition: 'background 0.3s',
                                    flexShrink: 0,
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Right actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 170, justifyContent: 'flex-end' }}>
                <button className="btn-icon" title="Help">
                    <IconInfo size={16} color="currentColor" />
                </button>
                <button className="btn-icon" title="Settings">
                    <IconSettings size={16} color="currentColor" />
                </button>
                {/* Avatar */}
                <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                    boxShadow: '0 0 16px var(--accent-glow)',
                    border: '1.5px solid rgba(var(--glass-accent),0.4)',
                }}>
                    <IconUser size={16} color="rgba(var(--glass-white),0.9)" />
                </div>
            </div>
        </nav >
    );
}
