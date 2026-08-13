import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { code, title, unit, level, semester, department_id } = await req.json();

    if (!code || !title || !unit || !level || !semester || !department_id) {
      return NextResponse.json({ error: "All course fields are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("courses")
      .update({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        unit: Number(unit),
        level: Number(level),
        semester: String(semester).trim(),
        department_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, department:departments(*, faculty:faculties(*))")
      .single();

    if (error) throw error;
    return NextResponse.json({ course: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { error } = await supabaseAdmin.from("courses").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
