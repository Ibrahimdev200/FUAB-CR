import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const session = await getSession("lecturer");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course_id");

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // Fetch active session
    const { data: settings } = await supabaseAdmin
      .from("academic_settings")
      .select("active_session, active_semester")
      .limit(1)
      .single();

    const activeSession = settings?.active_session || "2025/2026";
    const activeSemester = settings?.active_semester || "First";

    // Fetch session grading policy
    const { data: policy } = await supabaseAdmin
      .from("grading_policies")
      .select("*")
      .eq("session", activeSession)
      .single();

    const caMax = policy?.ca_weight_percent ? Number(policy.ca_weight_percent) : 30;
    const examMax = policy?.exam_weight_percent ? Number(policy.exam_weight_percent) : 70;

    // Fetch registered students for this course & session
    const { data: regs, error } = await supabaseAdmin
      .from("course_registrations")
      .select("*, student:students(*, department:departments(*)), score:scores(*)")
      .eq("course_id", courseId)
      .eq("session", activeSession)
      .order("created_at", { ascending: true });

    if (error) throw error;

    let rejectionNotes: Array<{ rejectedAt: string; rejectedBy: string; note: string }> = [];
    let isCourseRejected = false;
    let isCourseApproved = false;
    let allScored = (regs && regs.length > 0);

    const students = (regs || []).map((reg) => {
      const scoreObj = Array.isArray(reg.score) ? reg.score[0] : reg.score;

      if (reg.status === "rejected") isCourseRejected = true;
      if (reg.status === "approved") isCourseApproved = true;
      if (reg.status !== "scored" && reg.status !== "approved") allScored = false;

      if (scoreObj?.rejection_history && Array.isArray(scoreObj.rejection_history)) {
        rejectionNotes = scoreObj.rejection_history;
      }

      return {
        registrationId: reg.id,
        status: reg.status,
        student: reg.student,
        score: scoreObj || null,
      };
    });

    return NextResponse.json({
      students,
      caMax,
      examMax,
      activeSession,
      activeSemester,
      isCourseRejected,
      isCourseApproved,
      allScored,
      rejectionNotes,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
