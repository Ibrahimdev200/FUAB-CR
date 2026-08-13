import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Extract IP address from headers
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const { isLimited } = checkRateLimit(ip, 10, 60000); // 10 attempts per minute

    if (isLimited) {
      return NextResponse.json(
        { error: "Too many matric lookup attempts. Please wait 1 minute before trying again." },
        { status: 429 }
      );
    }

    const { matric_number } = await req.json();

    if (!matric_number || !matric_number.trim()) {
      return NextResponse.json({ error: "Matriculation number is required" }, { status: 400 });
    }

    const cleanMatric = matric_number.trim().toUpperCase();

    // 1. Check preloaded_matrics table
    const { data: preloaded, error: preloadedErr } = await supabaseAdmin
      .from("preloaded_matrics")
      .select("*, department:departments(*, faculty:faculties(*))")
      .ilike("matric_number", cleanMatric)
      .single();

    if (preloadedErr || !preloaded) {
      return NextResponse.json({
        exists: false,
        error: "Your data has not been found on the portal. Please visit the school management office regarding your registration or fees status.",
      });
    }

    // 2. Check if student account already registered on portal
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id, is_registered_on_portal")
      .ilike("matric_number", cleanMatric)
      .single();

    return NextResponse.json({
      exists: true,
      isRegistered: Boolean(student?.is_registered_on_portal),
      preloadedData: {
        matric_number: preloaded.matric_number,
        full_name: preloaded.full_name,
        department: preloaded.department,
        level: preloaded.level,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
