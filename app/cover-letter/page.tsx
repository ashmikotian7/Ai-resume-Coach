"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/navbar/Header";
import Footer from "@/components/common/Footer";

type Tone = "confident" | "direct" | "academic";

const TONES: { id: Tone; label: string; description: string; tag: string }[] = [
  {
    id: "confident",
    label: "Executive & Outcome-Driven",
    description: "Assertive, quantifies leadership scale, highlights high-impact business outcomes.",
    tag: "Recommended for Senior / Staff",
  },
  {
    id: "direct",
    label: "Direct & Punchy",
    description: "Zero fluff or boilerplate, cuts straight to problem-solving capability and proof points.",
    tag: "High Growth Startups",
  },
  {
    id: "academic",
    label: "Technical & Methodological",
    description: "Deep domain architecture, analytical rigor, systems thinking and technical decisions.",
    tag: "Engineering & R&D",
  },
];

const SAMPLE_EXPERIENCE = `Senior Software Engineer with 6+ years designing distributed systems.
• Re-architected payment orchestration pipeline in Go and Kafka, cutting p99 processing latency by 44% across 8M transactions daily.
• Led cloud migration of legacy monolith to AWS ECS and Kubernetes, saving $140K in annualized infrastructure spend.
• Mentored 5 mid-level engineers and drove team adoption of trunk-based development and canary deployments.`;

const SAMPLE_JOB = `Senior Backend Infrastructure Engineer at Stripe.
Responsibilities:
- Build fault-tolerant distributed systems capable of handling billions in transaction volume.
- Work closely with security, reliability, and platform engineering teams.
- Must have deep experience with Golang, distributed messaging (Kafka/RabbitMQ), and cloud architecture (AWS/K8s).`;

