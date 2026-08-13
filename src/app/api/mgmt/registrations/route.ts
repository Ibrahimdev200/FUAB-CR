import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const session = await getSession("management");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get("faculty_id");
    const departmentId = searchParams.get("department_id");
    const level = searchParams.get("level");
    const academicSession = searchParams.get("session");

    let query = supabaseAdmin
      .from("course_registrations")
      .select(`
        id,
        session,
        semester,
        status,
        created_at,
        student:students(*, department:departments(*, faculty:faculties(*))),
        course:courses(*, department:departments(*, faculty:faculties(*))),
        score:scores(*)
      `)
      .order("created_at", { ascending: false });

    if (academicSession) {
      query = query.eq("session", academicSession);
    }

    if (level) {
      query = query.eq("student.level", Number(level));
    }

    const { data: rawRegs, error } = await query;
    if (error) throw error;

    // Filter in-memory for deep nested department/faculty if specified
    let filtered = rawRegs || [];

    if (departmentId) {
      filtered = filtered.filter((r) => {
        const studentDeptId = (r.student as { department_id?: string })?.department_id;
        const courseDeptId = (r.course as { department_id?: string })?.department_id;
        return studentDeptId === departmentId || courseDeptId === departmentId;
      });
    }

    if (facultyId) {
      filtered = filtered.filter((r) => {
        const studentFacultyId = (r.student as { department?: { faculty_id?: string } })?.department?.faculty_id;
        const courseFacultyId = (r.course as { department?: { faculty_id?: string } })?.department?.faculty_id;
        return studentFacultyId === facultyId || courseFacultyId === facultyId;
      });
    }

    return NextResponse.json({ registrations: filtered });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
