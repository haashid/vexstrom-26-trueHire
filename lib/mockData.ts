// Mock data for demo-ready UI — simulates what the AI backend would return

export const MOCK_ANALYSIS = {
    candidate: {
        name: "Arjun Mehta",
        email: "arjun.m@example.com",
        role: "Senior Full-Stack Engineer",
        credibility: "MEDIUM",
        credibilityLabel: "Partial Verification",
    },
    redFlags: [
        {
            id: "rf1",
            claim: "Led a team of 15 engineers at Scale AI (2021–2023)",
            concern: "LinkedIn shows only 6 months at Scale AI as IC. No managerial title listed.",
            verificationQuestion: "Can you walk me through your org structure at Scale AI — who did you directly manage, and what was your reporting line?",
            severity: "HIGH",
        },
        {
            id: "rf2",
            claim: "Architected a real-time ML serving system handling 50M req/day",
            concern: "Candidate lacks any open-source contribution or technical writing on ML infra topics. Claim is unusually specific.",
            verificationQuestion: "Describe the specific bottleneck you solved in that serving pipeline. What was the P99 latency before and after?",
            severity: "CRITICAL",
        },
        {
            id: "rf3",
            claim: "MBA from IIM Ahmedabad, 2019",
            concern: "No mention of MBA on resume skills or role history. Possible credential padding.",
            verificationQuestion: "How has your MBA influenced your approach to engineering decisions or stakeholder communication?",
            severity: "LOW",
        },
    ],
    skills: [
        { name: "System Design", level: 85, tier: "HIGH" },
        { name: "React / Next.js", level: 72, tier: "HIGH" },
        { name: "Node.js / APIs", level: 78, tier: "HIGH" },
        { name: "Machine Learning", level: 41, tier: "MEDIUM" },
        { name: "Database Design", level: 65, tier: "MEDIUM" },
        { name: "DevOps / Infra", level: 30, tier: "LOW" },
        { name: "Leadership", level: 38, tier: "LOW" },
    ],
    questionBank: [
        {
            area: "System Design",
            questions: [
                {
                    id: "q1",
                    tier: "T1",
                    preview: "Design a URL shortener with 100M users.",
                    full: "Design a URL shortener service that handles 100M active users per month. Walk me through your data model, API design, caching strategy, and how you'd handle hot URLs.",
                    why_ask: "Reveals depth of distributed systems knowledge. Watch for candidates who jump to solutions without clarifying requirements.",
                    keywords: ["url", "shortener", "shorten", "bitly", "redirect", "slug", "key-value", "redis", "cache", "hot url", "100 million", "data model", "api design", "caching"],
                },
                {
                    id: "q2",
                    tier: "T2",
                    preview: "How would you minimize write amplification in a write-heavy system?",
                    full: "Given a write-heavy workload (10:1 write-to-read ratio), how would you design your storage layer to minimize write amplification while maintaining read performance?",
                    why_ask: "Tests genuine database internals knowledge. Most junior candidates can't answer this without coaching.",
                    keywords: ["write amplification", "lsm", "write-heavy", "compaction", "wal", "write ahead", "storage layer", "write ratio", "rocksdb", "cassandra"],
                },
            ],
        },
        {
            area: "ML Systems",
            questions: [
                {
                    id: "q3",
                    tier: "T3",
                    preview: "Walk me through your real-time serving architecture.",
                    full: "You claimed to have built an ML serving system at 50M req/day. Walk me through the architecture end-to-end — model packaging, inference server, batching strategy, and monitoring.",
                    why_ask: "Directly probes the high-severity red flag. Technical specificity reveals whether this was a personal contribution or team-attributed achievement.",
                    keywords: ["ml", "serving", "inference", "model", "batching", "latency", "triton", "torchserve", "onnx", "scale ai", "50 million", "architecture", "pipeline", "real-time", "monitoring"],
                },
                {
                    id: "q4",
                    tier: "T2",
                    preview: "How do you handle model drift in production?",
                    full: "Describe your approach to detecting and responding to model drift in a production ML system. What metrics do you monitor, and what's your rollback strategy?",
                    why_ask: "Separates engineers who've actually operated ML systems from those who've only trained models.",
                    keywords: ["drift", "model drift", "data drift", "distribution shift", "monitoring", "rollback", "retraining", "psi", "kl divergence", "alerting"],
                },
            ],
        },
        {
            area: "Leadership & Ownership",
            questions: [
                {
                    id: "q5",
                    tier: "T1",
                    preview: "Tell me about a high-stakes technical decision you owned.",
                    full: "Describe a high-stakes technical decision you made where you were the primary decision-maker. What was the trade-off, who did you consult, and what was the outcome?",
                    why_ask: "Validates leadership claim from resume. Real leaders describe specific decisions; inflators speak in vague generalities.",
                    keywords: ["decision", "trade-off", "tradeoff", "stakeholder", "owned", "leadership", "high-stakes", "outcome", "manage", "team", "engineer"],
                },
            ],
        },
    ],
    interviewStrategy: "Focus the first 20 minutes on the ML serving system claim — it's the highest-risk red flag. If the candidate satisfies T3, pivot to system design depth. Preserve leadership questions for final 10 minutes to evaluate culture fit under pressure.",
};

