import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, GEMINI_MODEL, isGeminiConfigured } from "@/lib/gemini";
import { z } from "zod";

const ImproveInputSchema = z.object({
  bullets: z.array(z.string()).min(1, "Provide at least one bullet point."),
  targetRole: z.string().optional(),
});

const SuggestionItemSchema = z.object({
  id: z.string(),
  original: z.string(),
  issue: z.string(),
  rewrite: z.string(),
  metricsSuggested: z.array(z.string()).optional().default([]),
});

const ImproveResponseSchema = z.object({
  suggestions: z.array(SuggestionItemSchema),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = ImproveInputSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request. Provide an array of bullet points." },
        { status: 400 }
      );
    }

    const { bullets, targetRole } = validated.data;
    const cleanBullets = bullets.map((b) => b.trim()).filter((b) => b.length > 0);

    if (cleanBullets.length === 0) {
      return NextResponse.json(
        { error: "No non-empty bullet points provided." },
        { status: 400 }
      );
    }

    // Call Gemini AI if available
    if (isGeminiConfigured()) {
      try {
        const ai = getGeminiClient();
        const prompt = `You are an executive resume coach specializing in the Google X-Y-Z formula:
"Accomplished [X] as measured by [Y], by doing [Z]"

Target Role: ${targetRole || "Competitive Technology / Professional Role"}

BULLET POINTS TO REWRITE:
${cleanBullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}

For EVERY bullet point:
1. Identify weak elements: passive verbs ("responsible for", "helped", "worked on"), missing metrics, vague scope.
2. Rewrite using strong action verbs, quantifiable metrics (% improvement, $ value, hours saved, users scaled), and direct business impact.
3. Suggest 2-3 specific metrics the candidate could substitute with their real numbers.

Return strictly a JSON object:
{
  "suggestions": [
    {
      "id": "1",
      "original": "original bullet text",
      "issue": "concise description of the flaw",
      "rewrite": "complete high-impact Google X-Y-Z rewrite",
      "metricsSuggested": ["Metric suggestion 1", "Metric suggestion 2"]
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
        const parsedJson = JSON.parse(cleanedJson);
        const result = ImproveResponseSchema.parse(parsedJson);

        return NextResponse.json(result);
      } catch (geminiError) {
        console.error("Gemini Improve error, using fallback rewriter:", geminiError);
      }
    }

    // Heuristic Fallback Rewriter
    const suggestions = cleanBullets.map((bullet, i) => {
      let issue = "Passive framing, no measurable metric or outcome";
      let rewrite = bullet;
      const lower = bullet.toLowerCase();

      if (lower.startsWith("responsible for")) {
        issue = "Weak duty framing ('Responsible for'), missing quantifiable scale";
        rewrite = `Spearheaded ${bullet.replace(/responsible for/i, "").trim()}, lifting project throughput by 32% across 4 quarters.`;
      } else if (lower.startsWith("worked on") || lower.startsWith("helped")) {
        issue = "Passive contribution without direct ownership or metric";
        rewrite = `Architected and delivered ${bullet.replace(/worked on|helped with/i, "").trim()}, reducing user cycle time by 25%.`;
      } else if (!/\d+%|\$\d+|\d+x|\d+/.test(bullet)) {
        issue = "Missing quantifiable metric and concrete business result";
        rewrite = `${bullet.replace(/\.$/, "")}, driving a 28% efficiency boost and saving 15+ engineering hours weekly.`;
      } else {
        issue = "Can be strengthened with stronger action verbs and Google X-Y-Z framing";
        rewrite = `Orchestrated ${bullet.toLowerCase()}, directly increasing operational velocity by 20%.`;
      }

      return {
        id: String(i + 1),
        original: bullet,
        issue,
        rewrite,
        metricsSuggested: [
          "Percentage increase in conversion or velocity (e.g. 25-40%)",
          "Hours or dollars saved per quarter",
        ],
      };
    });

    return NextResponse.json({ suggestions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
