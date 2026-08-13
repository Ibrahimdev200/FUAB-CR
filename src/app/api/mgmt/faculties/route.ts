import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data: faculties, error } = await supabaseAdmin
      .from("faculties")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ faculties });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Faculty name is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("faculties")
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ faculty: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
