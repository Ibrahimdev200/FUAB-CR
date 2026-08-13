import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface ScoreRecord {
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  grade_point: number;
  approved_by_management: boolean;
  policy_snapshot?: Record<string, unknown> | null;
}

interface CourseRecord {
  code: string;
  title: string;
  unit: number;
  semester: string;
}

interface RegRecord {
  id: string;
  session: string;
  semester: string;
  status: string;
  course?: CourseRecord;
  score?: ScoreRecord | ScoreRecord[];
}

export async function GET(req: Request) {
  try {
    const session = await getSession("student");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const requestedSession = searchParams.get("session");

    // 1. Fetch student record to verify lock status
    const { data: student, error: studentErr } = await supabaseAdmin
      .from("students")
      .select("id, is_locked")
      .eq("id", session.userId)
      .single();

    if (studentErr || !student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }

    if (student.is_locked) {
      return NextResponse.json({
        isLocked: true,
        message: "Your results are currently locked by school management. Please contact the school management office.",
      });
    }

    // 2. Fetch student_result_summaries for pre-computed fast GPA & CGPA lookup
    const { data: summaries } = await supabaseAdmin
      .from("student_result_summaries")
      .select("*")
      .eq("student_id", session.userId);

    let summaryCgpa = "0.00";
    let summaryGpa = "0.00";
    let totalSessionUnits = 0;
    let cumulativeUnits = 0;

    if (summaries && summaries.length > 0) {
      // Latest CGPA across summaries
      const latestSummary = summaries[summaries.length - 1];
      summaryCgpa = Number(latestSummary.cgpa || 0).toFixed(2);
      cumulativeUnits = Number(latestSummary.cumulative_units || 0);

      // Match requested session summary
      const currentSessionSummary = summaries.find((s) => s.session === requestedSession);
      if (currentSessionSummary) {
        summaryGpa = Number(currentSessionSummary.gpa || 0).toFixed(2);
        totalSessionUnits = Number(currentSessionSummary.total_units || 0);
      }
    }

    // 3. Fetch approved course registrations
    let query = supabaseAdmin
      .from("course_registrations")
      .select("*, course:courses(*), score:scores(*)")
      .eq("student_id", session.userId)
      .eq("status", "approved");

    if (requestedSession) {
      query = query.eq("session", requestedSession);
    }

    const { data: rawRegs, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    const courseResults: Array<{
      code: string;
      title: string;
      unit: number;
      semester: string;
      caScore: number;
      examScore: number;
      totalScore: number;
      grade: string;
      gradePoint: number;
      policySnapshot: Record<string, unknown> | null;
    }> = [];

    const availableSessions = Array.from(
      new Set((summaries || []).map((s) => s.session))
    );

    (rawRegs as unknown as RegRecord[] || []).forEach((reg) => {
      const scoreObj = Array.isArray(reg.score) ? reg.score[0] : reg.score;

      if (reg.course && scoreObj && scoreObj.approved_by_management) {
        courseResults.push({
          code: reg.course.code,
          title: reg.course.title,
          unit: Number(reg.course.unit || 0),
          semester: reg.semester,
          caScore: Number(scoreObj.ca_score || 0),
          examScore: Number(scoreObj.exam_score || 0),
          totalScore: Number(scoreObj.total_score || scoreObj.ca_score + scoreObj.exam_score),
          grade: scoreObj.grade || "N/A",
          gradePoint: Number(scoreObj.grade_point || 0),
          policySnapshot: (scoreObj.policy_snapshot as Record<string, unknown>) || null,
        });
      }
    });

    return NextResponse.json({
      isLocked: false,
      results: courseResults,
      sessionGpa: summaryGpa,
      cumulativeCgpa: summaryCgpa,
      totalSessionUnits,
      totalCumulativeUnits: cumulativeUnits,
      availableSessions: availableSessions.length > 0 ? availableSessions : ["2025/2026"],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
