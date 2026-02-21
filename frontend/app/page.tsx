'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { MOCK_ANALYSIS } from '@/lib/mockData';
import {
  IconUpload, IconFile, IconFileCheck, IconBriefcase,
  IconCpu, IconZap, IconTarget, IconShield,
  IconArrowRight, IconCheckCircle, IconAlertCircle,
} from '@/components/Icons';

const STATUS_LINES = [
  'Agent 1 — Parsing resume claims and credentials...',
  'Agent 2 — Cross-referencing job requirements...',
  'Agent 3 — Scoring risk profile and red flags...',
  'Agent 4 — Generating tiered question bank...',
  'Compiling candidate intelligence brief...',
];

type FileState = { name: string; size: number; content: string } | null;

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
    reader.onload = e => onFile({ name: file.name, size: file.size, content: e.target?.result as string || '' });
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
        borderRadius: 16,
        padding: 'clamp(28px,5vh,40px) clamp(20px,4vw,32px)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        minHeight: 260,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 18, textAlign: 'center',
        userSelect: 'none', position: 'relative', overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
        /* Multi-layer glass */
        background: loaded
          ? 'rgba(16,185,129,0.05)'
          : drag
            ? 'rgba(99,102,241,0.08)'
            : 'rgba(14,14,22,0.75)',
        backdropFilter: 'blur(24px) saturate(140%)',
        border: `1.5px dashed ${loaded ? 'rgba(16,185,129,0.45)' : drag ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)'}`,
        boxShadow: loaded
          ? '0 0 0 3px rgba(16,185,129,0.08), 0 8px 40px rgba(16,185,129,0.07), inset 0 1px 0 rgba(16,185,129,0.12)'
          : drag
            ? '0 0 0 3px rgba(99,102,241,0.12), 0 8px 40px rgba(99,102,241,0.1), inset 0 1px 0 rgba(99,102,241,0.12)'
            : '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
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
            width: 72, height: 72, borderRadius: 18,
            background: drag ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${drag ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.25s', transform: drag ? 'scale(1.08)' : 'scale(1)',
            boxShadow: drag ? '0 0 24px rgba(99,102,241,0.2)' : 'none',
          }}>
            {drag
              ? <IconUpload size={28} color="var(--accent-primary)" />
              : <CardIcon size={28} color="var(--text-dim)" />
            }
          </div>

          <div>
            <div style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '1rem', color: drag ? 'var(--accent-primary)' : 'var(--text-primary)', marginBottom: 6, transition: 'color 0.2s' }}>
              {drag ? 'Drop to upload' : `Upload ${label}`}
            </div>
            <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ height: 1, width: 36, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.72rem', color: 'var(--text-dim)' }}>or</span>
            <div style={{ height: 1, width: 36, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 20px', borderRadius: 10, pointerEvents: 'none',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'IBM Plex Sans', fontWeight: 500, fontSize: '0.84rem', color: 'var(--text-secondary)',
          }}>
            <IconUpload size={15} color="currentColor" />
            Browse files
          </div>

          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--text-dim)' }}>PDF · DOCX · TXT</div>
        </>
      ) : (
        /* Loaded state */
        <>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16,185,129,0.15)',
          }}>
            <IconFileCheck size={28} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1rem', color: 'var(--green)', marginBottom: 5 }}>{fileState.name}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'rgba(16,185,129,0.6)', marginBottom: 8 }}>
              {(fileState.size / 1024).toFixed(1)} KB · {fileState.content.split(/\s+/).filter(Boolean).length} words
            </div>
            <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.78rem', color: 'var(--text-dim)' }}>Click to replace</div>
          </div>
          {/* Preview snippet */}
          <div style={{
            width: '100%', background: 'rgba(10,10,15,0.6)', borderRadius: 10, padding: '10px 14px',
            fontFamily: 'IBM Plex Sans', fontSize: '0.75rem', color: 'var(--text-secondary)',
            lineHeight: 1.65, textAlign: 'left', borderLeft: '2px solid rgba(16,185,129,0.35)',
            maxHeight: 70, overflow: 'hidden', position: 'relative',
          }}>
            {fileState.content.slice(0, 150)}...
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, background: 'linear-gradient(transparent, rgba(10,10,15,0.9))' }} />
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
    setLoading(true);
    setLines([]); setDoneLines([]);
    for (let i = 0; i < STATUS_LINES.length; i++) {
      await new Promise(r => setTimeout(r, 500 + i * 420));
      setLines(prev => [...prev, STATUS_LINES[i]]);
      await new Promise(r => setTimeout(r, 200));
      if (i < STATUS_LINES.length - 1) setDoneLines(prev => [...prev, true]);
    }
    await new Promise(r => setTimeout(r, 400));
    sessionStorage.setItem('analysisData', JSON.stringify(MOCK_ANALYSIS));
    router.push('/prebrief');
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: 'clamp(36px,7vh,64px) clamp(16px,4vw,36px) 80px' }}>

      {/* ── HERO */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vh,52px)' }}>
        <div className="reveal pill pill-accent" style={{ display: 'inline-flex', marginBottom: 24 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }} />
          DataVex TrueHire · AI Interview Intelligence
        </div>

        <h1 className="reveal delay-1" style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: 'clamp(2rem,5.5vw,3.6rem)', letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 14 }}>
          Stop interviewing candidates.
        </h1>
        <p className="reveal delay-2" style={{ fontFamily: 'DM Sans', fontWeight: 300, fontSize: 'clamp(1.1rem,2.4vw,1.5rem)', color: 'var(--text-secondary)', letterSpacing: '-0.01em', marginBottom: 12 }}>
          Start uncovering them.
        </p>
        <p className="reveal delay-3" style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.88rem', color: 'var(--text-dim)', maxWidth: 480, margin: '0 auto' }}>
          Upload the resume and job description. Four AI agents handle everything — live, in real-time.
        </p>
      </div>

      {/* ── STATS */}
      <div className="reveal delay-2" style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(24px,5vw,56px)', flexWrap: 'wrap', marginBottom: 44 }}>
        {[{ v: '4', l: 'AI Agents' }, { v: '<2s', l: 'Analysis Time' }, { v: '94%', l: 'Accuracy' }, { v: '12k+', l: 'Interviews Run' }].map(s => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: 'clamp(1.2rem,2.5vw,1.8rem)', color: 'var(--accent-primary)', letterSpacing: '-0.03em' }}>{s.v}</div>
            <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── UPLOAD GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))', gap: 18, marginBottom: 18 }}>
        <div className="reveal-left">
          <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.63rem', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconFile size={13} color="var(--text-dim)" /> Candidate Resume
          </div>
          <FileUploadCard label="Resume" icon={IconFile} description="Upload the candidate's CV or resume" accept=".pdf,.doc,.docx,.txt" fileState={resume} onFile={setResume} disabled={loading} />
        </div>
        <div className="reveal-right">
          <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.63rem', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconBriefcase size={13} color="var(--text-dim)" /> Job Description
          </div>
          <FileUploadCard label="Job Description" icon={IconBriefcase} description="Upload the full job requirements document" accept=".pdf,.doc,.docx,.txt" fileState={jd} onFile={setJd} disabled={loading} />
        </div>
      </div>

      {/* Status hint */}
      {!loading && (
        <p className="animate-fade-in" style={{ textAlign: 'center', fontFamily: 'IBM Plex Sans', fontSize: '0.78rem', color: !resume || !jd ? 'var(--text-dim)' : 'var(--green)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {!resume && !jd && 'Upload both files to enable analysis'}
          {resume && !jd && <><IconAlertCircle size={14} color="var(--yellow)" /> Resume loaded — upload the job description</>}
          {!resume && jd && <><IconAlertCircle size={14} color="var(--yellow)" /> Job description loaded — upload the resume</>}
          {resume && jd && <><IconCheckCircle size={14} color="var(--green)" /> Both files ready — run analysis</>}
        </p>
      )}

      {/* ── CTA */}
      <div className="reveal delay-1">
        <button className="btn-accent" disabled={!canSubmit} onClick={handleRun}
          style={{ width: '100%', padding: 'clamp(14px,2vh,18px) 32px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          {loading
            ? <><span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block' }} />Analyzing...</>
            : <><span>Run Pre-Interview Analysis</span><IconArrowRight size={17} color="rgba(255,255,255,0.7)" /></>
          }
        </button>

        {/* Status log */}
        {lines.length > 0 && (
          <div style={{ marginTop: 18, padding: '18px 20px', background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
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
          <div className="section-label" style={{ marginBottom: 10 }}>Agent Pipeline</div>
          <h2 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 'clamp(1.2rem,3vw,1.7rem)', letterSpacing: '-0.02em' }}>How TrueHire works</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,210px),1fr))', gap: 14 }}>
          {AGENT_CARDS.map((item, i) => (
            <div key={item.n} className={`card-glass card-hover reveal delay-${i + 1}`} style={{ padding: 'clamp(16px,2.5vw,22px)', position: 'relative', overflow: 'hidden' }}>
              {/* Corner accent */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.08), transparent)', borderRadius: '0 14px 0 0', pointerEvents: 'none' }} />
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'var(--accent-primary)', letterSpacing: '0.1em', marginBottom: 14 }}>{item.n}</div>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <item.Icon size={20} color="var(--accent-primary)" />
              </div>
              <div style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.88rem', marginBottom: 8, lineHeight: 1.3 }}>{item.title}</div>
              <div style={{ fontFamily: 'IBM Plex Sans', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
