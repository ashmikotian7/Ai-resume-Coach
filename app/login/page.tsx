"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/feedback");
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
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
            Welcome back
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-sans)] text-3xl font-semibold leading-tight text-[#F6F5F1]">
            Pick up where your résumé left off.
          </h1>
          <p className="mt-4 font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#9CA0AB]">
            Sign in to see your latest match score, keyword gaps, and the edits
            that moved the needle.
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
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#14171F] font-[family-name:var(--font-mono)] text-[13px] font-bold text-[#D7FF3E]">
              R
            </span>
            <span className="font-[family-name:var(--font-mono)] text-sm uppercase tracking-[0.14em] text-[#14171F]">
              Resumatch
            </span>
          </div>

          <h2 className="font-[family-name:var(--font-sans)] text-2xl font-semibold text-[#14171F]">
            Log in to your account
          </h2>
          <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-[#6B6F79]">
            New here?{" "}
            <a
              href="/register"
              className="font-medium text-[#14171F] underline decoration-[#D7FF3E] decoration-2 underline-offset-2"
            >
              Create an account
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

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]"
                >
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="font-[family-name:var(--font-sans)] text-xs text-[#6B6F79] underline decoration-[#DBD8CE] underline-offset-2 hover:text-[#14171F]"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-sm border border-[#DBD8CE] bg-white px-3 py-2.5 pr-16 font-[family-name:var(--font-sans)] text-sm text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[#9CA0AB] hover:text-[#14171F]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
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
              {submitting ? "Signing in…" : "Log in"}
            </button>
          </form>

          <div className="mt-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#EDEBE3]" />
            <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.1em] text-[#9CA0AB]">
              Or
            </span>
            <div className="h-px flex-1 bg-[#EDEBE3]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-sm border border-[#DBD8CE] bg-white py-2.5 font-[family-name:var(--font-sans)] text-sm font-medium text-[#14171F] transition-colors hover:border-[#14171F]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0012 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 010-4.2V7.05H2.18a11 11 0 000 9.9l3.66-2.85z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 00-9.82 6.05l3.66 2.85C6.71 7.3 9.14 5.38 12 5.38z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center font-[family-name:var(--font-sans)] text-xs text-[#9CA0AB]">
            By logging in, you agree to our{" "}
            <a href="/terms" className="underline hover:text-[#14171F]">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-[#14171F]">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}