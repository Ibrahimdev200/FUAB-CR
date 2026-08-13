import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { signJWT, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { matric_number, password } = await req.json();

    if (!matric_number || !password) {
      return NextResponse.json({ error: "Matriculation number and password are required" }, { status: 400 });
    }

    const cleanMatric = matric_number.trim().toUpperCase();

    const { data: student, error } = await supabaseAdmin
      .from("students")
      .select("*")
      .ilike("matric_number", cleanMatric)
      .single();

    if (error || !student || !student.password_hash) {
      return NextResponse.json({ error: "Invalid matric number or password" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, student.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid matric number or password" }, { status: 401 });
    }

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
