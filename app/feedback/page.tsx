"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/navbar/Header";
import Footer from "@/components/common/Footer";

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
    title: "Resume Scan — Senior Product Manager",
    date: "Aug 2, 2026",
    score: 91,
    delta: 23,
    summary:
      "Strong match. Keyword coverage and structure both clean — this version is ready for submission to enterprise ATS filters.",
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
    title: "Mock Interview — Senior Product Manager",
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
        question: "How did you handle the situation where engineering and executive stakeholders disagreed on the Q3 roadmap priority?",
        candidate_answer: "I set up a meeting with both parties and shared customer data showing why the feature was needed.",
        score: 70,
        star_adherence: "partial",
        strengths: ["Data-backed mediation approach"],
        improvement_tips: ["Highlight the exact tradeoff compromise reached and the resulting business impact"],
        ideal_answer_summary: "Detail the specific conflicting priorities, the framework used to align on ROI, and the quantifiable outcome.",
      },
    ],
  },
  {
    id: "r3",
    type: "cover-letter",
    title: "Cover Letter — Senior Product Manager, Stripe",
    date: "Jul 28, 2026",
    score: 88,
    delta: 12,
    summary:
      "High alignment. The opening hook directly ties your past scaling experience to the company's stated quarterly infrastructure goals.",
    details: [
      { label: "Hook strength", note: "Clear value proposition in opening paragraph", status: "pass" },
      { label: "Metric proof points", note: "3 quantifiable achievements embedded", status: "pass" },
      { label: "Strategic tone", note: "Executive & outcome-driven phrasing", status: "pass" },
      { label: "Length & formatting", note: "380 words — ideal concise length", status: "pass" },
    ],
  },
];

const TYPE_META: Record<ReportType, { label: string; href: string }> = {
  scan: { label: "ATS Scan", href: "/ats" },
  interview: { label: "Interview", href: "/mock-interview" },
  "cover-letter": { label: "Cover Letter", href: "/cover-letter" },
};

const STATUS_STYLES: Record<"pass" | "warn" | "fail", { dot: string; text: string; label: string }> = {
  pass: { dot: "bg-emerald-500", text: "text-emerald-800", label: "Clean" },
  warn: { dot: "bg-amber-500", text: "text-amber-800", label: "Needs attention" },
  fail: { dot: "bg-red-500", text: "text-red-800", label: "Blocking issue" },
};

function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-800";
  if (score >= 65) return "text-amber-800";
  return "text-red-800";
}

