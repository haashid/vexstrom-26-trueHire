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
import Hero from '@/components/Hero';

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
        borderRadius: 16,
        padding: 'clamp(32px,6vh,48px) clamp(24px,5vw,40px)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        minHeight: 280,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 20, textAlign: 'center',
        userSelect: 'none', position: 'relative', overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        background: loaded
          ? 'rgba(255, 255, 255, 0.8)'
          : drag
            ? 'rgba(239, 246, 255, 0.8)'
            : 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px ${loaded ? 'solid' : 'dashed'} ${loaded ? 'var(--accent-primary)' : drag ? 'var(--accent-primary)' : 'rgba(15,23,42,0.1)'}`,
        boxShadow: loaded
          ? '0 10px 40px -10px rgba(37, 99, 235, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 1)'
          : drag
            ? '0 20px 40px -10px rgba(37, 99, 235, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.8)'
            : '0 4px 20px -5px rgba(0, 0, 0, 0.03), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
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
            width: 64, height: 64, borderRadius: 16,
            background: drag ? 'rgba(37,99,235,0.1)' : 'rgba(255, 255, 255, 0.8)',
            border: `1px solid ${drag ? 'rgba(37,99,235,0.3)' : 'rgba(15,23,42,0.05)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            transition: 'all 0.2s', transform: drag ? 'scale(1.05)' : 'scale(1)',
          }}>
            {drag
              ? <IconUpload size={28} color="var(--accent-primary)" />
              : <CardIcon size={28} color="var(--text-primary)" />
            }
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '1.1rem', color: drag ? 'var(--accent-primary)' : 'var(--text-primary)', marginBottom: 6, transition: 'color 0.2s', letterSpacing: '-0.01em' }}>
              {drag ? 'Drop to upload' : `Upload ${label}`}
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 400 }}>{description}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ height: 1, width: 36, background: 'rgba(15,23,42,0.08)' }} />
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>or</span>
            <div style={{ height: 1, width: 36, background: 'rgba(15,23,42,0.08)' }} />
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 100, pointerEvents: 'none',
            background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(15,23,42,0.08)',
            fontFamily: 'var(--font-inter)', fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)',
            boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
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
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            boxShadow: '0 4px 16px -4px rgba(16,185,129,0.2), inset 0 0 0 1px rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconFileCheck size={28} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.01em' }}>{fileState.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              {(fileState.size / 1024).toFixed(1)} KB · {fileState.content.split(/\s+/).filter(Boolean).length} words
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Click to replace</div>
          </div>
          {/* Preview snippet */}
          <div style={{
            width: '100%', background: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: '12px 16px',
            fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--text-secondary)',
            lineHeight: 1.6, textAlign: 'left', border: '1px solid rgba(15,23,42,0.04)', borderLeft: '4px solid var(--green)',
            maxHeight: 80, overflow: 'hidden', position: 'relative',
          }}>
            {fileState.content.slice(0, 150)}...
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, background: 'linear-gradient(transparent, rgba(255,255,255,0.9))' }} />
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
    <main>
      <Hero />

      <div id="upload" style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(80px,10vh,120px) clamp(24px,5vw,40px) 100px', position: 'relative' }}>

        {/* Subtle background glow for the whole section */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: '100vw', maxWidth: '1400px', height: '800px', background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        <div className="reveal" style={{ textAlign: 'center', marginBottom: 64, position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: 'clamp(2.5rem,5vw,3.5rem)', color: 'var(--text-primary)', letterSpacing: '-0.05em', marginBottom: 20 }}>
            Deploy candidate intelligence.
          </h2>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(1.1rem,2vw,1.25rem)', color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto', lineHeight: 1.6, fontWeight: 400 }}>
            Upload the candidate&apos;s resume and job description to initiate our multi-agent evaluation pipeline.
          </p>
        </div>

        {/* ── UPLOAD GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))', gap: 32, marginBottom: 32, position: 'relative', zIndex: 1 }}>
          <div className="reveal-left">
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconFile size={15} color="var(--text-dim)" /> Candidate Resume
            </div>
            <FileUploadCard label="Resume" icon={IconFile} description="Upload the candidate&apos;s CV or resume (PDF only)" accept=".pdf" fileState={resume} onFile={setResume} disabled={loading} />
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
        <div className="reveal delay-1" style={{ position: 'relative', zIndex: 1, marginTop: 40 }}>
          <button className="btn-accent" disabled={!canSubmit} onClick={handleRun}
            style={{
              width: '100%',
              padding: 'clamp(18px,3vh,24px) 40px',
              fontSize: '1.15rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              borderRadius: '9999px',
              background: canSubmit ? 'var(--text-primary)' : 'rgba(15, 23, 42, 0.08)',
              color: canSubmit ? '#fff' : 'rgba(15, 23, 42, 0.65)',
              boxShadow: canSubmit ? '0 15px 35px -5px rgba(15, 23, 42, 0.25)' : 'none',
              border: canSubmit ? 'none' : '1px solid rgba(15,23,42,0.15)',
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)'
            }}>
            {loading
              ? <><span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block' }} />Analyzing...</>
              : <><span>Run Pre-Interview Analysis</span><IconArrowRight size={17} color={canSubmit ? "#fff" : "rgba(15, 23, 42, 0.65)"} /></>
            }
          </button>

          {/* Status log */}
          {lines.length > 0 && (
            <div style={{ marginTop: 32, padding: '32px 36px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.6)' }}>
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
        <div id="features" style={{ marginTop: 'clamp(100px,15vh,160px)', position: 'relative', zIndex: 1 }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: 'clamp(2.5rem,5vw,3.5rem)', color: 'var(--text-primary)', letterSpacing: '-0.05em', marginBottom: 20 }}>Analysis pipeline.</h2>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(1.1rem,2vw,1.25rem)', color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto', lineHeight: 1.6, fontWeight: 400 }}>
              Under the hood, we run an orchestrated swarm of expert agents mimicking a seasoned talent acquisition board.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: 24 }}>
            {AGENT_CARDS.map((item, i) => (
              <div key={item.n} className={`reveal delay-${i + 1}`} style={{
                padding: 'clamp(32px,4vw,40px)', position: 'relative', overflow: 'hidden', borderRadius: 24,
                background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.8)',
                transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease'
              }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 50px -10px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,1)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.8)'; }}>
                {/* Decorative glowing orb in corner */}
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'radial-gradient(circle, rgba(15,23,42,0.03) 0%, transparent 70%)', borderRadius: '50%' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <item.Icon size={24} color="var(--text-primary)" />
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)' }}>{item.n}</div>
                </div>

                <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: '1.25rem', marginBottom: 12, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{item.title}</div>
                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
