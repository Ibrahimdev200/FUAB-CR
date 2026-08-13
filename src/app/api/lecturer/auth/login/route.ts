import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { signJWT, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const { data: lecturer, error } = await supabaseAdmin
      .from("lecturers")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !lecturer) {
      return NextResponse.json({ error: "Invalid lecturer credentials" }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, lecturer.password_hash);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid lecturer credentials" }, { status: 401 });
    }

    const token = await signJWT({
      userId: lecturer.id,
      email: lecturer.email,
      fullName: lecturer.full_name,
      role: "lecturer",
    });

    await setSessionCookie("lecturer", token);

    return NextResponse.json({
      success: true,
      user: {
        id: lecturer.id,
        email: lecturer.email,
        fullName: lecturer.full_name,
        role: "lecturer",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
