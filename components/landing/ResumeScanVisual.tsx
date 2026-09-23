"use client";

import { useEffect, useState } from "react";

type Annotation = {
  id: string;
  top: string;
  side: "left" | "right";
  kind: "flag" | "check";
  label: string;
  delay: number;
};

const ANNOTATIONS: Annotation[] = [
  {
    id: "a1",
    top: "22%",
    side: "right",
    kind: "flag",
    label: "Missing keyword: “stakeholder management”",
    delay: 900,
  },
  {
    id: "a2",
    top: "41%",
    side: "left",
    kind: "check",
    label: "Strong action verb, keep it",
    delay: 1500,
  },
  {
    id: "a3",
    top: "63%",
    side: "right",
    kind: "flag",
    label: "No metric — add a number here",
    delay: 2100,
  },
  {
    id: "a4",
    top: "80%",
    side: "left",
    kind: "check",
    label: "Matches job description",
    delay: 2700,
  },
];

const LINE_WIDTHS = [
  "78%", "92%", "60%", "85%",
  "70%", "94%", "55%", "88%",
  "64%", "90%", "48%", "76%",
];

export default function ResumeScanVisual() {
  const [visibleAnnotations, setVisibleAnnotations] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [beamKey, setBeamKey] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    ANNOTATIONS.forEach((a) => {
      timers.push(
        setTimeout(() => {
          setVisibleAnnotations((prev) => [...prev, a.id]);
        }, a.delay)
      );
    });

    const scoreStart = setTimeout(() => {
      let current = 0;
      const target = 94;
      const step = setInterval(() => {
        current += 2;
        if (current >= target) {
          current = target;
          clearInterval(step);
        }
        setScore(current);
      }, 24);
    }, 2900);
    timers.push(scoreStart);

    const loop = setInterval(() => {
      setVisibleAnnotations([]);
      setScore(0);
      setBeamKey((k) => k + 1);
    }, 6400);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(loop);
    };
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      <style jsx>{`
        @keyframes sweep {
          0% {
            top: -4%;
            opacity: 0;
          }
          6% {
            opacity: 1;
          }
          92% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        @keyframes popIn {
          from {
            opacity: 0;
            transform: translateY(4px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .beam {
          animation: sweep 2.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .annotation-pop {
          animation: popIn 0.35s ease-out forwards;
        }
      `}</style>

      {/* ATS score badge */}
      <div
        className="absolute -top-5 -right-4 z-20 flex flex-col items-center justify-center rounded-full bg-[#14171F] text-[#F6F5F1] shadow-[0_8px_24px_rgba(20,23,31,0.35)]"
        style={{ width: 84, height: 84 }}
      >
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[#9CA0AB]">
          Match
        </span>
        <span className="font-[family-name:var(--font-mono)] text-2xl font-semibold text-[#D7FF3E]">
          {score}%
        </span>
      </div>

      {/* Document */}
      <div className="relative overflow-hidden rounded-[2px] border border-[#DBD8CE] bg-white shadow-[0_20px_60px_-15px_rgba(20,23,31,0.25)]">
        {/* scan beam */}
        <div
          key={beamKey}
          className="beam pointer-events-none absolute left-0 right-0 z-10 h-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, #D7FF3E 20%, #D7FF3E 80%, transparent)",
            boxShadow: "0 0 16px 2px rgba(215,255,62,0.7)",
          }}
        />

        <div className="p-7 sm:p-9">
          {/* doc header */}
          <div className="mb-6 space-y-2 border-b border-[#EDEBE3] pb-5">
            <div className="h-3 w-2/5 rounded-sm bg-[#14171F]" />
            <div className="h-2 w-1/3 rounded-sm bg-[#C9C6BC]" />
          </div>

          {/* doc body lines */}
          <div className="space-y-3">
            {LINE_WIDTHS.map((w, i) => (
              <div
                key={i}
                className="h-2 rounded-sm bg-[#E7E4DA]"
                style={{ width: w }}
              />
            ))}
          </div>
        </div>

        {/* annotations */}
        {ANNOTATIONS.map((a) => {
          const isVisible = visibleAnnotations.includes(a.id);
          return (
            <div
              key={a.id}
              className={`absolute z-20 max-w-[180px] ${
                a.side === "right" ? "right-2 sm:-right-6 text-left" : "left-2 sm:-left-6 text-left"
              } ${isVisible ? "annotation-pop opacity-100" : "opacity-0"}`}
              style={{ top: a.top }}
            >
              <div
                className={`flex items-start gap-1.5 rounded-sm border px-2 py-1.5 text-[11px] leading-tight shadow-sm ${
                  a.kind === "flag"
                    ? "border-[#E14545]/30 bg-[#FDF0F0] text-[#B23333]"
                    : "border-[#7BA648]/30 bg-[#F2F8EA] text-[#4E7A2C]"
                }`}
              >
                <span className="mt-[1px] font-[family-name:var(--font-mono)] font-semibold">
                  {a.kind === "flag" ? "✕" : "✓"}
                </span>
                <span className="font-[family-name:var(--font-sans)]">{a.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}