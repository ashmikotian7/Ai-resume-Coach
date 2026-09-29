"use client";

import { useState, useRef, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/navbar/Header";
import Footer from "@/components/common/Footer";
import { EvaluationResult, QuestionEvaluation } from "@/app/api/mock-interview/evaluate/route";

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

  // Audio / TTS state
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Timer per question
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showStarGuide, setShowStarGuide] = useState(false);

  // In-session Evaluation result
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "questions">("overview");

  const [answersList, setAnswersList] = useState<
    Array<{ questionId: string; question: string; answer: string; ideal_answer?: string; context?: string }>
  >([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Helper for text to speech
  const speakText = useCallback(
    (text: string) => {
      if (!audioEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const englishVoice =
          voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))) ||
          voices.find((v) => v.lang.startsWith("en"));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("TTS notice:", err);
      }
    },
    [audioEnabled]
  );

  // Stop TTS on unmount or navigation
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Timer tick during active question
  useEffect(() => {
    if (!started || finished || thinking) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [started, finished, thinking, questionIndex]);

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
      setTimerSeconds(0);

      const introText = `Welcome. I've reviewed your background${
        role ? ` for the ${role} position` : ""
      } and prepared ${generatedQuestions.length} targeted questions to probe your real experience. Answer clearly, as if we are in the formal interview room.`;

      setMessages([
        {
          id: uid(),
          role: "interviewer",
          text: introText,
        },
        {
          id: uid(),
          role: "interviewer",
          text: generatedQuestions[0].question,
          context: generatedQuestions[0].context,
        },
      ]);

      speakText(generatedQuestions[0].question);
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
      setTimerSeconds(0);
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
      speakText(fallbackList[0].question);
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

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
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
    setTimerSeconds(0);

    const nextIdx = questionIndex + 1;

    if (nextIdx < questions.length) {
      setTimeout(() => {
        const nextQ = questions[nextIdx];
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "interviewer",
            text: nextQ.question,
            context: nextQ.context,
          },
        ]);
        setQuestionIndex(nextIdx);
        setThinking(false);
        setTimerSeconds(0);
        speakText(nextQ.question);
      }, 1200);
    } else {
      // Completed all questions -> Evaluate performance!
      setTimeout(async () => {
        const wrapUpText = "That concludes our interview session today. Outstanding dedication. I am evaluating your answers across clarity, depth, executive presence, and the STAR framework.";
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "interviewer",
            text: wrapUpText,
          },
        ]);
        speakText(wrapUpText);
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
            if (evalData.evaluation) {
              setEvaluation(evalData.evaluation);
              if (typeof window !== "undefined") {
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

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#14171F] flex flex-col justify-between">
      {!started && <Header />}

      {!started ? (
        /* SETUP SCREEN */
        <main className="mx-auto max-w-2xl w-full px-4 sm:px-6 py-14 text-center flex-grow">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DBD8CE] bg-white px-3.5 py-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#5A606D] shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#D7FF3E] animate-pulse-subtle" />
            <span>AI Voice &amp; Scenario Simulator 2.0</span>
          </div>

          <h1 className="mt-4 font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight sm:text-4xl text-[#14171F]">
            Practice out loud, before the real interview.
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#5A606D] max-w-lg mx-auto">
            Questions are generated directly from your resume claims. The interviewer evaluates your STAR structure, metric proof points, verbal pacing, and filler words.
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
              <strong>Spoken Audio + TTS</strong>
              <p className="mt-0.5 text-[#8A8F99]">Interviewer speaks aloud</p>
            </div>
            <div className="border-t border-[#DBD8CE] pt-3">
              <strong>STAR Framework</strong>
              <p className="mt-0.5 text-[#8A8F99]">Evaluates S-T-A-R components</p>
            </div>
            <div className="border-t border-[#DBD8CE] pt-3">
              <strong>Hiring Decision</strong>
              <p className="mt-0.5 text-[#8A8F99]">Executive scorecard &amp; rewrites</p>
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
                onClick={() => {
                  if (typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  }
                  setStarted(false);
                }}
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

            {/* Middle: Controls (Audio Toggle, STAR Guide) */}
            <div className="hidden sm:flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking && typeof window !== "undefined") {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }
                  setAudioEnabled(!audioEnabled);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] transition-colors border ${
                  audioEnabled
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
                    : "border-[#DBD8CE] bg-[#FAF9F5] text-[#8A8F99]"
                }`}
                title="Toggle Hiring Manager Spoken Audio"
              >
                <span className={`h-2 w-2 rounded-full ${audioEnabled ? (isSpeaking ? "bg-emerald-600 animate-ping" : "bg-emerald-500") : "bg-gray-400"}`} />
                {audioEnabled ? (isSpeaking ? "Interviewer Speaking…" : "Voice Audio ON") : "Voice Audio Muted"}
              </button>

              <button
                type="button"
                onClick={() => setShowStarGuide(!showStarGuide)}
                className="inline-flex items-center gap-1 rounded-sm border border-[#DBD8CE] bg-white px-2.5 py-1 font-[family-name:var(--font-mono)] text-[11px] text-[#4A4F58] hover:border-[#14171F]"
              >
                <span>STAR Guide</span>
                <span>{showStarGuide ? "▲" : "▼"}</span>
              </button>
            </div>

            {/* Right: Progress indicators & Timer */}
            <div className="flex items-center gap-4">
              {!finished && (
                <div className="font-[family-name:var(--font-mono)] text-[11.5px] text-[#4A4F58] bg-[#FAF9F5] border border-[#DBD8CE] rounded px-2 py-0.5">
                  ⏱ {formatTime(timerSeconds)}
                </div>
              )}
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
            </div>
          </header>

          {/* Collapsible STAR Framework Cheatsheet */}
          {showStarGuide && (
            <div className="bg-[#FAF9F5] border-b border-[#DBD8CE] px-6 py-3 text-[12px] font-[family-name:var(--font-sans)] transition-all">
              <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-2 rounded border border-[#DBD8CE]">
                  <strong className="text-emerald-800 font-[family-name:var(--font-mono)]">S — Situation</strong>
                  <p className="text-[#6B7280] text-[11px] mt-0.5">1-2 sentences: the company context, stakes, and initial bottleneck.</p>
                </div>
                <div className="bg-white p-2 rounded border border-[#DBD8CE]">
                  <strong className="text-blue-800 font-[family-name:var(--font-mono)]">T — Task</strong>
                  <p className="text-[#6B7280] text-[11px] mt-0.5">Your exact mandate, personal responsibility, or hurdle.</p>
                </div>
                <div className="bg-white p-2 rounded border border-[#DBD8CE]">
                  <strong className="text-purple-800 font-[family-name:var(--font-mono)]">A — Action</strong>
                  <p className="text-[#6B7280] text-[11px] mt-0.5">Specific choices, trade-offs evaluated, and tools implemented.</p>
                </div>
                <div className="bg-white p-2 rounded border border-[#DBD8CE]">
                  <strong className="text-amber-800 font-[family-name:var(--font-mono)]">R — Result</strong>
                  <p className="text-[#6B7280] text-[11px] mt-0.5">Quantifiable metrics (% improved, latency cut, dollar ROI) and learnings.</p>
                </div>
              </div>
            </div>
          )}

          <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col px-4 sm:px-6 overflow-hidden">
            {!finished ? (
              <>
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
                            <div className="flex items-center gap-2">
                              {m.context && (
                                <span className="rounded-full bg-[#F6F5F1] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[#6B6F79]">
                                  Focus: {m.context}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => speakText(m.text)}
                                title="Listen to question"
                                className="text-[#8A8F99] hover:text-[#14171F] p-0.5 rounded"
                              >
                                🔊
                              </button>
                            </div>
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
                          Analyzing delivery against STAR rubrics…
                        </span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#14171F] [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#14171F] [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#14171F]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input & Mic Bar */}
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
                    <span>Enter to submit · Shift+Enter for newline</span>
                    <span className="flex items-center gap-2">
                      <span
                        className={
                          wordCount < 30
                            ? "text-amber-700"
                            : wordCount > 170
                            ? "text-blue-700"
                            : "text-emerald-700 font-semibold"
                        }
                      >
                        {wordCount} words {wordCount < 30 ? "(brief)" : wordCount > 170 ? "(long)" : "(target)"}
                      </span>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* ENHANCED COMPLETION SCREEN & INSTANT SCORECARD */
              <div className="flex-1 overflow-y-auto py-6">
                <div className="rounded-sm border border-[#DBD8CE] bg-white p-6 sm:p-8 shadow-sm">
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F0EEE7] pb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] font-semibold text-emerald-900">
                        <span className="h-2 w-2 rounded-full bg-emerald-600" />
                        Session Complete
                      </div>
                      <h2 className="mt-2 font-[family-name:var(--font-serif)] text-2xl sm:text-3xl font-bold text-[#14171F]">
                        Executive Interview Performance Card
                      </h2>
                      <p className="mt-1 text-sm text-[#5A606D]">
                        Role: {role || "Target Position"} · Rigor: {difficulty} · Evaluated against corporate rubrics
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => router.push("/feedback?type=interview")}
                        className="rounded-sm bg-[#14171F] px-5 py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-wider text-[#F6F5F1] font-semibold hover:bg-[#2A2E38] shadow-sm transition-all"
                      >
                        View Full Report &amp; PDF →
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStarted(false);
                          setMessages([]);
                          setQuestionIndex(0);
                          setFinished(false);
                          setAnswersList([]);
                          setEvaluation(null);
                        }}
                        className="rounded-sm border border-[#DBD8CE] bg-white px-4 py-2.5 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-wider text-[#14171F] hover:border-[#14171F] transition-all"
                      >
                        Practice Again
                      </button>
                    </div>
                  </div>

                  {/* Loading spinner while evaluation calculates */}
                  {evaluating && (
                    <div className="py-12 text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#14171F]/20 border-t-[#14171F]" />
                      <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[#5A606D]">
                        Computing STAR adherence, filler word density, and executive presence score…
                      </p>
                    </div>
                  )}

                  {/* Evaluation Loaded */}
                  {!evaluating && evaluation && (
                    <div className="mt-6 space-y-6">
                      {/* Metric Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-sm border border-[#DBD8CE] bg-[#FAF9F5] p-4 text-center">
                          <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase text-[#8A8F99] font-bold">
                            Overall Score
                          </span>
                          <div className="mt-1 font-[family-name:var(--font-mono)] text-3xl font-bold text-[#14171F]">
                            {evaluation.overall_score}
                            <span className="text-base font-normal text-[#8A8F99]">/100</span>
                          </div>
                        </div>

                        <div className="rounded-sm border border-[#DBD8CE] bg-[#FAF9F5] p-4 text-center">
                          <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase text-[#8A8F99] font-bold">
                            Hiring Decision
                          </span>
                          <div className="mt-1">
                            <span
                              className={`inline-block rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-xs font-bold ${
                                evaluation.hiring_decision === "Strong Hire"
                                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                  : evaluation.hiring_decision === "Hire"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : evaluation.hiring_decision === "Leaning Hire"
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-red-100 text-red-900 border border-red-300"
                              }`}
                            >
                              {evaluation.hiring_decision}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-sm border border-[#DBD8CE] bg-[#FAF9F5] p-4 text-center">
                          <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase text-[#8A8F99] font-bold">
                            STAR Structure
                          </span>
                          <div className="mt-1 font-[family-name:var(--font-mono)] text-3xl font-bold text-emerald-800">
                            {evaluation.star_score}%
                          </div>
                        </div>

                        <div className="rounded-sm border border-[#DBD8CE] bg-[#FAF9F5] p-4 text-center">
                          <span className="font-[family-name:var(--font-mono)] text-[10.5px] uppercase text-[#8A8F99] font-bold">
                            Executive Presence
                          </span>
                          <div className="mt-1 font-[family-name:var(--font-mono)] text-3xl font-bold text-[#14171F]">
                            {evaluation.executive_presence_score}%
                          </div>
                        </div>
                      </div>

                      {/* Executive Assessment Box */}
                      <div className="rounded-sm border border-[#DBD8CE] bg-[#F6F5F1] p-5">
                        <div className="flex items-center gap-2">
                          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-[#6B6F79] font-bold">
                            Committee Assessment
                          </span>
                          <span className="h-1.5 w-1.5 rounded-full bg-[#14171F]" />
                          <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#8A8F99]">
                            {evaluation.filler_words_summary.impact_assessment}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[#2A2E38] leading-relaxed">
                          {evaluation.hiring_recommendation_rationale || evaluation.summary}
                        </p>
                      </div>

                      {/* Tabs: Overview vs Questions */}
                      <div className="border-b border-[#DBD8CE] flex gap-4">
                        <button
                          type="button"
                          onClick={() => setActiveTab("overview")}
                          className={`pb-2.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider font-bold transition-colors ${
                            activeTab === "overview"
                              ? "border-b-2 border-[#14171F] text-[#14171F]"
                              : "text-[#8A8F99] hover:text-[#14171F]"
                          }`}
                        >
                          Core Pillars
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("questions")}
                          className={`pb-2.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider font-bold transition-colors ${
                            activeTab === "questions"
                              ? "border-b-2 border-[#14171F] text-[#14171F]"
                              : "text-[#8A8F99] hover:text-[#14171F]"
                          }`}
                        >
                          Per-Question Breakdown ({evaluation.question_feedbacks.length})
                        </button>
                      </div>

                      {activeTab === "overview" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-sm border border-[#DBD8CE] bg-white p-4">
                              <div className="flex items-center justify-between">
                                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[#6B6F79] font-bold">
                                  Verbal Clarity
                                </span>
                                <span className="font-[family-name:var(--font-mono)] font-bold text-sm">
                                  {evaluation.clarity_score}/100
                                </span>
                              </div>
                              <div className="mt-2 h-2 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-600 rounded-full"
                                  style={{ width: `${evaluation.clarity_score}%` }}
                                />
                              </div>
                              <p className="mt-2 text-[11.5px] text-[#6B7280]">
                                Conciseness, absence of trailing rambling, and clear direct phrasing.
                              </p>
                            </div>

                            <div className="rounded-sm border border-[#DBD8CE] bg-white p-4">
                              <div className="flex items-center justify-between">
                                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[#6B6F79] font-bold">
                                  STAR Adherence
                                </span>
                                <span className="font-[family-name:var(--font-mono)] font-bold text-sm">
                                  {evaluation.star_score}/100
                                </span>
                              </div>
                              <div className="mt-2 h-2 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#14171F] rounded-full"
                                  style={{ width: `${evaluation.star_score}%` }}
                                />
                              </div>
                              <p className="mt-2 text-[11.5px] text-[#6B7280]">
                                Coverage of Situation, Task, Action, and quantifiable Result.
                              </p>
                            </div>

                            <div className="rounded-sm border border-[#DBD8CE] bg-white p-4">
                              <div className="flex items-center justify-between">
                                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[#6B6F79] font-bold">
                                  Metric Depth
                                </span>
                                <span className="font-[family-name:var(--font-mono)] font-bold text-sm">
                                  {evaluation.depth_score}/100
                                </span>
                              </div>
                              <div className="mt-2 h-2 w-full bg-[#EDEBE3] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: `${evaluation.depth_score}%` }}
                                />
                              </div>
                              <p className="mt-2 text-[11.5px] text-[#6B7280]">
                                Evidence of quantified business impact and tool/tradeoff justification.
                              </p>
                            </div>
                          </div>

                          {/* Filler Words Card */}
                          <div className="rounded-sm border border-[#DBD8CE] bg-[#FAF9F5] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[#6B6F79] font-bold">
                                Filler Word Frequency
                              </span>
                              <p className="text-xs text-[#5A606D] mt-0.5">
                                {evaluation.filler_words_summary.total_count === 0
                                  ? "Zero filler words detected! Crisp executive delivery."
                                  : `Detected ${evaluation.filler_words_summary.total_count} filler instances (${evaluation.filler_words_summary.frequent_words.join(", ")}).`}
                              </p>
                            </div>
                            <span className="font-[family-name:var(--font-mono)] text-sm font-bold text-[#14171F] px-3 py-1 bg-white rounded border border-[#DBD8CE]">
                              {evaluation.filler_words_summary.total_count} total
                            </span>
                          </div>
                        </div>
                      )}

                      {activeTab === "questions" && (
                        <div className="space-y-4">
                          {evaluation.question_feedbacks.map((qf, idx) => (
                            <div key={idx} className="rounded-sm border border-[#DBD8CE] bg-[#FAF9F5] p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-[#8A8F99] font-bold">
                                    Question {idx + 1}
                                  </span>
                                  <p className="font-[family-name:var(--font-serif)] font-bold text-[#14171F] text-[15px] mt-0.5">
                                    {qf.question}
                                  </p>
                                </div>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10.5px] uppercase font-bold shrink-0 ${
                                    qf.star_adherence === "strong"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : qf.star_adherence === "partial"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  STAR: {qf.star_adherence} · {qf.score}/100
                                </span>
                              </div>

                              <div className="mt-3 rounded-sm bg-white p-3 border border-[#DBD8CE] text-xs text-[#4A4F58]">
                                <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#8A8F99] uppercase font-bold block mb-1">
                                  Your Response ({qf.word_count || 0} words):
                                </span>
                                &ldquo;{qf.candidate_answer}&rdquo;
                              </div>

                              {/* STAR Component Pills */}
                              {qf.star_breakdown && (
                                <div className="mt-3 flex items-center gap-2 flex-wrap">
                                  <span className="font-[family-name:var(--font-mono)] text-[10.5px] text-[#8A8F99]">
                                    STAR Checklist:
                                  </span>
                                  {[
                                    { k: "situation", label: "Situation" },
                                    { k: "task", label: "Task" },
                                    { k: "action", label: "Action" },
                                    { k: "result", label: "Result" },
                                  ].map((comp) => {
                                    const hasIt = (qf.star_breakdown as any)?.[comp.k];
                                    return (
                                      <span
                                        key={comp.k}
                                        className={`rounded px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase font-semibold ${
                                          hasIt ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600 line-through"
                                        }`}
                                      >
                                        {hasIt ? "✓" : "✗"} {comp.label}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}

                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="rounded bg-white p-3 border border-emerald-200">
                                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-emerald-800 font-bold block mb-1 uppercase">
                                    ✓ Key Strengths
                                  </span>
                                  <ul className="space-y-1 text-[#4A4F58]">
                                    {qf.strengths.map((str, sIdx) => (
                                      <li key={sIdx}>• {str}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="rounded bg-white p-3 border border-amber-200">
                                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-amber-800 font-bold block mb-1 uppercase">
                                    ↑ Improvement Focus
                                  </span>
                                  <ul className="space-y-1 text-[#4A4F58]">
                                    {qf.improvement_tips.map((tip, tIdx) => (
                                      <li key={tIdx}>• {tip}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {qf.model_answer && (
                                <details className="mt-3 rounded border border-blue-200 bg-blue-50/50 p-3 text-xs text-[#2A2E38]">
                                  <summary className="cursor-pointer font-[family-name:var(--font-mono)] text-[11px] font-bold text-blue-900 uppercase">
                                    🌟 View Top 1% Executive STAR Rewrite
                                  </summary>
                                  <p className="mt-2 whitespace-pre-line leading-relaxed text-[#2A2E38]">
                                    {qf.model_answer}
                                  </p>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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