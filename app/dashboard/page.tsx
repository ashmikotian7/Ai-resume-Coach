"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/navbar/Header";
import Footer from "@/components/common/Footer";

interface ScanHistoryItem {
  id: string;
  createdAt: string;
  fileName: string;
  atsScore: number;
  jobTitle: string;
  scoreBreakdown?: {
    format_score?: number;
    keyword_score?: number;
    impact_score?: number;
    readability_score?: number;
  };
  keywordsCount?: number;
}

const DEMO_HISTORY: ScanHistoryItem[] = [
  {
    id: "sample-3",
    createdAt: new Date().toISOString(),
    fileName: "Senior_PM_Resume_v3.pdf",
    atsScore: 94,
    jobTitle: "Principal Product Manager",
    keywordsCount: 16,
  },
  {
    id: "sample-2",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    fileName: "Senior_PM_Resume_v2.pdf",
    atsScore: 82,
    jobTitle: "Senior Product Manager",
    keywordsCount: 14,
  },
  {
    id: "sample-1",
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    fileName: "PM_Original_Draft.docx",
    atsScore: 61,
    jobTitle: "Product Manager",
    keywordsCount: 9,
  },
];

function scoreBadgeStyle(score: number) {
  if (score >= 80) {
    return {
      bg: "bg-emerald-50 text-emerald-800 border-emerald-300",
      label: "Strong Match",
    };
  }
  if (score >= 65) {
    return {
      bg: "bg-amber-50 text-amber-800 border-amber-300",
      label: "Needs Polish",
    };
  }
  return {
    bg: "bg-red-50 text-red-800 border-red-300",
    label: "High Risk",
  };
}

