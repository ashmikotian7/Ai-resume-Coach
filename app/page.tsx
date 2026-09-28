"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/navbar/Header";
import Footer from "@/components/common/Footer";
import ResumeScanVisual from "@/components/landing/ResumeScanVisual";

const FEATURES = [
  {
    tag: "SCAN",
    href: "/ats",
    title: "ATS match scan",
    body: "See exactly how applicant tracking software reads your resume, line by line, before a human ever does.",
    stat: "40+ checks",
    icon: (
      <svg className="w-5 h-5 text-[#14171F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    tag: "REWRITE",
    href: "/improve",
    title: "Targeted rewrites",
    body: "Get sentence-level edits that swap vague duties for measurable outcomes recruiters actually search for.",
    stat: "Google X-Y-Z",
    icon: (
      <svg className="w-5 h-5 text-[#14171F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    tag: "BUILD",
    href: "/resume-builder",
    title: "ATS resume builder",
    body: "Start from a layout that parses cleanly in every ATS — no tables, no floating text boxes, zero guesswork.",
    stat: "0 parser traps",
    icon: (
      <svg className="w-5 h-5 text-[#14171F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    tag: "WRITE",
    href: "/cover-letter",
    title: "Tailored cover letters",
    body: "Generate a targeted letter that argues your specific case for this exact role with verified proof points.",
    stat: "3 bespoke tones",
    icon: (
      <svg className="w-5 h-5 text-[#14171F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    tag: "PRACTICE",
    href: "/mock-interview",
    title: "Audio mock interviews",
    body: "Answer follow-up behavioral & technical questions pulled straight from your own resume out loud.",
    stat: "Voice + AI feedback",
    icon: (
      <svg className="w-5 h-5 text-[#14171F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    tag: "TRACK",
    href: "/dashboard",
    title: "History & analytics",
    body: "Every version, every score, every keyword fix — logged in one place so you know what moved the needle.",
    stat: "Version control",
    icon: (
      <svg className="w-5 h-5 text-[#14171F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const DEMO_BULLETS = [
  {
    role: "Senior Software Engineer",
    weak: "Worked on improving API response times and helped maintain backend databases.",
    issue: "Missing metrics, vague tools, passive impact.",
    strong: "Optimized Node/PostgreSQL caching layer with Redis, reducing p99 latency by 42% across 12M daily requests.",
  },
  {
    role: "Product Manager",
    weak: "Responsible for managing a team and improving customer onboarding.",
    issue: "No scope, no quantified result, standard duty framing.",
    strong: "Led a 7-person team to redesign onboarding funnel, lifting day-30 user retention from 21% to 38% in Q3.",
  },
  {
    role: "Growth Marketer",
    weak: "Ran paid social campaigns and wrote copy for marketing landing pages.",
    issue: "No budget scope, missing conversion lift or acquisition cost.",
    strong: "Managed $85K/mo paid Meta & LinkedIn ad budget, cutting blended CAC by 28% while scaling pipeline to $1.2M.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Parse & Extract",
    desc: "We analyze your document using our AST parser to simulate how Taleo, Greenhouse, and Workday extract your experience.",
  },
  {
    num: "02",
    title: "Redline & Score",
    desc: "Identifies missing high-frequency keywords, layout failure points, and passive duties needing quantifiable evidence.",
  },
  {
    num: "03",
    title: "Practice & Apply",
    desc: "Generate tailored cover letters and rehearse live voice interview drills generated directly from your redlined resume.",
  },
];

const STATS = [
  { value: "94%", label: "Average ATS match score after first rewrite iteration" },
  { value: "3.1×", label: "Higher interview callback rate reported by applicants" },
  { value: "< 45s", label: "Instant line-by-line breakdown and X-Y-Z suggestion speed" },
];

const FAQS = [
  {
    q: "Why do most resumes fail ATS screenings?",
    a: "Applicant Tracking Systems struggle with complex multi-column tables, floating text boxes, graphics, and missing semantic keywords from the job description. Redline highlights these parser hazards and rewrites weak duty statements into measurable achievements.",
  },
  {
    q: "What is the Google X-Y-Z formula used in rewrites?",
    a: "It is the formula recommended by Google hiring leaders: 'Accomplished [X] as measured by [Y], by doing [Z]'. Redline automatically re-architects passive responsibilities into outcome-focused impact statements.",
  },
  {
    q: "Can I practice for interviews with my own resume?",
    a: "Yes! Redline's voice mock interview tool uses your actual resume bullet points and job description to ask real follow-up questions out loud, grading your answers on impact and clarity.",
  },
];

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#14171F]">
      <Header />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-[#DBD8CE]/60 bg-grid-subtle">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DBD8CE] bg-white/90 px-3.5 py-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#4A4F58] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#D7FF3E] animate-pulse-subtle" />
              <span>Next-Gen ATS Parser & Resume Coach</span>
            </div>

            <h1 className="mt-6 font-[family-name:var(--font-serif)] text-[2.75rem] font-bold leading-[1.08] tracking-tight sm:text-[3.6rem]">
              Your resume, marked up{" "}
              <br />
              before it costs you{" "}
              <br />
              <span className="relative inline-block text-[#14171F]">
                the interview
                <span className="absolute inset-x-0 bottom-1.5 -z-10 h-3.5 bg-[#D7FF3E]/80 rounded-[2px]" />
              </span>
              .
            </h1>

            <p className="mt-6 max-w-lg text-[1.1rem] leading-relaxed text-[#4A4F58]">
              Tired of sending applications into a black hole? Redline scans your resume the exact way corporate ATS filters do, diagnoses missing keywords, and rewrites vague duties into measurable achievements recruiters fight for.
            </p>

            <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <Link
                href="/upload"
                className="group inline-flex items-center justify-center gap-2 rounded-sm bg-[#14171F] px-7 py-3.5 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] transition-all hover:bg-[#2A2E38] hover:shadow-lg active:scale-[0.98]"
              >
                <span>Upload your resume</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/ats"
                className="inline-flex items-center justify-center rounded-sm border border-[#DBD8CE] bg-white/80 px-6 py-3.5 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#14171F] transition-all hover:bg-white hover:border-[#14171F]"
              >
                View sample scan
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-6 font-[family-name:var(--font-mono)] text-[11.5px] text-[#717784]">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Instant parsing & scoring
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Zero parser traps
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <ResumeScanVisual />
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO: LIVE BULLET FIXER */}
      <section className="border-b border-[#DBD8CE] bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
              Interactive Demonstration
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight sm:text-4xl text-[#14171F]">
              See the Redline difference on a single bullet point
            </h2>
            <p className="mt-3 text-[15px] text-[#5A606D] max-w-2xl mx-auto">
              Hiring managers spend 6 seconds reading your resume. Switch between roles below to see how passive duties are transformed into executive-ready achievements.
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {DEMO_BULLETS.map((item, idx) => (
              <button
                key={item.role}
                onClick={() => setActiveDemo(idx)}
                className={`px-4 py-2 rounded-sm font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] transition-all ${
                  activeDemo === idx
                    ? "bg-[#14171F] text-[#F6F5F1] shadow-sm"
                    : "bg-[#F6F5F1] text-[#5A606D] hover:bg-[#EFECE4] border border-[#DBD8CE]"
                }`}
              >
                {item.role}
              </button>
            ))}
          </div>

          {/* Before & After comparison card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Before (Weak) */}
            <div className="rounded-sm border border-red-200 bg-[#FDF8F8] p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-red-100">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-red-700 font-semibold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Before: Weak Duty Framing
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[11px] text-red-600 bg-red-100 px-2 py-0.5 rounded-sm">
                    42% ATS Match
                  </span>
                </div>
                <p className="mt-4 font-[family-name:var(--font-serif)] text-lg text-[#333] line-through decoration-red-400 decoration-1">
                  "{DEMO_BULLETS[activeDemo].weak}"
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-red-100/80">
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-red-600 font-semibold block mb-1">
                  Identified Flaw:
                </span>
                <p className="text-[13px] text-red-800">
                  {DEMO_BULLETS[activeDemo].issue}
                </p>
              </div>
            </div>

            {/* After (Redline) */}
            <div className="rounded-sm border border-emerald-300 bg-[#F4F9F2] p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 h-16 w-16 bg-[#D7FF3E]/30 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-emerald-800 font-semibold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    After: Redline X-Y-Z Rewrite
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[11px] text-emerald-800 bg-[#D7FF3E] px-2 py-0.5 rounded-sm font-bold">
                    95% ATS Match
                  </span>
                </div>
                <p className="mt-4 font-[family-name:var(--font-serif)] text-lg font-medium text-[#11381E] leading-relaxed">
                  "{DEMO_BULLETS[activeDemo].strong}"
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-emerald-200/80 flex items-center justify-between">
                <span className="text-[13px] text-emerald-800 font-medium">
                  ✓ Quantified scale, active verb & clear business outcome.
                </span>
                <Link
                  href="/improve"
                  className="font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-wider text-[#14171F] font-semibold underline underline-offset-4 hover:text-black"
                >
                  Rewrite mine →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS: 3 STEPS */}
      <section className="border-b border-[#DBD8CE] bg-[#F6F5F1] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-xl mb-14">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
              Methodology
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight sm:text-4xl text-[#14171F]">
              How Redline prepares your resume for the top 1% of recruiters.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="group relative rounded-sm border border-[#DBD8CE] bg-white p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(20,23,31,0.06)]"
              >
                <div className="font-[family-name:var(--font-mono)] text-3xl font-bold text-[#DBD8CE] group-hover:text-[#14171F] transition-colors">
                  {s.num}
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-serif)] text-xl font-bold text-[#14171F]">
                  {s.title}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[#5A606D]">
                  {s.desc}
                </p>
                <div className="mt-6 h-1 w-8 bg-[#DBD8CE] group-hover:w-full group-hover:bg-[#D7FF3E] transition-all duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE SUITE */}
      <section className="border-b border-[#DBD8CE] bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                Full Application Suite
              </span>
              <h2 className="mt-3 font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight sm:text-4xl">
                Everything between "applied" and "hired."
              </h2>
            </div>
            <p className="text-[14.5px] text-[#5A606D] max-w-md">
              Each module is engineered to address the specific friction points of corporate recruiting funnels.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-[#DBD8CE] bg-[#DBD8CE] sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="group flex flex-col justify-between bg-white p-8 transition-all hover:bg-[#FCFCFA]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99] group-hover:text-[#14171F] font-semibold">
                      {f.tag}
                    </span>
                    <span className="rounded-full bg-[#F6F5F1] p-2 text-[#14171F] group-hover:bg-[#D7FF3E] transition-colors">
                      {f.icon}
                    </span>
                  </div>
                  <h3 className="font-[family-name:var(--font-serif)] text-xl font-bold text-[#14171F]">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-[#5A606D]">
                    {f.body}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#DBD8CE]/50 flex items-center justify-between font-[family-name:var(--font-mono)] text-[11.5px]">
                  <span className="text-[#8A8F99]">{f.stat}</span>
                  <span className="text-[#14171F] font-semibold group-hover:translate-x-1 transition-transform">
                    Launch →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BANNER */}
      <section className="border-b border-[#DBD8CE] bg-[#14171F] text-[#F6F5F1] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.label} className="border-l border-[#2F3440] pl-6">
                <div className="font-[family-name:var(--font-mono)] text-4xl font-bold text-[#D7FF3E] sm:text-5xl">
                  {s.value}
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-[#B9BCC4]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section className="border-b border-[#DBD8CE] bg-[#F6F5F1] py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-12">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
              Common Questions
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight text-[#14171F]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-sm border border-[#DBD8CE] bg-white transition-all overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-[family-name:var(--font-serif)] text-lg font-semibold text-[#14171F]"
                  >
                    <span>{faq.q}</span>
                    <span className="font-[family-name:var(--font-mono)] text-xl text-[#8A8F99] ml-4">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-[14.5px] leading-relaxed text-[#5A606D] border-t border-[#DBD8CE]/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="bg-white py-24 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <span className="inline-block rounded-full bg-[#D7FF3E]/40 px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase tracking-wider text-[#14171F] mb-4">
            Zero Guesswork
          </span>
          <h2 className="font-[family-name:var(--font-serif)] text-3xl font-bold sm:text-5xl tracking-tight text-[#14171F]">
            Stop guessing why the callback never came.
          </h2>
          <p className="mt-4 text-[16px] text-[#5A606D] max-w-lg mx-auto">
            Upload your resume now for an instant line-by-line ATS match breakdown, score assessment, and Google X-Y-Z rewrites.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/upload"
              className="rounded-sm bg-[#14171F] px-8 py-4 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] transition-all hover:bg-[#2A2E38] hover:shadow-xl"
            >
              Upload your resume now →
            </Link>
            <Link
              href="/ats"
              className="rounded-sm border border-[#DBD8CE] px-7 py-4 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#14171F] hover:bg-[#F6F5F1]"
            >
              Explore sample scan
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}