import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const session = await getSession("student");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("department_id");
    const level = searchParams.get("level");

    // Fetch active academic settings
    const { data: settings } = await supabaseAdmin
      .from("academic_settings")
      .select("active_session, active_semester")
      .limit(1)
      .single();

    const activeSession = settings?.active_session || "2025/2026";
    const activeSemester = settings?.active_semester || "First";

    let query = supabaseAdmin
      .from("courses")
      .select("*, department:departments(*, faculty:faculties(*))")
      .eq("semester", activeSemester)
      .order("code", { ascending: true });

    if (departmentId) {
      query = query.eq("department_id", departmentId);
    }
    if (level) {
      query = query.eq("level", Number(level));
    }

    const { data: courses, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      courses,
      activeSession,
      activeSemester,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
