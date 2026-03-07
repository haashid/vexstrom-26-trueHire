/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, react/display-name */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { analyzeDocuments } from '@/lib/api';
import { LandingFeatures } from '@/components/LandingFeatures';
import {
  IconUpload, IconFile, IconFileCheck, IconBriefcase,
  IconCpu, IconZap, IconTarget, IconShield,
  IconArrowRight, IconCheckCircle, IconAlertCircle,
  IconUser, IconActivity, IconBarChart, IconUsers
} from '@/components/Icons';

const STATUS_LINES = [
  'Agent 1 — Parsing resume claims and credentials...',
  'Agent 2 — Cross-referencing job requirements...',
  'Agent 3 — Scoring risk profile and red flags...',
  'Agent 4 — Generating tiered question bank...',
  'Compiling candidate intelligence brief...',
];

type FileState = { name: string; size: number; content: string; file: File } | null;

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
    reader.onload = e => onFile({ name: file.name, size: file.size, content: e.target?.result as string || '', file });
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
          ? 'rgba(var(--glass-green),0.05)'
          : drag
            ? 'rgba(var(--glass-accent),0.08)'
            : 'rgba(14,14,22,0.75)',
        backdropFilter: 'blur(24px) saturate(140%)',
        border: `1.5px dashed ${loaded ? 'rgba(var(--glass-green),0.45)' : drag ? 'rgba(var(--glass-accent),0.6)' : 'rgba(var(--glass-white),0.1)'}`,
        boxShadow: loaded
          ? '0 0 0 3px rgba(var(--glass-green),0.08), 0 8px 40px rgba(var(--glass-green),0.07), inset 0 1px 0 rgba(var(--glass-green),0.12)'
          : drag
            ? '0 0 0 3px rgba(var(--glass-accent),0.12), 0 8px 40px rgba(var(--glass-accent),0.1), inset 0 1px 0 rgba(var(--glass-accent),0.12)'
            : '0 4px 24px rgba(var(--glass-black),0.4), inset 0 1px 0 rgba(var(--glass-white),0.04)',
      }}
    >
      {/* Inner glow blob when active */}
      {drag && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(var(--glass-accent),0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />}
      {loaded && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(var(--glass-green),0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />}

      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />

      {!loaded ? (
        <>
          {/* Icon container */}
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: drag ? 'rgba(var(--glass-accent),0.18)' : 'rgba(var(--glass-white),0.04)',
            border: `1px solid ${drag ? 'rgba(var(--glass-accent),0.35)' : 'rgba(var(--glass-white),0.08)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.25s', transform: drag ? 'scale(1.08)' : 'scale(1)',
            boxShadow: drag ? '0 0 24px rgba(var(--glass-accent),0.2)' : 'none',
          }}>
            {drag
              ? <IconUpload size={28} color="var(--accent-primary)" />
              : <CardIcon size={28} color="var(--text-dim)" />
            }
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '1rem', color: drag ? 'var(--accent-primary)' : 'var(--text-primary)', marginBottom: 6, transition: 'color 0.2s' }}>
              {drag ? 'Drop to upload' : `Upload ${label}`}
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ height: 1, width: 36, background: 'rgba(var(--glass-white),0.07)' }} />
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'var(--text-dim)' }}>or</span>
            <div style={{ height: 1, width: 36, background: 'rgba(var(--glass-white),0.07)' }} />
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 20px', borderRadius: 10, pointerEvents: 'none',
            background: 'rgba(var(--glass-white),0.03)', border: '1px solid rgba(var(--glass-white),0.08)',
            fontFamily: 'var(--font-inter)', fontWeight: 500, fontSize: '0.84rem', color: 'var(--text-secondary)',
          }}>
            <IconUpload size={15} color="currentColor" />
            Browse files
          </div>

          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.65rem', color: 'var(--text-dim)' }}>PDF · DOCX · TXT</div>
        </>
      ) : (
        /* Loaded state */
        <>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(var(--glass-green),0.12)', border: '1px solid rgba(var(--glass-green),0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(var(--glass-green),0.15)',
          }}>
            <IconFileCheck size={28} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1rem', color: 'var(--green)', marginBottom: 5 }}>{fileState.name}</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.7rem', color: 'rgba(var(--glass-green),0.6)', marginBottom: 8 }}>
              {(fileState.size / 1024).toFixed(1)} KB · {fileState.content.split(/\s+/).filter(Boolean).length} words
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>Click to replace</div>
          </div>
          {/* Preview snippet */}
          <div style={{
            width: '100%', background: 'rgba(var(--glass-surface),0.6)', borderRadius: 10, padding: '10px 14px',
            fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-secondary)',
            lineHeight: 1.65, textAlign: 'left', borderLeft: '2px solid rgba(var(--glass-green),0.35)',
            maxHeight: 70, overflow: 'hidden', position: 'relative',
          }}>
            {fileState.content.slice(0, 150)}...
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, background: 'linear-gradient(transparent, rgba(var(--glass-surface),0.9))' }} />
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
  const [error, setError] = useState<string | null>(null);

  useScrollReveal([]);

  const canSubmit = !!resume && !!jd && !loading;

  const handleRun = async () => {
    if (!resume?.file || !jd?.file) return;
    setLoading(true);
    setError(null);
    setLines([]); setDoneLines([]);

    // Animate the status log while the API call runs
    const animateLines = async () => {
      for (let i = 0; i < STATUS_LINES.length - 1; i++) {
        await new Promise(r => setTimeout(r, 500 + i * 420));
        setLines(prev => [...prev, STATUS_LINES[i]]);
        await new Promise(r => setTimeout(r, 200));
        setDoneLines(prev => [...prev, true]);
      }
    };

    try {
      // Run animation and API call in parallel
      const [analysisData] = await Promise.all([
        analyzeDocuments(resume.file, jd.file),
        animateLines(),
      ]);

      // Show final status line
      setLines(prev => [...prev, STATUS_LINES[STATUS_LINES.length - 1]]);
      await new Promise(r => setTimeout(r, 400));

      sessionStorage.setItem('analysisData', JSON.stringify(analysisData));
      router.push('/prebrief');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Is the backend running on port 8000?');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: 'clamp(36px,7vh,64px) clamp(16px,4vw,36px) 80px' }}>

      {/* ── HERO */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vh,52px)' }}>
        <div className="reveal pill pill-accent" style={{ display: 'inline-flex', marginBottom: 24 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }} />
          DataVex TrueHire · AI Interview Intelligence
        </div>

        <h1 className="reveal delay-1" style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(2rem,5.5vw,3.6rem)', letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 14 }}>
          Stop interviewing candidates.
        </h1>
        <p className="reveal delay-2" style={{ fontFamily: 'var(--font-syne)', fontWeight: 300, fontSize: 'clamp(1.1rem,2.4vw,1.5rem)', color: 'var(--text-secondary)', letterSpacing: '-0.01em', marginBottom: 12 }}>
          Start uncovering them.
        </p>
        <p className="reveal delay-3" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.88rem', color: 'var(--text-dim)', maxWidth: 480, margin: '0 auto' }}>
          Upload the resume and job description. Four AI agents handle everything — live, in real-time.
        </p>
      </div>

      {/* ── STATS */}
      <div className="reveal delay-2" style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(24px,5vw,56px)', flexWrap: 'wrap', marginBottom: 44 }}>
        {[{ v: '4', l: 'AI Agents' }, { v: '<2s', l: 'Analysis Time' }, { v: '94%', l: 'Accuracy' }, { v: '12k+', l: 'Interviews Run' }].map(s => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontWeight: 600, fontSize: 'clamp(1.2rem,2.5vw,1.8rem)', color: 'var(--accent-primary)', letterSpacing: '-0.03em' }}>{s.v}</div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── UPLOAD GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))', gap: 18, marginBottom: 18 }}>
        <div className="reveal-left">
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.63rem', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconFile size={13} color="var(--text-dim)" /> Candidate Resume
          </div>
          <FileUploadCard label="Resume" icon={IconFile} description="Upload the candidate's CV or resume" accept=".pdf,.doc,.docx,.txt" fileState={resume} onFile={setResume} disabled={loading} />
        </div>
        <div className="reveal-right">
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.63rem', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconBriefcase size={13} color="var(--text-dim)" /> Job Description
          </div>
          <FileUploadCard label="Job Description" icon={IconBriefcase} description="Upload the full job requirements document" accept=".pdf,.doc,.docx,.txt" fileState={jd} onFile={setJd} disabled={loading} />
        </div>
      </div>

      {/* Status hint */}
      {!loading && (
        <p className="animate-fade-in" style={{ textAlign: 'center', fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: !resume || !jd ? 'var(--text-dim)' : 'var(--green)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
            ? <><span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(var(--glass-white),0.2)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block' }} />Analyzing...</>
            : <><span>Run Pre-Interview Analysis</span><IconArrowRight size={17} color="rgba(var(--glass-white),0.7)" /></>
          }
        </button>

        {error && (
          <div className="animate-fade-in" style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(var(--glass-red),0.1)', border: '1px solid rgba(var(--glass-red),0.3)', borderRadius: 8, color: 'var(--red)', fontFamily: 'var(--font-inter)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconAlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Status log */}
        {lines.length > 0 && (
          <div style={{ marginTop: 18, padding: '18px 20px', background: 'rgba(var(--glass-surface),0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(var(--glass-white),0.06)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {lines.map((l, i) => (
              <div key={i} className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-dm-mono)', fontSize: '0.75rem', color: i === lines.length - 1 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                {doneLines[i]
                  ? <IconCheckCircle size={14} color="var(--green)" />
                  : i === lines.length - 1
                    ? <span className="animate-spin" style={{ width: 13, height: 13, border: '1.5px solid rgba(var(--glass-accent),0.3)', borderTop: '1.5px solid var(--accent-primary)', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
                    : <div style={{ width: 13, height: 13 }} />
                }
                {l}
              </div>
            ))}
          </div>
        )}
      </div>

      <LandingFeatures />

      {/* ── BENTO GRID: HOW IT WORKS ── */}
      <div style={{ marginTop: 'clamp(60px,10vh,96px)' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="section-label" style={{ marginBottom: 12 }}>Agent Pipeline</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 'clamp(1.6rem,4vw,2.4rem)', letterSpacing: '-0.03em', marginBottom: 16 }}>Intelligence at every step.</h2>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>Four specialized AI agents work in tandem to evaluate candidates passively and produce actionable hiring decisions.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 24 }}>

          {/* Card 1: Resume Analyzer */}
          <div className="bento-card dot-grid reveal delay-1" style={{ minHeight: 320, display: 'flex', flexDirection: 'column' }}>
            <div className="bento-header">
              <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '1.2rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconCpu size={18} color="var(--accent-primary)" /> Resume Analyzer
              </h3>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Parses every claim, credential, and tenure gap from the uploaded documents before the interview begins.</p>
            </div>
            <div style={{ marginTop: 'auto', padding: '0 24px 24px', display: 'flex', justifyContent: 'flex-end' }}>
              <div className="bento-inner" style={{ width: '92%', padding: '20px 22px', background: 'linear-gradient(135deg, rgba(8,8,18,0.9), rgba(var(--glass-accent),0.06))' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span className="bento-pill">Claim Extracted</span>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(var(--glass-white),0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconFile size={13} color="var(--text-secondary)" /></div>
                </div>
                <div style={{ height: 6, width: '100%', background: 'rgba(var(--glass-white),0.05)', borderRadius: 3, marginBottom: 8 }} />
                <div style={{ height: 6, width: '80%', background: 'rgba(var(--glass-white),0.05)', borderRadius: 3, marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(var(--glass-accent),0.4)' }} />
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(var(--glass-accent),0.2)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Question Generator */}
          <div className="bento-card dot-grid reveal delay-2" style={{ minHeight: 320, display: 'flex', flexDirection: 'column' }}>
            <div className="bento-header">
              <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '1.2rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconZap size={18} color="var(--yellow)" /> Question Generator
              </h3>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Creates a tiered T1/T2/T3 question bank targeting specific risk areas and claimed expertise.</p>
            </div>
            <div style={{ marginTop: 'auto', padding: '0 24px 24px' }}>
              <div className="bento-inner" style={{ padding: '20px 24px', borderLeft: '4px solid var(--yellow)', background: 'linear-gradient(135deg, rgba(8,8,18,0.9), rgba(var(--glass-yellow),0.04))' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <span className="bento-pill" style={{ background: 'rgba(var(--glass-yellow),0.1)', color: 'var(--yellow)', borderColor: 'rgba(var(--glass-yellow),0.25)' }}>Tier 3: Deep Dive</span>
                </div>
                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>"Explain the exact architectural compromises made when scaling the real-time pipeline to 10k RPS."</div>
              </div>
            </div>
          </div>

          {/* Card 3: Live Voice Evaluator */}
          <div className="bento-card dot-grid reveal delay-3" style={{ minHeight: 320, display: 'flex', flexDirection: 'column' }}>
            <div className="bento-header">
              <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '1.2rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconActivity size={18} color="var(--green)" /> Live Voice Evaluator
              </h3>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Transcribes the interview via microphone, passively mapping answers to questions and auto-scoring in real-time.</p>
            </div>
            <div style={{ marginTop: 'auto', padding: '0 24px 24px' }}>
              <div className="bento-inner" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="animate-pulse-glow" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.75rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>LISTENING</span>
                  </div>
                  <span className="bento-pill-green">94% Confidence</span>
                </div>
                <svg className="chart-path" width="100%" height="45" viewBox="0 0 200 45" preserveAspectRatio="none">
                  <path d="M0,35 Q20,10 40,25 T80,15 T120,40 T160,10 T200,25" fill="none" stroke="var(--green)" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 6px rgba(var(--glass-green),0.5))' }} />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 4: Verdict Engine */}
          <div className="bento-card dot-grid reveal delay-4" style={{ minHeight: 320, display: 'flex', flexDirection: 'column' }}>
            <div className="bento-header">
              <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '1.2rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconShield size={18} color="var(--accent-primary)" /> Verdict Engine
              </h3>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>A multi-agent debate determines the final HIRE / NO-HIRE decision, synthesizing all findings into a complete report.</p>
            </div>
            <div style={{ marginTop: 'auto', padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
              <div className="bento-inner" style={{ padding: '32px 24px', textAlign: 'center', width: '100%', background: 'radial-gradient(ellipse at center, rgba(var(--glass-green),0.06), transparent)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  {[IconCpu, IconZap, IconTarget].map((Icon, idx) => (
                    <div key={idx} style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid rgba(var(--glass-white),0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: idx > 0 ? -14 : 0, boxShadow: '0 4px 16px rgba(var(--glass-black),0.6)', position: 'relative', zIndex: 3 - idx }}>
                      <Icon size={18} color="rgba(var(--glass-white),0.8)" />
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--green)', textShadow: '0 0 20px rgba(var(--glass-green),0.4)', letterSpacing: '-0.03em' }}>
                  STRONG HIRE
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
