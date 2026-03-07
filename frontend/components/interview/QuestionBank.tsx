import React from 'react';
import { IconList, IconCheckCircle } from '@/components/Icons';
import PulseRing from './PulseRing';
import { AnalysisData, QuestionNode, EvaluationResult } from '@/types/interview';

const tierClr = (t: string) => t === 'T1' ? 'var(--green)' : t === 'T2' ? 'var(--yellow)' : 'var(--red)';
const tierBg = (t: string) => t === 'T1' ? 'var(--green)15' : t === 'T2' ? 'var(--yellow)15' : 'var(--red)15';

interface QuestionBankProps {
    data: AnalysisData;
    allQ: QuestionNode[];
    evaluations: Record<string, EvaluationResult>;
    detectedQId: string | null;
    agentOn: boolean;
}

export default function QuestionBank({ data, allQ, evaluations, detectedQId, agentOn }: QuestionBankProps) {
    return (
        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '20px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <IconList size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                    Question Bank ({Object.keys(evaluations).length}/{allQ.length})
                </span>
            </div>

            {data.questionBank.map((group) => (
                <div key={group.area} style={{ marginBottom: 24 }}>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, paddingBottom: 8, marginBottom: 12, borderBottom: '1px solid var(--border)', textTransform: 'uppercase' }}>
                        {group.area}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {group.questions.map((q) => {
                            const isDetected = q.id === detectedQId;
                            const eval_ = evaluations[q.id];
                            return (
                                <div key={q.id} style={{
                                    padding: '12px', borderRadius: 10,
                                    background: isDetected ? 'var(--green)08' : eval_ ? 'var(--bg-primary)' : 'transparent',
                                    border: `1px solid ${isDetected ? 'var(--green)40' : eval_ ? 'var(--border)' : 'transparent'}`,
                                    transition: 'all 0.3s',
                                    cursor: 'default',
                                    marginBottom: 4
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        {isDetected && agentOn ? <PulseRing /> : eval_ ? <IconCheckCircle size={14} color="var(--green)" /> : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid var(--border)' }} />}
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', padding: '2px 6px', borderRadius: 4, background: tierBg(q.tier), color: tierClr(q.tier) }}>{q.tier}</span>
                                        {isDetected && <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', color: 'var(--green)', fontWeight: 700 }}>ACTIVE</span>}
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', lineHeight: 1.6, color: isDetected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isDetected ? 500 : 400 }}>
                                        {q.full || q.question_text || q.preview}
                                    </div>
                                    {eval_ && (
                                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)50' }}>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: eval_.score >= 70 ? 'var(--green)' : eval_.score >= 50 ? 'var(--yellow)' : 'var(--red)', fontWeight: 700 }}>{eval_.score}/100</div>
                                            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>{eval_.label}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
