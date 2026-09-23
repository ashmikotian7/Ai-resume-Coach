"use client";

import { useEffect, useState, Suspense } from "react";
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

interface KeywordItem {
  term: string;
  found: boolean;
  frequency?: number;
  category?: string;
}

interface SectionCheck {
  label: string;
  status: "pass" | "warn" | "fail";
  detail?: string;
}

interface LineIssue {
  original: string;
  issue: string;
  rewrite: string;
}

interface ScanData {
  ats_score: number;
  score_breakdown?: {
    format_score?: number;
    keyword_score?: number;
    impact_score?: number;
    readability_score?: number;
  };
  keywords: KeywordItem[];
  section_checks: SectionCheck[];
  line_issues: LineIssue[];
  file_name?: string;
  job_description?: string;
  raw_text?: string;
}

const SAMPLE_SCAN: ScanData = {
  ats_score: 68,
  score_breakdown: {
    format_score: 80,
    keyword_score: 60,
    impact_score: 65,
    readability_score: 78,
  },
  keywords: [
    { term: "Cross-functional collaboration", found: true, category: "Core" },
    { term: "Stakeholder management", found: true, category: "Core" },
    { term: "SQL", found: true, category: "Tech" },
    { term: "A/B testing", found: true, category: "Tech" },
    { term: "Product roadmap", found: false, category: "Core" },
    { term: "Data-driven decision making", found: false, category: "Core" },
    { term: "Agile / Scrum", found: true, category: "Management" },
    { term: "KPI ownership", found: false, category: "Management" },
  ],
  section_checks: [
    { label: "Contact info", status: "pass", detail: "Email and phone clearly detected." },
    { label: "Work experience", status: "pass", detail: "Standard reverse chronological order." },
    { label: "Education", status: "pass", detail: "Degree and university details verified." },
    { label: "Skills section", status: "warn", detail: "Needs distinct grouping for ATS filters." },
    { label: "File format (.docx / .pdf)", status: "pass", detail: "Single column readable document." },
    { label: "Tables or text boxes detected", status: "fail", detail: "Nested columns may break parser flow." },
  ],
  line_issues: [
    {
      original: "Responsible for managing a team and improving processes across departments.",
      issue: "Vague duty, no measurable outcome",
      rewrite: "Led a 6-person cross-functional team to cut process turnaround time by 34% over two quarters.",
    },
    {
      original: "Worked on the company website and helped with updates.",
      issue: "Passive framing, no scope or impact",
      rewrite: "Rebuilt the marketing site's checkout flow, lifting conversion rate from 2.1% to 3.4%.",
    },
    {
      original: "Helped with data analysis for various projects.",
      issue: "Missing tools, scale, and result",
      rewrite: "Built SQL dashboards analyzing 40K+ weekly transactions, surfacing a pricing gap worth $180K annually.",
    },
  ],
  file_name: "Sample_Resume_PM.pdf",
  job_description: "Senior Product Manager at Acme Corp",
};

const STATUS_STYLES: Record<"pass" | "warn" | "fail", { dot: string; text: string; label: string }> = {
  pass: { dot: "bg-[#4CAF6E]", text: "text-[#2F6B45]", label: "Pass" },
  warn: { dot: "bg-[#D7A93E]", text: "text-[#8A6B1F]", label: "Warning" },
  fail: { dot: "bg-[#D65A4A]", text: "text-[#9A3B2F]", label: "Issue detected" },
};

