import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#DBD8CE] bg-[#F6F5F1] text-[#14171F]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5 lg:gap-12">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-[family-name:var(--font-serif)] text-xl font-bold tracking-tight"
            >
              <span>Redline</span>
              <span className="h-2 w-2 rounded-full bg-[#D7FF3E]" />
            </Link>
            <p className="max-w-sm text-[14px] leading-relaxed text-[#5A606D]">
              The intelligent career co-pilot that stress-tests your resume against modern ATS algorithms, rewrites bullet points for maximum recruiter impact, and prepares you for tough interviews.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DBD8CE] bg-white px-2.5 py-1 font-[family-name:var(--font-mono)] text-[11px] text-[#4A4F58]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
                Gemini 2.5 Flash + ATS Neural Parser
              </span>
            </div>
          </div>

          {/* Tools Column */}
          <div>
            <h4 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
              Tools
            </h4>
            <ul className="mt-4 space-y-2.5 font-[family-name:var(--font-mono)] text-[12.5px] uppercase tracking-[0.05em] text-[#5A606D]">
              <li>
                <Link href="/ats" className="transition-colors hover:text-[#14171F]">
                  ATS Match Scan
                </Link>
              </li>
              <li>
                <Link href="/improve" className="transition-colors hover:text-[#14171F]">
                  Targeted Rewrites
                </Link>
              </li>
              <li>
                <Link href="/resume-builder" className="transition-colors hover:text-[#14171F]">
                  Clean ATS Builder
                </Link>
              </li>
              <li>
                <Link href="/cover-letter" className="transition-colors hover:text-[#14171F]">
                  Cover Letters
                </Link>
              </li>
              <li>
                <Link href="/mock-interview" className="transition-colors hover:text-[#14171F]">
                  Mock Interviews
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
              Workflows
            </h4>
            <ul className="mt-4 space-y-2.5 font-[family-name:var(--font-mono)] text-[12.5px] uppercase tracking-[0.05em] text-[#5A606D]">
              <li>
                <Link href="/upload" className="transition-colors hover:text-[#14171F]">
                  Upload & Parse
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition-colors hover:text-[#14171F]">
                  Scan History
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="transition-colors hover:text-[#14171F]">
                  Feedback Reports
                </Link>
              </li>
              <li>
                <Link href="/settings" className="transition-colors hover:text-[#14171F]">
                  Settings & Keys
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Philosophy */}
          <div>
            <h4 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
              Standards
            </h4>
            <p className="mt-4 text-[13px] leading-relaxed text-[#6B7280]">
              Built strictly on the Google X-Y-Z formula (<em className="italic">Accomplished [X], as measured by [Y], by doing [Z]</em>) and zero-table ATS layout specifications.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-[#DBD8CE] pt-8 sm:flex-row gap-4 font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
          <p>© {new Date().getFullYear()} Redline. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#14171F] cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[#14171F] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[#14171F] cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
