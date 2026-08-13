import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createNotification } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: students, error } = await supabaseAdmin
      .from("students")
      .select("*, department:departments(*, faculty:faculties(*))")
      .order("matric_number", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ students: students || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { student_id, is_locked, lock_reason } = await req.json();

    if (!student_id || is_locked === undefined) {
      return NextResponse.json({ error: "Student ID and is_locked flag required" }, { status: 400 });
    }

    const { data: student, error } = await supabaseAdmin
      .from("students")
      .update({
        is_locked: Boolean(is_locked),
        lock_reason: is_locked ? lock_reason?.trim() || "Contact management office" : null,
      })
      .eq("id", student_id)
      .select()
      .single();

    if (error) throw error;

    // Audit Log & Student Notification
    const actionType = is_locked ? "student_locked" : "student_unlocked";
    await createAuditLog(
      session.userId,
      session.email || "Management Admin",
      "management",
      actionType,
      `Toggled result access lock for ${student.full_name} (${student.matric_number}). Status: ${is_locked ? "LOCKED" : "UNLOCKED"}`
    );

    await createNotification(
      student_id,
      "student",
      is_locked
        ? "Your result access has been restricted by school management. Please contact the management office."
        : "Your result access restriction has been lifted by school management.",
      is_locked ? "account_locked" : "account_unlocked"
    );

    return NextResponse.json({ success: true, student });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
