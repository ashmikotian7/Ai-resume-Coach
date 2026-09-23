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

interface EvaluationResult {
  overall_score: number;
  clarity_score: number;
  star_score: number;
  depth_score: number;
  summary: string;
  question_feedbacks: Array<{
    question: string;
    candidate_answer: string;
    score: number;
    star_adherence: "strong" | "partial" | "weak";
    strengths: string[];
    improvement_tips: string[];
    ideal_answer_summary: string;
  }>;
}

function generateFallbackEvaluation(
  responses: Array<{ question: string; answer: string }>,
  role?: string
): EvaluationResult {
  const avgLength =
    responses.reduce((acc, r) => acc + r.answer.trim().split(/\s+/).length, 0) /
    Math.max(responses.length, 1);

  const starDetected = responses.filter((r) => {
    const text = r.answer.toLowerCase();
    return (
      (text.includes("when") || text.includes("situation") || text.includes("project")) &&
      (text.includes("led") || text.includes("built") || text.includes("decided") || text.includes("implemented")) &&
      (text.includes("result") || text.includes("increased") || text.includes("reduced") || text.includes("%"))
    );
  }).length;

  const starPercentage = Math.round((starDetected / Math.max(responses.length, 1)) * 100);
  const baseScore = Math.min(
    95,
    Math.max(65, Math.round(68 + Math.min(avgLength, 120) * 0.15 + (starPercentage > 50 ? 10 : 0)))
  );

  return {
    overall_score: baseScore,
    clarity_score: Math.min(94, baseScore + 4),
    star_score: Math.max(60, starPercentage || 72),
    depth_score: Math.min(92, Math.max(64, baseScore - 3)),
    summary: `Demonstrated solid domain foundation${role ? ` for ${role}` : ""}. Responses showed direct experience, with ${starDetected} of ${responses.length} answers effectively utilizing the STAR framework (Situation, Task, Action, Result). Focus on front-loading quantifiable business metrics in remaining answers.`,
    question_feedbacks: responses.map((r, idx) => {
      const words = r.answer.trim().split(/\s+/).length;
      const isDetailed = words > 35;
      const hasMetrics = /\d+[%kKmM]?/.test(r.answer);
      return {
        question: r.question,
        candidate_answer: r.answer,
        score: isDetailed && hasMetrics ? 88 : isDetailed ? 78 : 68,
        star_adherence: hasMetrics && isDetailed ? "strong" : isDetailed ? "partial" : "weak",
        strengths: [
          "Direct address of the interviewer's core question",
          isDetailed ? "Specific operational context provided" : "Concise conversational delivery",
        ],
        improvement_tips: [
          hasMetrics
            ? "Expand on cross-functional alignment and lessons learned"
            : "Include explicit numerical metrics (% improvement, latency drop, revenue impacted)",
          "Explicitly conclude with the lasting organizational impact",
        ],
        ideal_answer_summary:
          "Open with 1 sentence framing the scope, explain your distinct decision-making rationale, and end with the verified metric outcome.",
      };
    }),
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
        const prompt = `You are a Principal Hiring Manager and Executive Interview Coach.
Evaluate this candidate's interview performance based on their responses to resume-tailored questions.

ROLE: ${role || "General Technical/Professional Role"}
DIFFICULTY: ${difficulty}

INTERVIEW TRANSCRIPT:
${responses
  .map(
    (r, i) => `
QUESTION ${i + 1}: ${r.question}
IDEAL CONTEXT: ${r.ideal_answer || "Demonstrate structured STAR impact"}
CANDIDATE ANSWER: ${r.answer}
`
  )
  .join("\n---")}

Score the candidate rigorously (0-100 scale). Return strictly a JSON object:
{
  "overall_score": number (0-100),
  "clarity_score": number (0-100),
  "star_score": number (0-100, adherence to Situation, Task, Action, Result),
  "depth_score": number (0-100, technical rigor and metric justification),
  "summary": "2-3 sentences concise executive assessment",
  "question_feedbacks": [
    {
      "question": "string",
      "candidate_answer": "string",
      "score": number (0-100),
      "star_adherence": "strong" | "partial" | "weak",
      "strengths": ["string", "string"],
      "improvement_tips": ["string", "string"],
      "ideal_answer_summary": "string"
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
        evaluation = JSON.parse(cleanedJson);
      } catch (aiErr) {
        console.warn("Gemini evaluation error, using fallback heuristic:", aiErr);
      }
    }

    if (!evaluation) {
      evaluation = generateFallbackEvaluation(responses, role);
    }

    // Persist to Supabase if possible
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
