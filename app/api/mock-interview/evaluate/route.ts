import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, GEMINI_MODEL, isGeminiConfigured } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const QuestionAnswerSchema = z.object({
  questionId: z.string().optional(),
  question: z.string(),
  answer: z.string(),
  ideal_answer: z.string().optional(),
  context: z.string().optional(),
});

const EvaluateInputSchema = z.object({
  role: z.string().optional(),
  difficulty: z.enum(["warmup", "standard", "tough"]).optional().default("standard"),
  responses: z.array(QuestionAnswerSchema).min(1, "At least one question and answer is required."),
  resumeId: z.string().uuid().optional(),
});

export interface StarBreakdown {
  situation: boolean;
  task: boolean;
  action: boolean;
  result: boolean;
}

export interface QuestionEvaluation {
  question: string;
  candidate_answer: string;
  score: number;
  star_adherence: "strong" | "partial" | "weak";
  star_breakdown: StarBreakdown;
  strengths: string[];
  improvement_tips: string[];
  ideal_answer_summary: string;
  model_answer: string;
  filler_words_found: string[];
  word_count: number;
  pacing_feedback: string;
}

export interface EvaluationResult {
  overall_score: number;
  clarity_score: number;
  star_score: number;
  depth_score: number;
  executive_presence_score: number;
  hiring_decision: "Strong Hire" | "Hire" | "Leaning Hire" | "Needs Work";
  hiring_recommendation_rationale: string;
  summary: string;
  filler_words_summary: {
    total_count: number;
    frequent_words: string[];
    impact_assessment: string;
  };
  question_feedbacks: QuestionEvaluation[];
}

const COMMON_FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "you know",
  "basically",
  "actually",
  "sort of",
  "kind of",
  "literally",
  "honestly",
  "right",
  "i mean",
];

function analyzeFillers(text: string): string[] {
  const lower = text.toLowerCase();
  const detected: string[] = [];
  for (const filler of COMMON_FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        detected.push(filler);
      }
    }
  }
  return detected;
}

function analyzeStarComponents(text: string): StarBreakdown {
  const t = text.toLowerCase();
  const hasSituation =
    t.includes("when") ||
    t.includes("at ") ||
    t.includes("during") ||
    t.includes("project") ||
    t.includes("company") ||
    t.includes("scenario") ||
    t.includes("faced") ||
    t.includes("client");

  const hasTask =
    t.includes("goal") ||
    t.includes("task") ||
    t.includes("needed to") ||
    t.includes("required") ||
    t.includes("responsible") ||
    t.includes("objective") ||
    t.includes("target") ||
    t.includes("challenge");

  const hasAction =
    t.includes("built") ||
    t.includes("led") ||
    t.includes("designed") ||
    t.includes("implemented") ||
    t.includes("architected") ||
    t.includes("created") ||
    t.includes("decided") ||
    t.includes("spearheaded") ||
    t.includes("developed") ||
    t.includes("optimized");

  const hasResult =
    t.includes("result") ||
    t.includes("increased") ||
    t.includes("reduced") ||
    t.includes("decreased") ||
    t.includes("improved") ||
    t.includes("achieved") ||
    /\d+%/.test(t) ||
    /\$\d+/.test(t) ||
    t.includes("roi") ||
    t.includes("latency") ||
    t.includes("conversion");

  return {
    situation: hasSituation,
    task: hasTask,
    action: hasAction,
    result: hasResult,
  };
}

