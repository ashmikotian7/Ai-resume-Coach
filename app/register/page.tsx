"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!agreed) {
      setError("You need to agree to the Terms to continue.");
      return;
    }

    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If email confirmation is enabled in Supabase, there's no session yet —
    // show a "check your inbox" state instead of redirecting.
    if (data.user && !data.session) {
      setCheckEmail(true);
      return;
    }

    router.push("/feedback");
    router.refresh();
  };

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (checkEmail) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F6F5F1] px-6">
        <div className="w-full max-w-sm text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#14171F] font-[family-name:var(--font-mono)] text-[16px] font-bold text-[#D7FF3E] mx-auto">
            R
          </span>
          <h2 className="mt-6 font-[family-name:var(--font-sans)] text-2xl font-semibold text-[#14171F]">
            Check your inbox
          </h2>
          <p className="mt-3 font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#6B6F79]">
            We sent a confirmation link to <strong>{email}</strong>. Click it
            to activate your account, then log in.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block font-[family-name:var(--font-sans)] text-sm font-medium text-[#14171F] underline decoration-[#D7FF3E] decoration-2 underline-offset-2"
          >
            Back to log in
          </a>
        </div>
      </div>
    );
  }

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
            Get started
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-sans)] text-3xl font-semibold leading-tight text-[#F6F5F1]">
            Know why your resume gets skipped — before you send it again.
          </h1>
          <p className="mt-4 font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#9CA0AB]">
            Create an account to scan, score, and rewrite your resume in
            under a minute. No credit card required.
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

          <h2 className="font-[family-name:var(--font-sans)] text-2xl font-semibold text-[#14171F]">
            Create your account
          </h2>
          <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-[#6B6F79]">
            Already have an account?{" "}
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
                htmlFor="name"
                className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jordan Lee"
                className="mt-1.5 w-full rounded-sm border border-[#DBD8CE] bg-white px-3 py-2.5 font-[family-name:var(--font-sans)] text-sm text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40"
              />
            </div>

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
              <label
                htmlFor="password"
                className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-sm border border-[#DBD8CE] bg-white px-3 py-2.5 font-[family-name:var(--font-sans)] text-sm text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40"
              />
            </div>

            <label className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-[#DBD8CE] text-[#14171F] focus:ring-[#D7FF3E]/40"
              />
              <span className="font-[family-name:var(--font-sans)] text-xs leading-relaxed text-[#6B6F79]">
                I agree to the{" "}
                <a href="/terms" className="underline hover:text-[#14171F]">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/privacy" className="underline hover:text-[#14171F]">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            {error && (
              <p className="rounded-sm border border-[#E8B4B4] bg-[#FBEAEA] px-3 py-2 font-[family-name:var(--font-sans)] text-xs text-[#9A3B3B]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center rounded-sm bg-[#14171F] py-2.5 font-[family-name:var(--font-sans)] text-sm font-medium text-[#F6F5F1] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Creating account…" : "Create account"}
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
            onClick={handleGoogleSignup}
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
        </div>
      </div>
    </div>
  );
}