export default function CoverLetterPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobPosting, setJobPosting] = useState("");
  const [tone, setTone] = useState<Tone>("confident");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);

  const [generatedLetter, setGeneratedLetter] = useState<string>("");
  const [highlights, setHighlights] = useState<string[]>([]);

  // Pre-load resume & job posting from latest scan in sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedScan = window.sessionStorage.getItem("redline_current_scan");
        if (storedScan) {
          const parsed = JSON.parse(storedScan);
          if (parsed.raw_text) {
            setResumeText(parsed.raw_text);
            setLoadedFileName(parsed.file_name || "Latest Uploaded Resume");
          }
          if (parsed.job_description) {
            setJobPosting(parsed.job_description);
          }
        }
      } catch (err) {
        console.warn("Could not read stored scan for cover letter:", err);
      }
    }
  }, []);

  const handleLoadSample = () => {
    setResumeText(SAMPLE_EXPERIENCE);
    setJobPosting(SAMPLE_JOB);
    setLoadedFileName("Sample_Engineer_Profile.pdf");
  };

  const handleGenerate = async () => {
    setError("");
    if (!resumeText.trim() || resumeText.trim().length < 20) {
      setError("Please provide at least a summary of your resume experience (minimum 20 characters).");
      return;
    }
    if (!jobPosting.trim() || jobPosting.trim().length < 20) {
      setError("Please paste the target job description or requirements (minimum 20 characters).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          jobPosting: jobPosting.trim(),
          tone,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate cover letter.");
      }

      const data = await res.json();
      setGeneratedLetter(data.coverLetter || "");
      setHighlights(data.highlights || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generating cover letter";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownloadTxt = () => {
    if (!generatedLetter) return;
    const blob = new Blob([generatedLetter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Cover_Letter_${tone}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const wordCount = generatedLetter
    ? generatedLetter.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#14171F] flex flex-col justify-between print:bg-white">
      {/* Print Styles */}
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
          .print-full {
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="no-print">
        <Header />
      </div>

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-10 flex-grow">
        {/* TITLE & HEADER */}
        <div className="no-print border-b border-[#DBD8CE]/80 pb-6 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                Cover Letter Studio
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#D7FF3E]" />
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#5A606D]">
                Tailored Alignment Engine
              </span>
            </div>
            <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight sm:text-4xl text-[#14171F]">
              Argue your specific case for this exact role.
            </h1>
            <p className="mt-1 text-[15px] leading-relaxed text-[#5A606D] max-w-2xl">
              Zero boilerplate or robotic templates. Redline extracts proof points from your resume and matches them directly against the hiring team&apos;s primary requirements.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadSample}
            className="no-print self-start md:self-auto rounded-sm border border-[#DBD8CE] bg-white px-3.5 py-2 font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-wider text-[#14171F] hover:bg-[#FAF9F5] shadow-xs"
          >
            Load Sample Scenario
          </button>
        </div>

        {/* TWO-COLUMN STUDIO */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* LEFT: INPUTS */}
          <div className="space-y-6 no-print">
            {/* RESUME INPUT */}
            <div className="rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79] font-bold">
                  Candidate Experience / Resume Bullet Points
                </label>
                {loadedFileName && (
                  <span className="rounded-full bg-[#D7FF3E]/30 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[#14171F] font-semibold">
                    ✓ Linked: {loadedFileName}
                  </span>
                )}
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste key achievements, leadership highlights, or your recent resume text…"
                rows={6}
                className="w-full resize-none rounded-sm border border-[#DBD8CE] bg-white p-3 font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40"
              />
              <div className="mt-2 flex items-center justify-between font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                <span>Quantifiable outcomes work best</span>
                <span>{resumeText.trim().split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </div>

            {/* JOB POSTING INPUT */}
            <div className="rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79] font-bold">
                  Target Job Description &amp; Requirements
                </label>
                <span className="font-[family-name:var(--font-mono)] text-[10.5px] text-[#8A8F99]">
                  Required for matching
                </span>
              </div>
              <textarea
                value={jobPosting}
                onChange={(e) => setJobPosting(e.target.value)}
                placeholder="Paste the job description, core responsibilities, and required tech stack…"
                rows={6}
                className="w-full resize-none rounded-sm border border-[#DBD8CE] bg-white p-3 font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40"
              />
              <div className="mt-2 text-right font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                {jobPosting.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

            {/* TONE PICKER */}
            <div className="rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-sm">
              <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79] font-bold block mb-3">
                Strategic Tone &amp; Framing
              </label>
              <div className="space-y-2.5">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`flex w-full items-start justify-between rounded-sm border p-4 text-left transition-all ${
                      tone === t.id
                        ? "border-[#14171F] bg-[#14171F] text-[#F6F5F1] shadow-xs"
                        : "border-[#DBD8CE] bg-white text-[#4A4F58] hover:border-[#B7B4A9] hover:bg-[#FAF9F5]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-mono)] text-[12.5px] uppercase tracking-[0.06em] font-semibold">
                          {t.label}
                        </span>
                        <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-[family-name:var(--font-mono)] font-bold ${
                          tone === t.id ? "bg-[#D7FF3E] text-[#14171F]" : "bg-[#EDEBE3] text-[#6B7280]"
                        }`}>
                          {t.tag}
                        </span>
                      </div>
                      <div
                        className={`mt-1.5 text-[12px] leading-snug ${
                          tone === t.id ? "text-[#D7FF3E]" : "text-[#8A8F99]"
                        }`}
                      >
                        {t.description}
                      </div>
                    </div>
                    {tone === t.id && (
                      <span className="shrink-0 text-base font-bold text-[#D7FF3E]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-sm border border-red-200 bg-red-50 p-4 font-[family-name:var(--font-sans)] text-sm text-red-800">
                {error}
              </div>
            )}

            {/* GENERATE BUTTON */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#14171F] py-4 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] font-bold transition-all hover:bg-[#2A2E38] disabled:opacity-60 shadow-md active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Aligning Experience &amp; Generating Letter…
                </>
              ) : (
                "Generate Tailored Cover Letter →"
              )}
            </button>

            {/* HIGHLIGHTS */}
            {highlights.length > 0 && (
              <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-xs">
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99] font-bold block mb-3">
                  AI Alignment Proof Points
                </span>
                <ul className="space-y-2">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#14171F]">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT: PREVIEW PANE */}
          <div className="flex flex-col">
            <div className="mb-3 flex items-center justify-between no-print">
              <div className="flex items-center gap-3">
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99] font-bold">
                  Document Preview
                </span>
                {generatedLetter && (
                  <span className="rounded-full bg-[#EDEBE3] px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[#6B6F79]">
                    {wordCount} words · ~{Math.ceil(wordCount / 200)} min read
                  </span>
                )}
              </div>
              {generatedLetter && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-sm border border-[#DBD8CE] bg-white px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#14171F] hover:bg-[#FAF9F5]"
                  >
                    {copied ? "Copied! ✓" : "Copy text"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="rounded-sm border border-[#DBD8CE] bg-white px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#14171F] hover:bg-[#FAF9F5]"
                  >
                    .txt
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="rounded-sm bg-[#14171F] px-3.5 py-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#F6F5F1] hover:bg-[#2A2E38]"
                  >
                    Export PDF
                  </button>
                </div>
              )}
            </div>

            {/* LETTERHEAD CONTAINER */}
            <div className="print-full flex-1 rounded-sm border border-[#DBD8CE] bg-white p-8 sm:p-12 shadow-sm min-h-[550px] relative">
              {generatedLetter ? (
                <div>
                  {/* Subtle stationery header */}
                  <div className="border-b border-[#EDEBE3] pb-6 mb-6 flex justify-between items-end font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
                    <div>
                      <span className="font-bold text-[#14171F] block text-sm">Application for Employment</span>
                      <span>Target Role Alignment</span>
                    </div>
                    <div>
                      <span>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>

                  <div className="font-[family-name:var(--font-serif)] text-[16px] leading-[1.75] text-[#14171F] space-y-4">
                    {generatedLetter.split("\n\n").map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))}
                  </div>

                  {/* Sign-off footer */}
                  <div className="mt-8 pt-6 border-t border-[#EDEBE3] font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99] flex justify-between">
                    <span>Generated via Redline Precision Engine</span>
                    <span>Ready for Submission</span>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[440px] flex-col items-center justify-center text-center p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#DBD8CE] bg-[#F6F5F1] text-[#8A8F99]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <h3 className="mt-5 font-[family-name:var(--font-serif)] text-lg font-bold text-[#14171F]">
                    Your customized cover letter will appear here.
                  </h3>
                  <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-[#5A606D]">
                    Paste your resume highlights and target job description, choose your strategic tone, and click generate to craft a tailored letter.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="mt-5 text-[12px] font-[family-name:var(--font-mono)] uppercase tracking-wider text-[#14171F] underline underline-offset-4 hover:text-black font-semibold"
                  >
                    Or try with a sample scenario →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="no-print">
        <Footer />
      </div>
    </div>
  );
}
