const API_BASE = "http://127.0.0.1:8000/api/v1";

// Global State
let globalResumeAnalysis = null;
let globalQuestionBank = null;
let globalResumeClaims = []; // Extracted for evaluate phase
let qaPairsObj = []; // For the final verdict

// Elements
const dom = {
    jd: document.getElementById('jd'),
    resume: document.getElementById('resume'),
    btnAnalyze: document.getElementById('btn-analyze'),
    analyzeSpinner: document.getElementById('analyze-spinner'),
    analyzeError: document.getElementById('analyze-error'),
    
    phase1: document.getElementById('phase-1'),
    phase2: document.getElementById('phase-2'),
    phase3: document.getElementById('phase-3'),
    phase4: document.getElementById('phase-4'),
    
    fitScoreBadge: document.getElementById('fit-score-badge'),
    strengthsList: document.getElementById('strengths-list'),
    redFlagsList: document.getElementById('red-flags-list'),
    
    questionSelect: document.getElementById('question-select'),
    currentQuestionText: document.getElementById('current-question-text'),
    qTier: document.getElementById('q-tier'),
    candidateAnswer: document.getElementById('candidate-answer'),
    
    btnEvaluate: document.getElementById('btn-evaluate'),
    evalSpinner: document.getElementById('eval-spinner'),
    evalError: document.getElementById('eval-error'),
    
    evalDepth: document.getElementById('eval-depth'),
    evalLabel: document.getElementById('eval-label'),
    evalBluff: document.getElementById('eval-bluff'),
    contradictionAlert: document.getElementById('contradiction-alert'),
    contradictionText: document.getElementById('contradiction-text'),
    evalFollowup: document.getElementById('eval-followup'),
    
    btnNextQuestion: document.getElementById('btn-next-question'),
    btnVerdict: document.getElementById('btn-verdict'),
    verdictSpinner: document.getElementById('verdict-spinner'),
    
    finalDecision: document.getElementById('final-decision'),
    verdictSummary: document.getElementById('verdict-summary'),
    reasoningList: document.getElementById('reasoning-list')
};

// ==========================================
// Phase 1: Analyze
// ==========================================
dom.btnAnalyze.addEventListener('click', async () => {
    const jdFile = dom.jd.files[0];
    const resumeFile = dom.resume.files[0];
    
    if (!jdFile || !resumeFile) {
        showError(dom.analyzeError, "Both Job Description and Resume PDF files are required.");
        return;
    }

    dom.btnAnalyze.disabled = true;
    dom.analyzeSpinner.classList.remove('hidden');
    dom.analyzeError.classList.add('hidden');

    const formData = new FormData();
    formData.append("resume_pdf", resumeFile);
    formData.append("jd_pdf", jdFile);

    try {
        const response = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(await response.text());
        
        const data = await response.json();
        setupPhase2(data);
        
    } catch (err) {
        showError(dom.analyzeError, "Analysis Failed: " + err.message);
    } finally {
        dom.btnAnalyze.disabled = false;
        dom.analyzeSpinner.classList.add('hidden');
    }
});

function setupPhase2(data) {
    globalResumeAnalysis = data.pre_brief;
    globalQuestionBank = data.question_bank.questions;
    
    // Extract claims strings for the evaluator
    globalResumeClaims = globalResumeAnalysis.skills.map(s => `${s.skill_name}: ${s.evidence}`);

    // Populate UI
    dom.fitScoreBadge.textContent = `${globalResumeAnalysis.overall_fit_score}% Fit`;
    
    dom.strengthsList.innerHTML = globalResumeAnalysis.key_strengths.map(s => `<li>${s}</li>`).join('');
    dom.redFlagsList.innerHTML = globalResumeAnalysis.red_flags.map(r => `<li>${r}</li>`).join('');

    // Populate dropdown
    dom.questionSelect.innerHTML = globalQuestionBank.map((q, idx) => 
        `<option value="${idx}">[Tier ${q.tier}] ${q.category}</option>`
    ).join('');
    
    updateCurrentQuestion(0);

    dom.phase1.classList.add('hidden');
    dom.phase2.classList.remove('hidden');
}

dom.questionSelect.addEventListener('change', (e) => updateCurrentQuestion(e.target.value));

