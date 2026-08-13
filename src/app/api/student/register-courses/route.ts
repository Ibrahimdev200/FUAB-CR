import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const session = await getSession("student");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { course_ids } = await req.json();

    if (!Array.isArray(course_ids) || course_ids.length === 0) {
      return NextResponse.json({ error: "Please select at least one course to register." }, { status: 400 });
    }

    // Fetch active academic settings
    const { data: settings } = await supabaseAdmin
      .from("academic_settings")
      .select("active_session, active_semester")
      .limit(1)
      .single();

    const activeSession = settings?.active_session || "2025/2026";
    const activeSemester = settings?.active_semester || "First";

    let registeredCount = 0;
    let skippedCount = 0;

    for (const courseId of course_ids) {
      // Check existing registration
      const { data: existing } = await supabaseAdmin
        .from("course_registrations")
        .select("id")
        .eq("student_id", session.userId)
        .eq("course_id", courseId)
        .eq("session", activeSession)
        .eq("semester", activeSemester)
        .single();

      if (existing) {
        skippedCount++;
        continue;
      }

      const { error: insertErr } = await supabaseAdmin
        .from("course_registrations")
        .insert({
          student_id: session.userId,
          course_id: courseId,
          session: activeSession,
          semester: activeSemester,
          status: "registered",
        });

      if (insertErr) {
        skippedCount++;
      } else {
        registeredCount++;
      }
    }

    if (registeredCount > 0) {
      await createNotification(
        session.userId,
        "student",
        `Your course registration for ${registeredCount} course(s) (${activeSession} Session) was submitted successfully.`,
        "registration_saved"
      );
    }

    return NextResponse.json({
      success: true,
      registeredCount,
      skippedCount,
      activeSession,
      activeSemester,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
