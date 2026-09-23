"use client";

import { useState } from "react";
import Link from "next/link";
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

const TABS = [
  { id: "account", label: "Account" },
  { id: "preferences", label: "Preferences" },
  { id: "billing", label: "Billing" },
  { id: "danger", label: "Danger zone" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("account");

  // Account
  const [name, setName] = useState("Jordan Lee");
  const [email, setEmail] = useState("jordan@email.com");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Preferences
  const [emailScanResults, setEmailScanResults] = useState(true);
  const [emailTips, setEmailTips] = useState(false);
  const [defaultTone, setDefaultTone] = useState("professional");

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const handleSaveAccount = () => {
    setSavingAccount(true);
    setTimeout(() => {
      setSavingAccount(false);
      setAccountSaved(true);
      setTimeout(() => setAccountSaved(false), 2000);
    }, 800);
  };

  const handleChangePassword = () => {
    setPasswordError("");
    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    setPasswordSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  return (
    <div
      className={`${sans.variable} ${serif.variable} ${mono.variable} min-h-screen bg-[#F6F5F1] font-[family-name:var(--font-sans)] text-[#14171F] antialiased`}
    >
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-[#DBD8CE] bg-[#F6F5F1]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-serif)] text-lg font-semibold tracking-tight"
          >
            Redline<span className="text-[#8A8F99]">.</span>
          </Link>
          <Link
            href="/feedback"
            className="font-[family-name:var(--font-mono)] text-[13px] text-[#4A4F58] transition-colors hover:text-[#14171F]"
          >
            Back to reports
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
          Settings
        </span>
        <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight sm:text-4xl">
          Account settings
        </h1>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[200px_1fr]">
          {/* TAB RAIL */}
          <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap rounded-sm px-3.5 py-2.5 text-left font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] transition-colors ${
                  tab === t.id
                    ? "bg-[#14171F] text-[#F6F5F1]"
                    : "text-[#4A4F58] hover:bg-white"
                } ${t.id === "danger" && tab !== t.id ? "text-[#B5563E]" : ""}`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* PANEL */}
          <div className="min-w-0">
            {/* ACCOUNT */}
            {tab === "account" && (
              <div className="space-y-6">
                <div className="rounded-sm border border-[#DBD8CE] bg-white p-7">
                  <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold">
                    Profile
                  </h2>
                  <p className="mt-1 text-[13.5px] text-[#8A8F99]">
                    Used on generated cover letters and reports.
                  </p>

                  <div className="mt-5 space-y-4">
                    <Field label="Full name">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSaveAccount}
                      disabled={savingAccount}
                      className="rounded-sm bg-[#14171F] px-5 py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38] disabled:opacity-60"
                    >
                      {savingAccount ? "Saving…" : "Save changes"}
                    </button>
                    {accountSaved && (
                      <span className="font-[family-name:var(--font-mono)] text-[12px] text-[#2F6B45]">
                        Saved ✓
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-sm border border-[#DBD8CE] bg-white p-7">
                  <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold">
                    Password
                  </h2>
                  <p className="mt-1 text-[13.5px] text-[#8A8F99]">
                    Change the password used to log in.
                  </p>

                  <div className="mt-5 space-y-4">
                    <Field label="Current password">
                      <input
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        type="password"
                        placeholder="••••••••"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="New password">
                      <input
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        type="password"
                        placeholder="At least 8 characters"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  {passwordError && (
                    <p className="mt-4 rounded-sm border border-[#E8B4B4] bg-[#FBEAEA] px-3.5 py-2.5 font-[family-name:var(--font-sans)] text-[13px] text-[#9A3B3B]">
                      {passwordError}
                    </p>
                  )}

                  <div className="mt-6 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleChangePassword}
                      className="rounded-sm border border-[#DBD8CE] px-5 py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#14171F] transition-colors hover:border-[#14171F]"
                    >
                      Update password
                    </button>
                    {passwordSaved && (
                      <span className="font-[family-name:var(--font-mono)] text-[12px] text-[#2F6B45]">
                        Password updated ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PREFERENCES */}
            {tab === "preferences" && (
              <div className="space-y-6">
                <div className="rounded-sm border border-[#DBD8CE] bg-white p-7">
                  <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold">
                    Email notifications
                  </h2>

                  <div className="mt-5 space-y-4">
                    <ToggleRow
                      label="Scan results"
                      description="Get an email when a resume scan finishes."
                      checked={emailScanResults}
                      onChange={setEmailScanResults}
                    />
                    <ToggleRow
                      label="Tips & product updates"
                      description="Occasional emails about new features and job-search advice."
                      checked={emailTips}
                      onChange={setEmailTips}
                    />
                  </div>
                </div>

                <div className="rounded-sm border border-[#DBD8CE] bg-white p-7">
                  <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold">
                    Defaults
                  </h2>
                  <p className="mt-1 text-[13.5px] text-[#8A8F99]">
                    Applied automatically to new cover letters.
                  </p>

                  <div className="mt-5">
                    <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]">
                      Default tone
                    </label>
                    <div className="mt-1.5 grid grid-cols-4 gap-2">
                      {["professional", "confident", "warm", "direct"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDefaultTone(t)}
                          className={`rounded-sm border px-3 py-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.04em] capitalize transition-colors ${
                            defaultTone === t
                              ? "border-[#14171F] bg-[#14171F] text-[#F6F5F1]"
                              : "border-[#DBD8CE] bg-white text-[#4A4F58] hover:border-[#B7B4A9]"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BILLING */}
            {tab === "billing" && (
              <div className="space-y-6">
                <div className="rounded-sm border border-[#DBD8CE] bg-white p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                        Current plan
                      </span>
                      <h2 className="mt-1.5 font-[family-name:var(--font-serif)] text-2xl font-semibold">
                        Free
                      </h2>
                      <p className="mt-1 text-[13.5px] text-[#4A4F58]">
                        3 scans / month, 1 saved cover letter
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-sm bg-[#14171F] px-5 py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38]"
                    >
                      Upgrade to Pro
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 border-t border-[#F0EEE7] pt-6 sm:grid-cols-3">
                    <PlanStat label="Scans used" value="2 / 3 this month" />
                    <PlanStat label="Saved cover letters" value="1 / 1" />
                    <PlanStat label="Mock interviews" value="Unlimited" />
                  </div>
                </div>

                <div className="rounded-sm border border-[#DBD8CE] bg-white p-7">
                  <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold">
                    Payment method
                  </h2>
                  <p className="mt-2 text-[13.5px] text-[#8A8F99]">
                    No payment method on file — you're on the Free plan.
                  </p>
                </div>
              </div>
            )}

            {/* DANGER ZONE */}
            {tab === "danger" && (
              <div className="rounded-sm border border-[#E8B4B4] bg-white p-7">
                <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[#9A3B3B]">
                  Delete account
                </h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#4A4F58]">
                  This permanently deletes your account, saved resumes,
                  scan history, and cover letters. This can't be undone.
                </p>

                <div className="mt-5">
                  <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]">
                    Type DELETE to confirm
                  </label>
                  <input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className="mt-1.5 w-full max-w-xs rounded-sm border border-[#DBD8CE] bg-white px-3 py-2.5 font-[family-name:var(--font-sans)] text-sm text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#9A3B3B] focus:ring-2 focus:ring-[#E8B4B4]/40"
                  />
                </div>

                <button
                  type="button"
                  disabled={deleteConfirm !== "DELETE"}
                  className="mt-5 rounded-sm bg-[#9A3B3B] px-5 py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Delete my account
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#F0EEE7] pb-4 last:border-none last:pb-0">
      <div>
        <p className="text-[14px] font-medium text-[#14171F]">{label}</p>
        <p className="mt-0.5 text-[13px] text-[#8A8F99]">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[#14171F]" : "bg-[#DBD8CE]"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function PlanStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[#8A8F99]">
        {label}
      </span>
      <p className="mt-1 text-[14px] font-medium text-[#14171F]">{value}</p>
    </div>
  );
}

const inputClass =
  "w-full rounded-sm border border-[#DBD8CE] bg-white px-3 py-2.5 font-[family-name:var(--font-sans)] text-sm text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40";