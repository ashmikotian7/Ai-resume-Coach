"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/navbar/Header";
import Footer from "@/components/common/Footer";

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
  const [keywordFilter, setKeywordFilter] = useState<"all" | "found" | "missing">("all");
  const [keywordSearch, setKeywordSearch] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  const handleCopyRewrite = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const foundKeywordsCount = scan.keywords.filter((k) => k.found).length;
  const totalKeywordsCount = scan.keywords.length;

  const filteredKeywords = scan.keywords.filter((k) => {
    if (keywordFilter === "found" && !k.found) return false;
    if (keywordFilter === "missing" && k.found) return false;
    if (keywordSearch.trim()) {
      return k.term.toLowerCase().includes(keywordSearch.toLowerCase());
    }
    return true;
  });

  // Calculate SVG circular stroke offset
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scan.ats_score / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#14171F] print:bg-white flex flex-col justify-between">
      {/* Print stylesheet */}
      <style jsx global>{`
        @media print {
          header,
          footer,
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

      <div className="no-print">
        <Header />
      </div>

      <main className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-10 flex-grow">
        {/* TOP STATUS BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DBD8CE]/70 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                {isLiveScan ? "Live ATS Audit Report" : "Demonstration ATS Audit"}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#D7FF3E]" />
              <span className="font-[family-name:var(--font-mono)] text-[10.5px] text-[#5A606D]">
                Workday &amp; Greenhouse Emulation
              </span>
            </div>
            <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight sm:text-4xl text-[#14171F]">
              {isLiveScan ? "Your ATS Match & Line-by-Line Breakdown" : "Here's what an executive ATS scan looks like."}
            </h1>
            {scan.job_description && (
              <p className="mt-1 font-[family-name:var(--font-mono)] text-[12px] text-[#6B7280]">
                Target Role: <span className="font-semibold text-[#14171F]">{scan.job_description}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 no-print">
            {scan.file_name && (
              <div className="flex items-center gap-2 rounded-sm border border-[#DBD8CE] bg-white px-3 py-2 font-[family-name:var(--font-mono)] text-[12px] text-[#4A4F58] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#4CAF6E]" />
                <span className="font-medium">{scan.file_name}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-sm border border-[#DBD8CE] bg-white px-3.5 py-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#14171F] hover:bg-[#FAF9F5] shadow-sm transition-all"
            >
              Export PDF
            </button>
            <Link
              href="/upload"
              className="rounded-sm bg-[#14171F] px-4 py-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#F6F5F1] hover:bg-[#2A2E38] shadow-sm transition-all"
            >
              Scan New Resume →
            </Link>
          </div>
        </div>

        {loading && (
          <div className="mt-6 rounded-sm border border-[#DBD8CE] bg-white p-4 font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99] animate-pulse">
            Analyzing ATS spiders and keywords...
          </div>
        )}

        {/* TOP SCORE + CIRCULAR GAUGE + SECTION AUDIT */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* Circular Score Gauge Card */}
          <div className="print-card rounded-sm border border-[#DBD8CE] bg-white p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                  Overall ATS Match Rating
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase tracking-wider ${
                    scan.ats_score >= 80
                      ? "bg-emerald-100 text-emerald-800"
                      : scan.ats_score >= 65
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {scan.ats_score >= 80
                    ? "Strong Candidate"
                    : scan.ats_score >= 65
                    ? "Needs Tuning"
                    : "High Rejection Risk"}
                </span>
              </div>

              {/* Gauge Graphic */}
              <div className="my-6 flex items-center justify-center gap-8">
                <div className="relative flex items-center justify-center">
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      stroke="#EDEBE3"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      stroke={scan.ats_score >= 80 ? "#2F6B45" : scan.ats_score >= 65 ? "#14171F" : "#9A3B2F"}
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="font-[family-name:var(--font-mono)] text-4xl font-bold text-[#14171F]">
                      {scan.ats_score}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99] uppercase">
                      / 100
                    </span>
                  </div>
                </div>

                <div className="max-w-[200px]">
                  <h4 className="font-[family-name:var(--font-serif)] text-base font-bold text-[#14171F]">
                    {scan.ats_score >= 80
                      ? "Interview Ready"
                      : scan.ats_score >= 65
                      ? "Missing Keywords"
                      : "Formatting Alerts"}
                  </h4>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#5A606D]">
                    {scan.ats_score >= 80
                      ? "Your resume passes the initial automated filters for high-volume recruitment pipelines."
                      : scan.ats_score >= 65
                      ? "Automated filters may rank your profile behind peers with direct keyword alignment."
                      : "Critical structure or keyword omissions are preventing your resume from reaching recruiters."}
                  </p>
                </div>
              </div>
            </div>

            {/* Score Breakdown Bars */}
            {scan.score_breakdown && (
              <div className="mt-4 border-t border-[#F0EEE7] pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.1em] text-[#8A8F99]">
                    Algorithm Sub-Metrics
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#8A8F99]">
                    Normalized
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[12px]">
                  <div>
                    <div className="flex justify-between font-[family-name:var(--font-mono)] text-[#6B6F79]">
                      <span>Keywords</span>
                      <span className="font-semibold text-[#14171F]">{scan.score_breakdown.keyword_score ?? 65}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                      <div className="h-full bg-[#14171F] rounded-full" style={{ width: `${scan.score_breakdown.keyword_score ?? 65}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-[family-name:var(--font-mono)] text-[#6B6F79]">
                      <span>Metrics &amp; Scale</span>
                      <span className="font-semibold text-[#14171F]">{scan.score_breakdown.impact_score ?? 65}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                      <div className="h-full bg-[#D7FF3E] rounded-full" style={{ width: `${scan.score_breakdown.impact_score ?? 65}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-[family-name:var(--font-mono)] text-[#6B6F79]">
                      <span>Format &amp; Layout</span>
                      <span className="font-semibold text-[#14171F]">{scan.score_breakdown.format_score ?? 80}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                      <div className="h-full bg-[#14171F] rounded-full" style={{ width: `${scan.score_breakdown.format_score ?? 80}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-[family-name:var(--font-mono)] text-[#6B6F79]">
                      <span>Readability Index</span>
                      <span className="font-semibold text-[#14171F]">{scan.score_breakdown.readability_score ?? 78}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                      <div className="h-full bg-[#14171F] rounded-full" style={{ width: `${scan.score_breakdown.readability_score ?? 78}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section & Layout Audit */}
          <div className="print-card rounded-sm border border-[#DBD8CE] bg-white p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                  Section &amp; Format Audit
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#6B7280]">
                  {scan.section_checks.filter((s) => s.status === "pass").length} of {scan.section_checks.length} Passed
                </span>
              </div>
              <div className="divide-y divide-[#F0EEE7]">
                {scan.section_checks.map((s) => {
                  const style = STATUS_STYLES[s.status] || STATUS_STYLES.pass;
                  return (
                    <div key={s.label} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-semibold text-[#14171F]">{s.label}</span>
                        <span
                          className={`flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] ${style.text}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                          {style.label}
                        </span>
                      </div>
                      {s.detail && (
                        <p className="mt-1 text-[12.5px] text-[#6B7280] leading-snug">
                          {s.detail}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F0EEE7] flex items-center justify-between font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
              <span>Parser standard: Single column UTF-8</span>
              <Link href="/resume-builder" className="text-[#14171F] underline underline-offset-4 hover:text-black">
                Fix formatting in Builder →
              </Link>
            </div>
          </div>
        </div>

        {/* KEYWORDS SECTION WITH CONTROLS */}
        <div className="mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                Semantic Keyword Analysis
              </span>
              <h2 className="mt-1 font-[family-name:var(--font-serif)] text-2xl font-bold tracking-tight text-[#14171F]">
                {foundKeywordsCount} of {totalKeywordsCount} role requirements detected
              </h2>
            </div>

            {/* Keyword Filter & Search */}
            <div className="flex items-center gap-2 no-print">
              <div className="flex rounded-sm border border-[#DBD8CE] bg-white p-0.5 font-[family-name:var(--font-mono)] text-[11px]">
                <button
                  type="button"
                  onClick={() => setKeywordFilter("all")}
                  className={`px-3 py-1 rounded-xs transition-colors ${
                    keywordFilter === "all" ? "bg-[#14171F] text-white" : "text-[#5A606D] hover:text-[#14171F]"
                  }`}
                >
                  All ({scan.keywords.length})
                </button>
                <button
                  type="button"
                  onClick={() => setKeywordFilter("found")}
                  className={`px-3 py-1 rounded-xs transition-colors ${
                    keywordFilter === "found" ? "bg-[#14171F] text-white" : "text-[#5A606D] hover:text-[#14171F]"
                  }`}
                >
                  Found ({foundKeywordsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setKeywordFilter("missing")}
                  className={`px-3 py-1 rounded-xs transition-colors ${
                    keywordFilter === "missing" ? "bg-[#14171F] text-white" : "text-[#5A606D] hover:text-[#14171F]"
                  }`}
                >
                  Missing ({totalKeywordsCount - foundKeywordsCount})
                </button>
              </div>

              <input
                type="text"
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                placeholder="Search skill..."
                className="rounded-sm border border-[#DBD8CE] bg-white px-3 py-1 text-[12px] font-[family-name:var(--font-mono)] focus:outline-none focus:border-[#14171F] w-36"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredKeywords.map((k) => (
              <div
                key={k.term}
                className={`print-card flex items-center justify-between rounded-sm border px-4 py-3 transition-colors ${
                  k.found
                    ? "border-[#DBD8CE] bg-white"
                    : "border-amber-200 bg-[#FCF8EC]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-medium text-[#14171F]">{k.term}</span>
                  {k.category && (
                    <span className="rounded-sm bg-[#EDEBE3] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[9.5px] uppercase tracking-wider text-[#6B6F79]">
                      {k.category}
                    </span>
                  )}
                </div>
                <span
                  className={`font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-sm font-semibold ${
                    k.found
                      ? "text-[#2F6B45] bg-[#2F6B45]/10"
                      : "text-[#8A6B1F] bg-[#8A6B1F]/15"
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
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                Line-by-line Google X-Y-Z formula
              </span>
              <h2 className="mt-1 font-[family-name:var(--font-serif)] text-2xl font-bold tracking-tight text-[#14171F]">
                {scan.line_issues.length} weak statements converted to recruiter-ready achievements
              </h2>
            </div>
            <Link
              href="/improve"
              className="no-print font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-wider text-[#14171F] font-semibold underline underline-offset-4 hover:text-black"
            >
              Open in Rewriter Studio →
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {scan.line_issues.map((item, i) => (
              <div
                key={i}
                className="print-card rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-sm transition-all hover:border-[#14171F]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[#B5563E] font-semibold bg-red-50 border border-red-200 px-2 py-0.5 rounded-sm">
                    Flag: {item.issue}
                  </span>
                  <div className="flex items-center gap-2 no-print">
                    <button
                      type="button"
                      onClick={() => handleCopyRewrite(item.rewrite, i)}
                      className="rounded-sm border border-[#DBD8CE] bg-white px-2.5 py-1 font-[family-name:var(--font-mono)] text-[11px] text-[#14171F] hover:bg-[#F6F5F1] transition-colors"
                    >
                      {copiedIndex === i ? "Copied ✓" : "Copy Rewrite"}
                    </button>
                    <Link
                      href={`/improve?bullet=${encodeURIComponent(item.original)}&issue=${encodeURIComponent(item.issue)}`}
                      className="rounded-sm border border-[#DBD8CE] bg-[#F6F5F1] px-2.5 py-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#14171F] hover:bg-white transition-colors"
                    >
                      Fine-tune →
                    </Link>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="border-l-2 border-red-300 pl-3.5">
                    <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase text-red-600 font-semibold block">
                      Original weak line
                    </span>
                    <p className="text-[14px] text-[#6B7280] line-through decoration-red-300">
                      {item.original}
                    </p>
                  </div>

                  <div className="border-l-2 border-[#D7FF3E] pl-3.5 bg-emerald-50/40 p-2 rounded-r-sm">
                    <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase text-emerald-800 font-bold block">
                      Redline Google X-Y-Z rewrite
                    </span>
                    <p className="text-[14.5px] font-medium text-[#14171F]">
                      {item.rewrite}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM ACTION BANNER */}
        <div className="no-print mt-16 rounded-sm border border-[#DBD8CE] bg-[#14171F] px-8 py-10 text-center shadow-lg text-[#F6F5F1]">
          <h3 className="font-[family-name:var(--font-serif)] text-2xl font-bold sm:text-3xl">
            Convert this scan into interview callbacks
          </h3>
          <p className="mx-auto mt-2.5 max-w-lg text-[14px] leading-relaxed text-[#B9BCC4]">
            Rehearse mock interview questions generated directly from your resume's weaknesses, or draft a tailored cover letter.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/mock-interview?role=${encodeURIComponent(
                scan.file_name ? scan.file_name.replace(/\.[^/.]+$/, "") : "Target Role"
              )}&jobDescription=${encodeURIComponent(scan.job_description || "")}`}
              className="rounded-sm bg-[#D7FF3E] px-6 py-3 font-[family-name:var(--font-mono)] text-[12.5px] uppercase tracking-[0.08em] text-[#14171F] font-bold hover:bg-[#cbf530] transition-colors"
            >
              Practice Voice Interview →
            </Link>
            <Link
              href="/improve"
              className="rounded-sm border border-[#3A3F4D] bg-white/5 px-6 py-3 font-[family-name:var(--font-mono)] text-[12.5px] uppercase tracking-[0.08em] text-[#F6F5F1] hover:bg-white/10 transition-colors"
            >
              Open Bullet Studio
            </Link>
            <Link
              href="/cover-letter"
              className="rounded-sm border border-[#3A3F4D] bg-white/5 px-6 py-3 font-[family-name:var(--font-mono)] text-[12.5px] uppercase tracking-[0.08em] text-[#F6F5F1] hover:bg-white/10 transition-colors"
            >
              Draft Tailored Cover Letter
            </Link>
          </div>
        </div>
      </main>

      <div className="no-print">
        <Footer />
      </div>
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
