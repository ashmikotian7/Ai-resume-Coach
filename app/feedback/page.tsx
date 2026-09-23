"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Source_Serif_4, IBM_Plex_Mono, Inter } from "next/font/google";

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});
const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

type ReportType = "scan" | "interview" | "cover-letter";

interface QuestionFeedback {
  question: string;
  candidate_answer: string;
  score: number;
  star_adherence: "strong" | "partial" | "weak";
  strengths: string[];
  improvement_tips: string[];
  ideal_answer_summary: string;
}

interface Report {
  id: string;
  type: ReportType;
  title: string;
  date: string;
  score: number;
  delta: number;
  summary: string;
  details: { label: string; note: string; status: "pass" | "warn" | "fail" }[];
  interview_metrics?: {
    clarity_score: number;
    star_score: number;
    depth_score: number;
  };
  question_feedbacks?: QuestionFeedback[];
}

const DEFAULT_REPORTS: Report[] = [
  {
    id: "r5",
    type: "scan",
    title: "Resume scan — Product Manager, Acme Inc.",
    date: "Aug 2, 2026",
    score: 91,
    delta: 23,
    summary:
      "Strong match. Keyword coverage and structure both clean — this version is ready to send.",
    details: [
      { label: "Keyword coverage", note: "7 of 8 target terms present", status: "pass" },
      { label: "File structure", note: "No tables or text boxes detected", status: "pass" },
      { label: "Bullet strength", note: "All bullets lead with measurable outcomes", status: "pass" },
      { label: "Length", note: "1 page — appropriate for experience level", status: "pass" },
    ],
  },
  {
    id: "r4",
    type: "interview",
    title: "Mock interview — Senior Product Manager",
    date: "Jul 30, 2026",
    score: 78,
    delta: 9,
    summary:
      "Solid domain foundation. Responses showed clear technical ownership, with consistent situational structure. Tighten up two answers where outcomes lacked numerical baselines.",
    details: [
      { label: "Structure (STAR)", note: "Used consistently across 4 of 5 answers", status: "pass" },
      { label: "Specificity", note: "Q3 answer lacked a measurable result", status: "warn" },
      { label: "Conciseness", note: "Delivery remained within target 90s pacing", status: "pass" },
      { label: "Confidence markers", note: "No hedging or filler language detected", status: "pass" },
    ],
    interview_metrics: {
      clarity_score: 84,
      star_score: 76,
      depth_score: 75,
    },
    question_feedbacks: [
      {
        question: "Walk me through the most technically challenging initiative on your resume. What trade-offs did you evaluate?",
        candidate_answer: "Led the migration from our legacy monolithic backend to microservices. We chose Go over Node to optimize throughput and cut p99 latency.",
        score: 85,
        star_adherence: "strong",
        strengths: ["Clear architectural justification", "Directly stated tool tradeoff"],
        improvement_tips: ["State the baseline p99 latency versus the final metric drop"],
        ideal_answer_summary: "Frame the business impetus, discuss architectural choices evaluated, and quantify performance gains.",
      },
      {
        question: "Can you detail a quantifiable metric you achieved and explain your individual contribution?",
        candidate_answer: "Reduced process turnaround by 34% by establishing automated CI/CD pipelines across 6 engineering squads.",
        score: 82,
        star_adherence: "strong",
        strengths: ["Clear quantifiable metric (34%)", "Distinct scope (6 squads)"],
        improvement_tips: ["Mention how you handled rollout resistance and regression prevention"],
        ideal_answer_summary: "Explain baseline turnaround, team collaboration, and automation safeguards.",
      },
      {
        question: "Describe a situation where a stakeholder disagreed with your technical direction. How did you resolve it?",
        candidate_answer: "The marketing director wanted a feature launched earlier without load testing. We talked about it and decided to run tests first.",
        score: 68,
        star_adherence: "partial",
        strengths: ["Addressed conflict directly"],
        improvement_tips: ["Use data or compromise to explain how you persuaded the stakeholder", "Specify risk impact that justified the delay"],
        ideal_answer_summary: "Demonstrate empathetic listening, provide empirical risk data, and propose an MVP compromise.",
      },
    ],
  },
  {
    id: "r3",
    type: "cover-letter",
    title: "Cover letter — Product Manager, Acme Inc.",
    date: "Jul 30, 2026",
    score: 82,
    delta: 82,
    summary:
      "Clear and specific to the role. Closing paragraph is slightly generic — could reference the company more directly.",
    details: [
      { label: "Role-specific detail", note: "References 2 of 3 posting requirements", status: "pass" },
      { label: "Opening line", note: "Avoids generic 'I am writing to apply'", status: "pass" },
      { label: "Closing paragraph", note: "Reads as generic, no company-specific detail", status: "warn" },
      { label: "Length", note: "280 words — within ideal range", status: "pass" },
    ],
  },
  {
    id: "r2",
    type: "scan",
    title: "Resume scan — Product Manager, Acme Inc.",
    date: "Jul 24, 2026",
    score: 68,
    delta: 12,
    summary:
      "Above average, but four keyword gaps and one structural issue are likely filtering this out early.",
    details: [
      { label: "Keyword coverage", note: "4 of 8 target terms present", status: "warn" },
      { label: "File structure", note: "Table detected in skills section", status: "fail" },
      { label: "Bullet strength", note: "3 bullets lack measurable outcomes", status: "warn" },
      { label: "Length", note: "1 page — appropriate for experience level", status: "pass" },
    ],
  },
];

