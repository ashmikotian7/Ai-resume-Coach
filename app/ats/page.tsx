"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/navbar/Header";
import Footer from "@/components/common/Footer";

interface KeywordItem {
  term: string;
  found: boolean;
  frequency?: number;
  category?: string;
  contextSnippet?: string;
}

interface SectionCheck {
  label: string;
  status: "pass" | "warn" | "fail";
  detail?: string;
  notes?: string;
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
  ats_score: 74,
  score_breakdown: {
    format_score: 82,
    keyword_score: 68,
    impact_score: 70,
    readability_score: 85,
  },
  keywords: [
    { term: "Cross-functional collaboration", found: true, category: "Core", frequency: 4 },
    { term: "Stakeholder management", found: true, category: "Core", frequency: 3 },
    { term: "Product roadmap", found: false, category: "Core", frequency: 0 },
    { term: "Data-driven decision making", found: false, category: "Core", frequency: 0 },
    { term: "SQL", found: true, category: "Tech", frequency: 2 },
    { term: "A/B testing", found: true, category: "Tech", frequency: 2 },
    { term: "System architecture", found: false, category: "Tech", frequency: 0 },
    { term: "Python", found: true, category: "Tech", frequency: 1 },
    { term: "Agile / Scrum", found: true, category: "Management", frequency: 3 },
    { term: "KPI ownership", found: false, category: "Management", frequency: 0 },
    { term: "OKRs & Quarterly Planning", found: true, category: "Management", frequency: 2 },
    { term: "Budget forecasting", found: false, category: "Management", frequency: 0 },
  ],
  section_checks: [
    { label: "Contact Information", status: "pass", detail: "Email, LinkedIn, and phone detected with standard format.", notes: "Parser successfully extracted candidate contact nodes." },
    { label: "Work Experience Timeline", status: "pass", detail: "Chronological flow matches Workday standard timestamp regex.", notes: "Detected 3 position blocks with clean start/end dates." },
    { label: "Education & Credentials", status: "pass", detail: "Degree, institution, and graduation year verified.", notes: "Accredited degree extracted properly." },
    { label: "Skills Section Grouping", status: "warn", detail: "Keywords appear in paragraph blocks instead of bullet taxonomy.", notes: "Separating into categories (Languages, Frameworks, Cloud) improves scoring." },
    { label: "File Format & Encoding", status: "pass", detail: "Single column UTF-8 layout without decorative layers.", notes: "Zero unicode glyph distortion detected." },
    { label: "Tables & Multi-column Flow", status: "fail", detail: "Two-column skills layout may cause spider parser inversion.", notes: "Parsers may read across column breaks, merging unrelated lines." },
  ],
  line_issues: [
    {
      original: "Responsible for managing a team and improving processes across departments.",
      issue: "Vague duty, passive voice, no measurable outcome",
      rewrite: "Orchestrated a 7-person cross-functional engineering team, standardizing deployment pipelines to reduce release turnaround time by 38% across 4 quarters.",
    },
    {
      original: "Worked on the company website and helped with updates.",
      issue: "Missing scope, technical ownership, and revenue impact",
      rewrite: "Spearheaded the complete rewrite of customer checkout flows using Next.js & Stripe, increasing conversion rate from 2.1% to 3.6% ($240K incremental ARR).",
    },
    {
      original: "Helped with data analysis for various executive projects.",
      issue: "Unspecified tooling, volume, and business decision",
      rewrite: "Built automated SQL dashboards analyzing 55K+ weekly customer transactions, discovering pricing anomalies that retained $190K in annual contract value.",
    },
  ],
  file_name: "Sample_Executive_Resume.pdf",
  job_description: "Senior Product & Technical Lead at Horizon Labs",
  raw_text: `ALEXANDER R. MORGAN
San Francisco, CA | alex.morgan@example.com | (415) 555-0198 | linkedin.com/in/alexmorgan

PROFESSIONAL SUMMARY
Senior Technical Leader with 7+ years directing cross-functional software initiatives, scaling cloud platforms, and leading Agile teams to ship high-impact digital products.

WORK EXPERIENCE
Horizon Labs — Lead Product Engineer (2022 - Present)
- Orchestrated a 7-person cross-functional engineering team, standardizing deployment pipelines to reduce release turnaround time by 38% across 4 quarters.
- Re-architected customer checkout flows using Next.js & Stripe, lifting conversion rate from 2.1% to 3.6% ($240K ARR).
- Built automated SQL dashboards analyzing 55K+ weekly transactions, discovering pricing anomalies retaining $190K.

Vanguard Tech — Software Engineer II (2019 - 2022)
- Collaborated across product, UX, and QA to release 12 core platform features with 99.95% uptime.
- Spearheaded A/B testing framework evaluating user activation, increasing monthly retained users by 18%.

EDUCATION
University of California, Berkeley — B.S. in Computer Science (2015 - 2019)

SKILLS & CERTIFICATIONS
SQL, Python, Next.js, React, TypeScript, Agile/Scrum, Stakeholder Management, A/B Testing, Cloud Infrastructure`,
};

const STATUS_CONFIG: Record<"pass" | "warn" | "fail", { badge: string; dot: string; text: string; label: string; border: string; bg: string }> = {
  pass: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    label: "Passed",
    border: "border-emerald-200/80",
    bg: "bg-emerald-50/30",
  },
  warn: {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-700",
    label: "Needs Review",
    border: "border-amber-200/80",
    bg: "bg-amber-50/40",
  },
  fail: {
    badge: "bg-red-50 text-red-800 border-red-200",
    dot: "bg-rose-500",
    text: "text-rose-700",
    label: "Critical Flag",
    border: "border-red-200/80",
    bg: "bg-rose-50/40",
  },
};