export const MOCK_INTERVIEW_ANALYSIS = {
    q1: {
        depthScore: 78,
        depthLabel: "Solid",
        bluffRisk: "LOW",
        contradiction_detected: false,
        followUp: {
            question: "You mentioned using Redis for caching — how would you handle cache invalidation when the original URL is updated?",
            why: "Follow-through question on cache strategy reveals depth vs. surface-level pattern matching.",
        },
    },
    q3: {
        depthScore: 31,
        depthLabel: "Shallow",
        bluffRisk: "HIGH",
        contradiction_detected: true,
        contradiction: {
            resumeClaimed: "Architected a real-time ML serving system handling 50M req/day at Scale AI",
            candidateSaid: "We used a vendor solution — I was more on the integration side. The team handled the core infra.",
            severity: "CRITICAL",
        },
        followUp: {
            question: "Who specifically owned the batching and inference server decisions on your team?",
            why: "Contradiction confirmed. This question establishes whether candidate had any meaningful contribution.",
        },
    },
};

export const MOCK_VERDICT = {
    verdict: "NO-HIRE",
    confidence: 82,
    primaryReason: "Critical credential inflation detected. Candidate overstated ownership of ML infrastructure — confirmed via contradiction in live interview. System design depth is solid but insufficient to offset trust deficit.",
    skillHeatmap: [
        { skill: "System Design", conceptual: "HIGH", applied: "HIGH", deep: "MEDIUM" },
        { skill: "Frontend (React)", conceptual: "HIGH", applied: "HIGH", deep: "HIGH" },
        { skill: "ML Systems", conceptual: "LOW", applied: "LOW", deep: "LOW" },
        { skill: "Leadership", conceptual: "MEDIUM", applied: "LOW", deep: "LOW" },
        { skill: "Database Design", conceptual: "MEDIUM", applied: "MEDIUM", deep: "LOW" },
    ],
    discrepancies: [
        { id: "d1", claim: "Led team of 15 engineers", finding: "IC role at Scale AI for 6 months", severity: "HIGH" },
        { id: "d2", claim: "50M req/day ML serving system", finding: "Vendor integration, not authorship", severity: "CRITICAL" },
        { id: "d3", claim: "IIM Ahmedabad MBA", finding: "Unverifiable, no supporting context", severity: "LOW" },
    ],
    agentDebate: [
        {
            agent: "A",
            name: "Agent Sigma",
            color: "var(--accent-primary)",
            position: "NO-HIRE",
            reasoning: "The ML infrastructure claim was the linchpin of the candidacy. When directly probed, the candidate pivoted to 'integration work' — a clear admission of credential inflation. Engineers who overstate technical ownership in interviews will overstate it on-the-job. This is a cultural and trust risk, not just a skills gap.",
        },
        {
            agent: "B",
            name: "Agent Delta",
            color: "var(--yellow)",
            position: "CONDITIONAL",
            reasoning: "I'd push back on a full no-hire. The system design depth was genuinely strong — URL shortener answer was T2-quality unprompted. The inflation may reflect cultural coaching ('put your best foot forward') rather than intentional deception. Consider a 30-day contract-to-hire with scoped ownership.",
        },
        {
            agent: "C",
            name: "Agent Tau",
            color: "var(--red)",
            position: "NO-HIRE",
            reasoning: "Agreed with Sigma. The contradiction was unprompted and immediate. Candidate didn't attempt to clarify — they retreated. That behavioural signal is more damning than the factual discrepancy. High-trust engineering environments can't absorb this risk at senior level.",
        },
    ],
    consensus: "Two of three agents recommend NO-HIRE with high confidence. Agent Delta's conditional-hire position is noted and preserved for hiring manager review. Primary concern: trust deficit at senior IC / lead level role where autonomous ownership is non-negotiable.",
};

