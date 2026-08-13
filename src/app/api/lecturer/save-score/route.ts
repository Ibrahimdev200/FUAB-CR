import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createNotification } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";
import { Score } from "@/types/db";

export async function POST(req: Request) {
  try {
    const session = await getSession("lecturer");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { registration_id, ca_score, exam_score, ca_max, exam_max } = await req.json();

    if (!registration_id || ca_score === undefined || exam_score === undefined) {
      return NextResponse.json({ error: "Registration ID, CA score, and Exam score are required" }, { status: 400 });
    }

    const ca = Number(ca_score);
    const exam = Number(exam_score);
    const maxCa = Number(ca_max || 30);
    const maxExam = Number(exam_max || 70);

    if (isNaN(ca) || ca < 0 || ca > maxCa) {
      return NextResponse.json({ error: `CA score must be a number between 0 and ${maxCa}` }, { status: 400 });
    }

    if (isNaN(exam) || exam < 0 || exam > maxExam) {
      return NextResponse.json({ error: `Exam score must be a number between 0 and ${maxExam}` }, { status: 400 });
    }

    const total = ca + exam;

    // Check existing registration
    const { data: existingReg } = await supabaseAdmin
      .from("course_registrations")
      .select("id, course_id, session, score:scores(*)")
      .eq("id", registration_id)
      .single();

    if (!existingReg) {
      return NextResponse.json({ error: "Course registration record not found" }, { status: 404 });
    }

    const existingScoreObj: Score | null = Array.isArray(existingReg.score) ? existingReg.score[0] : (existingReg.score as Score | null);

    if (existingScoreObj?.approved_by_management) {
      return NextResponse.json({ error: "Scores for this course have already been approved by management and cannot be modified." }, { status: 403 });
    }

    let scoreId = existingScoreObj?.id;

    if (scoreId) {
      const { error: updateErr } = await supabaseAdmin
        .from("scores")
        .update({
          ca_score: ca,
          exam_score: exam,
          total_score: total,
          entered_by_lecturer_id: session.userId,
          entered_at: new Date().toISOString(),
        })
        .eq("id", scoreId);

      if (updateErr) throw updateErr;
    } else {
      const { data: newScore, error: insertErr } = await supabaseAdmin
        .from("scores")
        .insert({
          course_registration_id: registration_id,
          ca_score: ca,
          exam_score: exam,
          total_score: total,
          entered_by_lecturer_id: session.userId,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      scoreId = newScore.id;
    }

    // Update registration status
    await supabaseAdmin
      .from("course_registrations")
      .update({ status: "scored" })
      .eq("id", registration_id);

    // Write audit log
    await createAuditLog(
      session.userId,
      session.email || "Lecturer",
      "lecturer",
      "score_entered",
      `Entered CA (${ca}) & Exam (${exam}) for course registration ${registration_id}`
    );

    // Check if all students are scored
    const { data: allRegs } = await supabaseAdmin
      .from("course_registrations")
      .select("id, status")
      .eq("course_id", existingReg.course_id)
      .eq("session", existingReg.session);

    const allScored = (allRegs || []).every((r) => r.status === "scored" || r.status === "approved");

    if (allScored) {
      await createNotification(
        session.userId,
        "lecturer",
        `All student scores for course ${existingReg.course_id} (${existingReg.session}) have been entered. Ready for management approval.`,
        "scores_submitted"
      );
    }

    return NextResponse.json({
      success: true,
      allScored,
      scoreId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
