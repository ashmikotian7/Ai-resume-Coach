"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

interface QuestionItem {
  id: string;
  question: string;
  context: string;
  ideal_answer: string;
}

interface Message {
  id: string;
  role: "interviewer" | "candidate";
  text: string;
  context?: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

function MockInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [started, setStarted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const [role, setRole] = useState(searchParams.get("role") || "");
  const [jobDescription, setJobDescription] = useState(searchParams.get("jobDescription") || "");
  const [difficulty, setDifficulty] = useState<"warmup" | "standard" | "tough">("standard");

  const [resumeText, setResumeText] = useState("");
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [recording, setRecording] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [finished, setFinished] = useState(false);
  const [speechError, setSpeechError] = useState("");

  const [answersList, setAnswersList] = useState<Array<{ questionId: string; question: string; answer: string; ideal_answer?: string; context?: string }>>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load resume from latest scan in sessionStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedScan = window.sessionStorage.getItem("redline_current_scan");
        if (storedScan) {
          const parsed = JSON.parse(storedScan);
          if (parsed.raw_text) {
            setResumeText(parsed.raw_text);
            setLoadedFileName(parsed.file_name || "Latest Uploaded Resume");
          }
          if (!role && parsed.job_description) {
            setJobDescription(parsed.job_description);
          }
        }
      } catch (e) {
        console.warn("Could not read stored scan:", e);
      }
    }
  }, [role]);

  // Scroll messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  // Setup Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setAnswer((prev) => {
              const cleanedPrev = prev.trim();
              return cleanedPrev ? `${cleanedPrev} ${currentTranscript.trim()}` : currentTranscript.trim();
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setSpeechError(
            event.error === "not-allowed"
              ? "Microphone access blocked. Please enable mic permissions in your browser."
              : `Microphone error: ${event.error}`
          );
          setRecording(false);
        };

        recognition.onend = () => {
          setRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const toggleRecording = () => {
    setSpeechError("");
    if (!recognitionRef.current) {
      setSpeechError("Voice input is not supported in this browser. Please type your response.");
      return;
    }

    if (recording) {
      recognitionRef.current.stop();
      setRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setRecording(true);
      } catch (e) {
        console.warn("Error starting speech recognition:", e);
        setRecording(false);
      }
    }
  };

  const handleStart = async () => {
    setLoadingQuestions(true);
    setSpeechError("");

    const textToUse =
      resumeText.trim() ||
      `Senior Professional with 5+ years driving full-lifecycle projects, streamlining operations by 34%, and leading cross-functional teams in agile development and business metric optimization.`;

    try {
      const res = await fetch("/api/mock-interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: textToUse,
          jobPosting: jobDescription.trim() || role.trim() || undefined,
          difficulty,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate targeted interview questions");
      }

      const data = await res.json();
      const generatedQuestions: QuestionItem[] = data.questions || [];

      if (generatedQuestions.length === 0) {
        throw new Error("No questions returned");
      }

      setQuestions(generatedQuestions);
      setStarted(true);
      setQuestionIndex(0);

      // Intro message + First question
      setMessages([
        {
          id: uid(),
          role: "interviewer",
          text: `Welcome. I've reviewed your resume background${
            role ? ` for the ${role} role` : ""
          } and prepared ${generatedQuestions.length} targeted questions to probe your real experience. Answer clearly, as if we are in the formal interview room.`,
        },
        {
          id: uid(),
          role: "interviewer",
          text: generatedQuestions[0].question,
          context: generatedQuestions[0].context,
        },
      ]);
    } catch (err: unknown) {
      console.error("Error initiating interview:", err);
      // Fallback questions if offline
      const fallbackList: QuestionItem[] = [
        {
          id: "1",
          question: "Walk me through your most impactful initiative. What specific trade-offs did you evaluate?",
          context: "Architectural & strategic decision making",
          ideal_answer: "Structured STAR framework with quantified business result",
        },
        {
          id: "2",
          question: "Can you detail a quantifiable metric you achieved and explain your individual contribution versus the team's?",
          context: "Verifying ownership of claimed resume metrics",
          ideal_answer: "Exact measurement tools, baseline vs result",
        },
        {
          id: "3",
          question: "Tell me about a time you faced technical or stakeholder disagreement. How did you resolve it?",
          context: "Stakeholder management & persuasion",
          ideal_answer: "Collaborative, data-backed resolution",
        },
      ];
      setQuestions(fallbackList);
      setStarted(true);
      setQuestionIndex(0);
      setMessages([
        {
          id: uid(),
          role: "interviewer",
          text: `Welcome. Let's begin the interview session${role ? ` for ${role}` : ""}.`,
        },
        {
          id: uid(),
          role: "interviewer",
          text: fallbackList[0].question,
          context: fallbackList[0].context,
        },
      ]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSend = async () => {
    if (!answer.trim()) return;

    if (recording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setRecording(false);
    }

    const currentQ = questions[questionIndex];
    const candidateMsg: Message = { id: uid(), role: "candidate", text: answer.trim() };
    const updatedAnswers = [
      ...answersList,
      {
        questionId: currentQ?.id || String(questionIndex + 1),
        question: currentQ?.question || messages[messages.length - 1]?.text || "",
        answer: answer.trim(),
        ideal_answer: currentQ?.ideal_answer,
        context: currentQ?.context,
      },
    ];

    setAnswersList(updatedAnswers);
    setMessages((prev) => [...prev, candidateMsg]);
    setAnswer("");
    setThinking(true);

    const nextIdx = questionIndex + 1;

    if (nextIdx < questions.length) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "interviewer",
            text: questions[nextIdx].question,
            context: questions[nextIdx].context,
          },
        ]);
        setQuestionIndex(nextIdx);
        setThinking(false);
      }, 1200);
    } else {
      // Completed all questions -> Evaluate performance!
      setTimeout(async () => {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "interviewer",
            text: "That concludes our questions today. Outstanding effort. I am evaluating your answers now across clarity, depth, and the STAR framework.",
          },
        ]);
        setThinking(false);
        setFinished(true);
        setEvaluating(true);

        try {
          const evalRes = await fetch("/api/mock-interview/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: role.trim() || undefined,
              difficulty,
              responses: updatedAnswers,
            }),
          });

          if (evalRes.ok) {
            const evalData = await evalRes.json();
            if (typeof window !== "undefined" && evalData.evaluation) {
              window.sessionStorage.setItem(
                "redline_latest_interview_feedback",
                JSON.stringify({
                  role: role.trim() || "Target Position",
                  date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                  difficulty,
                  ...evalData.evaluation,
                })
              );
            }
          }
        } catch (evalErr) {
          console.warn("Evaluation fetch note:", evalErr);
        } finally {
          setEvaluating(false);
        }
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
          <div className="flex items-center gap-6">
            <Link
              href="/ats"
              className="font-[family-name:var(--font-mono)] text-[13px] text-[#4A4F58] transition-colors hover:text-[#14171F]"
            >
              ATS Scanner
            </Link>
            <Link
              href="/feedback"
              className="font-[family-name:var(--font-mono)] text-[13px] text-[#4A4F58] transition-colors hover:text-[#14171F]"
            >
              Past Feedback & Reports
            </Link>
          </div>
        </div>
      </header>

      {!started ? (
        /* SETUP SCREEN */
        <main className="mx-auto max-w-xl px-6 py-16 text-center">
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#8A8F99]">
            AI Interview Simulator
          </span>
          <h1 className="mt-3 font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight sm:text-4xl">
            Practice out loud, before the real one.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#4A4F58]">
            Questions are generated live from your resume claims — so the follow-ups pressure test the exact metrics and bullet points recruiters will grill you on.
          </p>

          {loadedFileName && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#D7FF3E] bg-[#D7FF3E]/15 px-3.5 py-1 text-left">
              <span className="h-2 w-2 rounded-full bg-[#14171F]" />
              <span className="font-[family-name:var(--font-mono)] text-[12px] text-[#14171F]">
                Loaded resume claims: <strong>{loadedFileName}</strong>
              </span>
            </div>
          )}

          <div className="mt-8 space-y-5 rounded-sm border border-[#DBD8CE] bg-white p-7 text-left shadow-sm">
            <div>
              <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]">
                Target Role
              </label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Product Manager / Staff Software Engineer"
                className="mt-1.5 w-full rounded-sm border border-[#DBD8CE] bg-white px-3.5 py-2.5 font-[family-name:var(--font-sans)] text-sm text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]">
                  Job Description / Role Requirements (Optional)
                </label>
                <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                  Tailors situational questions
                </span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste key responsibilities or requirements from the job posting…"
                rows={3}
                className="mt-1.5 w-full resize-none rounded-sm border border-[#DBD8CE] bg-white px-3.5 py-2.5 font-[family-name:var(--font-sans)] text-sm text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40"
              />
            </div>

            <div>
              <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79]">
                Interview Rigor
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "warmup", label: "Warm-up", desc: "Foundational & conversational" },
                    { id: "standard", label: "Standard", desc: "Realistic technical & STAR" },
                    { id: "tough", label: "Tough", desc: "Deep drill-down & tradeoffs" },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id)}
                    className={`rounded-sm border p-2.5 text-center transition-colors ${
                      difficulty === d.id
                        ? "border-[#14171F] bg-[#14171F] text-[#F6F5F1]"
                        : "border-[#DBD8CE] bg-white text-[#4A4F58] hover:border-[#B7B4A9]"
                    }`}
                  >
                    <div className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em]">
                      {d.label}
                    </div>
                    <div
                      className={`mt-1 text-[10px] ${
                        difficulty === d.id ? "text-[#D7FF3E]" : "text-[#8A8F99]"
                      }`}
                    >
                      {d.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleStart}
              disabled={loadingQuestions}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#14171F] py-3.5 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38] disabled:opacity-60"
            >
              {loadingQuestions ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Generating Resume-Specific Questions…
                </>
              ) : (
                "Start Mock Interview →"
              )}
            </button>
          </div>

          <p className="mt-5 font-[family-name:var(--font-mono)] text-[12px] text-[#8A8F99]">
            5 targeted questions · Voice mic supported · Instant STAR scorecard
          </p>
        </main>
      ) : (
        /* INTERVIEW SCREEN */
        <main className="mx-auto flex h-[calc(100vh-73px)] max-w-3xl flex-col px-6">
          {/* Progress header */}
          <div className="flex items-center justify-between border-b border-[#DBD8CE]/60 py-4">
            <div>
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#8A8F99]">
                Question {Math.min(questionIndex + 1, questions.length)} of {questions.length}
              </span>
              {role && (
                <span className="ml-2 rounded-sm bg-[#EDEBE3] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase text-[#6B6F79]">
                  {role}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {questions.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-7 rounded-full transition-colors ${
                    i < questionIndex
                      ? "bg-[#2F6B45]"
                      : i === questionIndex
                      ? "bg-[#14171F]"
                      : "bg-[#DBD8CE]"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Conversation messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto py-5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "candidate" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-sm px-4 py-3.5 text-[14.5px] leading-relaxed shadow-sm ${
                    m.role === "interviewer"
                      ? "border border-[#DBD8CE] bg-white text-[#14171F]"
                      : "bg-[#14171F] text-[#F6F5F1]"
                  }`}
                >
                  {m.role === "interviewer" && (
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[#8A8F99]">
                        Hiring Manager
                      </span>
                      {m.context && (
                        <span className="rounded bg-[#F6F5F1] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[#6B6F79]">
                          Focus: {m.context}
                        </span>
                      )}
                    </div>
                  )}
                  {m.text}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-sm border border-[#DBD8CE] bg-white px-4 py-3">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                    Interviewer is evaluating your response…
                  </span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#14171F] [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#14171F] [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#14171F]" />
                </div>
              </div>
            )}
          </div>

          {/* Input or completion banner */}
          {!finished ? (
            <div className="border-t border-[#DBD8CE] py-4">
              {speechError && (
                <div className="mb-2 rounded-sm border border-[#E8B4B4] bg-[#FBEAEA] px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] text-[#9A3B3B]">
                  {speechError}
                </div>
              )}

              {recording && (
                <div className="mb-2 flex items-center gap-2 rounded-sm bg-[#D7FF3E]/20 px-3 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D65A4A] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D65A4A]" />
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[#14171F]">
                    Listening via microphone… speak clearly into your mic
                  </span>
                </div>
              )}

              <div className="flex items-end gap-3 rounded-sm border border-[#DBD8CE] bg-white p-3 focus-within:border-[#14171F] focus-within:ring-2 focus-within:ring-[#D7FF3E]/40">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    recording
                      ? "Listening to your voice… your words appear here."
                      : "Type your answer, or tap the microphone to speak out loud…"
                  }
                  rows={2}
                  className="flex-1 resize-none bg-transparent font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#14171F] outline-none placeholder:text-[#B7B4A9]"
                />
                <button
                  type="button"
                  onClick={toggleRecording}
                  title={recording ? "Stop Voice Recording" : "Use Voice Input (Microphone)"}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border transition-all ${
                    recording
                      ? "animate-pulse border-[#D65A4A] bg-[#D65A4A] text-white shadow-md"
                      : "border-[#DBD8CE] text-[#4A4F58] hover:border-[#14171F] hover:text-[#14171F]"
                  }`}
                  aria-label="Toggle voice input"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0014 0M12 19v3" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!answer.trim() || thinking}
                  className="flex h-10 shrink-0 items-center justify-center rounded-sm bg-[#14171F] px-5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38] disabled:opacity-40"
                >
                  Send Answer →
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[#8A8F99]">
                <span className="font-[family-name:var(--font-mono)]">
                  Enter to send · Shift+Enter for new line · Mic toggles speech-to-text
                </span>
                <span className="font-[family-name:var(--font-mono)]">
                  {answer.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>
          ) : (
            <div className="border-t border-[#DBD8CE] py-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#D7FF3E] text-[#14171F]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="mt-3 font-[family-name:var(--font-serif)] text-2xl font-semibold text-[#14171F]">
                Interview Completed.
              </p>
              <p className="mt-1.5 text-[14.5px] text-[#4A4F58]">
                {evaluating
                  ? "Generating your comprehensive performance scorecard and STAR coaching tips…"
                  : "Your answers have been analyzed across clarity, STAR framework adherence, and metric justification."}
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/feedback?type=interview")}
                  className="rounded-sm bg-[#14171F] px-7 py-3.5 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] transition-colors hover:bg-[#2A2E38]"
                >
                  {evaluating ? "Opening Feedback…" : "View Full Scorecard & Coaching →"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStarted(false);
                    setMessages([]);
                    setQuestionIndex(0);
                    setFinished(false);
                    setAnswersList([]);
                  }}
                  className="rounded-sm border border-[#DBD8CE] bg-white px-6 py-3.5 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#14171F] transition-colors hover:border-[#14171F]"
                >
                  Practice Again
                </button>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default function MockInterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F5F1] p-12 text-center font-[family-name:var(--font-mono)] text-sm text-[#8A8F99]">
          Loading Mock Interview Simulator…
        </div>
      }
    >
      <MockInterviewContent />
    </Suspense>
  );
}