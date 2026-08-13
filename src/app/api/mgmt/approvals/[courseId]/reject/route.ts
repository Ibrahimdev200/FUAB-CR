import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { RejectionHistoryEntry, Score } from "@/types/db";

export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;
    const { academic_session, semester, note } = await req.json();

    if (!note || !note.trim()) {
      return NextResponse.json({ error: "A rejection note is required" }, { status: 400 });
    }

    if (!academic_session || !semester) {
      return NextResponse.json({ error: "Session and Semester are required" }, { status: 400 });
    }

    // Fetch all registrations for this course, session, and semester
    const { data: regs, error: fetchErr } = await supabaseAdmin
      .from("course_registrations")
      .select("id, score:scores(*)")
      .eq("course_id", courseId)
      .eq("session", academic_session)
      .eq("semester", semester)
      .in("status", ["scored", "approved"]);

    if (fetchErr) throw fetchErr;

    if (!regs || regs.length === 0) {
      return NextResponse.json({ error: "No registrations found to reject for this course." }, { status: 400 });
    }

    const regIds = regs.map((r) => r.id);
    const rejectionEntry: RejectionHistoryEntry = {
      rejectedAt: new Date().toISOString(),
      rejectedBy: session.email || "Management",
      note: note.trim(),
    };

    // Update each score with rejection note & history
    for (const reg of regs) {
      const scoreObj: Score | null = Array.isArray(reg.score) ? reg.score[0] : (reg.score as Score | null);

      if (scoreObj) {
        const existingHistory = Array.isArray(scoreObj.rejection_history)
          ? (scoreObj.rejection_history as unknown as RejectionHistoryEntry[])
          : [];
        const updatedHistory = [...existingHistory, rejectionEntry];

        await supabaseAdmin
          .from("scores")
          .update({
            approved_by_management: false,
            approved_at: null,
            rejection_note: note.trim(),
            rejection_history: updatedHistory,
          })
          .eq("id", scoreObj.id);
      }
    }

    // Set course_registrations status back to 'rejected'
    const { error: updateRegErr } = await supabaseAdmin
      .from("course_registrations")
      .update({ status: "rejected" })
      .in("id", regIds);

    if (updateRegErr) throw updateRegErr;

    return NextResponse.json({ success: true, rejectedCount: regIds.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