const TYPE_META: Record<ReportType, { label: string; href: string }> = {
  scan: { label: "ATS Scan", href: "/ats" },
  interview: { label: "Interview", href: "/mock-interview" },
  "cover-letter": { label: "Cover Letter", href: "/cover-letter" },
};

const STATUS_STYLES: Record<"pass" | "warn" | "fail", { dot: string; text: string; label: string }> = {
  pass: { dot: "bg-[#4CAF6E]", text: "text-[#2F6B45]", label: "Clean" },
  warn: { dot: "bg-[#D7A93E]", text: "text-[#8A6B1F]", label: "Needs attention" },
  fail: { dot: "bg-[#D65A4A]", text: "text-[#9A3B2F]", label: "Blocking issue" },
};

function scoreColor(score: number) {
  if (score >= 85) return "text-[#2F6B45]";
  if (score >= 65) return "text-[#8A6B1F]";
  return "text-[#9A3B2F]";
}

function FeedbackContent() {
  const searchParams = useSearchParams();
  const requestedType = searchParams.get("type") as ReportType | null;

  const [reports, setReports] = useState<Report[]>(DEFAULT_REPORTS);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_REPORTS[0].id);
  const [filter, setFilter] = useState<ReportType | "all">(requestedType || "all");

  // Read latest completed interview evaluation or scan from sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedInterview = window.sessionStorage.getItem("redline_latest_interview_feedback");
        if (storedInterview) {
          const evalData = JSON.parse(storedInterview);
          const liveReport: Report = {
            id: "live-interview-latest",
            type: "interview",
            title: `Mock Interview — ${evalData.role || "Target Role"}`,
            date: evalData.date || "Just now",
            score: evalData.overall_score || 80,
            delta: 14,
            summary: evalData.summary || "Completed live interview session.",
            details: [
              {
                label: "Response Clarity",
                note: `Scored ${evalData.clarity_score || 80}/100 in verbal conciseness`,
                status: (evalData.clarity_score || 80) >= 75 ? "pass" : "warn",
              },
              {
                label: "STAR Adherence",
                note: `Scored ${evalData.star_score || 75}/100 in Situation-Task-Action-Result structure`,
                status: (evalData.star_score || 75) >= 70 ? "pass" : "warn",
              },
              {
                label: "Technical & Metric Depth",
                note: `Scored ${evalData.depth_score || 75}/100 in metric justification`,
                status: (evalData.depth_score || 75) >= 70 ? "pass" : "warn",
              },
            ],
            interview_metrics: {
              clarity_score: evalData.clarity_score || 80,
              star_score: evalData.star_score || 75,
              depth_score: evalData.depth_score || 75,
            },
            question_feedbacks: evalData.question_feedbacks || [],
          };

          setReports((prev) => [liveReport, ...prev.filter((r) => r.id !== "live-interview-latest")]);
          if (requestedType === "interview" || !requestedType) {
            setSelectedId("live-interview-latest");
            setFilter("interview");
          }
        }
      } catch (e) {
        console.warn("Could not parse sessionStorage interview evaluation:", e);
      }
    }
  }, [requestedType]);

  const selected = reports.find((r) => r.id === selectedId) ?? reports[0];
  const filtered = filter === "all" ? reports : reports.filter((r) => r.type === filter);

  const scanScores = reports.filter((r) => r.type === "scan").map((r) => r.score);
  const bestScan = scanScores.length > 0 ? Math.max(...scanScores) : 91;
  const firstScan = scanScores.length > 0 ? scanScores[scanScores.length - 1] : 68;

  return (
    <div
      className={`${sans.variable} ${serif.variable} ${mono.variable} min-h-screen bg-[#F6F5F1] font-[family-name:var(--font-sans)] text-[#14171F] antialiased`}
    >
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-[#DBD8CE] bg-[#F6F5F1]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-serif)] text-lg font-semibold tracking-tight"
          >
            Redline<span className="text-[#8A8F99]">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="font-[family-name:var(--font-mono)] text-[13px] text-[#4A4F58] transition-colors hover:text-[#14171F]"
            >
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="rounded-sm bg-[#14171F] px-4 py-2 font-[family-name:var(--font-mono)] text-[13px] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38]"
            >
              New Scan →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
          Performance Scorecards & History
        </span>
        <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight sm:text-4xl">
          Actionable feedback that actually moves the needle.
        </h1>

        {/* SUMMARY STRIP */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-sm">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
              Best ATS Match Score
            </span>
            <div className={`mt-2 font-[family-name:var(--font-mono)] text-3xl font-semibold ${scoreColor(bestScan)}`}>
              {bestScan}
            </div>
            <p className="mt-1 text-[12px] text-[#8A8F99]">Top score across resume iterations</p>
          </div>
          <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-sm">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
              Net Score Improvement
            </span>
            <div className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-semibold text-[#2F6B45]">
              +{Math.max(0, bestScan - firstScan)} pts
            </div>
            <p className="mt-1 text-[12px] text-[#8A8F99]">Measured impact of X-Y-Z rewrites</p>
          </div>
          <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-sm">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
              Evaluations on File
            </span>
            <div className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-semibold text-[#14171F]">
              {reports.length}
            </div>
            <p className="mt-1 text-[12px] text-[#8A8F99]">Scans, interviews, &amp; cover letters</p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[330px_1fr]">
          {/* HISTORY LIST */}
          <div>
            {/* Filter tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "interview", label: "Interviews" },
                  { id: "scan", label: "Scans" },
                  { id: "cover-letter", label: "Letters" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] transition-colors ${
                    filter === f.id
                      ? "border-[#14171F] bg-[#14171F] text-[#F6F5F1]"
                      : "border-[#DBD8CE] bg-white text-[#4A4F58] hover:border-[#B7B4A9]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2.5">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`block w-full rounded-sm border px-4 py-3.5 text-left transition-colors ${
                    selectedId === r.id
                      ? "border-[#14171F] bg-white shadow-sm ring-1 ring-[#14171F]"
                      : "border-[#DBD8CE] bg-white hover:border-[#B7B4A9]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[#8A8F99]">
                        {TYPE_META[r.type].label} · {r.date}
                      </span>
                      <p className="mt-1 truncate text-[13.5px] font-medium text-[#14171F]">
                        {r.title}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 font-[family-name:var(--font-mono)] text-lg font-semibold ${scoreColor(
                        r.score
                      )}`}
                    >
                      {r.score}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* DETAIL SCORECARD PANEL */}
          <div className="rounded-sm border border-[#DBD8CE] bg-white p-7 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                  {TYPE_META[selected.type].label} · {selected.date}
                </span>
                <h2 className="mt-1.5 font-[family-name:var(--font-serif)] text-2xl font-semibold tracking-tight">
                  {selected.title}
                </h2>
              </div>
              <Link
                href={TYPE_META[selected.type].href}
                className="shrink-0 rounded-sm border border-[#DBD8CE] px-4 py-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#14171F] transition-colors hover:border-[#14171F]"
              >
                Run New {TYPE_META[selected.type].label} →
              </Link>
            </div>

            {/* Overall Score Row */}
            <div className="mt-6 flex flex-wrap items-center gap-6 border-y border-[#F0EEE7] py-5">
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-[family-name:var(--font-mono)] text-5xl font-semibold ${scoreColor(
                    selected.score
                  )}`}
                >
                  {selected.score}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-base text-[#8A8F99]">
                  / 100
                </span>
              </div>
              {selected.delta > 0 && (
                <span className="font-[family-name:var(--font-mono)] text-[12px] text-[#2F6B45]">
                  ↑ +{selected.delta} vs. initial attempt
                </span>
              )}
              <div className="ml-auto flex items-center gap-3">
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#8A8F99]">
                  Benchmark
                </span>
                <div className="h-2 w-32 overflow-hidden rounded-full bg-[#EDEBE3]">
                  <div
                    className="h-full rounded-full bg-[#D7FF3E]"
                    style={{ width: `${selected.score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* INTERVIEW RIGOR METRICS BAR (If interview) */}
            {selected.type === "interview" && selected.interview_metrics && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-sm border border-[#DBD8CE] bg-[#F6F5F1] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[#6B6F79]">
                      Response Clarity
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[12px] font-semibold text-[#14171F]">
                      {selected.interview_metrics.clarity_score}/100
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#DBD8CE]">
                    <div
                      className="h-full bg-[#14171F]"
                      style={{ width: `${selected.interview_metrics.clarity_score}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-sm border border-[#DBD8CE] bg-[#F6F5F1] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[#6B6F79]">
                      STAR Adherence
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[12px] font-semibold text-[#14171F]">
                      {selected.interview_metrics.star_score}/100
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#DBD8CE]">
                    <div
                      className="h-full bg-[#D7FF3E]"
                      style={{ width: `${selected.interview_metrics.star_score}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-sm border border-[#DBD8CE] bg-[#F6F5F1] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[#6B6F79]">
                      Technical &amp; Metric Depth
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[12px] font-semibold text-[#14171F]">
                      {selected.interview_metrics.depth_score}/100
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#DBD8CE]">
                    <div
                      className="h-full bg-[#14171F]"
                      style={{ width: `${selected.interview_metrics.depth_score}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Executive Summary */}
            <div className="mt-6">
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
                Executive Assessment
              </span>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#4A4F58]">
                {selected.summary}
              </p>
            </div>

            {/* QUESTION-BY-QUESTION BREAKDOWN (If interview has questions) */}
            {selected.type === "interview" &&
              selected.question_feedbacks &&
              selected.question_feedbacks.length > 0 && (
                <div className="mt-8 border-t border-[#F0EEE7] pt-6">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                    Question-by-Question Coaching Tips
                  </span>
                  <div className="mt-4 space-y-4">
                    {selected.question_feedbacks.map((q, idx) => (
                      <div
                        key={idx}
                        className="rounded-sm border border-[#DBD8CE] bg-[#F6F5F1]/50 p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-[family-name:var(--font-serif)] text-[15px] font-semibold text-[#14171F]">
                            Q{idx + 1}: {q.question}
                          </p>
                          <span
                            className={`shrink-0 rounded px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10.5px] uppercase ${
                              q.star_adherence === "strong"
                                ? "bg-[#D7FF3E]/30 text-[#14171F] font-medium"
                                : q.star_adherence === "partial"
                                ? "bg-[#FBF6EA] text-[#8A6B1F]"
                                : "bg-[#FBEAEA] text-[#9A3B2F]"
                            }`}
                          >
                            STAR: {q.star_adherence}
                          </span>
                        </div>

                        {q.candidate_answer && (
                          <div className="mt-3 rounded bg-white p-3 border border-[#E5E2D8] text-[13.5px] leading-relaxed text-[#4A4F58]">
                            <span className="block font-[family-name:var(--font-mono)] text-[10px] uppercase text-[#8A8F99] mb-1">
                              Your Response:
                            </span>
                            &ldquo;{q.candidate_answer}&rdquo;
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded border border-[#E5E2D8] bg-white p-3">
                            <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.06em] text-[#2F6B45]">
                              ✓ Key Strengths
                            </span>
                            <ul className="mt-1.5 space-y-1 text-[12.5px] text-[#4A4F58]">
                              {q.strengths.map((str, i) => (
                                <li key={i}>• {str}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded border border-[#E5E2D8] bg-white p-3">
                            <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.06em] text-[#B5563E]">
                              ↑ Coaching &amp; Improvements
                            </span>
                            <ul className="mt-1.5 space-y-1 text-[12.5px] text-[#4A4F58]">
                              {q.improvement_tips.map((tip, i) => (
                                <li key={i}>• {tip}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {q.ideal_answer_summary && (
                          <p className="mt-3 font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                            <strong>Ideal Delivery:</strong> {q.ideal_answer_summary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Standard audit checklist details (for scans / letters) */}
            {selected.type !== "interview" && (
              <div className="mt-8 border-t border-[#F0EEE7] pt-6 space-y-3">
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                  Audit Breakdown
                </span>
                {selected.details.map((d) => {
                  const style = STATUS_STYLES[d.status];
                  return (
                    <div
                      key={d.label}
                      className="flex items-center justify-between border-b border-[#F0EEE7] pb-3 last:border-none last:pb-0"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-[#14171F]">{d.label}</p>
                        <p className="mt-0.5 text-[13px] text-[#8A8F99]">{d.note}</p>
                      </div>
                      <span
                        className={`flex shrink-0 items-center gap-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] ${style.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {style.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F5F1] p-12 text-center font-[family-name:var(--font-mono)] text-sm text-[#8A8F99]">
          Loading performance scorecards…
        </div>
      }
    >
      <FeedbackContent />
    </Suspense>
  );
}