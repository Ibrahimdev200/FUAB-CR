import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { approveCourseScores } from "@/lib/services/calculation-service";

export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;
    const { academic_session, semester } = await req.json();

    if (!academic_session || !semester) {
      return NextResponse.json({ error: "Session and Semester are required" }, { status: 400 });
    }

    const result = await approveCourseScores(
      courseId,
      academic_session,
      semester,
      session.email || "Management Admin"
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
