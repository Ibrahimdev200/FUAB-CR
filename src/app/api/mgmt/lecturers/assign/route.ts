import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { lecturer_id, course_id, academic_session } = await req.json();

    if (!lecturer_id || !course_id || !academic_session) {
      return NextResponse.json({ error: "Lecturer, Course, and Session are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("lecturer_course_assignments")
      .upsert(
        {
          lecturer_id,
          course_id,
          session: academic_session.trim(),
        },
        { onConflict: "lecturer_id,course_id,session" }
      )
      .select("*, course:courses(*)")
      .single();

    if (error) throw error;
    return NextResponse.json({ assignment: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { assignment_id } = await req.json();
    if (!assignment_id) return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });

    const { error } = await supabaseAdmin.from("lecturer_course_assignments").delete().eq("id", assignment_id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
