"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/navbar/Header";
import Footer from "@/components/common/Footer";

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

  const handleFillSample = () => {
    setName("Alex Rivera");
    setTitle("Senior Product Manager");
    setEmail("alex.rivera@example.com");
    setPhone("(555) 382-9102");
    setLocation("San Francisco, CA");
    setSummary(
      "Customer-obsessed Product Manager with 6+ years scaling B2B SaaS workflows and data platforms. Championed experimentation frameworks that boosted activation by 38% and unlocked $4.2M in annual pipeline."
    );
    setExperiences([
      {
        id: uid(),
        role: "Senior Product Manager",
        company: "VentureScale Inc.",
        dates: "2022 — Present",
        bullets:
          "Led 8-person engineering pod to rebuild customer onboarding funnel, lifting 30-day retention from 22% to 41%.\nSpearheaded adoption of real-time usage analytics across 180K daily active accounts, surfacing $850K in upsell opportunities.\nOwned product roadmap for core billing integration, reducing payment processing failures by 64%.",
      },
      {
        id: uid(),
        role: "Product Manager",
        company: "Apex Cloud Technologies",
        dates: "2019 — 2022",
        bullets:
          "Launched enterprise audit logging capability required for SOC2 compliance, closing 14 Fortune 500 deals.\nConducted 45+ customer discovery interviews to design workflow automations adopted by 65% of customer base within 60 days.",
      },
    ]);
    setEducation([
      {
        id: uid(),
        school: "University of California, Berkeley",
        degree: "B.S. Electrical Engineering & Computer Science",
        dates: "2015 — 2019",
      },
    ]);
    setSkills(
      "Product Strategy, SQL, A/B Testing, User Research, Agile/Scrum, Roadmap Prioritization, System Architecture, Go-to-Market"
    );
  };

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#14171F] flex flex-col justify-between print:bg-white">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          header,
          footer,
          .no-print {
            display: none !important;
          }
          body,
          main {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .resume-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div className="no-print">
        <Header />
      </div>

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 flex-grow">
        {/* TOP CONTROLS */}
        <div className="no-print border-b border-[#DBD8CE]/80 pb-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
                Zero-Trap ATS Builder
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#D7FF3E]" />
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#5A606D]">
                Guaranteed 100% Parseable Structure
              </span>
            </div>
            <h1 className="mt-1.5 font-[family-name:var(--font-serif)] text-2xl font-bold sm:text-3xl text-[#14171F]">
              Build an ATS-proof resume in minutes.
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleFillSample}
              className="rounded-sm border border-[#DBD8CE] bg-white px-3.5 py-2 font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-wider text-[#14171F] hover:bg-[#FAF9F5] shadow-xs"
            >
              Fill Sample Profile
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-sm bg-[#14171F] px-4 py-2 font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-wider text-[#F6F5F1] font-bold hover:bg-[#2A2E38] shadow-xs"
            >
              Export PDF Resume →
            </button>
          </div>
        </div>

        {/* TWO-COLUMN BUILDER */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
          {/* FORM PANEL */}
          <div className="no-print rounded-sm border border-[#DBD8CE] bg-white shadow-xs">
            {/* section tabs */}
            <div className="flex overflow-x-auto border-b border-[#DBD8CE] bg-[#FAF9F5]">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className={`whitespace-nowrap border-b-2 px-4 py-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] font-semibold transition-colors ${
                    activeSection === s.id
                      ? "border-[#14171F] bg-white text-[#14171F]"
                      : "border-transparent text-[#8A8F99] hover:text-[#4A4F58]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="max-h-[calc(100vh-260px)] overflow-y-auto p-6 space-y-4">
              {/* CONTACT */}
              {activeSection === "contact" && (
                <div className="space-y-4">
                  <Field label="Full Name">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jordan Lee"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Target Headline / Title">
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Senior Product Manager"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Email Address">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan@email.com"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Phone Number">
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
                  <Field label="Professional Summary">
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Product leader with 6+ years driving 0-to-1 launches across fintech and SaaS platforms…"
                      rows={8}
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                  <p className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99] leading-relaxed">
                    2–3 concise sentences. Lead with your role and years of experience, followed by your strongest quantifiable business outcome.
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
                        <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[#8A8F99] font-bold">
                          Role {i + 1}
                        </span>
                        {experiences.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExperience(exp.id)}
                            className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        value={exp.role}
                        onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                        placeholder="Job Title"
                        className={inputClass}
                      />
                      <input
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                        placeholder="Company Name"
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
                    className="w-full rounded-sm border border-dashed border-[#DBD8CE] py-3 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#4A4F58] hover:border-[#14171F] hover:text-[#14171F] transition-colors"
                  >
                    + Add Another Position
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
                        <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[#8A8F99] font-bold">
                          Degree / School {i + 1}
                        </span>
                        {education.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEducation(ed.id)}
                            className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        value={ed.school}
                        onChange={(e) => updateEducation(ed.id, "school", e.target.value)}
                        placeholder="University / Institution Name"
                        className={inputClass}
                      />
                      <input
                        value={ed.degree}
                        onChange={(e) => updateEducation(ed.id, "degree", e.target.value)}
                        placeholder="Degree & Major (e.g. B.S. Computer Science)"
                        className={inputClass}
                      />
                      <input
                        value={ed.dates}
                        onChange={(e) => updateEducation(ed.id, "dates", e.target.value)}
                        placeholder="Graduation Year (e.g. 2016 — 2020)"
                        className={inputClass}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEducation}
                    className="w-full rounded-sm border border-dashed border-[#DBD8CE] py-3 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#4A4F58] hover:border-[#14171F] hover:text-[#14171F] transition-colors"
                  >
                    + Add Another Degree
                  </button>
                </div>
              )}

              {/* SKILLS */}
              {activeSection === "skills" && (
                <div className="space-y-4">
                  <Field label="Key Skills & Technologies">
                    <textarea
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="SQL, A/B testing, Product Roadmapping, Figma, Stakeholder management, Python, Cloud Architecture"
                      rows={6}
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                  <p className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                    Comma-separated list. Match the exact keywords from your target job description.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* PREVIEW SHEET */}
          <div className="rounded-sm border border-[#DBD8CE] bg-[#EDEBE3] p-4 sm:p-8 overflow-x-auto">
            <div className="resume-sheet mx-auto max-w-[680px] rounded-sm bg-white p-8 sm:p-12 shadow-md">
              {/* Header */}
              <div className="border-b border-[#DBD8CE] pb-5">
                <h1 className="font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight text-[#14171F]">
                  {name || "Your Full Name"}
                </h1>
                {title && (
                  <p className="mt-1 text-[15px] font-medium text-[#4A4F58]">{title}</p>
                )}
                <p className="mt-2 font-[family-name:var(--font-mono)] text-[11.5px] text-[#6B7280]">
                  {[email, phone, location].filter(Boolean).join("   ·   ") ||
                    "email@example.com   ·   (555) 123-4567   ·   City, ST"}
                </p>
              </div>

              {/* Summary */}
              {summary && (
                <div className="mt-6">
                  <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99] font-bold">
                    Professional Summary
                  </h2>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[#14171F]">
                    {summary}
                  </p>
                </div>
              )}

              {/* Experience */}
              {experiences.some((e) => e.role || e.company) && (
                <div className="mt-7">
                  <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99] font-bold">
                    Work Experience
                  </h2>
                  <div className="mt-3 space-y-5">
                    {experiences
                      .filter((e) => e.role || e.company)
                      .map((exp) => (
                        <div key={exp.id}>
                          <div className="flex items-baseline justify-between gap-4">
                            <p className="text-[14.5px] font-bold text-[#14171F]">
                              {exp.role || "Job Title"}
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
                                    className="text-[13px] leading-relaxed text-[#14171F]"
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

              {/* Education */}
              {education.some((e) => e.school) && (
                <div className="mt-7">
                  <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99] font-bold">
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
                          <p className="text-[14px] text-[#14171F] font-semibold">
                            {ed.school}
                            {ed.degree && (
                              <span className="text-[#4A4F58] font-normal"> — {ed.degree}</span>
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

              {/* Skills */}
              {skillList.length > 0 && (
                <div className="mt-7">
                  <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99] font-bold">
                    Skills &amp; Competencies
                  </h2>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {skillList.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-xs border border-[#DBD8CE] px-2.5 py-0.5 text-[12px] text-[#14171F] font-medium bg-[#FAF9F5]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state prompt */}
              {!name &&
                !summary &&
                !experiences.some((e) => e.role) &&
                !education.some((e) => e.school) &&
                skillList.length === 0 && (
                  <p className="mt-12 text-center font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
                    Click &ldquo;Fill Sample Profile&rdquo; above or enter your info on the left to see your clean ATS resume build live.
                  </p>
                )}
            </div>
          </div>
        </div>
      </main>

      <div className="no-print">
        <Footer />
      </div>
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
      <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79] font-bold">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-sm border border-[#DBD8CE] bg-white px-3 py-2.5 font-[family-name:var(--font-sans)] text-sm text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40";