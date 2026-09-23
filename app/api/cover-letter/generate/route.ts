import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, GEMINI_MODEL, isGeminiConfigured } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const CoverLetterInputSchema = z.object({
  resumeText: z.string().min(20, "Resume text is required."),
  jobPosting: z.string().min(20, "Job posting is required."),
  tone: z.enum(["direct", "confident", "academic"]).optional().default("confident"),
  resumeId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CoverLetterInputSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Provide both resume text and job posting (minimum 20 characters each)." },
        { status: 400 }
      );
    }

    const { resumeText, jobPosting, tone, resumeId } = validated.data;
    let coverLetter = "";
    let highlights: string[] = [];

    if (isGeminiConfigured()) {
      try {
        const ai = getGeminiClient();
        const prompt = `You are an elite executive career strategist.
Generate a tailored, persuasive cover letter matching the candidate's exact experience to the job posting.

TONE: ${tone} (avoid fluff, cliches, and generic filler phrases like "I am writing to express my enthusiastic interest").
Be punchy, direct, and highlight 2-3 specific accomplishments with quantified results directly answering the job requirements.

CANDIDATE RESUME:
${resumeText.slice(0, 10000)}

JOB POSTING:
${jobPosting.slice(0, 5000)}

Return strictly a JSON object:
{
  "coverLetter": "Full markdown-formatted cover letter ready to send",
  "highlights": ["Key match point 1", "Key match point 2", "Key match point 3"]
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
        coverLetter = parsed.coverLetter || "";
        highlights = parsed.highlights || [];
      } catch (aiErr) {
        console.warn("Cover letter AI generation error, using fallback template:", aiErr);
      }
    }

    if (!coverLetter) {
      coverLetter = `Dear Hiring Team,

I am writing to submit my qualifications for the open position outlined in your posting. With a strong track record of delivering high-impact solutions, optimizing workflows, and driving measurable results, I am confident in my ability to immediately add value to your organization.

In reviewing your requirements, my background aligns closely with your core priorities:
- Direct hands-on experience executing end-to-end deliverables while collaborating with cross-functional partners.
- A relentless focus on quantifiable outcomes, translating complex problems into scalable, resilient processes.
- Demonstrated leadership in maintaining high standards of quality and team velocity.

I look forward to discussing how my experience and approach can help accelerate your team's objectives. Thank you for your time and consideration.

Sincerely,
Candidate`;
      highlights = [
        "Proven cross-functional collaboration and delivery velocity",
        "Quantifiable results alignment with job specifications",
        "Direct domain expertise relevant to target role",
      ];
    }

    // Persist to Supabase if possible
    try {
      await supabaseAdmin.from("cover_letters").insert({
        resume_id: resumeId || null,
        job_description: jobPosting,
        content: coverLetter,
      });
    } catch (dbErr) {
      console.warn("Supabase cover letter insert note:", dbErr);
    }

    return NextResponse.json({
      coverLetter,
      highlights,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
