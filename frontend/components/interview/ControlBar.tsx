import React from 'react';
import { Speaker } from '@/types/interview';
import { IconMic, IconMicOff, IconUser, IconUsers, IconArrowRight } from '@/components/Icons';
import Waveform from './Waveform';

interface ControlBarProps {
    agentOn: boolean;
    isListening: boolean;
    micError: string | null;
    secs: number;
    fmt: (s: number) => string;
    transcriptLength: number;
    flagsLength: number;
    autoSwitch: boolean;
    setAutoSwitch: (val: boolean) => void;
    currentSpeaker: Speaker;
    setCurrentSpeaker: (sp: Speaker) => void;
    toggleAgent: () => void;
    onConclude: () => void;
}

export default function ControlBar({
    agentOn, isListening, micError, secs, fmt,
    transcriptLength, flagsLength, autoSwitch, setAutoSwitch,
    currentSpeaker, setCurrentSpeaker, toggleAgent, onConclude
}: ControlBarProps) {
    return (
        <div style={{
            height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
            background: agentOn ? 'var(--green)03' : 'var(--bg-secondary)',
            borderBottom: `1px solid ${agentOn ? 'var(--green)20' : 'var(--border)'}`,
            transition: 'all 0.35s ease',
        }}>
            {/* Mic toggle */}
            <button onClick={toggleAgent} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px', borderRadius: 12,
                background: agentOn ? 'var(--green)10' : 'var(--bg-primary)',
                border: `1.5px solid ${agentOn ? 'var(--green)40' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all 0.25s',
                boxShadow: agentOn ? '0 0 20px var(--green)15' : 'none',
            }}>
                <div style={{ width: 36, height: 20, borderRadius: 10, background: agentOn ? 'var(--green)' : 'var(--border)', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: agentOn ? 19 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.25s cubic-bezier(0.16,1,0.3,1)' }} />
                </div>
                {agentOn ? <IconMic size={16} color="var(--green)" /> : <IconMicOff size={16} color="var(--text-dim)" />}
                <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.88rem', color: agentOn ? 'var(--green)' : 'var(--text-secondary)' }}>
                    AI Listening {agentOn ? 'Active' : 'Standby'}
                </span>
            </button>

            <Waveform active={agentOn && isListening} />

            <div style={{ flex: 1 }}>
                {agentOn ? (
                    <div className="reveal">
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--green)', fontWeight: 500 }}>Real-time Transcription & Intelligence Synthesis</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                            ELI-32 // {fmt(secs)} // {transcriptLength} UTTERANCES // {flagsLength} FLAGS
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: micError ? 'var(--red)' : 'var(--text-dim)' }}>
                            {micError ?? 'Enable AI Assistant to begin passive evaluation and bluff detection.'}
                        </span>
                        {!micError && !agentOn && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 20 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>SYSTEM READY</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: autoSwitch ? 'var(--accent-primary)' : 'var(--text-dim)', textTransform: 'uppercase' }}>Auto ID</span>
                    <button onClick={() => setAutoSwitch(!autoSwitch)} style={{ width: 32, height: 16, borderRadius: 10, background: autoSwitch ? 'var(--accent-primary)' : 'var(--border)', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
                        <div style={{ position: 'absolute', top: 2, left: autoSwitch ? 18 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </button>
                </div>

                {agentOn && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '4px' }}>
                        {(['Panelist', 'Candidate'] as Speaker[]).map(sp => (
                            <button key={sp} onClick={() => setCurrentSpeaker(sp)} style={{
                                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.75rem',
                                background: currentSpeaker === sp ? (sp === 'Panelist' ? 'var(--accent-primary)15' : 'var(--text-primary)10') : 'transparent',
                                color: currentSpeaker === sp ? (sp === 'Panelist' ? 'var(--accent-primary)' : 'var(--text-primary)') : 'var(--text-dim)',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                {sp === 'Panelist' ? <IconUsers size={14} /> : <IconUser size={14} />}
                                {sp}
                            </button>
                        ))}
                    </div>
                )}

                <button className="btn-accent"
                    onClick={onConclude}
                    style={{ padding: '10px 20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}
                >
                    Conclude Interview <IconArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
