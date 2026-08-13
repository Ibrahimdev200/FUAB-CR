import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Score } from "@/types/db";

export async function GET(req: Request) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionFilter = searchParams.get("session");

    let query = supabaseAdmin
      .from("course_registrations")
      .select(`
        id,
        session,
        semester,
        status,
        course:courses(*, department:departments(*)),
        student:students(*),
        score:scores(*)
      `)
      .in("status", ["scored", "approved", "rejected"]);

    if (sessionFilter) {
      query = query.eq("session", sessionFilter);
    }

    const { data: regs, error } = await query;
    if (error) throw error;

    // Group by course_id + session + semester
    const grouped = new Map<string, {
      course: unknown;
      session: string;
      semester: string;
      totalStudents: number;
      pendingCount: number;
      approvedCount: number;
      rejectedCount: number;
      students: unknown[];
      rejectionHistory: unknown[];
    }>();

    (regs || []).forEach((reg) => {
      const courseObj = reg.course as { id?: string; code?: string };
      const key = `${courseObj?.id || "unknown"}_${reg.session}_${reg.semester}`;
      const scoreObj: Score | null = Array.isArray(reg.score) ? reg.score[0] : (reg.score as Score | null);

      if (!grouped.has(key)) {
        grouped.set(key, {
          course: reg.course,
          session: reg.session,
          semester: reg.semester,
          totalStudents: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          students: [],
          rejectionHistory: Array.isArray(scoreObj?.rejection_history) ? scoreObj!.rejection_history : [],
        });
      }

      const item = grouped.get(key)!;
      item.totalStudents += 1;
      if (reg.status === "scored") item.pendingCount += 1;
      if (reg.status === "approved") item.approvedCount += 1;
      if (reg.status === "rejected") item.rejectedCount += 1;

      item.students.push({
        registrationId: reg.id,
        student: reg.student,
        score: scoreObj,
        status: reg.status,
      });
    });

    return NextResponse.json({ approvals: Array.from(grouped.values()) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
