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

    // 2. Fetch ALL approved registrations for cumulative CGPA
    const { data: allRegs, error: allErr } = await supabaseAdmin
      .from("course_registrations")
      .select("*, course:courses(*), score:scores(*)")
      .eq("student_id", session.userId)
      .eq("status", "approved");

    if (allErr) throw allErr;

    // Calculate Cumulative CGPA
    let totalCgpaUnits = 0;
    let totalCgpaPoints = 0;

    (allRegs as unknown as RegRecord[] || []).forEach((reg) => {
      const scoreObj = Array.isArray(reg.score) ? reg.score[0] : reg.score;
      if (reg.course && scoreObj && scoreObj.approved_by_management) {
        const units = Number(reg.course.unit || 0);
        const gradePoint = Number(scoreObj.grade_point || 0);
        totalCgpaUnits += units;
        totalCgpaPoints += units * gradePoint;
      }
    });

    const cgpa = totalCgpaUnits > 0 ? (totalCgpaPoints / totalCgpaUnits).toFixed(2) : "0.00";

    // 3. Filter for requested session GPA & course score details
    let sessionRegs = (allRegs as unknown as RegRecord[] || []);
    if (requestedSession) {
      sessionRegs = sessionRegs.filter((r) => r.session === requestedSession);
    }

    let totalGpaUnits = 0;
    let totalGpaPoints = 0;
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
    }> = [];

    sessionRegs.forEach((reg) => {
      const scoreObj = Array.isArray(reg.score) ? reg.score[0] : reg.score;
      if (reg.course && scoreObj && scoreObj.approved_by_management) {
        const units = Number(reg.course.unit || 0);
        const gradePoint = Number(scoreObj.grade_point || 0);

        totalGpaUnits += units;
        totalGpaPoints += units * gradePoint;

        courseResults.push({
          code: reg.course.code,
          title: reg.course.title,
          unit: units,
          semester: reg.semester,
          caScore: Number(scoreObj.ca_score || 0),
          examScore: Number(scoreObj.exam_score || 0),
          totalScore: Number(scoreObj.total_score || scoreObj.ca_score + scoreObj.exam_score),
          grade: scoreObj.grade || "N/A",
          gradePoint: gradePoint,
        });
      }
    });

    const gpa = totalGpaUnits > 0 ? (totalGpaPoints / totalGpaUnits).toFixed(2) : "0.00";

    // Extract available sessions for dropdown
    const availableSessions = Array.from(
      new Set((allRegs as unknown as RegRecord[] || []).map((r) => r.session))
    );

    return NextResponse.json({
      isLocked: false,
      results: courseResults,
      sessionGpa: gpa,
      cumulativeCgpa: cgpa,
      totalSessionUnits: totalGpaUnits,
      totalCumulativeUnits: totalCgpaUnits,
      availableSessions,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
