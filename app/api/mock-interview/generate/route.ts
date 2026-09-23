import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, GEMINI_MODEL, isGeminiConfigured } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const MockInterviewInputSchema = z.object({
  resumeText: z.string().min(20, "Resume text is required."),
  jobPosting: z.string().optional(),
  difficulty: z.enum(["warmup", "standard", "tough"]).optional().default("standard"),
  resumeId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = MockInterviewInputSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Provide candidate resume text (minimum 20 characters)." },
        { status: 400 }
      );
    }

    const { resumeText, jobPosting, difficulty, resumeId } = validated.data;
    let questions: Array<{
      id: string;
      question: string;
      context: string;
      ideal_answer: string;
    }> = [];

    if (isGeminiConfigured()) {
      try {
        const ai = getGeminiClient();
        const prompt = `You are an elite hiring manager conducting a technical and behavioral interview.
Generate exactly 5 targeted interview questions tailored directly to the specific claims, metrics, and bullet points in this candidate's resume.

DIFFICULTY LEVEL: ${difficulty}

CANDIDATE RESUME:
${resumeText.slice(0, 10000)}

JOB POSTING:
${jobPosting ? jobPosting.slice(0, 4000) : "General industry benchmark"}

Rules for questions:
- Dig deep into real achievements claimed on the resume (e.g., "In your bullet regarding X, how did you choose between Y and Z?").
- Include a mix of architectural/technical choices, metric justification, and behavioral conflict resolution.
- Provide clear context for why you are asking, and what an ideal response must demonstrate.

Return strictly a JSON object:
{
  "questions": [
    {
      "id": "1",
      "question": "Question text",
      "context": "Why this question tests their resume claim",
      "ideal_answer": "Key points an impressive candidate should hit (STAR method, trade-offs, metrics)"
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
        questions = parsed.questions || [];
      } catch (aiErr) {
        console.warn("Interview questions AI error, using fallback questions:", aiErr);
      }
    }

    if (!questions || questions.length === 0) {
      questions = [
        {
          id: "1",
          question: "Walk me through the most technically challenging initiative listed on your resume. What trade-offs did you evaluate?",
          context: "Evaluates architectural decision-making and depth of technical ownership.",
          ideal_answer: "Structured walk-through using the STAR framework, detailing alternative approaches evaluated and ultimate business metric achieved.",
        },
        {
          id: "2",
          question: "Pick one of your bullet points with a quantifiable metric. How did you baseline the metric, and what was your individual contribution?",
          context: "Verifies the authenticity and rigor of claimed resume metrics.",
          ideal_answer: "Concrete explanation of measurement methodology, tooling used, and attribution of personal work versus team effort.",
        },
        {
          id: "3",
          question: "Describe a situation where a stakeholder or cross-functional partner disagreed with your technical direction. How did you reach alignment?",
          context: "Assesses stakeholder management, empathy, and data-driven persuasion.",
          ideal_answer: "Demonstration of collaborative conflict resolution with data, prototypes, and alignment on shared business objectives.",
        },
        {
          id: "4",
          question: "What was the biggest failure or unexpected production bottleneck you encountered in your recent role, and how did you resolve it?",
          context: "Tests resilience, root-cause analysis (RCA), and incident handling.",
          ideal_answer: "Blameless post-mortem style response detailing immediate mitigation, root cause identification, and long-term preventative measures.",
        },
        {
          id: "5",
          question: "If you were to join our team tomorrow and had to rebuild your flagship project from scratch, what would you do differently?",
          context: "Reveals continuous learning, maturity, and insight into current industry best practices.",
          ideal_answer: "Self-awareness of technical debt, architectural evolution, and modern tooling tradeoffs.",
        },
      ];
    }

    // Persist to Supabase if possible
    try {
      await supabaseAdmin.from("mock_interviews").insert({
        resume_id: resumeId || null,
        questions,
      });
    } catch (dbErr) {
      console.warn("Supabase mock interview insert note:", dbErr);
    }

    return NextResponse.json({ questions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
