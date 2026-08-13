import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const session = await getSession("student");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: registrations, error } = await supabaseAdmin
      .from("course_registrations")
      .select("*, course:courses(*, department:departments(*, faculty:faculties(*)))")
      .eq("student_id", session.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ registrations });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
