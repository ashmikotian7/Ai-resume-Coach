"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/navbar/Header";
import Footer from "@/components/common/Footer";

const MAX_SIZE_MB = 10;
const ACCEPTED_LABEL = ".PDF, .DOC, .DOCX";

const SCAN_STEPS = [
  "Uploading & decrypting document structure…",
  "Executing AST text parser & section tokenizer…",
  "Querying ATS filters & matching role keywords…",
  "Detecting passive duties & drafting Google X-Y-Z rewrites…",
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
      setError("Please select or drop your resume document before starting the scan.");
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
    }, 1600);

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

      // Store in sessionStorage for fast client preview
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
    <div className="min-h-screen bg-[#F6F5F1] text-[#14171F] flex flex-col justify-between">
      <Header />

      <main className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-12 flex-grow">
        <div className="border-b border-[#DBD8CE]/80 pb-6 mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                Step 1 of 1 · ATS Document Audit
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#D7FF3E]" />
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#5A606D]">
                Strict Parsing Emulation
              </span>
            </div>
            <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight sm:text-4xl text-[#14171F]">
              Upload your resume for audit.
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[#5A606D] max-w-xl">
              We&apos;ll parse it the exact way applicant tracking software does. Add the target job description to match skills and generate custom X-Y-Z rewrites.
            </p>
          </div>

          <Link
            href="/ats"
            className="self-start sm:self-auto rounded-sm border border-[#DBD8CE] bg-white px-3.5 py-2 font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-wider text-[#14171F] hover:bg-[#FAF9F5] shadow-xs"
          >
            Explore Sample Audit →
          </Link>
        </div>

        {/* DROPZONE */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => handleDrag(e, true)}
          onDragEnter={(e) => handleDrag(e, true)}
          onDragLeave={(e) => handleDrag(e, false)}
          onClick={() => !submitting && inputRef.current?.click()}
          className={`relative flex cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed p-10 sm:p-14 text-center transition-all ${
            dragActive
              ? "border-[#14171F] bg-[#D7FF3E]/10 ring-4 ring-[#D7FF3E]/30"
              : "border-[#DBD8CE] bg-white hover:border-[#14171F] hover:shadow-xs"
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
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#DBD8CE] bg-[#F6F5F1] text-[#14171F] shadow-xs">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
                  <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
                </svg>
              </div>
              <h3 className="mt-4 font-[family-name:var(--font-serif)] text-lg font-bold text-[#14171F]">
                Drag and drop your resume here
              </h3>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
                or click to browse your files — {ACCEPTED_LABEL} — max {MAX_SIZE_MB}MB
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="rounded-full bg-[#EDEBE3] px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10.5px] text-[#5A606D]">
                  Single-column formats supported
                </span>
                <span className="rounded-full bg-[#EDEBE3] px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10.5px] text-[#5A606D]">
                  Private &amp; Encrypted
                </span>
              </div>
            </>
          ) : (
            <div
              className="flex w-full max-w-md items-center justify-between rounded-sm border border-[#DBD8CE] bg-[#FAF9F5] p-4 text-left shadow-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#14171F] font-[family-name:var(--font-mono)] text-[11px] font-bold text-[#D7FF3E]">
                  {file.name.split(".").pop()?.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-[family-name:var(--font-sans)] text-[14px] font-semibold text-[#14171F]">
                    {file.name}
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                    {formatBytes(file.size)} · Ready to scan
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
                  className="ml-4 shrink-0 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-red-600 hover:text-red-800 underline"
                >
                  Remove
                </button>
              )}
            </div>
          )}
        </div>

        {/* TARGET JOB POSTING */}
        <div className="mt-8 rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="jobPosting"
              className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79] font-bold"
            >
              Target Job Description (Optional)
            </label>
            <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
              Enables keyword &amp; competency matching
            </span>
          </div>
          <textarea
            id="jobPosting"
            value={jobPosting}
            onChange={(e) => setJobPosting(e.target.value)}
            disabled={submitting}
            placeholder="Paste the job requirements, responsibilities, or company role overview to calculate your match score…"
            rows={6}
            className="w-full resize-none rounded-sm border border-[#DBD8CE] bg-white p-3.5 font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40 disabled:bg-[#ECE9DF]"
          />
        </div>

        {/* MULTI-STEP PROGRESS INDICATOR */}
        {submitting && (
          <div className="mt-6 rounded-sm border border-[#DBD8CE] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-[#8A8F99] font-bold">
                ATS Analysis in Progress
              </span>
              <span className="font-[family-name:var(--font-mono)] text-[12px] font-semibold text-[#14171F]">
                Step {currentStepIndex + 1} of {SCAN_STEPS.length}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDEBE3]">
              <div
                className="h-full bg-[#14171F] transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStepIndex + 1) / SCAN_STEPS.length) * 100}%`,
                }}
              />
            </div>

            <div className="mt-5 space-y-2.5">
              {SCAN_STEPS.map((step, idx) => {
                const isDone = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 text-[13px] ${
                      isDone
                        ? "text-[#2F6B45]"
                        : isCurrent
                        ? "font-bold text-[#14171F]"
                        : "text-[#B7B4A9]"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full transition-all ${
                        isDone
                          ? "bg-[#4CAF6E]"
                          : isCurrent
                          ? "animate-pulse bg-[#14171F] ring-4 ring-[#D7FF3E]"
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
          <p className="mt-5 rounded-sm border border-red-200 bg-red-50 p-4 font-[family-name:var(--font-sans)] text-sm text-red-800">
            {error}
          </p>
        )}

        {/* SUBMIT BUTTON */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-sm bg-[#14171F] px-8 py-4 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] font-bold transition-all hover:bg-[#2A2E38] disabled:opacity-50 hover:shadow-md active:scale-[0.99]"
          >
            {submitting ? "Analyzing Resume Against ATS Models…" : "Scan My Resume Now →"}
          </button>
          <div className="font-[family-name:var(--font-mono)] text-[11.5px] text-[#8A8F99]">
            Instant results · Complete privacy · No credit card required
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
