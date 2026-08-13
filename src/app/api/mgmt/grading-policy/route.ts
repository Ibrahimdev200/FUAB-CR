import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const DEFAULT_GRADE_BOUNDARIES = [
  { grade: "A", minScore: 70, maxScore: 100, gradePoint: 5.0 },
  { grade: "B", minScore: 60, maxScore: 69.99, gradePoint: 4.0 },
  { grade: "C", minScore: 50, maxScore: 59.99, gradePoint: 3.0 },
  { grade: "D", minScore: 45, maxScore: 49.99, gradePoint: 2.0 },
  { grade: "E", minScore: 40, maxScore: 44.99, gradePoint: 1.0 },
  { grade: "F", minScore: 0, maxScore: 39.99, gradePoint: 0.0 },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionName = searchParams.get("session") || "2025/2026";

    const { data: policy, error } = await supabaseAdmin
      .from("grading_policies")
      .select("*")
      .eq("session", sessionName)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (!policy) {
      // Return default grading policy
      return NextResponse.json({
        policy: {
          session: sessionName,
          ca_weight_percent: 30,
          exam_weight_percent: 70,
          grade_boundaries: DEFAULT_GRADE_BOUNDARIES,
        },
      });
    }

    return NextResponse.json({ policy });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { academic_session, ca_weight_percent, exam_weight_percent, grade_boundaries } = await req.json();

    if (!academic_session || ca_weight_percent === undefined || exam_weight_percent === undefined) {
      return NextResponse.json({ error: "Session, CA weight %, and Exam weight % are required" }, { status: 400 });
    }

    if (Number(ca_weight_percent) + Number(exam_weight_percent) !== 100) {
      return NextResponse.json({ error: "CA weight % + Exam weight % must equal 100%" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("grading_policies")
      .upsert(
        {
          session: academic_session.trim(),
          ca_weight_percent: Number(ca_weight_percent),
          exam_weight_percent: Number(exam_weight_percent),
          grade_boundaries: grade_boundaries || DEFAULT_GRADE_BOUNDARIES,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session" }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ policy: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
