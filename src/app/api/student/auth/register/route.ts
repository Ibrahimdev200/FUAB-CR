import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { signJWT, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { matric_number, password, confirmPassword } = await req.json();

    if (!matric_number || !password || !confirmPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    const cleanMatric = matric_number.trim().toUpperCase();

    // Verify against PreloadedMatric
    const { data: preloaded, error: preloadedErr } = await supabaseAdmin
      .from("preloaded_matrics")
      .select("*")
      .ilike("matric_number", cleanMatric)
      .single();

    if (preloadedErr || !preloaded) {
      return NextResponse.json({
        error: "Your data has not been found on the portal. Please visit the school management office.",
      }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Upsert into students table
    const { data: student, error: upsertErr } = await supabaseAdmin
      .from("students")
      .upsert(
        {
          matric_number: preloaded.matric_number,
          full_name: preloaded.full_name,
          department_id: preloaded.department_id,
          level: preloaded.level,
          password_hash: passwordHash,
          is_registered_on_portal: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "matric_number" }
      )
      .select("*, department:departments(*)")
      .single();

    if (upsertErr) throw upsertErr;

    const token = await signJWT({
      userId: student.id,
      matricNumber: student.matric_number,
      fullName: student.full_name,
      role: "student",
    });

    await setSessionCookie("student", token);

    return NextResponse.json({
      success: true,
      user: {
        id: student.id,
        matricNumber: student.matric_number,
        fullName: student.full_name,
        role: "student",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
