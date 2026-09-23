"use client";

import { useState, useEffect, Suspense } from "react";
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

interface Suggestion {
  id: string;
  original: string;
  issue: string;
  rewrite: string;
  status: "pending" | "accepted" | "rejected";
  metricsSuggested?: string[];
}

const SAMPLE_INPUT = `Responsible for managing a team and improving processes across departments.
Worked on the company website and helped with updates.
Helped with data analysis for various projects.
In charge of customer communications and support tickets.`;

function ImproveContent() {
  const searchParams = useSearchParams();
  const incomingBullet = searchParams.get("bullet");
  const incomingRole = searchParams.get("role");

  const [input, setInput] = useState(incomingBullet || "");
  const [targetRole, setTargetRole] = useState(incomingRole || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (incomingBullet && !input) {
      setInput(incomingBullet);
    }
    if (incomingRole && !targetRole) {
      setTargetRole(incomingRole);
    }
  }, [incomingBullet, incomingRole, input, targetRole]);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setAnalyzing(true);
    setError("");

    const bullets = input
      .split("\n")
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    try {
      const res = await fetch("/api/resume/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullets,
          targetRole: targetRole.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to analyze bullets");
      }

      const data = await res.json();
      const mapped: Suggestion[] = (data.suggestions || []).map((s: any, idx: number) => ({
        id: s.id || String(idx + 1),
        original: s.original,
        issue: s.issue,
        rewrite: s.rewrite,
        status: "pending" as const,
        metricsSuggested: s.metricsSuggested || [],
      }));

      setSuggestions(mapped);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error analyzing bullets";
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const setStatus = (id: string, status: Suggestion["status"]) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const acceptedCount = suggestions.filter((s) => s.status === "accepted").length;
  const pendingCount = suggestions.filter((s) => s.status === "pending").length;

  const finalText = suggestions
    .map((s) => (s.status === "accepted" ? s.rewrite : s.original))
    .join("\n");

  const handleCopyFinal = () => {
    navigator.clipboard.writeText(finalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <div className="flex items-center gap-3">
            <Link
              href="/ats"
              className="font-[family-name:var(--font-mono)] text-[13px] text-[#4A4F58] transition-colors hover:text-[#14171F]"
            >
              ATS Scanner
            </Link>
            <Link
              href="/upload"
              className="rounded-sm bg-[#14171F] px-4 py-2 font-[family-name:var(--font-mono)] text-[13px] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38]"
            >
              Scan full resume
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
          Google X-Y-Z Rewriter
        </span>
        <h1 className="mt-3 font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight sm:text-4xl">
          Upgrade your bullet points.
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[#4A4F58]">
          Paste your existing resume bullet points. We&apos;ll find passive framing,
          missing metrics, and rewrite each using Google&apos;s X-Y-Z formula:{" "}
          <span className="font-medium text-[#14171F]">
            &ldquo;Accomplished [X], as measured by [Y], by doing [Z]&rdquo;
          </span>
          .
        </p>

        {incomingBullet && (
          <div className="mt-6 flex items-center gap-2 rounded-sm border border-[#D7FF3E] bg-[#D7FF3E]/15 px-3.5 py-2 text-left">
            <span className="font-[family-name:var(--font-mono)] text-[11.5px] text-[#14171F]">
              ✓ Pre-loaded bullet from your recent ATS scan report.
            </span>
          </div>
        )}

        {/* INPUT */}
        {suggestions.length === 0 && (
          <div className="mt-8">
            <div className="mb-4">
              <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]">
                Target role or industry (Optional)
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Product Manager, Full Stack Engineer"
                className="mt-1.5 w-full rounded-sm border border-[#DBD8CE] bg-white px-3.5 py-2.5 font-[family-name:var(--font-sans)] text-sm text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F]"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]">
                Your bullet points
              </label>
              <button
                type="button"
                onClick={() => setInput(SAMPLE_INPUT)}
                className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#8A8F99] hover:text-[#14171F]"
              >
                Use example
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"One bullet per line, e.g.\nResponsible for managing a team and improving processes."}
              rows={8}
              className="mt-1.5 w-full resize-none rounded-sm border border-[#DBD8CE] bg-white px-3.5 py-3 font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40"
            />

            {error && (
              <p className="mt-4 rounded-sm border border-[#E8B4B4] bg-[#FBEAEA] px-4 py-2.5 text-sm text-[#9A3B3B]">
                {error}
              </p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!input.trim() || analyzing}
                className="rounded-sm bg-[#14171F] px-6 py-3 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38] disabled:opacity-60"
              >
                {analyzing ? "Analyzing & Rewriting..." : "Get rewrites →"}
              </button>
              <span className="font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
                One bullet per line
              </span>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {suggestions.length > 0 && (
          <>
            {/* progress bar */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#DBD8CE] bg-white px-5 py-4">
              <div className="flex items-center gap-6">
                <span className="font-[family-name:var(--font-mono)] text-[12px] text-[#4A4F58]">
                  <span className="font-semibold text-[#14171F]">
                    {acceptedCount}
                  </span>{" "}
                  accepted
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[12px] text-[#4A4F58]">
                  <span className="font-semibold text-[#14171F]">
                    {pendingCount}
                  </span>{" "}
                  pending review
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSuggestions([]);
                    setInput("");
                  }}
                  className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#8A8F99] hover:text-[#14171F]"
                >
                  Start over
                </button>
                <button
                  type="button"
                  onClick={handleCopyFinal}
                  className="rounded-sm bg-[#14171F] px-4 py-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38]"
                >
                  {copied ? "Copied! ✓" : "Copy final version"}
                </button>
              </div>
            </div>

            {/* suggestion cards */}
            <div className="mt-6 space-y-4">
              {suggestions.map((s, idx) => (
                <div
                  key={s.id}
                  className={`rounded-sm border bg-white p-6 transition-colors ${
                    s.status === "accepted"
                      ? "border-[#D7FF3E] bg-[#FAFAF7]"
                      : s.status === "rejected"
                      ? "border-[#E8B4B4] opacity-60"
                      : "border-[#DBD8CE]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[#8A8F99]">
                      Bullet {idx + 1}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[#D65A4A]">
                      {s.issue}
                    </span>
                  </div>

                  {/* original */}
                  <div className="mt-3">
                    <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[#8A8F99]">
                      Original
                    </span>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-[#8A8F99] line-through">
                      {s.original}
                    </p>
                  </div>

                  {/* rewrite */}
                  <div className="mt-3">
                    <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[#2F6B45]">
                      Google X-Y-Z Rewrite
                    </span>
                    <p className="mt-1 font-medium text-[15px] leading-relaxed text-[#14171F]">
                      {s.rewrite}
                    </p>
                  </div>

                  {/* suggested metrics tags */}
                  {s.metricsSuggested && s.metricsSuggested.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.06em] text-[#8A8F99]">
                        Suggested Metrics:
                      </span>
                      {s.metricsSuggested.map((m, i) => (
                        <span
                          key={i}
                          className="rounded bg-[#EDEBE3] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[#4A4F58]"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* actions */}
                  <div className="mt-5 flex items-center justify-between border-t border-[#F0EEE7] pt-4">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                      {s.status === "accepted" && "✓ Accepted"}
                      {s.status === "rejected" && "✕ Kept original"}
                      {s.status === "pending" && "Choose an action"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStatus(s.id, "rejected")}
                        className={`rounded-sm border px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] transition-colors ${
                          s.status === "rejected"
                            ? "border-[#14171F] bg-[#14171F] text-[#F6F5F1]"
                            : "border-[#DBD8CE] bg-white text-[#4A4F58] hover:border-[#B7B4A9]"
                        }`}
                      >
                        Keep original
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(s.id, "accepted")}
                        className={`rounded-sm px-3.5 py-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] transition-colors ${
                          s.status === "accepted"
                            ? "bg-[#14171F] text-[#F6F5F1]"
                            : "bg-[#D7FF3E] text-[#14171F] hover:bg-[#c9f52f]"
                        }`}
                      >
                        Accept rewrite
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* final output box */}
            {acceptedCount > 0 && (
              <div className="mt-8 rounded-sm border border-[#DBD8CE] bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
                    Result preview ({acceptedCount} of {suggestions.length} rewritten)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyFinal}
                    className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#14171F] underline underline-offset-2 hover:text-[#4A4F58]"
                  >
                    {copied ? "Copied!" : "Copy all"}
                  </button>
                </div>
                <pre className="mt-3 whitespace-pre-wrap font-[family-name:var(--font-sans)] text-[14px] leading-relaxed text-[#14171F]">
                  {finalText}
                </pre>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function ImprovePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F5F1] p-12 text-center font-[family-name:var(--font-mono)] text-sm text-[#8A8F99]">
          Loading Bullet Rewriter...
        </div>
      }
    >
      <ImproveContent />
    </Suspense>
  );
}