const KEYWORD_SUGGESTIONS: Record<string, { why: string; examples: string[] }> = {
  "Product roadmap": {
    why: "ATS models search for strategic trajectory ownership terms to separate execution coders from strategic leads.",
    examples: [
      "Owned end-to-end multi-quarter product roadmap alignment across 5 teams, executing 14 on-time feature deliveries.",
      "Defined strategic product roadmap through customer interviews, prioritization matrix, and executive steering committee buy-in.",
    ],
  },
  "Data-driven decision making": {
    why: "High-volume recruitment parsers prioritize quantitative rationale over subjective intuition.",
    examples: [
      "Instituted data-driven decision making framework utilizing Mixpanel & SQL metrics, cutting speculative feature backlog by 40%.",
      "Grounded product prioritization in quantitative telemetry, running bi-weekly cohort analyses across 120K active users.",
    ],
  },
  "System architecture": {
    why: "Validates technical leadership and system-level scope beyond isolated component building.",
    examples: [
      "Architected distributed event-driven microservices processing 4.2M events daily with sub-80ms p99 latency.",
      "Co-authored foundational system architecture blueprint that reduced cloud operational expenditure by 22%.",
    ],
  },
  "KPI ownership": {
    why: "Differentiates task-completers from business outcome owners.",
    examples: [
      "Held direct KPI ownership over quarterly net revenue retention, achieving 114% target attainment in FY25.",
      "Established foundational KPI telemetry (NPS, CSAT, CAC-to-LTV ratio) reported directly to the executive staff.",
    ],
  },
  "Budget forecasting": {
    why: "Critical for management and director-track ATS queries looking for financial stewardship.",
    examples: [
      "Managed $1.4M annual departmental operational budget, executing within 2.5% variance of projected cloud and tooling expense.",
      "Spearheaded multi-vendor contract renegotiations, saving $85K in software licensing while expanding capacity.",
    ],
  },
};

