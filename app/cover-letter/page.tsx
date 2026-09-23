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

type Tone = "direct" | "confident" | "academic";

const TONES: { id: Tone; label: string; description: string }[] = [
  {
    id: "confident",
    label: "Confident & Executive",
    description: "Assertive, outcome-driven, highlights quantifiable leadership and scale.",
  },
  {
    id: "direct",
    label: "Direct & Punchy",
    description: "Zero fluff, cuts to the point immediately, bulleted proof points.",
  },
  {
    id: "academic",
    label: "Academic & Technical",
    description: "Methodological rigor, domain depth, architectural and analytical precision.",
  },
];

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
    <div
      className={`${sans.variable} ${serif.variable} ${mono.variable} min-h-screen bg-[#F6F5F1] font-[family-name:var(--font-sans)] text-[#14171F] antialiased print:bg-white`}
    >
      {/* Print Styles */}
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
          .print-full {
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-[#DBD8CE] bg-[#F6F5F1]/90 backdrop-blur no-print">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-serif)] text-lg font-semibold tracking-tight"
          >
            Redline<span className="text-[#8A8F99]">.</span>
          </Link>
          <div className="flex items-center gap-6">
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="no-print">
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
            Cover Letter Studio
          </span>
          <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight sm:text-4xl">
            Tailor a compelling argument for this exact role.
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#4A4F58]">
            Not a generic template with your name slotted in. We match your specific verified achievements directly against the employer&apos;s critical job requirements.
          </p>
        </div>

        {/* TWO-COLUMN STUDIO */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* LEFT: INPUTS */}
          <div className="space-y-6 no-print">
            {/* RESUME INPUT */}
            <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]">
                  Candidate Experience / Resume Text
                </label>
                {loadedFileName && (
                  <span className="rounded bg-[#D7FF3E]/30 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[#14171F]">
                    ✓ Linked: {loadedFileName}
                  </span>
                )}
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste key sections from your resume (Work Experience, Skills, Impact metrics)…"
                rows={6}
                className="mt-2 w-full resize-none rounded-sm border border-[#DBD8CE] bg-white px-3.5 py-2.5 font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40"
              />
              <div className="mt-1 text-right font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                {resumeText.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

            {/* JOB POSTING INPUT */}
            <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]">
                  Target Job Description
                </label>
                <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                  Required for exact alignment
                </span>
              </div>
              <textarea
                value={jobPosting}
                onChange={(e) => setJobPosting(e.target.value)}
                placeholder="Paste the job requirements, responsibilities, and company details…"
                rows={6}
                className="mt-2 w-full resize-none rounded-sm border border-[#DBD8CE] bg-white px-3.5 py-2.5 font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40"
              />
              <div className="mt-1 text-right font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                {jobPosting.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

            {/* TONE PICKER */}
            <div className="rounded-sm border border-[#DBD8CE] bg-white p-5 shadow-sm">
              <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]">
                Strategic Tone
              </label>
              <div className="mt-3 space-y-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`flex w-full items-start justify-between rounded-sm border p-3 text-left transition-colors ${
                      tone === t.id
                        ? "border-[#14171F] bg-[#14171F] text-[#F6F5F1]"
                        : "border-[#DBD8CE] bg-white text-[#4A4F58] hover:border-[#B7B4A9]"
                    }`}
                  >
                    <div>
                      <div className="font-[family-name:var(--font-mono)] text-[12.5px] uppercase tracking-[0.06em]">
                        {t.label}
                      </div>
                      <div
                        className={`mt-1 text-[12px] leading-snug ${
                          tone === t.id ? "text-[#D7FF3E]" : "text-[#8A8F99]"
                        }`}
                      >
                        {t.description}
                      </div>
                    </div>
                    {tone === t.id && (
                      <span className="shrink-0 text-sm font-bold text-[#D7FF3E]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-sm border border-[#E8B4B4] bg-[#FBEAEA] px-4 py-3 font-[family-name:var(--font-sans)] text-sm text-[#9A3B3B]">
                {error}
              </div>
            )}

            {/* GENERATE BUTTON */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#14171F] py-3.5 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Analyzing Alignment & Drafting Letter…
                </>
              ) : (
                "Generate Tailored Cover Letter →"
              )}
            </button>

            {/* HIGHLIGHTS PILL LIST */}
            {highlights.length > 0 && (
              <div className="rounded-sm border border-[#DBD8CE] bg-[#F6F5F1] p-5">
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
                  AI Key Alignment Points
                </span>
                <ul className="mt-3 space-y-2">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#14171F]">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#14171F]" />
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
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
                  Live Preview
                </span>
                {generatedLetter && (
                  <span className="rounded bg-[#EDEBE3] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[#6B6F79]">
                    {wordCount} words · ~{Math.ceil(wordCount / 200)} min read
                  </span>
                )}
              </div>
              {generatedLetter && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-sm border border-[#DBD8CE] bg-white px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#14171F] transition-colors hover:border-[#14171F]"
                  >
                    {copied ? "Copied! ✓" : "Copy text"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="rounded-sm border border-[#DBD8CE] bg-white px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#14171F] transition-colors hover:border-[#14171F]"
                  >
                    .txt
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="rounded-sm bg-[#14171F] px-3.5 py-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38]"
                  >
                    Export PDF
                  </button>
                </div>
              )}
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="print-full flex-1 rounded-sm border border-[#DBD8CE] bg-white p-8 shadow-sm">
              {generatedLetter ? (
                <div className="font-[family-name:var(--font-serif)] text-[15.5px] leading-relaxed text-[#14171F]">
                  {generatedLetter.split("\n\n").map((para, idx) => (
                    <p key={idx} className="mb-4 last:mb-0">
                      {para}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#DBD8CE] bg-[#F6F5F1] text-[#8A8F99]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <p className="mt-4 font-[family-name:var(--font-sans)] text-[15px] font-medium text-[#14171F]">
                    Your customized cover letter will appear here.
                  </p>
                  <p className="mt-1 max-w-xs font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
                    Select your strategic tone and click generate to craft a persuasive, tailored proposal.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
