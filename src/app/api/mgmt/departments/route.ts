import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data: departments, error } = await supabaseAdmin
      .from("departments")
      .select("*, faculty:faculties(*)")
      .order("name", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ departments });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, faculty_id } = await req.json();

    if (!name || !name.trim() || !faculty_id) {
      return NextResponse.json({ error: "Department name and faculty are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("departments")
      .insert({ name: name.trim(), faculty_id })
      .select("*, faculty:faculties(*)")
      .single();

    if (error) throw error;
    return NextResponse.json({ department: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