function AtsContent() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get("scanId");

  const [scan, setScan] = useState<ScanData>(SAMPLE_SCAN);
  const [loading, setLoading] = useState(false);
  const [isLiveScan, setIsLiveScan] = useState(false);

  useEffect(() => {
    if (!scanId) {
      if (typeof window !== "undefined") {
        const cached = window.sessionStorage.getItem("redline_current_scan");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setScan(parsed);
            setIsLiveScan(true);
            return;
          } catch {}
        }
      }
      setIsLiveScan(false);
      setScan(SAMPLE_SCAN);
      return;
    }

    if (typeof window !== "undefined") {
      const cached = window.sessionStorage.getItem("redline_current_scan");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setScan(parsed);
          setIsLiveScan(true);
        } catch {}
      }
    }

    setLoading(true);
    fetch(`/api/resume/scan?id=${scanId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not fetch scan");
        return res.json();
      })
      .then((data) => {
        if (data.results) {
          setScan(data.results);
          setIsLiveScan(true);
        }
      })
      .catch((err) => {
        console.warn("API scan fetch error, staying on loaded data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [scanId]);

  const handlePrint = () => {
    window.print();
  };

  const foundKeywordsCount = scan.keywords.filter((k) => k.found).length;
  const totalKeywordsCount = scan.keywords.length;

  return (
    <div
      className={`${sans.variable} ${serif.variable} ${mono.variable} min-h-screen bg-[#F6F5F1] font-[family-name:var(--font-sans)] text-[#14171F] antialiased print:bg-white`}
    >
      {/* Print stylesheet */}
      <style jsx global>{`
        @media print {
          header,
          .no-print {
            display: none !important;
          }
          body,
          main {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-card {
            border: 1px solid #DBD8CE !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-[#DBD8CE] bg-[#F6F5F1]/90 backdrop-blur no-print">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-serif)] text-lg font-semibold tracking-tight"
          >
            Redline<span className="text-[#8A8F99]">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-sm border border-[#DBD8CE] bg-white px-3.5 py-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#14171F] transition-colors hover:border-[#14171F]"
            >
              Export Report as PDF
            </button>
            <Link
              href="/improve"
              className="font-[family-name:var(--font-mono)] text-[13px] text-[#4A4F58] transition-colors hover:text-[#14171F]"
            >
              Bullet Rewriter
            </Link>
            <Link
              href="/upload"
              className="rounded-sm bg-[#14171F] px-4 py-2 font-[family-name:var(--font-mono)] text-[13px] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38]"
            >
              Scan new resume
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* PAGE HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
              {isLiveScan ? "Live ATS Audit Report" : "Sample Audit Report"}
            </span>
            <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight sm:text-4xl">
              {isLiveScan ? "Your ATS Match & Line-by-Line Scan" : "Here's what a real scan looks like."}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {scan.file_name && (
              <div className="flex items-center gap-2 rounded-sm border border-[#DBD8CE] bg-white px-3 py-1.5 font-[family-name:var(--font-mono)] text-[12px] text-[#4A4F58]">
                <span className="h-2 w-2 rounded-full bg-[#4CAF6E]" />
                <span>{scan.file_name}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="no-print rounded-sm bg-[#14171F] px-3.5 py-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38]"
            >
              Download PDF Audit
            </button>
          </div>
        </div>

        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#4A4F58]">
          {isLiveScan
            ? "Scored against modern applicant tracking algorithms, keyword parsers, and recruiter heuristics."
            : "This is an anonymized example scan for a Product Manager resume against a real job posting. Upload your own to get this same breakdown, scored against the role you're applying for."}
        </p>

        {loading && (
          <div className="mt-4 rounded-sm border border-[#DBD8CE] bg-white p-4 font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
            Fetching latest data from database...
          </div>
        )}

        {/* SCORE + FILE STRUCTURE */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Score card */}
          <div className="print-card flex flex-col justify-between rounded-sm border border-[#DBD8CE] bg-white p-7 shadow-sm">
            <div>
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                ATS match score
              </span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-mono)] text-6xl font-semibold text-[#14171F]">
                  {scan.ats_score}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-lg text-[#8A8F99]">
                  / 100
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[#EDEBE3]">
                <div
                  className="h-full rounded-full bg-[#D7FF3E] transition-all duration-700"
                  style={{ width: `${scan.ats_score}%` }}
                />
              </div>

              <p className="mt-5 text-[14.5px] leading-relaxed text-[#4A4F58]">
                {scan.ats_score >= 80
                  ? "Outstanding compatibility. Clear formatting and strong keyword coverage will pass most automated filters."
                  : scan.ats_score >= 65
                  ? "Moderate match. Several high-priority keyword gaps and structural flags may trigger automated rejection."
                  : "Below target threshold. Layout formatting and missing core competencies require immediate revision."}
              </p>
            </div>

            {/* Score Breakdown Bars */}
            {scan.score_breakdown && (
              <div className="mt-6 border-t border-[#F0EEE7] pt-5 space-y-2.5">
                <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.1em] text-[#8A8F99]">
                  Sub-Dimension Scores
                </span>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <div className="flex justify-between font-[family-name:var(--font-mono)] text-[#6B6F79]">
                      <span>Keywords</span>
                      <span>{scan.score_breakdown.keyword_score ?? 65}%</span>
                    </div>
                    <div className="mt-1 h-1 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                      <div className="h-full bg-[#14171F]" style={{ width: `${scan.score_breakdown.keyword_score ?? 65}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-[family-name:var(--font-mono)] text-[#6B6F79]">
                      <span>Impact / Metrics</span>
                      <span>{scan.score_breakdown.impact_score ?? 65}%</span>
                    </div>
                    <div className="mt-1 h-1 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                      <div className="h-full bg-[#D7FF3E]" style={{ width: `${scan.score_breakdown.impact_score ?? 65}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-[family-name:var(--font-mono)] text-[#6B6F79]">
                      <span>Formatting</span>
                      <span>{scan.score_breakdown.format_score ?? 80}%</span>
                    </div>
                    <div className="mt-1 h-1 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                      <div className="h-full bg-[#14171F]" style={{ width: `${scan.score_breakdown.format_score ?? 80}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-[family-name:var(--font-mono)] text-[#6B6F79]">
                      <span>Readability</span>
                      <span>{scan.score_breakdown.readability_score ?? 78}%</span>
                    </div>
                    <div className="mt-1 h-1 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                      <div className="h-full bg-[#14171F]" style={{ width: `${scan.score_breakdown.readability_score ?? 78}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section audit */}
          <div className="print-card rounded-sm border border-[#DBD8CE] bg-white p-7 shadow-sm">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
              Format &amp; section audit
            </span>
            <div className="mt-5 space-y-3">
              {scan.section_checks.map((s) => {
                const style = STATUS_STYLES[s.status] || STATUS_STYLES.pass;
                return (
                  <div
                    key={s.label}
                    className="border-b border-[#F0EEE7] pb-3 last:border-none last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium text-[#14171F]">{s.label}</span>
                      <span
                        className={`flex items-center gap-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] ${style.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {style.label}
                      </span>
                    </div>
                    {s.detail && (
                      <p className="mt-1 font-[family-name:var(--font-sans)] text-[12px] text-[#8A8F99]">
                        {s.detail}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* KEYWORDS */}
        <div className="mt-14">
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
            Keyword match
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-serif)] text-2xl font-semibold tracking-tight">
            {totalKeywordsCount} key skills analyzed, {foundKeywordsCount} detected in your resume.
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {scan.keywords.map((k) => (
              <div
                key={k.term}
                className={`print-card flex items-center justify-between rounded-sm border px-4 py-3 ${
                  k.found
                    ? "border-[#DBD8CE] bg-white"
                    : "border-[#E8DCC4] bg-[#FBF6EA]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-[#14171F]">{k.term}</span>
                  {k.category && (
                    <span className="rounded-sm bg-[#EDEBE3] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[#6B6F79]">
                      {k.category}
                    </span>
                  )}
                </div>
                <span
                  className={`font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] ${
                    k.found ? "text-[#2F6B45]" : "text-[#8A6B1F]"
                  }`}
                >
                  {k.found ? "Found" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* LINE-BY-LINE REWRITES */}
        <div className="mt-14">
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
            Line-by-line Google X-Y-Z formula
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-serif)] text-2xl font-semibold tracking-tight">
            {scan.line_issues.length} weak bullets converted to high-impact metrics.
          </h2>

          <div className="mt-6 space-y-4">
            {scan.line_issues.map((item, i) => (
              <div
                key={i}
                className="print-card rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[#B5563E]">
                    {item.issue}
                  </span>
                  <Link
                    href={`/improve?bullet=${encodeURIComponent(item.original)}&issue=${encodeURIComponent(item.issue)}`}
                    className="no-print shrink-0 rounded-sm border border-[#DBD8CE] bg-[#F6F5F1] px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#14171F] transition-colors hover:border-[#14171F] hover:bg-white"
                  >
                    Rewrite with AI →
                  </Link>
                </div>

                <p className="mt-3 border-l-2 border-[#E5B7AC] pl-4 text-[14.5px] leading-relaxed text-[#8A8F99] line-through decoration-[#D65A4A]/40">
                  {item.original}
                </p>

                <p className="mt-3 border-l-2 border-[#D7FF3E] pl-4 text-[14.5px] leading-relaxed text-[#14171F]">
                  {item.rewrite}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* NEXT STEPS & CTAs */}
        <div className="no-print mt-16 rounded-sm border border-[#DBD8CE] bg-[#14171F] px-8 py-12 text-center shadow-md">
          <h3 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-[#F6F5F1] sm:text-3xl">
            Ready to convert this scan into interviews?
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-[14.5px] leading-relaxed text-[#B9BCC4]">
            Practice live questions tailored to this role, or rewrite more bullets with the interactive Google X-Y-Z engine.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-4">
            <Link
              href={`/mock-interview?role=${encodeURIComponent(
                scan.file_name ? scan.file_name.replace(/\.[^/.]+$/, "") : "Target Role"
              )}&jobDescription=${encodeURIComponent(scan.job_description || "")}`}
              className="rounded-sm bg-[#D7FF3E] px-7 py-3.5 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#14171F] transition-opacity hover:opacity-90"
            >
              Practice Interview for this Role →
            </Link>
            <Link
              href="/improve"
              className="rounded-sm border border-[#3A3F4D] bg-white/5 px-7 py-3.5 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] transition-colors hover:border-[#6B6F79] hover:bg-white/10"
            >
              Open Bullet Rewriter
            </Link>
            <Link
              href="/cover-letter"
              className="rounded-sm border border-[#3A3F4D] bg-white/5 px-7 py-3.5 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] transition-colors hover:border-[#6B6F79] hover:bg-white/10"
            >
              Draft Cover Letter
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AtsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F5F1] p-12 text-center font-[family-name:var(--font-mono)] text-sm text-[#8A8F99]">
          Loading ATS report...
        </div>
      }
    >
      <AtsContent />
    </Suspense>
  );
}