function generateFallbackEvaluation(
  responses: Array<{ question: string; answer: string; ideal_answer?: string; context?: string }>,
  role?: string
): EvaluationResult {
  let totalFillers = 0;
  const fillerWordCounts: Record<string, number> = {};

  const questionFeedbacks: QuestionEvaluation[] = responses.map((r) => {
    const words = r.answer.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const fillers = analyzeFillers(r.answer);
    totalFillers += fillers.length;
    for (const f of fillers) {
      fillerWordCounts[f] = (fillerWordCounts[f] || 0) + 1;
    }

    const star = analyzeStarComponents(r.answer);
    const starCount = [star.situation, star.task, star.action, star.result].filter(Boolean).length;
    const starAdherence: "strong" | "partial" | "weak" =
      starCount >= 3 && star.result ? "strong" : starCount >= 2 ? "partial" : "weak";

    let score = 65;
    if (wordCount >= 40) score += 10;
    if (star.action) score += 8;
    if (star.result) score += 10;
    if (fillers.length === 0) score += 5;
    else if (fillers.length > 3) score -= 5;
    score = Math.min(96, Math.max(55, score));

    let pacingFeedback = "Optimal response length";
    if (wordCount < 30) {
      pacingFeedback = "Too concise — expand with specific technical context and trade-offs.";
    } else if (wordCount > 180) {
      pacingFeedback = "Somewhat lengthy — condense narrative to keep interviewer fully engaged.";
    } else {
      pacingFeedback = "Strong conversational pacing (60-90 second target window).";
    }

    const strengths: string[] = [];
    if (star.action) strengths.push("Clearly defined your specific ownership and hands-on actions");
    if (star.result) strengths.push("Included quantifiable outcome or concrete impact");
    if (wordCount >= 40) strengths.push("Sufficient technical context without excessive jargon");
    if (strengths.length === 0) strengths.push("Directly tackled the interviewer's prompt");

    const improvementTips: string[] = [];
    if (!star.result) improvementTips.push("Anchor the finish with measurable metrics (% improvement, latency, dollar ROI)");
    if (!star.situation) improvementTips.push("Spend 1 sentence upfront grounding the business stakes and baseline situation");
    if (fillers.length > 1) improvementTips.push(`Minimize filler words (${Array.from(new Set(fillers)).join(", ")}) for executive gravitas`);
    if (wordCount < 35) improvementTips.push("Provide the architectural reasoning or alternative paths considered");
    if (improvementTips.length === 0) improvementTips.push("Briefly mention the post-launch learnings or secondary organizational benefit");

    const modelAnswer = `Situation: When our team faced a bottleneck in this area, the core challenge was balancing speed with scalability.
Task: I took ownership of redefining the architecture and establishing clear milestone alignment.
Action: I designed and spearheaded the rollout, evaluating alternative trade-offs and selecting the highest-leverage path forward.
Result: As a result, we drove measurable efficiency gains, reduced operational friction by 25%, and established a reusable standard for the broader organization.`;

    return {
      question: r.question,
      candidate_answer: r.answer,
      score,
      star_adherence: starAdherence,
      star_breakdown: star,
      strengths,
      improvement_tips: improvementTips,
      ideal_answer_summary:
        r.ideal_answer ||
        "Structure with 1 sentence framing the scope, explain distinct trade-off rationale, and conclude with verified metric impact.",
      model_answer: modelAnswer,
      filler_words_found: Array.from(new Set(fillers)),
      word_count: wordCount,
      pacing_feedback: pacingFeedback,
    };
  });

  const avgScore = Math.round(
    questionFeedbacks.reduce((acc, q) => acc + q.score, 0) / Math.max(questionFeedbacks.length, 1)
  );

  const starCountTotal = questionFeedbacks.reduce(
    (acc, q) =>
      acc + [q.star_breakdown.situation, q.star_breakdown.task, q.star_breakdown.action, q.star_breakdown.result].filter(Boolean).length,
    0
  );
  const starPercentage = Math.round((starCountTotal / (questionFeedbacks.length * 4)) * 100);

  const clarityScore = Math.min(95, Math.max(60, Math.round(avgScore + (totalFillers === 0 ? 5 : -totalFillers * 2))));
  const depthScore = Math.min(94, Math.max(58, Math.round(avgScore - 2)));
  const executivePresence = Math.min(95, Math.max(62, Math.round((clarityScore + avgScore) / 2)));

  let hiringDecision: "Strong Hire" | "Hire" | "Leaning Hire" | "Needs Work" = "Hire";
  if (avgScore >= 88) hiringDecision = "Strong Hire";
  else if (avgScore >= 78) hiringDecision = "Hire";
  else if (avgScore >= 68) hiringDecision = "Leaning Hire";
  else hiringDecision = "Needs Work";

  const topFillers = Object.entries(fillerWordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, 3);

  return {
    overall_score: avgScore,
    clarity_score: clarityScore,
    star_score: Math.max(50, starPercentage),
    depth_score: depthScore,
    executive_presence_score: executivePresence,
    hiring_decision: hiringDecision,
    hiring_recommendation_rationale: `Candidate demonstrated solid competence for ${
      role || "the target role"
    }. STAR adherence scored ${starPercentage}%, with clear strengths in action ownership. Recommend focusing on numerical metric baselines and executive delivery conciseness.`,
    summary: `Solid interview demonstration for ${
      role || "target position"
    }. Structured responses communicated technical capability, with ${
      questionFeedbacks.filter((q) => q.star_adherence === "strong").length
    } of ${questionFeedbacks.length} answers executing the complete STAR structure.`,
    filler_words_summary: {
      total_count: totalFillers,
      frequent_words: topFillers,
      impact_assessment:
        totalFillers <= 2
          ? "Minimal filler word friction. Poised and crisp speech."
          : `Detected ${totalFillers} filler words (${topFillers.join(", ")}). Conscious pauses will enhance executive authority.`,
    },
    question_feedbacks: questionFeedbacks,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = EvaluateInputSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid interview responses format." },
        { status: 400 }
      );
    }

    const { role, difficulty, responses, resumeId } = validated.data;
    let evaluation: EvaluationResult | null = null;

    if (isGeminiConfigured()) {
      try {
        const ai = getGeminiClient();
        const prompt = `You are a Principal Hiring Committee Lead and Executive Coach at a tier-1 company.
Evaluate this candidate's interview responses with high technical rigor, rubric precision, and actionable guidance.

ROLE: ${role || "Senior Professional / Engineer"}
DIFFICULTY: ${difficulty}

INTERVIEW RESPONSES:
${responses
  .map(
    (r, i) => `
QUESTION ${i + 1}: ${r.question}
CONTEXT & EXPECTATION: ${r.ideal_answer || "Structured STAR delivery with metric outcome"}
CANDIDATE ANSWER: "${r.answer}"
`
  )
  .join("\n---")}

Perform an evaluation and return strictly JSON adhering to this schema:
{
  "overall_score": number (0-100),
  "clarity_score": number (0-100),
  "star_score": number (0-100),
  "depth_score": number (0-100),
  "executive_presence_score": number (0-100),
  "hiring_decision": "Strong Hire" | "Hire" | "Leaning Hire" | "Needs Work",
  "hiring_recommendation_rationale": "2-3 sentences explaining the hiring committee decision",
  "summary": "2-3 sentences executive assessment summarizing candidate strengths and priority areas for improvement",
  "filler_words_summary": {
    "total_count": number,
    "frequent_words": ["string"],
    "impact_assessment": "string assessment of conversational filler impact"
  },
  "question_feedbacks": [
    {
      "question": "string",
      "candidate_answer": "string",
      "score": number (0-100),
      "star_adherence": "strong" | "partial" | "weak",
      "star_breakdown": {
        "situation": boolean,
        "task": boolean,
        "action": boolean,
        "result": boolean
      },
      "strengths": ["string", "string"],
      "improvement_tips": ["string", "string"],
      "ideal_answer_summary": "string",
      "model_answer": "A polished, word-for-word executive STAR response showing how the candidate should have answered using their same story and facts",
      "filler_words_found": ["string"],
      "word_count": number,
      "pacing_feedback": "string"
    }
  ]
}
`;

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const textResponse = response.text || "{}";
        const cleanedJson = textResponse.replace(/^\s*```json/i, "").replace(/```\s*$/i, "").trim();
        const parsed = JSON.parse(cleanedJson);

        if (parsed.overall_score && Array.isArray(parsed.question_feedbacks)) {
          evaluation = parsed;
        }
      } catch (aiErr) {
        console.warn("Gemini evaluation error, using fallback heuristic:", aiErr);
      }
    }

    if (!evaluation) {
      evaluation = generateFallbackEvaluation(responses, role);
    }

    // Persist to Supabase if table exists
    try {
      await supabaseAdmin.from("mock_interviews").insert({
        resume_id: resumeId || null,
        score: evaluation.overall_score,
        questions: responses.map((r) => ({
          question: r.question,
          answer: r.answer,
        })),
      });
    } catch (dbErr) {
      console.warn("Supabase interview evaluation insert note:", dbErr);
    }

    return NextResponse.json({ evaluation });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error evaluating interview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
