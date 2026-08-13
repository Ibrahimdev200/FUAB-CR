import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const session = await getSession("lecturer");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch active session
    const { data: settings } = await supabaseAdmin
      .from("academic_settings")
      .select("active_session, active_semester")
      .limit(1)
      .single();

    const activeSession = settings?.active_session || "2025/2026";
    const activeSemester = settings?.active_semester || "First";

    // Fetch assigned courses for this lecturer
    const { data: assignments, error } = await supabaseAdmin
      .from("lecturer_course_assignments")
      .select("*, course:courses(*, department:departments(*, faculty:faculties(*)))")
      .eq("lecturer_id", session.userId)
      .eq("session", activeSession);

    if (error) throw error;

    return NextResponse.json({
      assignments: assignments || [],
      activeSession,
      activeSemester,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
