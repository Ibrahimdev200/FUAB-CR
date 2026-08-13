import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data: courses, error } = await supabaseAdmin
      .from("courses")
      .select("*, department:departments(*, faculty:faculties(*))")
      .order("code", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ courses });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code, title, unit, level, semester, department_id } = await req.json();

    if (!code || !title || !unit || !level || !semester || !department_id) {
      return NextResponse.json({ error: "All course fields are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("courses")
      .insert({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        unit: Number(unit),
        level: Number(level),
        semester: String(semester).trim(),
        department_id,
      })
      .select("*, department:departments(*, faculty:faculties(*))")
      .single();

    if (error) throw error;
    return NextResponse.json({ course: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
