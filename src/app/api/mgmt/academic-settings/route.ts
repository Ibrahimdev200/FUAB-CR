import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("academic_settings")
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (!data) {
      return NextResponse.json({
        settings: {
          active_session: "2025/2026",
          active_semester: "First",
        },
      });
    }

    return NextResponse.json({ settings: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { active_session, active_semester } = await req.json();

    if (!active_session || !active_semester) {
      return NextResponse.json({ error: "Active session and semester are required" }, { status: 400 });
    }

    // Get existing setting record ID if present
    const { data: existing } = await supabaseAdmin
      .from("academic_settings")
      .select("id")
      .limit(1)
      .single();

    let result;
    if (existing?.id) {
      const { data, error } = await supabaseAdmin
        .from("academic_settings")
        .update({
          active_session: active_session.trim(),
          active_semester: active_semester.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("academic_settings")
        .insert({
          active_session: active_session.trim(),
          active_semester: active_semester.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ settings: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