function updateCurrentQuestion(index) {
    const q = globalQuestionBank[index];
    dom.qTier.textContent = `Tier ${q.tier}`;
    dom.currentQuestionText.textContent = q.question_text;
}

// ==========================================
// Phase 2: Evaluate
// ==========================================
dom.btnEvaluate.addEventListener('click', async () => {
    const answer = dom.candidateAnswer.value.trim();
    if (!answer) {
        showError(dom.evalError, "Candidate answer is empty.");
        return;
    }

    dom.btnEvaluate.disabled = true;
    dom.evalSpinner.classList.remove('hidden');
    dom.evalError.classList.add('hidden');
    
    const selectedQIndex = dom.questionSelect.value;
    const currentQuestion = globalQuestionBank[selectedQIndex].question_text;

    try {
        const response = await fetch(`${API_BASE}/evaluate-answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: currentQuestion,
                transcript: [
                    { role: "candidate", content: answer }
                ],
                resume_claims: globalResumeClaims
            })
        });

        if (!response.ok) throw new Error(await response.text());
        
        const evaluation = await response.json();
        
        // Save to QA Pairs for verdict
        qaPairsObj.push({
            question: currentQuestion,
            answer: answer,
            evaluation: evaluation
        });

        setupPhase3(evaluation);
        
    } catch (err) {
        showError(dom.evalError, "Evaluation Failed: " + err.message);
    } finally {
        dom.btnEvaluate.disabled = false;
        dom.evalSpinner.classList.add('hidden');
    }
});

function setupPhase3(evalResult) {
    dom.evalDepth.textContent = evalResult.depth_score + "/10";
    dom.evalLabel.textContent = evalResult.label;
    dom.evalBluff.textContent = (evalResult.bluff_likelihood * 100).toFixed(0) + "%";
    
    if (evalResult.contradiction_flag) {
        dom.contradictionAlert.classList.remove('hidden');
        dom.contradictionText.textContent = evalResult.contradiction_detail;
    } else {
        dom.contradictionAlert.classList.add('hidden');
    }
    
    dom.evalFollowup.textContent = evalResult.suggested_follow_up;
    dom.candidateAnswer.value = ""; // clear for next

    dom.phase3.classList.remove('hidden');
}

dom.btnNextQuestion.addEventListener('click', () => {
    dom.phase3.classList.add('hidden');
    dom.candidateAnswer.focus();
});

// ==========================================
// Phase 3: Final Verdict
// ==========================================
dom.btnVerdict.addEventListener('click', async () => {
    dom.btnVerdict.disabled = true;
    dom.verdictSpinner.classList.remove('hidden');
    
    // We also need to get the true array value of qa_pairs mapped correctly
    const finalQAPairs = qaPairsObj.map(p => ({
        question: p.question,
        candidate_answer: p.answer,
        evaluation: p.evaluation
    }));

    try {
        const response = await fetch(`${API_BASE}/verdict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resume_analysis: globalResumeAnalysis,
                qa_pairs: finalQAPairs
            })
        });

        if (!response.ok) throw new Error(await response.text());
        
        const verdict = await response.json();
        setupPhase4(verdict);
        
    } catch (err) {
        alert("Failed to generate verdict: " + err.message);
        dom.btnVerdict.disabled = false;
        dom.verdictSpinner.classList.add('hidden');
    }
});

function setupPhase4(verdict) {
    const decision = verdict.verdict.toLowerCase();
    
    if (decision.includes('strong hire') || decision === 'hire') {
        dom.finalDecision.style.color = 'var(--success)';
    } else if (decision.includes('no-hire')) {
        dom.finalDecision.style.color = 'var(--danger)';
    } else {
        dom.finalDecision.style.color = 'var(--warning)';
    }
    
    dom.finalDecision.textContent = verdict.verdict;
    dom.verdictSummary.textContent = verdict.summary;
    
    dom.reasoningList.innerHTML = verdict.reasoning_trace.map(r => `<li>${r}</li>`).join('');

    dom.phase2.classList.add('hidden');
    dom.phase3.classList.add('hidden');
    dom.phase4.classList.remove('hidden');
}

// Helpers
function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
}
