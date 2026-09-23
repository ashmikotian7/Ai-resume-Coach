"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

function scoreBadgeStyle(score: number) {
  if (score >= 80) {
    return {
      bg: "bg-[#2F6B45]/10 text-[#2F6B45] border-[#2F6B45]/30",
      label: "Strong Match",
    };
  }
  if (score >= 65) {
    return {
      bg: "bg-[#8A6B1F]/10 text-[#8A6B1F] border-[#8A6B1F]/30",
      label: "Needs Polish",
    };
  }
  return {
    bg: "bg-[#9A3B2F]/10 text-[#9A3B2F] border-[#9A3B2F]/30",
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
        if (data.scans) {
          setScans(data.scans);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch scan history, using fallback:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const totalScans = scans.length;
  const scores = scans.map((s) => s.atsScore);
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  // Chronological score progression for the graph (oldest to newest)
  const progressionData = [...scans].reverse();

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
              href="/ats"
              className="font-[family-name:var(--font-mono)] text-[13px] text-[#4A4F58] transition-colors hover:text-[#14171F]"
            >
              ATS Scanner
            </Link>
            <Link
              href="/mock-interview"
              className="font-[family-name:var(--font-mono)] text-[13px] text-[#4A4F58] transition-colors hover:text-[#14171F]"
            >
              Mock Interview
            </Link>
            <Link
              href="/cover-letter"
              className="font-[family-name:var(--font-mono)] text-[13px] text-[#4A4F58] transition-colors hover:text-[#14171F]"
            >
              Cover Letters
            </Link>
            <Link
              href="/upload"
              className="rounded-sm bg-[#14171F] px-4 py-2 font-[family-name:var(--font-mono)] text-[13px] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38]"
            >
              + Scan Resume
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
              Career Command Center
            </span>
            <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight sm:text-4xl">
              Resume Audits &amp; Optimization Hub
            </h1>
          </div>
          <Link
            href="/upload"
            className="rounded-sm bg-[#14171F] px-6 py-3 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38]"
          >
            Upload New Revision →
          </Link>
        </div>

        {/* OVERVIEW STATS */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-sm">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
              Highest ATS Match
            </span>
            <div className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-semibold text-[#2F6B45]">
              {bestScore}
              <span className="text-sm font-normal text-[#8A8F99]"> /100</span>
            </div>
            <p className="mt-1 text-[12px] text-[#8A8F99]">Top candidate compatibility</p>
          </div>

          <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-sm">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
              Average ATS Score
            </span>
            <div className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-semibold text-[#14171F]">
              {avgScore}
              <span className="text-sm font-normal text-[#8A8F99]"> /100</span>
            </div>
            <p className="mt-1 text-[12px] text-[#8A8F99]">Across all scanned revisions</p>
          </div>

          <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-sm">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
              Revisions Audited
            </span>
            <div className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-semibold text-[#14171F]">
              {totalScans}
            </div>
            <p className="mt-1 text-[12px] text-[#8A8F99]">PDF / DOCX files processed</p>
          </div>

          <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-sm">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
              Net Improvement
            </span>
            <div className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-semibold text-[#2F6B45]">
              +{scores.length > 1 ? Math.max(0, scores[0] - scores[scores.length - 1]) : 25} pts
            </div>
            <p className="mt-1 text-[12px] text-[#8A8F99]">Since baseline version</p>
          </div>
        </div>

        {/* SCORE PROGRESSION GRAPH */}
        <div className="mt-8 rounded-sm border border-[#DBD8CE] bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                Score Trajectory
              </span>
              <h2 className="mt-1 font-[family-name:var(--font-serif)] text-2xl font-semibold tracking-tight">
                ATS Compatibility Progression
              </h2>
            </div>
            <span className="rounded-sm bg-[#EDEBE3] px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] text-[#6B6F79]">
              Target Hiring Bar: 85+
            </span>
          </div>

          {/* SVG Score Progression Bar / Area Visual */}
          <div className="mt-6">
            <div className="relative h-44 w-full">
              {/* Target Line at 85 */}
              <div
                className="absolute left-0 right-0 border-b border-dashed border-[#2F6B45]/50"
                style={{ top: "15%" }}
              >
                <span className="absolute right-0 -top-4 font-[family-name:var(--font-mono)] text-[10px] text-[#2F6B45]">
                  85% Hiring Benchmark
                </span>
              </div>

              {/* Bars representing each revision */}
              <div className="flex h-full items-end justify-around gap-4 pt-6">
                {progressionData.map((item, idx) => {
                  const heightPercent = Math.min(100, Math.max(20, item.atsScore));
                  const isLatest = idx === progressionData.length - 1;
                  return (
                    <div key={item.id} className="flex flex-1 flex-col items-center">
                      <span className="font-[family-name:var(--font-mono)] text-[12px] font-semibold text-[#14171F]">
                        {item.atsScore}
                      </span>
                      <div className="mt-2 w-full max-w-[56px] rounded-t-sm bg-[#EDEBE3] overflow-hidden" style={{ height: "110px" }}>
                        <div
                          className={`w-full transition-all duration-700 ${
                            isLatest ? "bg-[#D7FF3E]" : "bg-[#14171F]"
                          }`}
                          style={{
                            height: `${heightPercent}%`,
                            marginTop: `${100 - heightPercent}%`,
                          }}
                        />
                      </div>
                      <span className="mt-2 truncate font-[family-name:var(--font-mono)] text-[10px] uppercase text-[#8A8F99]">
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
        <div className="mt-8 rounded-sm border border-[#DBD8CE] bg-white shadow-sm overflow-hidden">
          <div className="border-b border-[#DBD8CE] bg-[#F6F5F1]/50 px-6 py-4">
            <h3 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[#14171F]">
              Scanned Resumes &amp; Target Roles
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center font-[family-name:var(--font-mono)] text-sm text-[#8A8F99]">
              Loading your scan records…
            </div>
          ) : scans.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-[family-name:var(--font-serif)] text-lg text-[#14171F]">
                No resumes scanned yet.
              </p>
              <Link
                href="/upload"
                className="mt-4 inline-block rounded-sm bg-[#14171F] px-6 py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase text-[#F6F5F1]"
              >
                Scan your first resume →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#DBD8CE] font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[#8A8F99]">
                    <th className="px-6 py-3.5 font-medium">Date</th>
                    <th className="px-6 py-3.5 font-medium">Resume File</th>
                    <th className="px-6 py-3.5 font-medium">Target Role</th>
                    <th className="px-6 py-3.5 font-medium">Match Score</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 text-right font-medium">Actions</th>
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
                      <tr key={s.id} className="hover:bg-[#F6F5F1]/40 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 font-[family-name:var(--font-mono)] text-[12px] text-[#6B6F79]">
                          {formattedDate}
                        </td>
                        <td className="px-6 py-4 font-medium text-[#14171F]">
                          {s.fileName}
                        </td>
                        <td className="px-6 py-4 text-[#4A4F58]">{s.jobTitle}</td>
                        <td className="px-6 py-4">
                          <span className="font-[family-name:var(--font-mono)] text-[15px] font-semibold text-[#14171F]">
                            {s.atsScore}
                          </span>
                          <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                            {" "}
                            / 100
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.04em] ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Link
                            href={`/ats?scanId=${s.id}`}
                            className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.04em] text-[#14171F] underline underline-offset-2 hover:text-[#4A4F58]"
                          >
                            View Audit
                          </Link>
                          <span className="text-[#DBD8CE]">·</span>
                          <Link
                            href={`/mock-interview?role=${encodeURIComponent(
                              s.jobTitle !== "Target Role" ? s.jobTitle : "Technical Role"
                            )}`}
                            className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.04em] text-[#6B6F79] hover:text-[#14171F]"
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
          )}
        </div>

        {/* QUICK TOOL LAUNCHPAD */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/mock-interview"
            className="group rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-sm transition-all hover:border-[#14171F]"
          >
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
              Simulator
            </span>
            <h4 className="mt-2 font-[family-name:var(--font-serif)] text-xl font-semibold text-[#14171F] group-hover:text-[#2A2E38]">
              Mock Interview →
            </h4>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#6B6F79]">
              Practice out loud with speech-to-text and instant STAR coaching.
            </p>
          </Link>

          <Link
            href="/improve"
            className="group rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-sm transition-all hover:border-[#14171F]"
          >
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
              Rewriter
            </span>
            <h4 className="mt-2 font-[family-name:var(--font-serif)] text-xl font-semibold text-[#14171F] group-hover:text-[#2A2E38]">
              Google X-Y-Z Engine →
            </h4>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#6B6F79]">
              Turn weak duties into quantified business impact statements.
            </p>
          </Link>

          <Link
            href="/cover-letter"
            className="group rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-sm transition-all hover:border-[#14171F]"
          >
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
              Studio
            </span>
            <h4 className="mt-2 font-[family-name:var(--font-serif)] text-xl font-semibold text-[#14171F] group-hover:text-[#2A2E38]">
              Cover Letter Studio →
            </h4>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#6B6F79]">
              Generate tailored proposals matched directly against job descriptions.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
