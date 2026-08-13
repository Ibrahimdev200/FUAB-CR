import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createNotification } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";
import { RejectionHistoryEntry, Score } from "@/types/db";

export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;
    const { academic_session, semester, rejection_note } = await req.json();

    if (!rejection_note || !rejection_note.trim()) {
      return NextResponse.json({ error: "Rejection note is required" }, { status: 400 });
    }

    // 1. Fetch course registrations for this course & session
    const { data: rawRegs, error: fetchErr } = await supabaseAdmin
      .from("course_registrations")
      .select("id, student_id, course_id, session, score:scores(*)")
      .eq("course_id", courseId)
      .eq("session", academic_session)
      .eq("semester", semester);

    if (fetchErr) throw fetchErr;

    if (!rawRegs || rawRegs.length === 0) {
      return NextResponse.json({ error: "No course registrations found to reject" }, { status: 404 });
    }

    const regIds = rawRegs.map((r) => r.id);
    const rejectionEntry: RejectionHistoryEntry = {
      rejectedAt: new Date().toISOString(),
      rejectedBy: session.email || "Management Admin",
      note: rejection_note.trim(),
    };

    // 2. Update scores table with rejection note and history
    let lecturerIdToNotify: string | null = null;

    for (const reg of rawRegs) {
      const scoreObj: Score | null = Array.isArray(reg.score) ? reg.score[0] : (reg.score as Score | null);
      if (scoreObj) {
        if (!lecturerIdToNotify && scoreObj.entered_by_lecturer_id) {
          lecturerIdToNotify = scoreObj.entered_by_lecturer_id;
        }

        const history: RejectionHistoryEntry[] = Array.isArray(scoreObj.rejection_history)
          ? scoreObj.rejection_history
          : [];

        await supabaseAdmin
          .from("scores")
          .update({
            rejection_note: rejection_note.trim(),
            rejection_history: [...history, rejectionEntry],
            approved_by_management: false,
          })
          .eq("id", scoreObj.id);
      }
    }

    // 3. Update course_registrations status to 'rejected'
    const { error: regUpdateErr } = await supabaseAdmin
      .from("course_registrations")
      .update({ status: "rejected" })
      .in("id", regIds);

    if (regUpdateErr) throw regUpdateErr;

    // 4. Audit Log & Lecturer Notification
    await createAuditLog(
      session.userId,
      session.email || "Management Admin",
      "management",
      "score_rejected",
      `Rejected score submission for course ${courseId}. Rejection note: "${rejection_note.trim()}"`
    );

    if (lecturerIdToNotify) {
      await createNotification(
        lecturerIdToNotify,
        "lecturer",
        `Management rejected score submission for your assigned course. Note: "${rejection_note.trim()}"`,
        "scores_rejected"
      );
    }

    return NextResponse.json({ success: true, rejectedCount: regIds.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