function FeedbackContent() {
  const searchParams = useSearchParams();
  const requestedType = searchParams.get("type") as ReportType | null;

  const [reports, setReports] = useState<Report[]>(DEFAULT_REPORTS);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_REPORTS[0].id);
  const [filter, setFilter] = useState<ReportType | "all">(requestedType || "all");

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
    <div className="min-h-screen bg-[#F6F5F1] text-[#14171F] flex flex-col justify-between print:bg-white">
      <div className="no-print">
        <Header />
      </div>

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-10 flex-grow">
        <div className="border-b border-[#DBD8CE]/80 pb-6 mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                Continuous Improvement
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#D7FF3E]" />
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#5A606D]">
                Scorecards &amp; Feedback Logs
              </span>
            </div>
            <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight sm:text-4xl text-[#14171F]">
              Actionable feedback that actually moves the needle.
            </h1>
          </div>
          <Link
            href="/upload"
            className="no-print rounded-sm bg-[#14171F] px-5 py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-wider text-[#F6F5F1] font-semibold hover:bg-[#2A2E38]"
          >
            + New Scan
          </Link>
        </div>

        {/* SUMMARY STRIP */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-xs">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99] font-bold">
              Best ATS Match Score
            </span>
            <div className={`mt-2 font-[family-name:var(--font-mono)] text-3xl font-bold ${scoreColor(bestScan)}`}>
              {bestScan}
            </div>
            <p className="mt-1 text-[12px] text-[#8A8F99]">Top score across resume iterations</p>
          </div>
          <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-xs">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99] font-bold">
              Net Score Improvement
            </span>
            <div className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-bold text-emerald-800">
              +{Math.max(0, bestScan - firstScan)} pts
            </div>
            <p className="mt-1 text-[12px] text-[#8A8F99]">Measured impact of X-Y-Z rewrites</p>
          </div>
          <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-xs">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99] font-bold">
              Evaluations on File
            </span>
            <div className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-bold text-[#14171F]">
              {reports.length}
            </div>
            <p className="mt-1 text-[12px] text-[#8A8F99]">Scans, interviews, &amp; cover letters</p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[330px_1fr]">
          {/* HISTORY LIST */}
          <div className="no-print">
            {/* Filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-3">
              {(["all", "scan", "interview", "cover-letter"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilter(t)}
                  className={`rounded-sm px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] transition-colors ${
                    filter === t
                      ? "bg-[#14171F] text-[#F6F5F1] font-semibold"
                      : "border border-[#DBD8CE] bg-white text-[#4A4F58] hover:border-[#14171F]"
                  }`}
                >
                  {t === "all" ? "All" : TYPE_META[t].label}
                </button>
              ))}
            </div>

            <div className="mt-2 space-y-2">
              {filtered.map((r) => {
                const isSelected = r.id === selectedId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full rounded-sm border p-4 text-left transition-all ${
                      isSelected
                        ? "border-[#14171F] bg-white shadow-sm ring-1 ring-[#14171F]"
                        : "border-[#DBD8CE] bg-white/70 hover:bg-white hover:border-[#B7B4A9]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.1em] text-[#8A8F99] font-bold">
                        {TYPE_META[r.type].label}
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                        {r.date}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-[13.5px] text-[#14171F] line-clamp-1">
                      {r.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={`font-[family-name:var(--font-mono)] text-lg font-bold ${scoreColor(r.score)}`}
                      >
                        {r.score}
                        <span className="text-[11px] font-normal text-[#8A8F99]"> /100</span>
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-[11px] font-bold text-emerald-800">
                        +{r.delta} pts
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* REPORT DETAILS PANE */}
          <div className="rounded-sm border border-[#DBD8CE] bg-white p-7 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#F0EEE7] pb-5">
              <div>
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99] font-bold">
                  {TYPE_META[selected.type].label} Scorecard
                </span>
                <h2 className="mt-1 font-[family-name:var(--font-serif)] text-2xl font-bold tracking-tight text-[#14171F]">
                  {selected.title}
                </h2>
                <p className="mt-1 font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
                  Evaluated on {selected.date}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div
                    className={`font-[family-name:var(--font-mono)] text-4xl font-bold ${scoreColor(selected.score)}`}
                  >
                    {selected.score}
                    <span className="text-base font-normal text-[#8A8F99]"> /100</span>
                  </div>
                  <span className="font-[family-name:var(--font-mono)] text-[11.5px] font-bold text-emerald-800">
                    +{selected.delta} pts improvement
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6">
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99] font-bold">
                Executive Synthesis
              </span>
              <p className="mt-2 text-[15px] leading-relaxed text-[#4A4F58]">
                {selected.summary}
              </p>
            </div>

            {/* If interview -> show sub-metrics and per-question STAR breakdown */}
            {selected.type === "interview" && selected.interview_metrics && (
              <div className="mt-8 border-t border-[#F0EEE7] pt-6">
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99] font-bold">
                  STAR Rubric Breakdown
                </span>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-sm border border-[#DBD8CE] bg-[#FAF9F5] p-4 text-center">
                    <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase text-[#6B6F79]">
                      Verbal Clarity
                    </span>
                    <div className="mt-1 font-[family-name:var(--font-mono)] text-2xl font-bold text-[#14171F]">
                      {selected.interview_metrics.clarity_score}%
                    </div>
                  </div>
                  <div className="rounded-sm border border-[#DBD8CE] bg-[#FAF9F5] p-4 text-center">
                    <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase text-[#6B6F79]">
                      STAR Adherence
                    </span>
                    <div className="mt-1 font-[family-name:var(--font-mono)] text-2xl font-bold text-[#14171F]">
                      {selected.interview_metrics.star_score}%
                    </div>
                  </div>
                  <div className="rounded-sm border border-[#DBD8CE] bg-[#FAF9F5] p-4 text-center">
                    <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase text-[#6B6F79]">
                      Metric Depth
                    </span>
                    <div className="mt-1 font-[family-name:var(--font-mono)] text-2xl font-bold text-[#14171F]">
                      {selected.interview_metrics.depth_score}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Question by question feedback */}
            {selected.type === "interview" &&
              selected.question_feedbacks &&
              selected.question_feedbacks.length > 0 && (
                <div className="mt-8 border-t border-[#F0EEE7] pt-6">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99] font-bold">
                    Per-Question Coaching &amp; STAR Analysis
                  </span>
                  <div className="mt-4 space-y-4">
                    {selected.question_feedbacks.map((q, idx) => (
                      <div
                        key={idx}
                        className="rounded-sm border border-[#DBD8CE] bg-[#FAF9F5] p-5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-[family-name:var(--font-serif)] text-[15.5px] font-bold text-[#14171F]">
                            Q{idx + 1}: {q.question}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10.5px] uppercase font-bold ${
                              q.star_adherence === "strong"
                                ? "bg-emerald-100 text-emerald-800"
                                : q.star_adherence === "partial"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            STAR: {q.star_adherence}
                          </span>
                        </div>

                        {q.candidate_answer && (
                          <div className="mt-3 rounded-sm bg-white p-3.5 border border-[#DBD8CE] text-[13.5px] leading-relaxed text-[#4A4F58]">
                            <span className="block font-[family-name:var(--font-mono)] text-[10px] uppercase text-[#8A8F99] font-bold mb-1">
                              Your Spoken / Typed Response:
                            </span>
                            &ldquo;{q.candidate_answer}&rdquo;
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-sm border border-emerald-200 bg-white p-3">
                            <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.06em] text-emerald-800 font-bold block mb-1">
                              ✓ Demonstrated Strengths
                            </span>
                            <ul className="space-y-1 text-[12.5px] text-[#4A4F58]">
                              {q.strengths.map((str, i) => (
                                <li key={i}>• {str}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-sm border border-amber-200 bg-white p-3">
                            <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.06em] text-amber-900 font-bold block mb-1">
                              ↑ Coaching &amp; Precision Fixes
                            </span>
                            <ul className="space-y-1 text-[12.5px] text-[#4A4F58]">
                              {q.improvement_tips.map((tip, i) => (
                                <li key={i}>• {tip}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {q.ideal_answer_summary && (
                          <p className="mt-3 font-[family-name:var(--font-mono)] text-[11.5px] text-[#6B7280]">
                            <strong>Target Delivery:</strong> {q.ideal_answer_summary}
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
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99] font-bold">
                  Audit Criteria Verification
                </span>
                {selected.details.map((d) => {
                  const style = STATUS_STYLES[d.status];
                  return (
                    <div
                      key={d.label}
                      className="flex items-center justify-between border-b border-[#F0EEE7] pb-3 last:border-none last:pb-0"
                    >
                      <div>
                        <p className="text-[14px] font-semibold text-[#14171F]">{d.label}</p>
                        <p className="mt-0.5 text-[13px] text-[#6B7280]">{d.note}</p>
                      </div>
                      <span
                        className={`flex shrink-0 items-center gap-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] font-semibold ${style.text}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${style.dot}`} />
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

      <div className="no-print">
        <Footer />
      </div>
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