"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F5F1] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Left — brand panel */}
      <div className="relative hidden overflow-hidden bg-[#14171F] px-14 py-12 lg:flex lg:flex-col lg:justify-between">
        <style jsx>{`
          @keyframes driftLine {
            0% {
              transform: translateY(0);
              opacity: 0.9;
            }
            50% {
              opacity: 0.35;
            }
            100% {
              transform: translateY(-14px);
              opacity: 0.9;
            }
          }
          .drift {
            animation: driftLine 3.6s ease-in-out infinite;
          }
        `}</style>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, #F6F5F1 0px, #F6F5F1 1px, transparent 1px, transparent 26px)",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#D7FF3E] font-[family-name:var(--font-mono)] text-[13px] font-bold text-[#14171F]">
              R
            </span>
            <span className="font-[family-name:var(--font-mono)] text-sm uppercase tracking-[0.14em] text-[#F6F5F1]">
              Resumatch
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-sm">
          <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#9CA0AB]">
            Account recovery
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-sans)] text-3xl font-semibold leading-tight text-[#F6F5F1]">
            Happens to everyone. Let's get you back in.
          </h1>
          <p className="mt-4 font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#9CA0AB]">
            Enter your email and we'll send a link to reset your password.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#2A2E3A]" />
            <span className="drift h-1.5 w-1.5 rounded-full bg-[#D7FF3E]" />
            <div className="h-px flex-1 bg-[#2A2E3A]" />
          </div>
        </div>

        <p className="relative z-10 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-[#5B5F6B]">
          94% average match improvement
        </p>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-16 sm:px-10">
        <div className="w-full max-w-sm">
          {/* mobile-only brand mark */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#14171F] font-[family-name:var(--font-mono)] text-[13px] font-bold text-[#D7FF3E]">
              R
            </span>
            <span className="font-[family-name:var(--font-mono)] text-sm uppercase tracking-[0.14em] text-[#14171F]">
              Resumatch
            </span>
          </div>

          {!sent ? (
            <>
              <h2 className="font-[family-name:var(--font-sans)] text-2xl font-semibold text-[#14171F]">
                Reset your password
              </h2>
              <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-[#6B6F79]">
                Remembered it after all?{" "}
                <a
                  href="/login"
                  className="font-medium text-[#14171F] underline decoration-[#D7FF3E] decoration-2 underline-offset-2"
                >
                  Log in
                </a>
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 w-full rounded-sm border border-[#DBD8CE] bg-white px-3 py-2.5 font-[family-name:var(--font-sans)] text-sm text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40"
                  />
                </div>

                {error && (
                  <p className="rounded-sm border border-[#E8B4B4] bg-[#FBEAEA] px-3 py-2.5 font-[family-name:var(--font-sans)] text-xs text-[#9A3B3B]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex w-full items-center justify-center rounded-sm bg-[#14171F] py-2.5 font-[family-name:var(--font-sans)] text-sm font-medium text-[#F6F5F1] transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center sm:text-left">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF4EC] sm:mx-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2F6B45"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16v16H4z" opacity="0" />
                  <path d="M3 7l9 6 9-6" />
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                </svg>
              </div>
              <h2 className="mt-5 font-[family-name:var(--font-sans)] text-2xl font-semibold text-[#14171F]">
                Check your inbox
              </h2>
              <p className="mt-3 font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#6B6F79]">
                If an account exists for <strong>{email}</strong>, we've sent
                a link to reset your password. It'll expire in 1 hour.
              </p>

              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-6 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#8A8F99] hover:text-[#14171F]"
              >
                Use a different email
              </button>

              <div className="mt-8">
                <a
                  href="/login"
                  className="font-[family-name:var(--font-sans)] text-sm font-medium text-[#14171F] underline decoration-[#D7FF3E] decoration-2 underline-offset-2"
                >
                  Back to log in
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}