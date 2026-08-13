import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { GradeBoundary, Score } from "@/types/db";

const DEFAULT_GRADE_BOUNDARIES: GradeBoundary[] = [
  { grade: "A", minScore: 70, maxScore: 100, gradePoint: 5.0 },
  { grade: "B", minScore: 60, maxScore: 69.99, gradePoint: 4.0 },
  { grade: "C", minScore: 50, maxScore: 59.99, gradePoint: 3.0 },
  { grade: "D", minScore: 45, maxScore: 49.99, gradePoint: 2.0 },
  { grade: "E", minScore: 40, maxScore: 44.99, gradePoint: 1.0 },
  { grade: "F", minScore: 0, maxScore: 39.99, gradePoint: 0.0 },
];

function calculateGradeAndPoint(totalScore: number, boundaries: GradeBoundary[]) {
  for (const b of boundaries) {
    if (totalScore >= b.minScore && totalScore <= b.maxScore) {
      return { grade: b.grade, gradePoint: b.gradePoint };
    }
  }
  return { grade: "F", gradePoint: 0.0 };
}

export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;
    const { academic_session, semester } = await req.json();

    if (!academic_session || !semester) {
      return NextResponse.json({ error: "Session and Semester are required" }, { status: 400 });
    }

    // Fetch grading policy for this session
    const { data: policyData } = await supabaseAdmin
      .from("grading_policies")
      .select("*")
      .eq("session", academic_session)
      .single();

    const boundaries: GradeBoundary[] = Array.isArray(policyData?.grade_boundaries)
      ? (policyData.grade_boundaries as unknown as GradeBoundary[])
      : DEFAULT_GRADE_BOUNDARIES;

    // Fetch all scored course registrations for this course, session, and semester
    const { data: regs, error: fetchErr } = await supabaseAdmin
      .from("course_registrations")
      .select("id, score:scores(*)")
      .eq("course_id", courseId)
      .eq("session", academic_session)
      .eq("semester", semester)
      .in("status", ["scored", "rejected"]);

    if (fetchErr) throw fetchErr;

    if (!regs || regs.length === 0) {
      return NextResponse.json({ error: "No pending or scored registrations found for this course." }, { status: 400 });
    }

    const regIds = regs.map((r) => r.id);

    // Update all scores with calculated grades
    for (const reg of regs) {
      const scoreObj: Score | null = Array.isArray(reg.score) ? reg.score[0] : (reg.score as Score | null);

      if (scoreObj) {
        const total = Number(scoreObj.total_score || (scoreObj.ca_score + scoreObj.exam_score));
        const { grade, gradePoint } = calculateGradeAndPoint(total, boundaries);

        await supabaseAdmin
          .from("scores")
          .update({
            grade,
            grade_point: gradePoint,
            approved_by_management: true,
            approved_at: new Date().toISOString(),
            policy_snapshot: policyData || { default: true },
          })
          .eq("id", scoreObj.id);
      }
    }

    // Update course_registrations status to 'approved'
    const { error: updateRegErr } = await supabaseAdmin
      .from("course_registrations")
      .update({ status: "approved" })
      .in("id", regIds);

    if (updateRegErr) throw updateRegErr;

    return NextResponse.json({ success: true, approvedCount: regIds.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
