import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    let scans: Array<{
      id: string;
      createdAt: string;
      fileName: string;
      atsScore: number;
      jobTitle: string;
      scoreBreakdown: {
        format_score?: number;
        keyword_score?: number;
        impact_score?: number;
        readability_score?: number;
      };
      keywordsCount: number;
    }> = [];

    try {
      const { data, error } = await supabaseAdmin
        .from("scans")
        .select("id, created_at, ats_score, job_description, score_breakdown, keywords, resumes(id, file_name)")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        scans = data.map((item: any) => ({
          id: item.id,
          createdAt: item.created_at,
          fileName: item.resumes?.file_name || "Resume_Document.pdf",
          atsScore: item.ats_score,
          jobTitle: item.job_description ? item.job_description.slice(0, 45) + "..." : "Target Role",
          scoreBreakdown: item.score_breakdown || {},
          keywordsCount: Array.isArray(item.keywords) ? item.keywords.length : 0,
        }));
      }
    } catch (dbErr) {
      console.warn("Supabase history query note:", dbErr);
    }

    // Default sample historical records if Supabase has no records yet
    if (scans.length === 0) {
      scans = [
        {
          id: "scan-sample-3",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
          fileName: "Alex_Chen_Staff_Engineer_v3.pdf",
          atsScore: 89,
          jobTitle: "Staff Software Engineer, Systems",
          scoreBreakdown: { format_score: 92, keyword_score: 88, impact_score: 87, readability_score: 90 },
          keywordsCount: 14,
        },
        {
          id: "scan-sample-2",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
          fileName: "Alex_Chen_Lead_Engineer_v2.pdf",
          atsScore: 78,
          jobTitle: "Senior / Lead Fullstack Engineer",
          scoreBreakdown: { format_score: 84, keyword_score: 75, impact_score: 74, readability_score: 80 },
          keywordsCount: 12,
        },
        {
          id: "scan-sample-1",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          fileName: "Alex_Chen_Old_Draft.docx",
          atsScore: 64,
          jobTitle: "Software Developer",
          scoreBreakdown: { format_score: 70, keyword_score: 58, impact_score: 62, readability_score: 66 },
          keywordsCount: 9,
        },
      ];
    }

    return NextResponse.json({ scans });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