function AtsContent() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get("scanId");

  const [scan, setScan] = useState<ScanData>(SAMPLE_SCAN);
  const [loading, setLoading] = useState(false);
  const [isLiveScan, setIsLiveScan] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "keywords" | "rewrites" | "parser" | "match">("overview");

  // Filter states
  const [keywordFilter, setKeywordFilter] = useState<"all" | "found" | "missing">("all");
  const [keywordCategory, setKeywordCategory] = useState<string>("all");
  const [keywordSearch, setKeywordSearch] = useState("");

  // Interactive drawer/modal for missing keyword helper
  const [selectedKeywordForAdvice, setSelectedKeywordForAdvice] = useState<string | null>(null);

  // Copy feedback
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedExampleBullet, setCopiedExampleBullet] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Target role tweaking state
  const [customJobDesc, setCustomJobDesc] = useState("");
  const [editingRole, setEditingRole] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    let isSubscribed = true;

    const initializeScanData = async () => {
      // 1. Try reading client cached scan first
      if (typeof window !== "undefined") {
        try {
          const cached = window.sessionStorage.getItem("redline_current_scan");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (isSubscribed) {
              setScan(parsed);
              setIsLiveScan(true);
              setCustomJobDesc(parsed.job_description || "");
            }
          }
        } catch (e) {
          console.warn("Could not read local session scan:", e);
        }
      }

      // 2. If scanId provided, fetch fresh from server
      if (scanId) {
        setLoading(true);
        try {
          const res = await fetch(`/api/resume/scan?id=${scanId}`);
          if (res.ok) {
            const data = await res.json();
            if (isSubscribed && data.results) {
              setScan(data.results);
              setIsLiveScan(true);
              setCustomJobDesc(data.results.job_description || "");
            }
          }
        } catch (err) {
          console.warn("API scan fetch notice:", err);
        } finally {
          if (isSubscribed) {
            setLoading(false);
          }
        }
      }
    };

    initializeScanData();

    return () => {
      isSubscribed = false;
    };
  }, [scanId]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyRewrite = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast("Rewrite copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyExampleBullet = (bullet: string) => {
    navigator.clipboard.writeText(bullet);
    setCopiedExampleBullet(bullet);
    showToast("Example bullet copied to clipboard");
    setTimeout(() => setCopiedExampleBullet(null), 2000);
  };

  const handleCopySummaryReport = () => {
    const markdown = `# ATS Audit Summary: ${scan.file_name || "Resume"}
Overall ATS Score: ${scan.ats_score}/100
Role: ${scan.job_description || "Target Role"}

## Sub-Scores
- Format & Parser Cleanliness: ${scan.score_breakdown?.format_score ?? 80}%
- Keyword Match: ${scan.score_breakdown?.keyword_score ?? 68}%
- Impact & Scale: ${scan.score_breakdown?.impact_score ?? 70}%
- Readability: ${scan.score_breakdown?.readability_score ?? 85}%

## Missing Keywords:
${scan.keywords.filter((k) => !k.found).map((k) => `- ${k.term} (${k.category || "General"})`).join("\n")}

Generated by Redline AI Resume Coach`;
    navigator.clipboard.writeText(markdown);
    showToast("Full Markdown audit report copied!");
  };

  // Keyword metrics
  const foundKeywordsCount = scan.keywords.filter((k) => k.found).length;
  const totalKeywordsCount = scan.keywords.length;
  const matchPercentage = totalKeywordsCount > 0 ? Math.round((foundKeywordsCount / totalKeywordsCount) * 100) : 0;

  const categories = useMemo(() => {
    const set = new Set<string>();
    scan.keywords.forEach((k) => {
      if (k.category) set.add(k.category);
    });
    return Array.from(set);
  }, [scan.keywords]);

  const filteredKeywords = useMemo(() => {
    return scan.keywords.filter((k) => {
      if (keywordFilter === "found" && !k.found) return false;
      if (keywordFilter === "missing" && k.found) return false;
      if (keywordCategory !== "all" && k.category !== keywordCategory) return false;
      if (keywordSearch.trim()) {
        return k.term.toLowerCase().includes(keywordSearch.toLowerCase());
      }
      return true;
    });
  }, [scan.keywords, keywordFilter, keywordCategory, keywordSearch]);

  // SVG circular calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scan.ats_score / 100) * circumference;

  // Grade verdict
  const scoreVerdict = useMemo(() => {
    if (scan.ats_score >= 82) {
      return {
        label: "Tier 1: Top Candidate Pool",
        color: "text-emerald-700",
        badge: "bg-emerald-50 text-emerald-800 border-emerald-300",
        summary: "High algorithmic match. Low risk of being filtered out by Workday or Taleo automated gates.",
        passChance: "92% automated screening bypass probability",
      };
    }
    if (scan.ats_score >= 68) {
      return {
        label: "Tier 2: Competitive with Minor Gaps",
        color: "text-amber-700",
        badge: "bg-amber-50 text-amber-800 border-amber-300",
        summary: "Good foundation, but missing secondary role keywords may rank you beneath direct-match peers.",
        passChance: "65% automated screening bypass probability",
      };
    }
    return {
      label: "Tier 3: High Auto-Rejection Risk",
      color: "text-rose-700",
      badge: "bg-rose-50 text-rose-800 border-rose-300",
      summary: "Critical parser layout conflicts or missing core skills will likely drop your resume before a recruiter views it.",
      passChance: "32% automated screening bypass probability",
    };
  }, [scan.ats_score]);

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#14171F] print:bg-white flex flex-col justify-between selection:bg-[#D7FF3E] selection:text-[#14171F]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-sm border border-[#14171F] bg-[#14171F] px-4 py-3 text-[13px] text-[#F6F5F1] shadow-xl animate-fade-in">
          <span className="h-2 w-2 rounded-full bg-[#D7FF3E]" />
          <span>{toastMessage}</span>
        </div>
      )}

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
          .print-all-tabs {
            display: block !important;
          }
        }
      `}</style>

      <div className="no-print">
        <Header />
      </div>

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 flex-grow">
        {/* TOP BREADCRUMB & METADATA BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DBD8CE]/80 pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DBD8CE] bg-white px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-wider text-[#6B7280]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D7FF3E]" />
                {isLiveScan ? "Live Resume Scan Report" : "Demonstration Benchmark Audit"}
              </span>
              <span className="hidden sm:inline-block text-[#DBD8CE]">/</span>
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#5A606D] flex items-center gap-1">
                <span>Engine:</span>
                <span className="font-semibold text-[#14171F]">Workday, Taleo &amp; Greenhouse v4 Spider</span>
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-baseline gap-3">
              <h1 className="font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight sm:text-4xl text-[#14171F]">
                ATS Match &amp; Architectural Breakdown
              </h1>
            </div>

            {/* Target Role with Quick Edit */}
            <div className="mt-2 flex flex-wrap items-center gap-2 font-[family-name:var(--font-mono)] text-[12px] text-[#5A606D]">
              <span>Benchmarked for:</span>
              {editingRole ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customJobDesc}
                    onChange={(e) => setCustomJobDesc(e.target.value)}
                    className="border border-[#14171F] bg-white px-2.5 py-0.5 rounded-sm text-[12px] text-[#14171F] font-medium focus:outline-none"
                    placeholder="Enter target job title or role..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setScan((prev) => ({ ...prev, job_description: customJobDesc }));
                      setEditingRole(false);
                      showToast("Target role updated for this session");
                    }}
                    className="bg-[#14171F] text-white px-2.5 py-0.5 text-[11px] uppercase tracking-wider rounded-sm hover:bg-[#2A2E38]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingRole(false)}
                    className="text-[#6B7280] text-[11px] hover:text-[#14171F]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#14171F] bg-white px-2 py-0.5 border border-[#DBD8CE] rounded-sm">
                    {scan.job_description || "Senior Technical Role"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingRole(true)}
                    className="no-print text-[11px] text-[#6B7280] hover:text-[#14171F] underline underline-offset-2"
                  >
                    Change role
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5 no-print">
            {scan.file_name && (
              <div className="hidden md:flex items-center gap-2 rounded-sm border border-[#DBD8CE] bg-white px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11.5px] text-[#4A4F58] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium truncate max-w-[180px]">{scan.file_name}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleCopySummaryReport}
              className="rounded-sm border border-[#DBD8CE] bg-white px-3 py-2 font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-[0.06em] text-[#14171F] hover:bg-[#FAF9F5] shadow-sm transition-all"
              title="Copy markdown summary report"
            >
              Copy Summary
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-sm border border-[#DBD8CE] bg-white px-3 py-2 font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-[0.06em] text-[#14171F] hover:bg-[#FAF9F5] shadow-sm transition-all"
            >
              Export PDF
            </button>
            <Link
              href="/upload"
              className="rounded-sm bg-[#14171F] px-4 py-2 font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-[0.06em] text-[#F6F5F1] hover:bg-[#2A2E38] shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Scan New Resume</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {loading && (
          <div className="mt-6 rounded-sm border border-[#DBD8CE] bg-white p-4 font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99] animate-pulse flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-[#14171F] animate-ping" />
            <span>Analyzing document AST tree and emulating Workday recruiter filters...</span>
          </div>
        )}

        {/* HERO SCORE MATRIX & BENCHMARK RADAR */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1.3fr]">
          {/* Main Dial & Probability Card */}
          <div className="print-card rounded-sm border border-[#DBD8CE] bg-white p-7 sm:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 h-28 w-28 bg-gradient-to-bl from-[#D7FF3E]/20 to-transparent pointer-events-none rounded-bl-full" />

            <div>
              <div className="flex items-center justify-between">
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                  Total Algorithmic Fit Score
                </span>
                <span
                  className={`border px-2.5 py-0.5 rounded-full font-[family-name:var(--font-mono)] text-[10.5px] font-semibold uppercase tracking-wider ${scoreVerdict.badge}`}
                >
                  {scoreVerdict.label}
                </span>
              </div>

              {/* Dial + Verdict Narrative */}
              <div className="my-7 flex flex-col sm:flex-row items-center sm:items-center justify-center gap-6 sm:gap-8">
                <div className="relative flex items-center justify-center">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke="#EDEBE3"
                      strokeWidth="11"
                      fill="transparent"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke={scan.ats_score >= 80 ? "#2F6B45" : scan.ats_score >= 65 ? "#14171F" : "#9A3B2F"}
                      strokeWidth="11"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="font-[family-name:var(--font-mono)] text-4xl font-extrabold text-[#14171F] tracking-tight">
                      {scan.ats_score}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[10.5px] text-[#8A8F99] uppercase tracking-wider">
                      out of 100
                    </span>
                  </div>
                </div>

                <div className="max-w-[280px] text-center sm:text-left">
                  <h3 className="font-[family-name:var(--font-serif)] text-lg font-bold text-[#14171F]">
                    {scan.ats_score >= 80
                      ? "Screening Filter Qualified"
                      : scan.ats_score >= 65
                      ? "Competitive with Gaps"
                      : "Parser Ingestion Risk"}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#5A606D]">
                    {scoreVerdict.summary}
                  </p>
                  <div className="mt-3 flex items-center justify-center sm:justify-start gap-1.5 font-[family-name:var(--font-mono)] text-[11px] text-[#2F6B45] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2F6B45]" />
                    <span>{scoreVerdict.passChance}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benchmark Spectrum Bar */}
            <div className="border-t border-[#F0EEE7] pt-5">
              <div className="flex items-center justify-between text-[11px] font-[family-name:var(--font-mono)] text-[#8A8F99] uppercase tracking-wider mb-2">
                <span>Applicant Benchmark Spectrum</span>
                <span className="text-[#14171F] font-semibold">
                  {scan.ats_score >= 85 ? "Top 6% Percentile" : scan.ats_score >= 70 ? "Top 24% Percentile" : "Bottom 45%"}
                </span>
              </div>
              <div className="relative h-3 w-full bg-gradient-to-r from-red-200 via-amber-200 to-emerald-300 rounded-sm overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-[#14171F] ring-2 ring-white shadow-md transition-all duration-1000"
                  style={{ left: `${Math.min(Math.max(scan.ats_score, 4), 98)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between font-[family-name:var(--font-mono)] text-[10px] text-[#8A8F99]">
                <span>&lt; 60 Auto-Reject</span>
                <span>65 Average Pool</span>
                <span>80 Interview Gate</span>
                <span>90+ Offer Magnet</span>
              </div>
            </div>
          </div>

          {/* 4 Deep-Dive Submetrics */}
          <div className="print-card rounded-sm border border-[#DBD8CE] bg-white p-7 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                  Spider Algorithm Diagnostics
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#6B7280]">
                  4 Evaluation Pillars
                </span>
              </div>

              <div className="space-y-4">
                {/* 1. Keywords */}
                <div className="rounded-sm border border-[#EDEBE3] p-3.5 hover:border-[#DBD8CE] transition-all bg-[#FAF9F5]">
                  <div className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#14171F]">Semantic Keywords &amp; Competencies</span>
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#8A8F99]">
                        ({foundKeywordsCount}/{totalKeywordsCount} Found)
                      </span>
                    </div>
                    <span className="font-[family-name:var(--font-mono)] font-bold text-[#14171F]">
                      {scan.score_breakdown?.keyword_score ?? matchPercentage}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#14171F] rounded-full transition-all duration-700"
                      style={{ width: `${scan.score_breakdown?.keyword_score ?? matchPercentage}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-[#6B7280]">
                    Direct phrase matches for role requirements, technical toolchains, and management terminology.
                  </p>
                </div>

                {/* 2. Quantified Impact */}
                <div className="rounded-sm border border-[#EDEBE3] p-3.5 hover:border-[#DBD8CE] transition-all bg-[#FAF9F5]">
                  <div className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#14171F]">Quantified Metrics &amp; Business Scale</span>
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#8A8F99]">
                        (Google X-Y-Z)
                      </span>
                    </div>
                    <span className="font-[family-name:var(--font-mono)] font-bold text-[#14171F]">
                      {scan.score_breakdown?.impact_score ?? 70}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D7FF3E] rounded-full transition-all duration-700"
                      style={{ width: `${scan.score_breakdown?.impact_score ?? 70}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-[#6B7280]">
                    Percentage of bullet points containing hard figures, dollar volumes, percentages, or time reductions.
                  </p>
                </div>

                {/* 3. Formatting */}
                <div className="rounded-sm border border-[#EDEBE3] p-3.5 hover:border-[#DBD8CE] transition-all bg-[#FAF9F5]">
                  <div className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#14171F]">Parser Ingestion &amp; Layout Integrity</span>
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#8A8F99]">
                        (AST Cleanliness)
                      </span>
                    </div>
                    <span className="font-[family-name:var(--font-mono)] font-bold text-[#14171F]">
                      {scan.score_breakdown?.format_score ?? 82}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#14171F] rounded-full transition-all duration-700"
                      style={{ width: `${scan.score_breakdown?.format_score ?? 82}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-[#6B7280]">
                    Detects table conflicts, header/footer text loss, multi-column errors, and unparsable glyphs.
                  </p>
                </div>

                {/* 4. Readability */}
                <div className="rounded-sm border border-[#EDEBE3] p-3.5 hover:border-[#DBD8CE] transition-all bg-[#FAF9F5]">
                  <div className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#14171F]">Executive Tone &amp; Readability Index</span>
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#8A8F99]">
                        (Action Verbs)
                      </span>
                    </div>
                    <span className="font-[family-name:var(--font-mono)] font-bold text-[#14171F]">
                      {scan.score_breakdown?.readability_score ?? 85}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#14171F] rounded-full transition-all duration-700"
                      style={{ width: `${scan.score_breakdown?.readability_score ?? 85}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-[#6B7280]">
                    Flesch-Kincaid grade evaluation: eliminates filler passive adverbs and corporate jargon.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F0EEE7] flex items-center justify-between font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
              <span>Simulated against 2026 hiring bar</span>
              <button
                type="button"
                onClick={() => setActiveTab("keywords")}
                className="text-[#14171F] font-semibold hover:underline"
              >
                Inspect Skill Matrix →
              </button>
            </div>
          </div>
        </div>

        {/* INTERACTIVE NAVIGATION TABS */}
        <div className="mt-12 no-print border-b border-[#DBD8CE] flex flex-wrap items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-[#14171F] text-[#14171F] bg-white/70"
                : "border-transparent text-[#6B7280] hover:text-[#14171F] hover:bg-white/40"
            }`}
          >
            <span>Overview &amp; Section Checks</span>
            <span className="text-[10px] bg-[#EDEBE3] px-1.5 py-0.2 rounded-full">
              {scan.section_checks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("keywords")}
            className={`px-4 py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "keywords"
                ? "border-[#14171F] text-[#14171F] bg-white/70"
                : "border-transparent text-[#6B7280] hover:text-[#14171F] hover:bg-white/40"
            }`}
          >
            <span>Keywords &amp; Skill Matrix</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                totalKeywordsCount - foundKeywordsCount > 0
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {totalKeywordsCount - foundKeywordsCount} missing
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rewrites")}
            className={`px-4 py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "rewrites"
                ? "border-[#14171F] text-[#14171F] bg-white/70"
                : "border-transparent text-[#6B7280] hover:text-[#14171F] hover:bg-white/40"
            }`}
          >
            <span>Google X-Y-Z Rewrites</span>
            <span className="text-[10px] bg-[#D7FF3E] text-[#14171F] px-1.5 py-0.2 rounded-full font-bold">
              {scan.line_issues.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("parser")}
            className={`px-4 py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "parser"
                ? "border-[#14171F] text-[#14171F] bg-white/70"
                : "border-transparent text-[#6B7280] hover:text-[#14171F] hover:bg-white/40"
            }`}
          >
            <span>Raw ATS Spider View</span>
            <span className="text-[10px] bg-slate-200 text-[#14171F] px-1.5 py-0.2 rounded-full font-mono">
              Stream
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("match")}
            className={`px-4 py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "match"
                ? "border-[#14171F] text-[#14171F] bg-white/70"
                : "border-transparent text-[#6B7280] hover:text-[#14171F] hover:bg-white/40"
            }`}
          >
            <span>Role Match Customizer</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & SECTION CHECKS */}
        {(activeTab === "overview" || typeof window === "undefined") && (
          <div className="mt-8 space-y-8">
            {/* Action Checklist Strip */}
            <div className="rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0EEE7] pb-4">
                <div>
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                    Immediate Action Checklist
                  </span>
                  <h3 className="font-[family-name:var(--font-serif)] text-xl font-bold text-[#14171F] mt-0.5">
                    What to fix before sending your next application
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-[family-name:var(--font-mono)] text-[12px] text-[#5A606D]">
                    {scan.section_checks.filter((s) => s.status === "pass").length} of {scan.section_checks.length} system rules passed
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scan.section_checks.map((check) => {
                  const cfg = STATUS_CONFIG[check.status] || STATUS_CONFIG.pass;
                  return (
                    <div
                      key={check.label}
                      className={`p-4 rounded-sm border ${cfg.border} ${cfg.bg} flex flex-col justify-between transition-all hover:shadow-xs`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-[14px] font-semibold text-[#14171F]">{check.label}</h4>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-mono)] font-semibold border ${cfg.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="mt-2 text-[12.5px] text-[#4A4F58] leading-relaxed">
                          {check.detail}
                        </p>
                      </div>

                      {check.notes && (
                        <div className="mt-3 pt-2.5 border-t border-black/5 font-[family-name:var(--font-mono)] text-[11px] text-[#6B7280]">
                          <span className="font-semibold text-[#14171F]">ATS Parser Note: </span>
                          {check.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-[#F0EEE7] flex flex-wrap items-center justify-between gap-3 font-[family-name:var(--font-mono)] text-[12px]">
                <span className="text-[#6B7280]">
                  Single-column standard ensures zero text-block collision in Workday &amp; Taleo.
                </span>
                <Link
                  href="/resume-builder"
                  className="font-bold text-[#14171F] hover:underline flex items-center gap-1"
                >
                  <span>Launch Clean ATS Resume Builder</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Quick Priority Box */}
            <div className="rounded-sm border border-[#14171F] bg-[#14171F] text-[#F6F5F1] p-6 sm:p-8 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.12em] text-[#D7FF3E]">
                    Priority 1: Urgent Fix
                  </span>
                  <h4 className="mt-1 font-[family-name:var(--font-serif)] text-lg font-bold text-white">
                    Flatten Multi-Column Layouts
                  </h4>
                  <p className="mt-1.5 text-[13px] text-[#B9BCC4] leading-relaxed">
                    Tables and side-by-side text boxes are read sequentially by parsing robots. Convert any two-column skill or education block into clean bullet points.
                  </p>
                </div>
                <div>
                  <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.12em] text-[#D7FF3E]">
                    Priority 2: Keyword Injection
                  </span>
                  <h4 className="mt-1 font-[family-name:var(--font-serif)] text-lg font-bold text-white">
                    Integrate {totalKeywordsCount - foundKeywordsCount} Missing Role Terms
                  </h4>
                  <p className="mt-1.5 text-[13px] text-[#B9BCC4] leading-relaxed">
                    Incorporate missing competencies into existing experience bullet points rather than dumping a raw list at the bottom.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("keywords")}
                    className="mt-2 text-[12px] font-[family-name:var(--font-mono)] text-[#D7FF3E] hover:underline"
                  >
                    View missing keywords →
                  </button>
                </div>
                <div>
                  <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.12em] text-[#D7FF3E]">
                    Priority 3: Google X-Y-Z Format
                  </span>
                  <h4 className="mt-1 font-[family-name:var(--font-serif)] text-lg font-bold text-white">
                    Quantify Routine Duties
                  </h4>
                  <p className="mt-1.5 text-[13px] text-[#B9BCC4] leading-relaxed">
                    Convert &quot;Responsible for...&quot; phrases into &quot;Accomplished [X], as measured by [Y], by doing [Z]&quot;.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("rewrites")}
                    className="mt-2 text-[12px] font-[family-name:var(--font-mono)] text-[#D7FF3E] hover:underline"
                  >
                    Review {scan.line_issues.length} suggested rewrites →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KEYWORDS & SKILL MATRIX */}
        {(activeTab === "keywords" || typeof window === "undefined") && (
          <div className="mt-8 space-y-6">
            <div className="rounded-sm border border-[#DBD8CE] bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#F0EEE7] pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                      Semantic Keyword Match Intelligence
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] bg-[#EDEBE3] px-2 py-0.5 rounded-full text-[#5A606D]">
                      Exact &amp; Synonym Match
                    </span>
                  </div>
                  <h2 className="mt-1 font-[family-name:var(--font-serif)] text-2xl font-bold tracking-tight text-[#14171F]">
                    {foundKeywordsCount} of {totalKeywordsCount} Role Competencies Detected ({matchPercentage}% Match)
                  </h2>
                  <p className="mt-1 text-[13px] text-[#5A606D] max-w-2xl">
                    High-scoring candidates typically reach 80%+ keyword density for senior roles. Click any missing skill to preview and copy recruiter-ready bullet points.
                  </p>
                </div>

                {/* Filter and Search Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Status Filter */}
                  <div className="flex rounded-sm border border-[#DBD8CE] bg-[#FAF9F5] p-0.5 font-[family-name:var(--font-mono)] text-[11px]">
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

                  {/* Category Dropdown */}
                  {categories.length > 0 && (
                    <select
                      value={keywordCategory}
                      onChange={(e) => setKeywordCategory(e.target.value)}
                      className="rounded-sm border border-[#DBD8CE] bg-white px-2.5 py-1 text-[11.5px] font-[family-name:var(--font-mono)] text-[#14171F] focus:outline-none"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Search bar */}
                  <input
                    type="text"
                    value={keywordSearch}
                    onChange={(e) => setKeywordSearch(e.target.value)}
                    placeholder="Search keyword..."
                    className="rounded-sm border border-[#DBD8CE] bg-white px-3 py-1 text-[12px] font-[family-name:var(--font-mono)] focus:outline-none focus:border-[#14171F] w-36 sm:w-44"
                  />
                </div>
              </div>

              {/* Keyword Badges Grid */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredKeywords.map((k) => (
                  <div
                    key={k.term}
                    onClick={() => {
                      if (!k.found) setSelectedKeywordForAdvice(k.term);
                    }}
                    className={`print-card flex items-center justify-between rounded-sm border p-3.5 transition-all ${
                      k.found
                        ? "border-[#DBD8CE] bg-white"
                        : "border-amber-200 bg-[#FCF8EC] hover:border-amber-400 cursor-pointer shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[13.5px] font-semibold text-[#14171F] truncate">{k.term}</span>
                      {k.category && (
                        <span className="rounded-sm bg-[#EDEBE3] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[9.5px] uppercase tracking-wider text-[#6B6F79]">
                          {k.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {k.found ? (
                        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-sm font-semibold text-[#2F6B45] bg-[#2F6B45]/10 flex items-center gap-1">
                          <span>✓</span>
                          <span>Found{k.frequency ? ` (${k.frequency}x)` : ""}</span>
                        </span>
                      ) : (
                        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-sm font-semibold text-[#8A6B1F] bg-[#8A6B1F]/15 flex items-center gap-1">
                          <span>Missing</span>
                          <span className="text-[9px]">💡 Fix</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredKeywords.length === 0 && (
                <div className="mt-8 text-center py-10 border border-dashed border-[#DBD8CE] rounded-sm font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
                  No keywords match the selected filter or search query.
                </div>
              )}
            </div>

            {/* Keyword Advice Drawer / Modal for Missing Skill */}
            {selectedKeywordForAdvice && (
              <div className="rounded-sm border-2 border-[#14171F] bg-white p-6 sm:p-8 shadow-lg animate-fade-in relative">
                <button
                  type="button"
                  onClick={() => setSelectedKeywordForAdvice(null)}
                  className="absolute top-4 right-4 text-[#8A8F99] hover:text-[#14171F] text-xl font-mono leading-none"
                  aria-label="Close advice box"
                >
                  ×
                </button>

                <div className="flex items-center gap-2">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A6B1F] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm font-bold">
                    Target Skill Insertion Assistant
                  </span>
                  <span className="text-[#8A8F99] text-xs">•</span>
                  <span className="font-semibold text-sm text-[#14171F]">
                    Skill: &ldquo;{selectedKeywordForAdvice}&rdquo;
                  </span>
                </div>

                <h3 className="mt-2 font-[family-name:var(--font-serif)] text-xl font-bold text-[#14171F]">
                  How to naturally integrate &ldquo;{selectedKeywordForAdvice}&rdquo; into your experience
                </h3>

                <p className="mt-2 text-[13.5px] text-[#5A606D]">
                  {KEYWORD_SUGGESTIONS[selectedKeywordForAdvice]?.why ||
                    "Applicant Tracking Systems scan for this exact term to qualify senior applicants. Inject it into a past accomplishment rather than listing it without context."}
                </p>

                <div className="mt-5 space-y-3">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-[#8A8F99] block font-semibold">
                    Recruiter-Tested Example Bullet Points:
                  </span>
                  {(
                    KEYWORD_SUGGESTIONS[selectedKeywordForAdvice]?.examples || [
                      `Led cross-functional alignment on ${selectedKeywordForAdvice.toLowerCase()}, delivering key milestones with a 25% efficiency improvement.`,
                      `Pioneered ${selectedKeywordForAdvice.toLowerCase()} best practices across team workflows, directly influencing quarterly business impact.`,
                    ]
                  ).map((bullet, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-sm border border-[#DBD8CE] bg-[#FAF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <p className="text-[13.5px] text-[#14171F] leading-snug">
                        • {bullet}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopyExampleBullet(bullet)}
                        className="self-start sm:self-auto rounded-sm border border-[#14171F] bg-white px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-[#14171F] hover:bg-[#14171F] hover:text-white transition-all whitespace-nowrap shadow-xs"
                      >
                        {copiedExampleBullet === bullet ? "Copied ✓" : "Copy Bullet"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GOOGLE X-Y-Z REWRITES */}
        {(activeTab === "rewrites" || typeof window === "undefined") && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DBD8CE] pb-4">
              <div>
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                  Recruiter Conversion Formula
                </span>
                <h2 className="mt-1 font-[family-name:var(--font-serif)] text-2xl font-bold tracking-tight text-[#14171F]">
                  Google X-Y-Z Formula Bullet Rewrites
                </h2>
                <p className="mt-1 text-[13px] text-[#5A606D] max-w-xl">
                  Laszlo Bock (Former Google SVP of People Ops) formula: <span className="font-semibold text-[#14171F]">&ldquo;Accomplished [X], as measured by [Y], by doing [Z]&rdquo;</span>.
                </p>
              </div>

              <Link
                href="/improve"
                className="no-print rounded-sm bg-[#14171F] px-4 py-2 font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-[0.08em] text-[#F6F5F1] hover:bg-[#2A2E38] transition-all flex items-center gap-1.5"
              >
                <span>Launch Interactive Rewriter Studio</span>
                <span>→</span>
              </Link>
            </div>

            <div className="space-y-4">
              {scan.line_issues.map((item, i) => (
                <div
                  key={i}
                  className="print-card rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-sm transition-all hover:border-[#14171F]/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[#B5563E] font-semibold bg-red-50 border border-red-200 px-2 py-0.5 rounded-sm">
                      Identified Weakness: {item.issue}
                    </span>
                    <div className="flex items-center gap-2 no-print">
                      <button
                        type="button"
                        onClick={() => handleCopyRewrite(item.rewrite, i)}
                        className="rounded-sm border border-[#DBD8CE] bg-white px-3 py-1 font-[family-name:var(--font-mono)] text-[11.5px] text-[#14171F] hover:bg-[#F6F5F1] transition-colors shadow-xs"
                      >
                        {copiedIndex === i ? "Copied to Clipboard ✓" : "Copy Rewrite"}
                      </button>
                      <Link
                        href={`/improve?bullet=${encodeURIComponent(item.original)}&issue=${encodeURIComponent(item.issue)}`}
                        className="rounded-sm border border-[#DBD8CE] bg-[#FAF9F5] px-3 py-1 font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-[0.06em] text-[#14171F] hover:bg-white transition-colors"
                      >
                        Fine-tune in Studio →
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Original */}
                    <div className="border-l-3 border-red-300 pl-3.5 bg-red-50/20 p-3 rounded-r-sm">
                      <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase text-red-600 font-bold block mb-1">
                        Original Weak Framing (Filtered by ATS)
                      </span>
                      <p className="text-[13.5px] text-[#6B7280] line-through decoration-red-300 leading-relaxed">
                        {item.original}
                      </p>
                    </div>

                    {/* Rewrite */}
                    <div className="border-l-3 border-[#D7FF3E] pl-3.5 bg-emerald-50/30 p-3 rounded-r-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase text-emerald-800 font-bold block">
                          Redline Google X-Y-Z Rewrite
                        </span>
                        <span className="font-[family-name:var(--font-mono)] text-[9.5px] uppercase tracking-wider bg-[#D7FF3E] text-[#14171F] px-1.5 py-0.2 rounded-xs font-bold">
                          Impact Verified
                        </span>
                      </div>
                      <p className="text-[14px] font-medium text-[#14171F] leading-relaxed">
                        {item.rewrite}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RAW ATS SPIDER VIEW */}
        {(activeTab === "parser" || typeof window === "undefined") && (
          <div className="mt-8 space-y-6">
            <div className="rounded-sm border border-[#DBD8CE] bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0EEE7] pb-4">
                <div>
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                    Spider Parser Extraction Stream
                  </span>
                  <h2 className="mt-0.5 font-[family-name:var(--font-serif)] text-2xl font-bold text-[#14171F]">
                    How Enterprise ATS Engines Ingest Your Text
                  </h2>
                </div>
                <div className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-[11.5px] text-[#5A606D]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>UTF-8 Token Stream Verified</span>
                </div>
              </div>

              <p className="mt-3 text-[13px] text-[#5A606D] leading-relaxed">
                Workday, Greenhouse, Taleo, and iCIMS strip all CSS styles, graphics, margins, and icons. If your extracted text below contains merged lines, missing sections, or broken phone numbers, human recruiters will receive a broken candidate record.
              </p>

              {/* Spider Stream Window */}
              <div className="mt-5 rounded-sm border border-[#DBD8CE] bg-[#14171F] p-5 text-[#E6E8EC] font-[family-name:var(--font-mono)] text-[12.5px] leading-relaxed overflow-x-auto shadow-inner">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-[11px] text-[#8A8F99]">
                  <span>AST_TEXT_STREAM :: RAW_PARSE_OUTPUT</span>
                  <span>LINES: {(scan.raw_text || SAMPLE_SCAN.raw_text || "").split("\n").length}</span>
                </div>
                <pre className="whitespace-pre-wrap font-[family-name:var(--font-mono)] select-all">
                  {scan.raw_text || SAMPLE_SCAN.raw_text}
                </pre>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-[family-name:var(--font-mono)] text-[11.5px] text-[#6B7280]">
                <span>Status: No corrupted font ligatures or binary control characters detected.</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(scan.raw_text || SAMPLE_SCAN.raw_text || "");
                    showToast("Raw text stream copied to clipboard");
                  }}
                  className="text-[#14171F] font-semibold hover:underline"
                >
                  Copy Raw Text Stream →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ROLE MATCH CUSTOMIZER */}
        {(activeTab === "match" || typeof window === "undefined") && (
          <div className="mt-8 space-y-6">
            <div className="rounded-sm border border-[#DBD8CE] bg-white p-6 sm:p-8 shadow-sm">
              <div className="border-b border-[#F0EEE7] pb-4">
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                  Live Role Match Comparator
                </span>
                <h2 className="mt-0.5 font-[family-name:var(--font-serif)] text-2xl font-bold text-[#14171F]">
                  Tailor Against a Specific Job Posting
                </h2>
                <p className="mt-1 text-[13px] text-[#5A606D]">
                  Paste a job description below to test real-time skill alignment or start a fresh targeted scan.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="jobPostingInput"
                    className="block font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-[#14171F] font-semibold mb-1.5"
                  >
                    Target Job Description / Responsibilities
                  </label>
                  <textarea
                    id="jobPostingInput"
                    rows={8}
                    value={customJobDesc}
                    onChange={(e) => setCustomJobDesc(e.target.value)}
                    placeholder="Paste the full job posting requirements here..."
                    className="w-full rounded-sm border border-[#DBD8CE] p-3 text-[13px] font-[family-name:var(--font-mono)] text-[#14171F] placeholder-[#8A8F99] focus:outline-none focus:border-[#14171F] bg-[#FAF9F5]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#6B7280]">
                    Tip: Target at least 70% direct keyword overlap for competitive tech and finance roles.
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setScan((prev) => ({
                          ...prev,
                          job_description: customJobDesc || prev.job_description,
                        }));
                        showToast("Role updated in session memory!");
                        setActiveTab("keywords");
                      }}
                      className="rounded-sm bg-[#14171F] px-4 py-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#F6F5F1] hover:bg-[#2A2E38] transition-all"
                    >
                      Update Audit Context
                    </button>
                    <Link
                      href="/upload"
                      className="rounded-sm border border-[#DBD8CE] bg-white px-4 py-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#14171F] hover:bg-[#FAF9F5] transition-all"
                    >
                      Run Full AI Rescan →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM ACTION STRIP */}
        <div className="no-print mt-14 rounded-sm border border-[#DBD8CE] bg-[#14171F] px-6 sm:px-10 py-10 text-center shadow-lg text-[#F6F5F1]">
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#D7FF3E] font-semibold">
            Next Steps in Your Preparation
          </span>
          <h3 className="mt-2 font-[family-name:var(--font-serif)] text-2xl font-bold sm:text-3xl">
            Convert This ATS Score Into Interview Offers
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-[14px] leading-relaxed text-[#B9BCC4]">
            Rehearse mock interview questions generated directly from your resume&apos;s weakest areas, draft a matching cover letter, or rebuild your resume layout.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3.5">
            <Link
              href={`/mock-interview?role=${encodeURIComponent(
                scan.job_description || (scan.file_name ? scan.file_name.replace(/\.[^/.]+$/, "") : "Target Role")
              )}&jobDescription=${encodeURIComponent(scan.job_description || "")}`}
              className="rounded-sm bg-[#D7FF3E] px-6 py-3 font-[family-name:var(--font-mono)] text-[12.5px] uppercase tracking-[0.08em] text-[#14171F] font-bold hover:bg-[#cbf530] transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>Practice AI Audio Interview</span>
              <span>→</span>
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
              Draft Matching Cover Letter
            </Link>
            <Link
              href="/resume-builder"
              className="rounded-sm border border-[#3A3F4D] bg-white/5 px-6 py-3 font-[family-name:var(--font-mono)] text-[12.5px] uppercase tracking-[0.08em] text-[#F6F5F1] hover:bg-white/10 transition-colors"
            >
              Edit in Resume Builder
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
