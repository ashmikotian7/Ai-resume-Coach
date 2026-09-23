import Link from "next/link";
import { Source_Serif_4, IBM_Plex_Mono, Inter } from "next/font/google";
import ResumeScanVisual from "@/components/landing/ResumeScanVisual";
import loginform from "./login/page";
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

const FEATURES = [
  {
    tag: "SCAN",
    href: "/ats",
    title: "ATS match scan",
    body: "See exactly how applicant tracking software reads your resume, line by line, before a human ever does.",
  },
  {
    tag: "REWRITE",
    href: "/improve",
    title: "Targeted rewrites",
    body: "Get sentence-level edits that swap vague duties for measurable outcomes recruiters actually search for.",
  },
  {
    tag: "BUILD",
    href: "/resume-builder",
    title: "Resume builder",
    body: "Start from a layout that parses cleanly in every ATS — no tables, no text boxes, no guesswork.",
  },
  {
    tag: "WRITE",
    href: "/cover-letter",
    title: "Cover letters",
    body: "Generate a letter that argues your specific case for this specific role, not a template with your name swapped in.",
  },
  {
    tag: "PRACTICE",
    href: "/mock-interview",
    title: "Mock interviews",
    body: "Answer follow-up questions pulled straight from your own resume, out loud, before the real thing.",
  },
  {
    tag: "TRACK",
    href: "/feedback",
    title: "Feedback reports",
    body: "Every version, every score, every fix — in one place so you know what actually moved the needle.",
  },
];

const STATS = [
  { value: "94%", label: "average ATS match after first rewrite" },
  { value: "3.1×", label: "more interview callbacks reported by users" },
  { value: "12 min", label: "median time to a scored, annotated resume" },
];

const QUOTES = [
  {
    quote:
      "I'd sent out forty applications and heard nothing. The scan showed me my resume was getting filtered before it reached a person.",
    name: "Priya M.",
    role: "Product analyst",
  },
  {
    quote:
      "The line-by-line rewrites were the useful part. Not generic tips — actual replacement sentences I could compare against mine.",
    name: "Daniel O.",
    role: "Mechanical engineer",
  },
  {
    quote:
      "Practicing out loud with questions based on my own bullet points caught gaps I wouldn't have found on my own.",
    name: "Sasha K.",
    role: "Marketing lead",
  },
];

export default function LandingPage() {
  return (
    <div
      className={`${sans.variable} ${serif.variable} ${mono.variable} min-h-screen bg-[#F6F5F1] font-[family-name:var(--font-sans)] text-[#14171F] antialiased`}
    >
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-[#DBD8CE] bg-[#F6F5F1]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-serif)] text-lg font-semibold tracking-tight"
          >
            Redline<span className="text-[#8A8F99]">.</span>
          </Link>

          <nav className="hidden items-center gap-8 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#4A4F58] md:flex">
            <Link href="/ats" className="transition-colors hover:text-[#14171F]">
              ATS scan
            </Link>
            <Link href="/improve" className="transition-colors hover:text-[#14171F]">
              Rewrites
            </Link>
            <Link href="/mock-interview" className="transition-colors hover:text-[#14171F]">
              Interview
            </Link>
            <Link href="/feedback" className="transition-colors hover:text-[#14171F]">
              Reports
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="./login"
              className="hidden font-[family-name:var(--font-mono)] text-[13px] text-[#4A4F58] transition-colors hover:text-[#14171F] sm:block"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-sm bg-[#14171F] px-4 py-2 font-[family-name:var(--font-mono)] text-[13px] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38]"
            >
              Scan my resume
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
        <div>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#DBD8CE] bg-white px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#4A4F58]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D7FF3E]" />
            Now reading resumes like an ATS does
          </span>

          <h1 className="font-[family-name:var(--font-serif)] text-[2.75rem] font-semibold leading-[1.08] tracking-tight sm:text-[3.4rem]">
            Your resume, marked up
            <br />
            before it costs you
            <br />
            <span className="relative inline-block">
              the interview
              <span className="absolute inset-x-0 bottom-1 -z-10 h-3 bg-[#D7FF3E]" />
            </span>
            .
          </h1>

          <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-[#4A4F58]">
            Upload one file. Redline scans it the way applicant tracking
            software does, flags what's costing you matches, and rewrites the
            weak lines — so you fix the resume, not just proofread it.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/upload"
              className="rounded-sm bg-[#14171F] px-6 py-3.5 text-center font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38]"
            >
              Upload your resume →
            </Link>
            <Link
              href="/ats"
              className="rounded-sm border border-[#DBD8CE] bg-transparent px-6 py-3.5 text-center font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#14171F] transition-colors hover:border-[#14171F]"
            >
              See a sample scan
            </Link>
          </div>

          <p className="mt-5 font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
            No credit card. First scan takes under a minute.
          </p>
        </div>

        <ResumeScanVisual />
      </section>

      {/* FEATURES */}
      <section className="border-t border-[#DBD8CE] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-14 max-w-lg">
            <span className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.14em] text-[#8A8F99]">
              What's inside
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything between "applied" and "hired."
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-[#DBD8CE] bg-[#DBD8CE] sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="group flex flex-col bg-white p-7 transition-colors hover:bg-[#FCFCFA]"
              >
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99] group-hover:text-[#4A4F58]">
                  {f.tag}
                </span>
                <h3 className="mt-4 font-[family-name:var(--font-serif)] text-xl font-semibold">
                  {f.title}
                </h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[#4A4F58]">
                  {f.body}
                </p>
                <span className="mt-5 font-[family-name:var(--font-mono)] text-[12px] text-[#14171F] opacity-0 transition-opacity group-hover:opacity-100">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-t border-[#DBD8CE] bg-[#14171F] text-[#F6F5F1]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="font-[family-name:var(--font-mono)] text-4xl font-semibold text-[#D7FF3E] sm:text-5xl">
                  {s.value}
                </div>
                <p className="mt-3 max-w-[220px] text-[14.5px] leading-relaxed text-[#B9BCC4]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTES */}
      <section className="bg-[#F6F5F1]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.14em] text-[#8A8F99]">
            From people who used it
          </span>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {QUOTES.map((q) => (
              <figure
                key={q.name}
                className="flex flex-col justify-between rounded-sm border border-[#DBD8CE] bg-white p-6"
              >
                <blockquote className="font-[family-name:var(--font-serif)] text-[15.5px] leading-relaxed text-[#14171F]">
                  “{q.quote}”
                </blockquote>
                <figcaption className="mt-6 font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
                  {q.name} — {q.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-[#DBD8CE] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="mx-auto max-w-xl font-[family-name:var(--font-serif)] text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Stop guessing why the callback
            <br className="hidden sm:block" /> never came.
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/upload"
              className="rounded-sm bg-[#14171F] px-7 py-3.5 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38]"
            >
              Upload your resume →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#DBD8CE] bg-[#F6F5F1]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="font-[family-name:var(--font-serif)] text-base font-semibold"
          >
            Redline<span className="text-[#8A8F99]">.</span>
          </Link>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] text-[#8A8F99]">
            <Link href="/ats" className="hover:text-[#14171F]">ATS scan</Link>
            <Link href="/resume-builder" className="hover:text-[#14171F]">Builder</Link>
            <Link href="/cover-letter" className="hover:text-[#14171F]">Cover letters</Link>
            <Link href="/mock-interview" className="hover:text-[#14171F]">Interview</Link>
            <Link href="/settings" className="hover:text-[#14171F]">Settings</Link>
          </nav>
          <p className="font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
            © {new Date().getFullYear()} Redline
          </p>
        </div>
      </footer>
    </div>
  );
}