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

type Experience = {
  id: string;
  role: string;
  company: string;
  dates: string;
  bullets: string;
};

type Education = {
  id: string;
  school: string;
  degree: string;
  dates: string;
};

const uid = () => Math.random().toString(36).slice(2, 9);

const SECTIONS = [
  { id: "contact", label: "Contact" },
  { id: "summary", label: "Summary" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
] as const;

export default function ResumeBuilderPage() {
  const [activeSection, setActiveSection] =
    useState<(typeof SECTIONS)[number]["id"]>("contact");

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  const [summary, setSummary] = useState("");

  const [experiences, setExperiences] = useState<Experience[]>([
    { id: uid(), role: "", company: "", dates: "", bullets: "" },
  ]);

  const [education, setEducation] = useState<Education[]>([
    { id: uid(), school: "", degree: "", dates: "" },
  ]);

  const [skills, setSkills] = useState("");

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setExperiences((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  const addExperience = () =>
    setExperiences((prev) => [
      ...prev,
      { id: uid(), role: "", company: "", dates: "", bullets: "" },
    ]);

  const removeExperience = (id: string) =>
    setExperiences((prev) => prev.filter((exp) => exp.id !== id));

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setEducation((prev) =>
      prev.map((ed) => (ed.id === id ? { ...ed, [field]: value } : ed))
    );
  };

  const addEducation = () =>
    setEducation((prev) => [...prev, { id: uid(), school: "", degree: "", dates: "" }]);

  const removeEducation = (id: string) =>
    setEducation((prev) => prev.filter((ed) => ed.id !== id));

  const skillList = skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      className={`${sans.variable} ${serif.variable} ${mono.variable} min-h-screen bg-[#F6F5F1] font-[family-name:var(--font-sans)] text-[#14171F] antialiased`}
    >
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-[#DBD8CE] bg-[#F6F5F1]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-serif)] text-lg font-semibold tracking-tight"
          >
            Redline<span className="text-[#8A8F99]">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-sm border border-[#DBD8CE] bg-white px-4 py-2 font-[family-name:var(--font-mono)] text-[13px] text-[#14171F] transition-colors hover:border-[#14171F]"
            >
              Download PDF
            </button>
            <Link
              href="/ats"
              className="rounded-sm bg-[#14171F] px-4 py-2 font-[family-name:var(--font-mono)] text-[13px] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38]"
            >
              Run ATS scan
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[380px_1fr]">
        {/* FORM PANEL */}
        <div className="rounded-sm border border-[#DBD8CE] bg-white">
          {/* section tabs */}
          <div className="flex overflow-x-auto border-b border-[#DBD8CE]">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] transition-colors ${
                  activeSection === s.id
                    ? "border-[#14171F] text-[#14171F]"
                    : "border-transparent text-[#8A8F99] hover:text-[#4A4F58]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-6">
            {/* CONTACT */}
            {activeSection === "contact" && (
              <div className="space-y-4">
                <Field label="Full name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jordan Lee"
                    className={inputClass}
                  />
                </Field>
                <Field label="Target title">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Senior Product Manager"
                    className={inputClass}
                  />
                </Field>
                <Field label="Email">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan@email.com"
                    className={inputClass}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className={inputClass}
                  />
                </Field>
                <Field label="Location">
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Austin, TX"
                    className={inputClass}
                  />
                </Field>
              </div>
            )}

            {/* SUMMARY */}
            {activeSection === "summary" && (
              <div className="space-y-4">
                <Field label="Professional summary">
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Product manager with 6 years driving 0-to-1 launches across fintech and marketplaces…"
                    rows={8}
                    className={`${inputClass} resize-none`}
                  />
                </Field>
                <p className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                  2–3 sentences. Lead with your role and years of experience,
                  then your strongest measurable outcome.
                </p>
              </div>
            )}

            {/* EXPERIENCE */}
            {activeSection === "experience" && (
              <div className="space-y-6">
                {experiences.map((exp, i) => (
                  <div
                    key={exp.id}
                    className="space-y-3 rounded-sm border border-[#EDEBE3] bg-[#FCFCFA] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[#8A8F99]">
                        Role {i + 1}
                      </span>
                      {experiences.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExperience(exp.id)}
                          className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#8A8F99] hover:text-[#D65A4A]"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                      placeholder="Job title"
                      className={inputClass}
                    />
                    <input
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                      placeholder="Company"
                      className={inputClass}
                    />
                    <input
                      value={exp.dates}
                      onChange={(e) => updateExperience(exp.id, "dates", e.target.value)}
                      placeholder="Jan 2022 — Present"
                      className={inputClass}
                    />
                    <textarea
                      value={exp.bullets}
                      onChange={(e) => updateExperience(exp.id, "bullets", e.target.value)}
                      placeholder={"One bullet per line, e.g.\nLed a 6-person team to cut turnaround time by 34%"}
                      rows={4}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addExperience}
                  className="w-full rounded-sm border border-dashed border-[#DBD8CE] py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#4A4F58] transition-colors hover:border-[#14171F] hover:text-[#14171F]"
                >
                  + Add another role
                </button>
              </div>
            )}

            {/* EDUCATION */}
            {activeSection === "education" && (
              <div className="space-y-6">
                {education.map((ed, i) => (
                  <div
                    key={ed.id}
                    className="space-y-3 rounded-sm border border-[#EDEBE3] bg-[#FCFCFA] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[#8A8F99]">
                        School {i + 1}
                      </span>
                      {education.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEducation(ed.id)}
                          className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#8A8F99] hover:text-[#D65A4A]"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      value={ed.school}
                      onChange={(e) => updateEducation(ed.id, "school", e.target.value)}
                      placeholder="University name"
                      className={inputClass}
                    />
                    <input
                      value={ed.degree}
                      onChange={(e) => updateEducation(ed.id, "degree", e.target.value)}
                      placeholder="B.S. Computer Science"
                      className={inputClass}
                    />
                    <input
                      value={ed.dates}
                      onChange={(e) => updateEducation(ed.id, "dates", e.target.value)}
                      placeholder="2016 — 2020"
                      className={inputClass}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEducation}
                  className="w-full rounded-sm border border-dashed border-[#DBD8CE] py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#4A4F58] transition-colors hover:border-[#14171F] hover:text-[#14171F]"
                >
                  + Add another school
                </button>
              </div>
            )}

            {/* SKILLS */}
            {activeSection === "skills" && (
              <div className="space-y-4">
                <Field label="Skills">
                  <textarea
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="SQL, A/B testing, Roadmapping, Figma, Stakeholder management"
                    rows={6}
                    className={`${inputClass} resize-none`}
                  />
                </Field>
                <p className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                  Comma-separated. Match the exact terms used in the job
                  posting where accurate.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PREVIEW PANEL */}
        <div className="rounded-sm border border-[#DBD8CE] bg-[#EDEBE3] p-4 sm:p-8">
          <div className="mx-auto max-w-[680px] rounded-sm bg-white p-10 shadow-sm sm:p-14">
            {/* header */}
            <div className="border-b border-[#DBD8CE] pb-5">
              <h1 className="font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight text-[#14171F]">
                {name || "Your Name"}
              </h1>
              {title && (
                <p className="mt-1 text-[15px] text-[#4A4F58]">{title}</p>
              )}
              <p className="mt-2 font-[family-name:var(--font-mono)] text-[11.5px] text-[#8A8F99]">
                {[email, phone, location].filter(Boolean).join("   ·   ") ||
                  "email@example.com   ·   (555) 123-4567   ·   City, ST"}
              </p>
            </div>

            {/* summary */}
            {summary && (
              <div className="mt-6">
                <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                  Summary
                </h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#14171F]">
                  {summary}
                </p>
              </div>
            )}

            {/* experience */}
            {experiences.some((e) => e.role || e.company) && (
              <div className="mt-7">
                <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                  Experience
                </h2>
                <div className="mt-3 space-y-5">
                  {experiences
                    .filter((e) => e.role || e.company)
                    .map((exp) => (
                      <div key={exp.id}>
                        <div className="flex items-baseline justify-between gap-4">
                          <p className="text-[14.5px] font-semibold text-[#14171F]">
                            {exp.role || "Role title"}
                            {exp.company && (
                              <span className="font-normal text-[#4A4F58]">
                                {" "}
                                — {exp.company}
                              </span>
                            )}
                          </p>
                          {exp.dates && (
                            <span className="shrink-0 font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                              {exp.dates}
                            </span>
                          )}
                        </div>
                        {exp.bullets && (
                          <ul className="mt-1.5 list-disc space-y-1 pl-4">
                            {exp.bullets
                              .split("\n")
                              .filter(Boolean)
                              .map((b, i) => (
                                <li
                                  key={i}
                                  className="text-[13.5px] leading-relaxed text-[#14171F]"
                                >
                                  {b}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* education */}
            {education.some((e) => e.school) && (
              <div className="mt-7">
                <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                  Education
                </h2>
                <div className="mt-3 space-y-3">
                  {education
                    .filter((e) => e.school)
                    .map((ed) => (
                      <div
                        key={ed.id}
                        className="flex items-baseline justify-between gap-4"
                      >
                        <p className="text-[14px] text-[#14171F]">
                          {ed.school}
                          {ed.degree && (
                            <span className="text-[#4A4F58]"> — {ed.degree}</span>
                          )}
                        </p>
                        {ed.dates && (
                          <span className="shrink-0 font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                            {ed.dates}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* skills */}
            {skillList.length > 0 && (
              <div className="mt-7">
                <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                  Skills
                </h2>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {skillList.map((s, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-[#DBD8CE] px-3 py-1 text-[12.5px] text-[#14171F]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* empty state */}
            {!name &&
              !summary &&
              !experiences.some((e) => e.role) &&
              !education.some((e) => e.school) &&
              skillList.length === 0 && (
                <p className="mt-10 text-center font-[family-name:var(--font-mono)] text-[12px] text-[#B7B4A9]">
                  Fill in the form on the left — your resume builds itself
                  here.
                </p>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-sm border border-[#DBD8CE] bg-white px-3 py-2.5 font-[family-name:var(--font-sans)] text-sm text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40";