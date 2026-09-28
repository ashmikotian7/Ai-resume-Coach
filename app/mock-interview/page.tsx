"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/navbar/Header";
import Footer from "@/components/common/Footer";

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

  const [answersList, setAnswersList] = useState<
    Array<{ questionId: string; question: string; answer: string; ideal_answer?: string; context?: string }>
  >([]);

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

  // Auto scroll messages
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
              ? "Microphone access blocked. Please allow mic permissions in your browser."
              : `Microphone notice: ${event.error}`
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

  const handleLoadSample = () => {
    setRole("Senior Product Manager");
    setJobDescription(
      "Lead cross-functional teams in driving SaaS product roadmap, data-informed prioritization, and experimentation across web and mobile funnels."
    );
    setResumeText(
      "Product Lead with 6+ years shipping high-velocity consumer software. Scaled mobile activation from 31% to 49% using A/B testing and reduced churn by 18%."
    );
    setLoadedFileName("Sample_Product_Resume.pdf");
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
          text: `Welcome. I've reviewed your background${
            role ? ` for the ${role} position` : ""
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
      // Robust fallback list if offline or API limit reached
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
    <div className="min-h-screen bg-[#F6F5F1] text-[#14171F] flex flex-col justify-between">
      {!started && <Header />}

      {!started ? (
        /* SETUP SCREEN */
        <main className="mx-auto max-w-2xl w-full px-4 sm:px-6 py-14 text-center flex-grow">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DBD8CE] bg-white px-3.5 py-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#5A606D] shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#D7FF3E] animate-pulse-subtle" />
            <span>AI Voice &amp; Scenario Simulator</span>
          </div>

          <h1 className="mt-4 font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight sm:text-4xl text-[#14171F]">
            Practice out loud, before the real interview.
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#5A606D] max-w-lg mx-auto">
            Questions are generated directly from your resume claims. The interviewer will probe your metrics, architecture decisions, and conflict resolutions.
          </p>

          {loadedFileName && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="font-[family-name:var(--font-mono)] text-[12px] text-emerald-900 font-semibold">
                Loaded Claims: {loadedFileName}
              </span>
            </div>
          )}

          <div className="mt-8 space-y-5 rounded-sm border border-[#DBD8CE] bg-white p-7 text-left shadow-sm">
            <div className="flex items-center justify-between">
              <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79] font-bold">
                Target Role
              </label>
              <button
                type="button"
                onClick={handleLoadSample}
                className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99] hover:text-[#14171F] underline underline-offset-2"
              >
                Use Sample PM Role
              </button>
            </div>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Product Manager / Staff Software Engineer"
              className="w-full rounded-sm border border-[#DBD8CE] bg-white px-3.5 py-2.5 font-[family-name:var(--font-sans)] text-sm text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40"
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79] font-bold">
                  Job Description / Role Focus (Optional)
                </label>
                <span className="font-[family-name:var(--font-mono)] text-[10.5px] text-[#8A8F99]">
                  Tailors deep technical questions
                </span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste key responsibilities or required competencies from the job posting…"
                rows={3}
                className="w-full resize-none rounded-sm border border-[#DBD8CE] bg-white p-3 font-[family-name:var(--font-sans)] text-sm text-[#14171F] placeholder:text-[#B7B4A9] outline-none transition-colors focus:border-[#14171F] focus:ring-2 focus:ring-[#D7FF3E]/40"
              />
            </div>

            <div>
              <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#6B6F79] font-bold block mb-2">
                Interview Rigor &amp; Pressure Level
              </label>
              <div className="grid grid-cols-3 gap-2">
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
                    className={`rounded-sm border p-3 text-center transition-all ${
                      difficulty === d.id
                        ? "border-[#14171F] bg-[#14171F] text-[#F6F5F1] shadow-xs"
                        : "border-[#DBD8CE] bg-white text-[#4A4F58] hover:border-[#B7B4A9] hover:bg-[#FAF9F5]"
                    }`}
                  >
                    <div className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] font-semibold">
                      {d.label}
                    </div>
                    <div
                      className={`mt-1 text-[10px] leading-tight ${
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
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#14171F] py-4 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] font-bold transition-all hover:bg-[#2A2E38] disabled:opacity-60 shadow-md active:scale-[0.99]"
            >
              {loadingQuestions ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Generating Resume-Specific Questions…
                </>
              ) : (
                "Start Mock Interview Session →"
              )}
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center font-[family-name:var(--font-mono)] text-[11px] text-[#6B7280]">
            <div className="border-t border-[#DBD8CE] pt-3">
              <strong>Live Audio Mic</strong>
              <p className="mt-0.5 text-[#8A8F99]">Speak responses naturally</p>
            </div>
            <div className="border-t border-[#DBD8CE] pt-3">
              <strong>Resume Probing</strong>
              <p className="mt-0.5 text-[#8A8F99]">Checks metrics &amp; ownership</p>
            </div>
            <div className="border-t border-[#DBD8CE] pt-3">
              <strong>STAR Scorecard</strong>
              <p className="mt-0.5 text-[#8A8F99]">Instant rubric evaluation</p>
            </div>
          </div>
        </main>
      ) : (
        /* INTERVIEW SCREEN */
        <div className="flex flex-col h-screen">
          {/* Custom Interview Header */}
          <header className="border-b border-[#DBD8CE] bg-white px-6 py-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setStarted(false)}
                className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-wider text-[#8A8F99] hover:text-[#14171F]"
              >
                ← Exit
              </button>
              <div className="h-4 w-px bg-[#DBD8CE]" />
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-serif)] font-bold text-lg text-[#14171F]">
                  Redline Room
                </span>
                {role && (
                  <span className="rounded-full bg-[#EDEBE3] px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10.5px] uppercase text-[#6B6F79] font-medium">
                    {role}
                  </span>
                )}
              </div>
            </div>

            {/* Progress indicators */}
            <div className="flex items-center gap-3">
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-[#8A8F99]">
                Q{Math.min(questionIndex + 1, questions.length)} of {questions.length}
              </span>
              <div className="flex items-center gap-1.5">
                {questions.map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 w-6 rounded-full transition-all duration-300 ${
                      i < questionIndex
                        ? "bg-emerald-600"
                        : i === questionIndex
                        ? "bg-[#14171F] scale-y-125"
                        : "bg-[#DBD8CE]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </header>

          <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col px-4 sm:px-6 overflow-hidden">
            {/* Conversation messages */}
            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto py-6 pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "candidate" ? "justify-end" : "justify-start"} animate-in fade-in-50 duration-200`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-sm p-5 text-[15px] leading-relaxed shadow-sm ${
                      m.role === "interviewer"
                        ? "border border-[#DBD8CE] bg-white text-[#14171F]"
                        : "bg-[#14171F] text-[#F6F5F1]"
                    }`}
                  >
                    {m.role === "interviewer" && (
                      <div className="mb-2.5 flex items-center justify-between gap-3 border-b border-[#F0EEE7] pb-2">
                        <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.08em] font-bold text-[#6B7280] flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Hiring Manager
                        </span>
                        {m.context && (
                          <span className="rounded-full bg-[#F6F5F1] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[#6B6F79]">
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
                  <div className="flex items-center gap-2 rounded-sm border border-[#DBD8CE] bg-white px-5 py-3 shadow-xs">
                    <span className="font-[family-name:var(--font-mono)] text-[11.5px] text-[#6B7280]">
                      Evaluating response against STAR rubrics…
                    </span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#14171F] [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#14171F] [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#14171F]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input & Mic Bar */}
            {!finished ? (
              <div className="border-t border-[#DBD8CE] py-4 bg-[#F6F5F1]">
                {speechError && (
                  <div className="mb-2 rounded-sm border border-red-200 bg-red-50 px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] text-red-800">
                    {speechError}
                  </div>
                )}

                {/* Animated Sound Wave when recording */}
                {recording && (
                  <div className="mb-3 flex items-center justify-between rounded-sm bg-red-50 border border-red-200 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
                      <span className="font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-wider text-red-800 font-bold">
                        Microphone Active — Speak your answer now
                      </span>
                    </div>
                    {/* Visualizer wave bars */}
                    <div className="flex items-center gap-1">
                      <span className="h-4 w-1 bg-red-500 animate-pulse" />
                      <span className="h-6 w-1 bg-red-600 animate-bounce" />
                      <span className="h-3 w-1 bg-red-500 animate-pulse" />
                      <span className="h-7 w-1 bg-red-700 animate-bounce [animation-delay:0.1s]" />
                      <span className="h-4 w-1 bg-red-500 animate-pulse" />
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-3 rounded-sm border border-[#DBD8CE] bg-white p-3.5 focus-within:border-[#14171F] focus-within:ring-2 focus-within:ring-[#D7FF3E]/40 shadow-sm">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      recording
                        ? "Transcribing your voice in real time…"
                        : "Type your answer using the STAR method, or click the mic to speak out loud…"
                    }
                    rows={2}
                    className="flex-1 resize-none bg-transparent font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[#14171F] outline-none placeholder:text-[#B7B4A9]"
                  />
                  <button
                    type="button"
                    onClick={toggleRecording}
                    title={recording ? "Stop Voice Recording" : "Use Voice Input (Microphone)"}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border transition-all ${
                      recording
                        ? "border-red-600 bg-red-600 text-white shadow-md animate-pulse"
                        : "border-[#DBD8CE] bg-[#FAF9F5] text-[#4A4F58] hover:border-[#14171F] hover:text-[#14171F]"
                    }`}
                    aria-label="Toggle voice input"
                  >
                    <svg
                      width="18"
                      height="18"
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
                    className="flex h-11 shrink-0 items-center justify-center rounded-sm bg-[#14171F] px-6 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.06em] text-[#F6F5F1] font-semibold transition-all hover:bg-[#2A2E38] disabled:opacity-40"
                  >
                    Submit Answer →
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#8A8F99] font-[family-name:var(--font-mono)]">
                  <span>Enter to submit · Shift+Enter for newline · Mic for speech-to-text</span>
                  <span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>
            ) : (
              /* COMPLETION SCREEN */
              <div className="border-t border-[#DBD8CE] py-10 text-center bg-white rounded-t-sm shadow-lg p-6 my-auto">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#D7FF3E] text-[#14171F] shadow-sm">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl font-bold text-[#14171F] sm:text-3xl">
                  Mock Interview Completed!
                </h3>
                <p className="mt-2 text-[15px] text-[#5A606D] max-w-md mx-auto">
                  {evaluating
                    ? "Compiling your STAR scorecard, clarity metrics, and executive coaching recommendations…"
                    : "Your session responses have been evaluated against corporate interview rubrics."}
                </p>
                <div className="mt-7 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => router.push("/feedback?type=interview")}
                    className="rounded-sm bg-[#14171F] px-8 py-3.5 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#F6F5F1] font-bold hover:bg-[#2A2E38] shadow-md transition-all"
                  >
                    {evaluating ? "Finalizing Report…" : "View Full STAR Scorecard →"}
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
                    className="rounded-sm border border-[#DBD8CE] bg-white px-6 py-3.5 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.08em] text-[#14171F] hover:border-[#14171F] transition-all"
                  >
                    Practice Again
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {!started && <Footer />}
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