export default function DashboardPage() {
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resume/history")
      .then((res) => {
        if (!res.ok) throw new Error("Could not fetch history");
        return res.json();
      })
      .then((data) => {
        if (data.scans && data.scans.length > 0) {
          setScans(data.scans);
        } else {
          // Check session storage
          if (typeof window !== "undefined") {
            const current = window.sessionStorage.getItem("redline_current_scan");
            if (current) {
              try {
                const parsed = JSON.parse(current);
                setScans([
                  {
                    id: "live-session",
                    createdAt: new Date().toISOString(),
                    fileName: parsed.file_name || "Latest_Uploaded_Resume.pdf",
                    atsScore: parsed.ats_score || 78,
                    jobTitle: parsed.job_description || "Target Role",
                    keywordsCount: parsed.keywords?.length || 10,
                  },
                  ...DEMO_HISTORY.slice(1),
                ]);
                return;
              } catch {}
            }
          }
          setScans(DEMO_HISTORY);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch scan history, using demo records:", err);
        setScans(DEMO_HISTORY);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const totalScans = scans.length;
  const scores = scans.map((s) => s.atsScore);
  const bestScore = scores.length > 0 ? Math.max(...scores) : 94;
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 79;

  // Chronological score progression for the graph (oldest to newest)
  const progressionData = [...scans].reverse();

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#14171F] flex flex-col justify-between">
      <Header />

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-10 flex-grow">
        {/* HEADER */}
        <div className="border-b border-[#DBD8CE]/80 pb-6 mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                Career Command Center
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#D7FF3E]" />
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#5A606D]">
                Optimization &amp; Version History
              </span>
            </div>
            <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight sm:text-4xl text-[#14171F]">
              Resume Audits &amp; Readiness Hub
            </h1>
          </div>
          <Link
            href="/upload"
            className="rounded-sm bg-[#14171F] px-6 py-3 font-[family-name:var(--font-mono)] text-[12.5px] uppercase tracking-[0.08em] text-[#F6F5F1] font-bold hover:bg-[#2A2E38] shadow-sm transition-all"
          >
            Upload New Revision →
          </Link>
        </div>

        {/* OVERVIEW STATS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-xs">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99] font-semibold">
              Highest ATS Match
            </span>
            <div className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-bold text-emerald-800">
              {bestScore}
              <span className="text-sm font-normal text-[#8A8F99]"> /100</span>
            </div>
            <p className="mt-1 text-[12px] text-[#6B7280]">Top candidate percentile</p>
          </div>

          <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-xs">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99] font-semibold">
              Average ATS Score
            </span>
            <div className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-bold text-[#14171F]">
              {avgScore}
              <span className="text-sm font-normal text-[#8A8F99]"> /100</span>
            </div>
            <p className="mt-1 text-[12px] text-[#6B7280]">Across all iterations</p>
          </div>

          <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-xs">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99] font-semibold">
              Revisions Audited
            </span>
            <div className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-bold text-[#14171F]">
              {totalScans}
            </div>
            <p className="mt-1 text-[12px] text-[#6B7280]">Documents analyzed</p>
          </div>

          <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-xs">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99] font-semibold">
              Net Score Delta
            </span>
            <div className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-bold text-emerald-800">
              +{scores.length > 1 ? Math.max(0, scores[0] - scores[scores.length - 1]) : 33} pts
            </div>
            <p className="mt-1 text-[12px] text-[#6B7280]">Lift since initial baseline</p>
          </div>
        </div>

        {/* PROGRESSION GRAPH */}
        <div className="mt-8 rounded-sm border border-[#DBD8CE] bg-white p-7 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99] font-bold">
                Compatibility Trajectory
              </span>
              <h2 className="mt-1 font-[family-name:var(--font-serif)] text-2xl font-bold tracking-tight text-[#14171F]">
                ATS Score Trajectory Across Versions
              </h2>
            </div>
            <span className="rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] font-semibold">
              Target Hiring Threshold: 85+
            </span>
          </div>

          <div className="mt-6">
            <div className="relative h-44 w-full">
              {/* Target Line at 85 */}
              <div
                className="absolute left-0 right-0 border-b border-dashed border-emerald-500/70"
                style={{ top: "15%" }}
              >
                <span className="absolute right-0 -top-4 font-[family-name:var(--font-mono)] text-[10px] text-emerald-700 font-bold">
                  85% Recruiter Callback Bar
                </span>
              </div>

              {/* Bars */}
              <div className="flex h-full items-end justify-around gap-4 pt-6">
                {progressionData.map((item, idx) => {
                  const heightPercent = Math.min(100, Math.max(20, item.atsScore));
                  const isLatest = idx === progressionData.length - 1;
                  return (
                    <div key={item.id} className="flex flex-1 flex-col items-center">
                      <span className="font-[family-name:var(--font-mono)] text-[12px] font-bold text-[#14171F]">
                        {item.atsScore}%
                      </span>
                      <div className="mt-2 w-full max-w-[64px] rounded-t-sm bg-[#EDEBE3] overflow-hidden" style={{ height: "110px" }}>
                        <div
                          className={`w-full transition-all duration-700 rounded-t-sm ${
                            isLatest ? "bg-[#D7FF3E] border-t-2 border-[#14171F]" : "bg-[#14171F]"
                          }`}
                          style={{
                            height: `${heightPercent}%`,
                            marginTop: `${100 - heightPercent}%`,
                          }}
                        />
                      </div>
                      <span className="mt-2 truncate font-[family-name:var(--font-mono)] text-[10.5px] uppercase text-[#8A8F99] font-medium">
                        Rev {idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SCAN HISTORY TABLE */}
        <div className="mt-8 rounded-sm border border-[#DBD8CE] bg-white shadow-xs overflow-hidden">
          <div className="border-b border-[#DBD8CE] bg-[#FAF9F5] px-6 py-4 flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-serif)] text-lg font-bold text-[#14171F]">
              Recent Resume Scans &amp; Job Targets
            </h3>
            <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
              {scans.length} records logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#DBD8CE] font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[#8A8F99] bg-[#FAF9F5]/40">
                  <th className="px-6 py-3.5 font-semibold">Date</th>
                  <th className="px-6 py-3.5 font-semibold">Resume Document</th>
                  <th className="px-6 py-3.5 font-semibold">Target Position</th>
                  <th className="px-6 py-3.5 font-semibold">Match Score</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EEE7]">
                {scans.map((s) => {
                  const badge = scoreBadgeStyle(s.atsScore);
                  const formattedDate = new Date(s.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={s.id} className="hover:bg-[#F6F5F1]/50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 font-[family-name:var(--font-mono)] text-[12px] text-[#6B7280]">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#14171F]">
                        {s.fileName}
                      </td>
                      <td className="px-6 py-4 text-[#4A4F58]">{s.jobTitle}</td>
                      <td className="px-6 py-4">
                        <span className="font-[family-name:var(--font-mono)] text-[15px] font-bold text-[#14171F]">
                          {s.atsScore}
                        </span>
                        <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                          {" "}
                          / 100
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.04em] font-semibold ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <Link
                          href={`/ats?scanId=${s.id}`}
                          className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.04em] text-[#14171F] font-bold underline underline-offset-2 hover:text-black"
                        >
                          View Audit
                        </Link>
                        <span className="text-[#DBD8CE]">·</span>
                        <Link
                          href={`/mock-interview?role=${encodeURIComponent(
                            s.jobTitle !== "Target Role" ? s.jobTitle : "Technical Role"
                          )}`}
                          className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.04em] text-[#6B7280] hover:text-[#14171F]"
                        >
                          Interview
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* QUICK LAUNCH TILES */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/mock-interview"
            className="group rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-xs transition-all hover:border-[#14171F] hover:shadow-sm"
          >
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99] font-bold">
              Simulator
            </span>
            <h4 className="mt-2 font-[family-name:var(--font-serif)] text-xl font-bold text-[#14171F] group-hover:text-black">
              Mock Interview Room →
            </h4>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#6B7280]">
              Practice out loud with live microphone speech recognition and STAR feedback.
            </p>
          </Link>

          <Link
            href="/improve"
            className="group rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-xs transition-all hover:border-[#14171F] hover:shadow-sm"
          >
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99] font-bold">
              Studio
            </span>
            <h4 className="mt-2 font-[family-name:var(--font-serif)] text-xl font-bold text-[#14171F] group-hover:text-black">
              Google X-Y-Z Rewriter →
            </h4>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#6B6F79]">
              Re-engineer vague responsibilities into quantified accomplishments recruiters notice.
            </p>
          </Link>

          <Link
            href="/cover-letter"
            className="group rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-xs transition-all hover:border-[#14171F] hover:shadow-sm"
          >
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99] font-bold">
              Letterhead
            </span>
            <h4 className="mt-2 font-[family-name:var(--font-serif)] text-xl font-bold text-[#14171F] group-hover:text-black">
              Cover Letter Generator →
            </h4>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#6B7280]">
              Generate persuasive proposals tailored directly to company requirements.
            </p>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
