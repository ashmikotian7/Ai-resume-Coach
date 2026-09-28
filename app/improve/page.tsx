"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/navbar/Header";
import Footer from "@/components/common/Footer";

interface Suggestion {
  id: string;
  original: string;
  issue: string;
  rewrite: string;
  status: "pending" | "accepted" | "rejected";
  metricsSuggested?: string[];
  isEditing?: boolean;
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
        isEditing: false,
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

  const updateRewrite = (id: string, newText: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, rewrite: newText } : s))
    );
  };

  const toggleEditing = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isEditing: !s.isEditing } : s))
    );
  };

  const handleAcceptAll = () => {
    setSuggestions((prev) => prev.map((s) => ({ ...s, status: "accepted" })));
  };

  const acceptedCount = suggestions.filter((s) => s.status === "accepted").length;
  const pendingCount = suggestions.filter((s) => s.status === "pending").length;

  const finalText = suggestions
    .map((s) => (s.status === "accepted" ? `• ${s.rewrite}` : `• ${s.original}`))
    .join("\n");

  const handleCopyFinal = () => {
    navigator.clipboard.writeText(finalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([finalText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `redline-rewritten-bullets.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#14171F] flex flex-col justify-between">
      <Header />

      <main className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-12 flex-grow">
        <div className="border-b border-[#DBD8CE]/80 pb-6 mb-8">
          <div className="flex items-center gap-2">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
              Google X-Y-Z Formula Engine
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D7FF3E]" />
            <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#5A606D]">
              Accomplished [X] as measured by [Y], by doing [Z]
            </span>
          </div>

          <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight sm:text-4xl text-[#14171F]">
            Transform passive duties into quantified results.
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#5A606D] max-w-2xl">
            Recruiters look for outcomes, not job responsibilities. Paste single lines or full experience sections to automatically insert quantifiable scale, metric impact, and action verbs.
          </p>
        </div>

        {incomingBullet && (
          <div className="mb-6 flex items-center justify-between rounded-sm border border-emerald-300 bg-emerald-50 px-4 py-2.5 shadow-xs">
            <span className="font-[family-name:var(--font-mono)] text-[12px] text-emerald-900 font-medium">
              ✓ Pre-loaded weak bullet from your latest ATS scan report.
            </span>
            <span className="font-[family-name:var(--font-mono)] text-[11px] text-emerald-700 uppercase">
              Ready for rewrite
            </span>
          </div>
        )}

        {/* INPUT FORM */}
        {suggestions.length === 0 && (
          <div className="rounded-sm border border-[#DBD8CE] bg-white p-7 shadow-sm">
            <div className="mb-5">
              <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79] font-semibold block">
                Target Role or Seniority Level (Optional)
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Product Manager, Lead Cloud Architect, VP Sales"
                className="mt-1.5 w-full rounded-sm border border-[#DBD8CE] bg-white px-3.5 py-2.5 font-[family-name:var(--font-sans)] text-sm text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F]"
              />
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79] font-semibold">
                Your Existing Resume Bullets
              </label>
              <button
                type="button"
                onClick={() => setInput(SAMPLE_INPUT)}
                className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#8A8F99] hover:text-[#14171F] underline underline-offset-2"
              >
                Load Example Bullets
              </button>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"Enter one bullet per line, e.g.\nResponsible for managing a team and improving customer retention.\nWorked on the cloud migration project and fixed latency bugs."}
              rows={8}
              className="w-full resize-none rounded-sm border border-[#DBD8CE] bg-white px-4 py-3 font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40"
            />

            {error && (
              <p className="mt-4 rounded-sm border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
                {error}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!input.trim() || analyzing}
                className="rounded-sm bg-[#14171F] px-7 py-3.5 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] font-semibold transition-all hover:bg-[#2A2E38] disabled:opacity-50 hover:shadow-sm"
              >
                {analyzing ? (
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#D7FF3E] animate-ping" />
                    Generating Google X-Y-Z Rewrites...
                  </span>
                ) : (
                  "Generate High-Impact Rewrites →"
                )}
              </button>
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                One bullet per line recommended
              </span>
            </div>
          </div>
        )}

        {/* RESULTS STUDIO */}
        {suggestions.length > 0 && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-[#DBD8CE] bg-white px-6 py-4 shadow-sm">
              <div className="flex items-center gap-6">
                <span className="font-[family-name:var(--font-mono)] text-[12px] text-[#4A4F58]">
                  <span className="font-bold text-emerald-800 text-[14px]">
                    {acceptedCount}
                  </span>{" "}
                  Accepted
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[12px] text-[#4A4F58]">
                  <span className="font-bold text-[#14171F] text-[14px]">
                    {pendingCount}
                  </span>{" "}
                  Pending Review
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="rounded-sm border border-[#DBD8CE] bg-[#F6F5F1] px-3.5 py-1.5 font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-wider text-[#14171F] hover:bg-white transition-colors"
                >
                  Accept All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuggestions([]);
                    setInput("");
                  }}
                  className="font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-wider text-[#8A8F99] hover:text-[#14171F] px-2"
                >
                  Clear &amp; Reset
                </button>
                <button
                  type="button"
                  onClick={handleCopyFinal}
                  className="rounded-sm bg-[#14171F] px-4 py-2 font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-[0.06em] text-[#F6F5F1] font-semibold hover:bg-[#2A2E38] transition-colors"
                >
                  {copied ? "Copied All! ✓" : "Copy Formatted Bullets"}
                </button>
              </div>
            </div>

            {/* Suggestion Cards */}
            <div className="space-y-4">
              {suggestions.map((s, idx) => (
                <div
                  key={s.id}
                  className={`rounded-sm border bg-white p-6 shadow-sm transition-all ${
                    s.status === "accepted"
                      ? "border-emerald-400 bg-emerald-50/20 ring-1 ring-emerald-300"
                      : s.status === "rejected"
                      ? "border-red-200 bg-red-50/30 opacity-70"
                      : "border-[#DBD8CE]"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#F0EEE7] pb-3">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[#8A8F99] font-bold">
                      Bullet {idx + 1}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-sm">
                      {s.issue}
                    </span>
                  </div>

                  {/* Original Line */}
                  <div className="mt-4 border-l-2 border-red-300 pl-3.5">
                    <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase text-red-700 font-semibold block">
                      Original Statement
                    </span>
                    <p className="mt-1 text-[14px] text-[#6B7280] line-through decoration-red-300">
                      {s.original}
                    </p>
                  </div>

                  {/* Rewrite Line */}
                  <div className="mt-4 border-l-2 border-[#D7FF3E] pl-3.5 bg-emerald-50/50 p-3 rounded-r-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase text-emerald-900 font-bold">
                        Google X-Y-Z Rewrite
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleEditing(s.id)}
                        className="font-[family-name:var(--font-mono)] text-[10.5px] text-[#5A606D] hover:text-[#14171F] underline"
                      >
                        {s.isEditing ? "Done Editing" : "Fine-tune text"}
                      </button>
                    </div>

                    {s.isEditing ? (
                      <textarea
                        value={s.rewrite}
                        onChange={(e) => updateRewrite(s.id, e.target.value)}
                        rows={3}
                        className="w-full mt-1.5 p-2 text-[14.5px] rounded-sm border border-[#DBD8CE] bg-white text-[#14171F] focus:outline-none focus:border-[#14171F]"
                      />
                    ) : (
                      <p className="font-medium text-[15px] leading-relaxed text-[#14171F]">
                        {s.rewrite}
                      </p>
                    )}
                  </div>

                  {/* Suggested Metric Tags */}
                  {s.metricsSuggested && s.metricsSuggested.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pl-3.5">
                      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.06em] text-[#8A8F99]">
                        Recommended Metrics:
                      </span>
                      {s.metricsSuggested.map((m, i) => (
                        <span
                          key={i}
                          className="rounded-xs bg-[#EDEBE3] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[#4A4F58]"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="mt-5 flex items-center justify-between border-t border-[#F0EEE7] pt-4">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                      {s.status === "accepted" && "✓ Accepted for resume"}
                      {s.status === "rejected" && "✕ Original preserved"}
                      {s.status === "pending" && "Review changes"}
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
                        className={`rounded-sm px-4 py-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] font-semibold transition-colors ${
                          s.status === "accepted"
                            ? "bg-[#14171F] text-[#F6F5F1]"
                            : "bg-[#D7FF3E] text-[#14171F] hover:bg-[#c9f52f]"
                        }`}
                      >
                        Accept Rewrite
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Final Export Preview Card */}
            <div className="mt-8 rounded-sm border border-[#DBD8CE] bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#F0EEE7] pb-3 mb-4">
                <div>
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99] font-bold">
                    Clean Export Preview
                  </span>
                  <p className="text-[13px] text-[#6B7280]">
                    Ready to paste directly into your resume document or ATS application.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="rounded-sm border border-[#DBD8CE] px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-[#14171F] hover:bg-[#F6F5F1]"
                  >
                    Download .txt
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyFinal}
                    className="rounded-sm bg-[#14171F] px-4 py-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-[#F6F5F1] hover:bg-[#2A2E38]"
                  >
                    {copied ? "Copied! ✓" : "Copy Bullets"}
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap font-[family-name:var(--font-sans)] text-[14px] leading-relaxed text-[#14171F] bg-[#FAF9F5] p-4 rounded-sm border border-[#DBD8CE]/60">
                {finalText}
              </pre>
            </div>
          </div>
        )}
      </main>

      <Footer />
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
