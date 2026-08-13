import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: students, error } = await supabaseAdmin
      .from("students")
      .select("*, department:departments(*, faculty:faculties(*))")
      .order("matric_number", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ students });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { student_id, is_locked, lock_reason } = await req.json();

    if (!student_id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("students")
      .update({
        is_locked: Boolean(is_locked),
        lock_reason: is_locked ? (lock_reason || null) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", student_id)
      .select("*, department:departments(*, faculty:faculties(*))")
      .single();

    if (error) throw error;
    return NextResponse.json({ student: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
