'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { analyzeCandidate } from '@/lib/api';
import {
  IconUpload, IconFile, IconFileCheck, IconBriefcase,
  IconCpu, IconZap, IconTarget, IconShield,
  IconArrowRight, IconCheckCircle, IconAlertCircle,
} from '@/components/Icons';

const STATUS_LINES = [
  'Parsing documents...',
  'Extracting key identifiers...',
  'Analyzing resume vs. job description...',
  'Generating expert question bank...',
  'Predicting candidate bluff risk...',
  'Compiling candidate intelligence brief...',
];

function mapBackendData(backendResponse: any) {
  const { pre_brief, question_bank } = backendResponse;

  const skills = pre_brief.skills.map((s: any) => {
    const levelMap: Record<string, number> = { 'Beginner': 40, 'Intermediate': 70, 'Expert': 95 };
    return {
      name: s.skill_name,
      level: levelMap[s.proficiency_level] || 60,
      tier: s.proficiency_level === 'Expert' ? 'HIGH' : s.proficiency_level === 'Intermediate' ? 'MEDIUM' : 'LOW'
    };
  });

  const redFlags = pre_brief.red_flags.map((flag: string, i: number) => ({
    id: `rf-${i}`,
    claim: flag,
    concern: "AI identified this as a potential discrepancy or missing requirement.",
    verificationQuestion: `Can you elaborate on your experience regarding: ${flag}?`,
    severity: "HIGH"
  }));

  const questionBankMap: Record<string, any[]> = {};
  question_bank.questions.forEach((q: any, i: number) => {
    if (!questionBankMap[q.category]) questionBankMap[q.category] = [];
    questionBankMap[q.category].push({
      id: `q-${i}`,
      tier: `T${q.tier}`,
      preview: q.question_text.slice(0, 60) + '...',
      full: q.question_text,
      why_ask: `Expected Signals: ${q.expected_signals.join(', ')}`,
      keywords: q.expected_signals.map((s: string) => s.toLowerCase())
    });
  });

  const questionBank = Object.entries(questionBankMap).map(([area, questions]) => ({
    area,
    questions
  }));

  return {
    candidate: {
      name: "Profile Summary",
      role: "AI Evaluation Result",
      credibility: pre_brief.overall_fit_score > 70 ? "HIGH" : pre_brief.overall_fit_score > 40 ? "MEDIUM" : "LOW",
      credibilityLabel: pre_brief.overall_fit_score > 70 ? "Qualified Candidate" : "Verify Claims",
    },
    fitScore: pre_brief.overall_fit_score,
    strengths: pre_brief.key_strengths,
    redFlags,
    skills,
    questionBank,
    interviewStrategy: `Focus on the identified red flags: ${pre_brief.red_flags.slice(0, 2).join(', ')}. Key strengths include: ${pre_brief.key_strengths.join(', ')}.`
  };
}

type FileState = { name: string; size: number; content: string; rawFile: File } | null;