export type TranscriptEntry = {
    id: string;
    speaker: 'Panelist' | 'Candidate';
    text: string;
    ts: string;
    flagged?: boolean;
    flagReason?: string;
};

export const MOCK_TRANSCRIPT_INITIAL: TranscriptEntry[] = [
    {
        id: 't1',
        speaker: 'Panelist',
        text: "Thanks for joining us today, Arjun. Let's start with your background. You mentioned you architected an ML serving system at Scale AI — can you walk us through that?",
        ts: '00:01:14',
    },
    {
        id: 't2',
        speaker: 'Candidate',
        text: "Sure, yes. At Scale AI I was part of the ML infra team. We built a real-time serving pipeline that handled, I think at peak it was around 50 million requests per day.",
        ts: '00:01:42',
    },
    {
        id: 't3',
        speaker: 'Panelist',
        text: "Interesting. Were you the primary architect on that system, or more of a contributor?",
        ts: '00:02:08',
    },
    {
        id: 't4',
        speaker: 'Candidate',
        text: "I was... involved from the early stages. We used a vendor solution for parts of it, and I was more on the integration side. The core infrastructure was handled by the team.",
        ts: '00:02:31',
        flagged: true,
        flagReason: 'Contradicts resume claim of sole architecture ownership',
    },
    {
        id: 't5',
        speaker: 'Panelist',
        text: "So when you say you architected it on your resume, you mean the integration layer specifically?",
        ts: '00:02:55',
    },
];

export const MOCK_TRANSCRIPT_CONTINUATION: TranscriptEntry[] = [
    {
        id: 't6',
        speaker: 'Candidate',
        text: "Right, yes. The integration and the API layer on top. I designed how it plugged into our product infrastructure.",
        ts: '00:03:18',
    },
    {
        id: 't7',
        speaker: 'Panelist',
        text: "Let's pivot — can you design a URL shortener service for 100 million active users? Walk me through data model, caching, and how you'd handle hot URLs.",
        ts: '00:04:02',
    },
    {
        id: 't8',
        speaker: 'Candidate',
        text: "Absolutely. So for the data model — I'd use a key-value store. The shortened code maps to the original URL. For storage I'd choose something like Cassandra or DynamoDB given the write volume. For caching, Redis in front with an LRU policy. Hot URLs are your top 1% driving 80% of traffic, so you pre-warm the cache for those using a background job that monitors click frequency.",
        ts: '00:04:55',
    },
    {
        id: 't9',
        speaker: 'Panelist',
        text: "Good. How do you handle cache invalidation if a URL gets updated or deleted?",
        ts: '00:05:30',
    },
    {
        id: 't10',
        speaker: 'Candidate',
        text: "You'd TTL everything in Redis — short TTLs for mutable URLs. On update, you'd publish an event to a message queue, and a cache invalidation consumer clears the key. For deleted URLs you return 410 Gone instead of 404 so downstream systems know it's intentional.",
        ts: '00:06:02',
    },
];

