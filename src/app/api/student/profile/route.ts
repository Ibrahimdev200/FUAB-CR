import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const session = await getSession("student");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: student, error } = await supabaseAdmin
      .from("students")
      .select("*, department:departments(*, faculty:faculties(*))")
      .eq("id", session.userId)
      .single();

    if (error || !student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
