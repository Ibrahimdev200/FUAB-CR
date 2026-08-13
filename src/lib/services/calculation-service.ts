import { supabaseAdmin } from "@/lib/supabase-admin";
import { GradeBoundary, Score } from "@/types/db";

const DEFAULT_GRADE_BOUNDARIES: GradeBoundary[] = [
  { grade: "A", minScore: 70, maxScore: 100, gradePoint: 5.0 },
  { grade: "B", minScore: 60, maxScore: 69.99, gradePoint: 4.0 },
  { grade: "C", minScore: 50, maxScore: 59.99, gradePoint: 3.0 },
  { grade: "D", minScore: 45, maxScore: 49.99, gradePoint: 2.0 },
  { grade: "E", minScore: 40, maxScore: 44.99, gradePoint: 1.0 },
  { grade: "F", minScore: 0, maxScore: 39.99, gradePoint: 0.0 },
];

function calculateGradeAndPoint(totalScore: number, boundaries: GradeBoundary[]) {
  for (const b of boundaries) {
    if (totalScore >= b.minScore && totalScore <= b.maxScore) {
      return { grade: b.grade, gradePoint: b.gradePoint };
    }
  }
  return { grade: "F", gradePoint: 0.0 };
}

interface RegWithScore {
  id: string;
  student_id: string;
  course_id: string;
  session: string;
  semester: string;
  status: string;
  score?: Score | Score[];
}

interface ApprovedReg {
  id: string;
  session: string;
  semester: string;
  status: string;
  course?: { unit: number };
  score?: Score | Score[];
}

export async function approveCourseScores(
  courseId: string,
  sessionName: string,
  semesterName: string,
  adminEmail: string = "Management Admin"
) {
  // 1. Fetch all course registrations for this course, session, and semester
  const { data: rawRegs, error: fetchErr } = await supabaseAdmin
    .from("course_registrations")
    .select("id, student_id, course_id, session, semester, status, score:scores(*)")
    .eq("course_id", courseId)
    .eq("session", sessionName)
    .eq("semester", semesterName);

  if (fetchErr) throw fetchErr;

  const regs = (rawRegs || []) as unknown as RegWithScore[];

  if (regs.length === 0) {
    throw new Error("No student course registrations found to approve for this course.");
  }

  // 2. Validate missing scores: ensure EVERY student has a score entry
  const missingScoreStudents: string[] = [];
  regs.forEach((reg) => {
    const scoreObj = Array.isArray(reg.score) ? reg.score[0] : reg.score;
    if (!scoreObj || scoreObj.ca_score === undefined || scoreObj.exam_score === undefined) {
      missingScoreStudents.push(reg.student_id);
    }
  });

  if (missingScoreStudents.length > 0) {
    throw new Error(
      `Cannot approve: ${missingScoreStudents.length} student(s) in this course are still missing saved scores.`
    );
  }

  // 3. Fetch session grading policy
  const { data: policyData } = await supabaseAdmin
    .from("grading_policies")
    .select("*")
    .eq("session", sessionName)
    .single();

  const policySnapshot = policyData || {
    session: sessionName,
    ca_weight_percent: 30,
    exam_weight_percent: 70,
    grade_boundaries: DEFAULT_GRADE_BOUNDARIES,
    snapshottedAt: new Date().toISOString(),
    approvedBy: adminEmail,
  };

  const boundaries: GradeBoundary[] = Array.isArray(policySnapshot.grade_boundaries)
    ? (policySnapshot.grade_boundaries as unknown as GradeBoundary[])
    : DEFAULT_GRADE_BOUNDARIES;

  const affectedStudentIds = new Set<string>();
  const regIds: string[] = [];

  // 4. Update each Score record with grade, grade_point, approval timestamp & policy snapshot
  for (const reg of regs) {
    regIds.push(reg.id);
    affectedStudentIds.add(reg.student_id);

    const scoreObj = Array.isArray(reg.score) ? reg.score[0] : reg.score;
    if (scoreObj) {
      const total = Number(scoreObj.total_score || Number(scoreObj.ca_score) + Number(scoreObj.exam_score));
      const { grade, gradePoint } = calculateGradeAndPoint(total, boundaries);

      const { error: updateScoreErr } = await supabaseAdmin
        .from("scores")
        .update({
          total_score: total,
          grade,
          grade_point: gradePoint,
          approved_by_management: true,
          approved_at: new Date().toISOString(),
          policy_snapshot: policySnapshot,
        })
        .eq("id", scoreObj.id);

      if (updateScoreErr) throw updateScoreErr;
    }
  }

  // 5. Update course_registrations status to 'approved'
  const { error: updateRegErr } = await supabaseAdmin
    .from("course_registrations")
    .update({ status: "approved" })
    .in("id", regIds);

  if (updateRegErr) throw updateRegErr;

  // 6. Recalculate Session GPA & Cumulative CGPA for all affected students
  for (const studentId of Array.from(affectedStudentIds)) {
    await recalculateStudentSummaries(studentId, sessionName, semesterName);
  }

  return {
    success: true,
    approvedCount: regIds.length,
    studentsAffectedCount: affectedStudentIds.size,
  };
}

export async function recalculateStudentSummaries(studentId: string, sessionName: string, semesterName: string) {
  // Fetch ALL approved registrations for this student across ALL sessions to date
  const { data: rawAllApproved, error } = await supabaseAdmin
    .from("course_registrations")
    .select("id, session, semester, status, course:courses(unit), score:scores(*)")
    .eq("student_id", studentId)
    .eq("status", "approved");

  if (error) throw error;

  const allApproved = (rawAllApproved || []) as unknown as ApprovedReg[];

  let cumulativeUnits = 0;
  let cumulativePoints = 0;

  let sessionUnits = 0;
  let sessionPoints = 0;

  allApproved.forEach((reg) => {
    const scoreObj = Array.isArray(reg.score) ? reg.score[0] : reg.score;
    if (reg.course && scoreObj && scoreObj.grade_point !== undefined && scoreObj.grade_point !== null) {
      const units = Number(reg.course.unit || 0);
      const points = Number(scoreObj.grade_point || 0);

      cumulativeUnits += units;
      cumulativePoints += units * points;

      if (reg.session === sessionName && reg.semester === semesterName) {
        sessionUnits += units;
        sessionPoints += units * points;
      }
    }
  });

  const sessionGpa = sessionUnits > 0 ? Number((sessionPoints / sessionUnits).toFixed(2)) : 0.0;
  const cumulativeCgpa = cumulativeUnits > 0 ? Number((cumulativePoints / cumulativeUnits).toFixed(2)) : 0.0;

  // Upsert into student_result_summaries
  await supabaseAdmin
    .from("student_result_summaries")
    .upsert(
      {
        student_id: studentId,
        session: sessionName,
        semester: semesterName,
        gpa: sessionGpa,
        cgpa: cumulativeCgpa,
        total_units: sessionUnits,
        cumulative_units: cumulativeUnits,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,session,semester" }
    );
}
