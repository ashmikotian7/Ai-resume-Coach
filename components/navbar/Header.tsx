"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkItem {
  name: string;
  href: string;
  badge?: string;
}

const NAV_ITEMS: NavLinkItem[] = [
  { name: "ATS Scan", href: "/ats" },
  { name: "Rewrites", href: "/improve" },
  { name: "Builder", href: "/resume-builder" },
  { name: "Cover Letter", href: "/cover-letter" },
  { name: "Interview", href: "/mock-interview", badge: "AI Audio" },
  { name: "Dashboard", href: "/dashboard" },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#DBD8CE]/80 bg-[#F6F5F1]/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2 font-[family-name:var(--font-serif)] text-xl font-bold tracking-tight text-[#14171F]"
          >
            <span>Redline</span>
            <span className="inline-block h-2 w-2 rounded-full bg-[#D7FF3E] transition-transform duration-300 group-hover:scale-125 group-hover:ring-4 group-hover:ring-[#D7FF3E]/30" />
          </Link>
          <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-[#DBD8CE] bg-white/70 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[#6B7280]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
            ATS Engine Live
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3.5 py-1.5 rounded-sm transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? "font-semibold text-[#14171F] bg-white/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-[#DBD8CE]/70"
                    : "text-[#5A606D] hover:text-[#14171F] hover:bg-black/[0.03]"
                }`}
              >
                <span>{item.name}</span>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-[#D7FF3E] text-[#14171F] rounded-full font-bold lowercase tracking-normal">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-block font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-wider text-[#5A606D] transition-colors hover:text-[#14171F] px-2 py-1"
          >
            Log in
          </Link>
          <Link
            href="/upload"
            className="group relative inline-flex items-center gap-2 rounded-sm bg-[#14171F] px-4 py-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] text-[#F6F5F1] transition-all hover:bg-[#2A2E38] hover:shadow-[0_4px_12px_rgba(20,23,31,0.15)] active:scale-[0.98]"
          >
            <span>Scan Resume</span>
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-sm text-[#14171F] hover:bg-black/5 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DBD8CE] bg-[#F6F5F1] px-6 py-5 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em]">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-sm transition-colors ${
                    isActive
                      ? "bg-white text-[#14171F] font-semibold border border-[#DBD8CE]"
                      : "text-[#5A606D] hover:bg-black/5 hover:text-[#14171F]"
                  }`}
                >
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#D7FF3E] text-[#14171F] rounded-full font-bold lowercase tracking-normal">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="mt-4 pt-4 border-t border-[#DBD8CE] flex flex-col gap-2">
              <Link
                href="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-sm bg-[#14171F] py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] text-[#F6F5F1]"
              >
                Scan Resume Now →
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-sm border border-[#DBD8CE] py-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.08em] text-[#14171F]"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