function FileUploadCard({ label, icon: CardIcon, description, accept, fileState, onFile, disabled }: {
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  accept: string;
  fileState: FileState;
  onFile: (f: FileState) => void;
  disabled: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => onFile({
      name: file.name,
      size: file.size,
      content: e.target?.result as string || '',
      rawFile: file
    });
    reader.readAsText(file);
  }, [onFile]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const loaded = !!fileState;

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      style={{
        borderRadius: 8,
        padding: 'clamp(28px,5vh,40px) clamp(20px,4vw,32px)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        minHeight: 260,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, textAlign: 'center',
        userSelect: 'none', position: 'relative', overflow: 'hidden',
        transition: 'all 0.2s ease',
        /* Solid backgrounds instead of glass */
        background: loaded
          ? 'var(--accent-soft)'
          : drag
            ? 'var(--accent-soft)'
            : 'var(--bg-card)',
        border: `2px ${loaded ? 'solid' : 'dashed'} ${loaded ? 'var(--accent-primary)' : drag ? 'var(--accent-primary)' : 'var(--border)'}`,
        boxShadow: loaded ? 'var(--shadow-md)' : drag ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
      }}
    >
      {/* Inner glow blob when active */}
      {drag && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />}
      {loaded && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />}

      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />

      {!loaded ? (
        <>
          {/* Icon container */}
          <div style={{
            width: 48, height: 48, borderRadius: 8,
            background: drag ? 'rgba(37,99,235,0.05)' : 'var(--bg-primary)',
            border: `1px solid ${drag ? 'rgba(37,99,235,0.2)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', transform: drag ? 'scale(1.05)' : 'scale(1)',
          }}>
            {drag
              ? <IconUpload size={24} color="var(--accent-primary)" />
              : <CardIcon size={24} color="var(--text-secondary)" />
            }
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.95rem', color: drag ? 'var(--accent-primary)' : 'var(--text-primary)', marginBottom: 4, transition: 'color 0.2s' }}>
              {drag ? 'Drop to upload' : `Upload ${label}`}
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{description}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ height: 1, width: 36, background: 'var(--border)' }} />
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>or</span>
            <div style={{ height: 1, width: 36, background: 'var(--border)' }} />
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 6, pointerEvents: 'none',
            background: 'var(--bg-primary)', border: '1px solid var(--border)',
            fontFamily: 'var(--font-inter)', fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-primary)',
            boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
          }}>
            <IconUpload size={15} color="var(--text-secondary)" />
            Browse files
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>PDF · DOCX · TXT</div>
        </>
      ) : (
        /* Loaded state */
        <>
          <div style={{
            width: 48, height: 48, borderRadius: 8,
            background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconFileCheck size={24} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4 }}>{fileState.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              {(fileState.size / 1024).toFixed(1)} KB · {fileState.content.split(/\s+/).filter(Boolean).length} words
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Click to replace</div>
          </div>
          {/* Preview snippet */}
          <div style={{
            width: '100%', background: 'var(--bg-primary)', borderRadius: 6, padding: '10px 14px',
            fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--text-secondary)',
            lineHeight: 1.5, textAlign: 'left', border: '1px solid var(--border)', borderLeft: '3px solid var(--green)',
            maxHeight: 70, overflow: 'hidden', position: 'relative',
          }}>
            {fileState.content.slice(0, 150)}...
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, background: 'linear-gradient(transparent, var(--bg-primary))' }} />
          </div>
        </>
      )}
    </div>
  );
}

const AGENT_CARDS = [
  { n: '01', Icon: IconCpu, title: 'Resume Analyzer', desc: 'Parses every claim, credential, and tenure gap in the uploaded resume.' },
  { n: '02', Icon: IconZap, title: 'Question Generator', desc: 'Generates T1/T2/T3 tiered interview questions targeting each risk area.' },
  { n: '03', Icon: IconTarget, title: 'Live Voice Evaluator', desc: 'Transcribes the live interview via microphone and flags contradictions in real-time.' },
  { n: '04', Icon: IconShield, title: 'Verdict Engine', desc: 'Multi-agent debate produces HIRE / NO-HIRE with confidence score and full reasoning.' },
];

export default function UploadPage() {
  const router = useRouter();
  const [resume, setResume] = useState<FileState>(null);
  const [jd, setJd] = useState<FileState>(null);
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [doneLines, setDoneLines] = useState<boolean[]>([]);

  useScrollReveal([]);

  const canSubmit = !!resume && !!jd && !loading;

  const handleRun = async () => {
    if (!resume || !jd) return;
    setLoading(true);
    setLines([]); setDoneLines([]);

    // UI feedback loop
    const statusPromise = (async () => {
      for (let i = 0; i < STATUS_LINES.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        setLines(prev => [...prev, STATUS_LINES[i]]);
        if (i < STATUS_LINES.length - 1) setDoneLines(prev => [...prev, true]);
      }
    })();

    try {
      const result = await analyzeCandidate(resume.rawFile, jd.rawFile);
      const mapped = mapBackendData(result);

      await statusPromise;

      setDoneLines(prev => [...prev, true]);
      await new Promise(r => setTimeout(r, 400));

      sessionStorage.setItem('analysisData', JSON.stringify(mapped));
      router.push('/prebrief');
    } catch (err) {
      console.error(err);
      alert('Analysis failed: ' + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: 'clamp(36px,7vh,64px) clamp(16px,4vw,36px) 80px' }}>

      {/* ── HERO */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 8vh, 64px)', paddingTop: '40px' }}>
        <h1 className="reveal delay-1" style={{ fontFamily: 'var(--font-inter)', fontWeight: 800, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16 }}>
          AI-Driven Candidate <span style={{ color: 'var(--accent-primary)' }}>Integrity Analysis.</span>
        </h1>
        <p className="reveal delay-2" style={{ fontFamily: 'var(--font-inter)', fontWeight: 400, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: 'var(--text-secondary)', marginBottom: 16, maxWidth: 600, margin: '0 auto 16px' }}>
          Uncover the truth behind every claim with our multi-agent interview orchestration engine.
        </p>
        <div className="reveal delay-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ height: 1, width: 40, background: 'var(--border)' }} />
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure & Enterprise Ready</p>
          <div style={{ height: 1, width: 40, background: 'var(--border)' }} />
        </div>
      </div>

      {/* ── STATS */}
      <div className="reveal delay-2" style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(24px,5vw,56px)', flexWrap: 'wrap', marginBottom: 44 }}>
        {[{ v: '4', l: 'AI Agents' }, { v: '<2s', l: 'Analysis Time' }, { v: '94%', l: 'Accuracy' }, { v: '12k+', l: 'Interviews' }].map(s => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'clamp(1.1rem,2vw,1.5rem)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{s.v}</div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── UPLOAD GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))', gap: 20, marginBottom: 20 }}>
        <div className="reveal-left">
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconFile size={15} color="var(--text-dim)" /> Candidate Resume
          </div>
          <FileUploadCard label="Resume" icon={IconFile} description="Upload the candidate's CV or resume (PDF only)" accept=".pdf" fileState={resume} onFile={setResume} disabled={loading} />
        </div>
        <div className="reveal-right">
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconBriefcase size={15} color="var(--text-dim)" /> Job Description
          </div>
          <FileUploadCard label="Job Description" icon={IconBriefcase} description="Upload the full job requirements document (PDF only)" accept=".pdf" fileState={jd} onFile={setJd} disabled={loading} />
        </div>
      </div>

      {/* Status hint */}
      {!loading && (
        <p className="animate-fade-in" style={{ textAlign: 'center', fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: !resume || !jd ? 'var(--text-secondary)' : 'var(--green)', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {!resume && !jd && 'Upload both files to enable analysis'}
          {resume && !jd && <><IconAlertCircle size={16} color="var(--yellow)" /> Resume loaded — upload the job description</>}
          {!resume && jd && <><IconAlertCircle size={16} color="var(--yellow)" /> Job description loaded — upload the resume</>}
          {resume && jd && <><IconCheckCircle size={16} color="var(--green)" /> Both files ready — run analysis</>}
        </p>
      )}

      {/* ── CTA */}
      <div className="reveal delay-1">
        <button className="btn-accent" disabled={!canSubmit} onClick={handleRun}
          style={{ width: '100%', padding: 'clamp(14px,2vh,18px) 32px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          {loading
            ? <><span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(15,23,42,0.2)', borderTop: '2px solid var(--accent-primary)', borderRadius: '50%', display: 'inline-block' }} />Analyzing...</>
            : <><span>Run Pre-Interview Analysis</span><IconArrowRight size={17} color="var(--text-primary)" /></>
          }
        </button>

        {/* Status log */}
        {lines.length > 0 && (
          <div style={{ marginTop: 18, padding: '18px 20px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {lines.map((l, i) => (
              <div key={i} className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: i === lines.length - 1 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                {doneLines[i]
                  ? <IconCheckCircle size={14} color="var(--green)" />
                  : i === lines.length - 1
                    ? <span className="animate-spin" style={{ width: 13, height: 13, border: '1.5px solid rgba(99,102,241,0.3)', borderTop: '1.5px solid var(--accent-primary)', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
                    : <div style={{ width: 13, height: 13 }} />
                }
                {l}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── HOW IT WORKS */}
      <div style={{ marginTop: 'clamp(60px,10vh,96px)' }}>
        <div className="divider" style={{ marginBottom: 48 }} />
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: 'clamp(1.2rem,3vw,1.5rem)', color: 'var(--text-primary)' }}>Analysis Pipeline</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,210px),1fr))', gap: 14 }}>
          {AGENT_CARDS.map((item, i) => (
            <div key={item.n} className={`card-glass reveal delay-${i + 1}`} style={{ padding: 'clamp(16px,2.5vw,20px)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 12 }}>{item.n}</div>
              <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <item.Icon size={18} color="var(--text-secondary)" />
              </div>
              <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 6, color: 'var(--text-primary)' }}>{item.title}</div>
              <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
