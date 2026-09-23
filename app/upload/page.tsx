"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const MAX_SIZE_MB = 10;
const ACCEPTED_LABEL = ".PDF, .DOC, .DOCX";

const SCAN_STEPS = [
  "Uploading document...",
  "Parsing structure & extracting text...",
  "Running ATS spiders & matching keywords...",
  "Detecting passive verbs & drafting Google X-Y-Z rewrites...",
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [jobPosting, setJobPosting] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateAndSetFile = (f: File) => {
    setError("");
    const validExtensions = ["pdf", "doc", "docx"];
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      setError("Please upload a PDF or Word document (.pdf, .doc, .docx).");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Max size is ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>, active: boolean) => {
    e.preventDefault();
    setDragActive(active);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const handleSubmit = async () => {
    setError("");
    if (!file) {
      setError("Add your resume file before scanning.");
      return;
    }
    setSubmitting(true);
    setCurrentStepIndex(0);

    // Multi-step interval animation
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < SCAN_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (jobPosting.trim()) {
        formData.append("jobPosting", jobPosting.trim());
      }

      const res = await fetch("/api/resume/scan", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Scan failed with status ${res.status}`);
      }

      const data = await res.json();

      // Store in sessionStorage for immediate fast preview
      if (typeof window !== "undefined" && data.results) {
        window.sessionStorage.setItem("redline_current_scan", JSON.stringify(data.results));
      }

      router.push(`/ats?scanId=${data.scanId}`);
    } catch (err: unknown) {
      clearInterval(interval);
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : "An error occurred during resume scanning.";
      setError(msg);
    }
  };

  return (
    <div
      className={`${sans.variable} ${serif.variable} ${mono.variable} min-h-screen bg-[#F6F5F1] font-[family-name:var(--font-sans)] text-[#14171F] antialiased`}
    >
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-[#DBD8CE] bg-[#F6F5F1]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-serif)] text-lg font-semibold tracking-tight"
          >
            Redline<span className="text-[#8A8F99]">.</span>
          </Link>
          <Link
            href="/ats"
            className="font-[family-name:var(--font-mono)] text-[13px] text-[#4A4F58] transition-colors hover:text-[#14171F]"
          >
            See a sample scan
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
          Step 1 of 1
        </span>
        <h1 className="mt-3 font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight sm:text-4xl">
          Upload your resume.
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[#4A4F58]">
          We'll scan it the way applicant tracking software does. Paste the
          job posting too, and we'll score your match against it directly.
        </p>

        {/* DROPZONE */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => handleDrag(e, true)}
          onDragEnter={(e) => handleDrag(e, true)}
          onDragLeave={(e) => handleDrag(e, false)}
          onClick={() => !submitting && inputRef.current?.click()}
          className={`mt-10 flex cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed px-6 py-16 text-center transition-colors ${
            dragActive
              ? "border-[#14171F] bg-white"
              : "border-[#DBD8CE] bg-white/60 hover:border-[#B7B4A9] hover:bg-white"
          } ${submitting ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileInput}
            className="hidden"
            disabled={submitting}
          />

          {!file ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#DBD8CE] bg-[#F6F5F1]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4A4F58"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
                  <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
                </svg>
              </div>
              <p className="mt-4 font-[family-name:var(--font-sans)] text-[15px] font-medium text-[#14171F]">
                Drag and drop your resume here
              </p>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
                or click to browse — {ACCEPTED_LABEL} — up to {MAX_SIZE_MB}MB
              </p>
            </>
          ) : (
            <div
              className="flex w-full max-w-sm items-center justify-between rounded-sm border border-[#DBD8CE] bg-[#F6F5F1] px-4 py-3.5 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#14171F] font-[family-name:var(--font-mono)] text-[10px] font-semibold text-[#D7FF3E]">
                  {file.name.split(".").pop()?.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-[family-name:var(--font-sans)] text-[13.5px] font-medium text-[#14171F]">
                    {file.name}
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              {!submitting && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  className="ml-3 shrink-0 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#8A8F99] hover:text-[#D65A4A]"
                >
                  Remove
                </button>
              )}
            </div>
          )}
        </div>

        {/* JOB POSTING */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <label
              htmlFor="jobPosting"
              className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]"
            >
              Job posting
            </label>
            <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#B7B4A9]">
              Optional, improves match score
            </span>
          </div>
          <textarea
            id="jobPosting"
            value={jobPosting}
            onChange={(e) => setJobPosting(e.target.value)}
            disabled={submitting}
            placeholder="Paste the full job description here..."
            rows={7}
            className="mt-1.5 w-full resize-none rounded-sm border border-[#DBD8CE] bg-white px-3.5 py-3 font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40 disabled:bg-[#ECE9DF]"
          />
        </div>

        {/* MULTI-STEP PROGRESS INDICATOR */}
        {submitting && (
          <div className="mt-6 rounded-sm border border-[#DBD8CE] bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-[#8A8F99]">
                Analysis in Progress
              </span>
              <span className="font-[family-name:var(--font-mono)] text-[12px] text-[#14171F]">
                Step {currentStepIndex + 1} of {SCAN_STEPS.length}
              </span>
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#EDEBE3]">
              <div
                className="h-full bg-[#14171F] transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStepIndex + 1) / SCAN_STEPS.length) * 100}%`,
                }}
              />
            </div>

            <div className="mt-4 space-y-2">
              {SCAN_STEPS.map((step, idx) => {
                const isDone = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-2.5 text-[13px] ${
                      isDone
                        ? "text-[#2F6B45]"
                        : isCurrent
                        ? "font-medium text-[#14171F]"
                        : "text-[#B7B4A9]"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isDone
                          ? "bg-[#4CAF6E]"
                          : isCurrent
                          ? "animate-pulse bg-[#14171F]"
                          : "bg-[#DBD8CE]"
                      }`}
                    />
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-5 rounded-sm border border-[#E8B4B4] bg-[#FBEAEA] px-4 py-3 font-[family-name:var(--font-sans)] text-sm text-[#9A3B3B]">
            {error}
          </p>
        )}

        {/* SUBMIT */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-sm bg-[#14171F] px-7 py-3.5 text-center font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38] disabled:opacity-60"
          >
            {submitting ? "Analyzing Resume..." : "Scan my resume →"}
          </button>
          <p className="font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
            Takes under a minute. Nothing is shared with employers.
          </p>
        </div>
      </main>
    </div>
  );
}
