"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Course, LecturerCourseAssignment, Score, Student } from "@/types/db";
import NotificationBell from "@/components/NotificationBell";

interface CourseStudentRow {
  registrationId: string;
  status: string;
  student: Student;
  score: Score | null;
}

export default function LecturerDashboardPage() {
  const router = useRouter();
  const [lecturer, setLecturer] = useState<{ email?: string; fullName?: string } | null>(null);
  const [assignments, setAssignments] = useState<LecturerCourseAssignment[]>([]);
  const [activeSession, setActiveSession] = useState("2025/2026");
  const [loading, setLoading] = useState(true);

  // Selected course state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseStudents, setCourseStudents] = useState<CourseStudentRow[]>([]);
  const [caMax, setCaMax] = useState(30);
  const [examMax, setExamMax] = useState(70);
  const [isCourseRejected, setIsCourseRejected] = useState(false);
  const [isCourseApproved, setIsCourseApproved] = useState(false);
  const [allScored, setAllScored] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState<Array<{ rejectedAt: string; rejectedBy: string; note: string }>>([]);

  // Local scores input state keyed by registrationId
  const [scoreInputs, setScoreInputs] = useState<Record<string, { ca: string; exam: string; isSaving?: boolean; saved?: boolean }>>({});
  const [savingMsg, setSavingMsg] = useState("");

  // Refs for fast row-by-row auto-focus
  const caInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch("/api/lecturer/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setLecturer(data.user);
        loadAssignedCourses();
      })
      .catch(() => {
        router.push("/lecturer/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function loadAssignedCourses() {
    try {
      const res = await fetch("/api/lecturer/assigned-courses");
      const data = await res.json();
      setAssignments(data.assignments || []);
      if (data.activeSession) setActiveSession(data.activeSession);

      if (data.assignments?.length > 0 && !selectedCourse) {
        selectCourse(data.assignments[0].course);
      }
    } catch (err) {
      console.error("Failed to load assigned courses", err);
    }
  }

  async function selectCourse(course: Course) {
    setSelectedCourse(course);
    setSavingMsg("");
    try {
      const res = await fetch(`/api/lecturer/course-students?course_id=${course.id}`);
      const data = await res.json();

      setCourseStudents(data.students || []);
      setCaMax(data.caMax || 30);
      setExamMax(data.examMax || 70);
      setIsCourseRejected(data.isCourseRejected || false);
      setIsCourseApproved(data.isCourseApproved || false);
      setAllScored(data.allScored || false);
      setRejectionNotes(data.rejectionNotes || []);

      // Populate local score inputs state
      const inputs: Record<string, { ca: string; exam: string; saved?: boolean }> = {};
      (data.students || []).forEach((row: CourseStudentRow) => {
        inputs[row.registrationId] = {
          ca: row.score?.ca_score !== undefined ? String(row.score.ca_score) : "",
          exam: row.score?.exam_score !== undefined ? String(row.score.exam_score) : "",
          saved: row.status === "scored" || row.status === "approved",
        };
      });
      setScoreInputs(inputs);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveRowScore(registrationId: string, currentIndex: number) {
    const currentInput = scoreInputs[registrationId];
    if (!currentInput) return;

    const caNum = parseFloat(currentInput.ca);
    const examNum = parseFloat(currentInput.exam);

    if (isNaN(caNum) || caNum < 0 || caNum > caMax) {
      alert(`CA score must be between 0 and ${caMax}`);
      return;
    }

    if (isNaN(examNum) || examNum < 0 || examNum > examMax) {
      alert(`Exam score must be between 0 and ${examMax}`);
      return;
    }

    setScoreInputs((prev) => ({
      ...prev,
      [registrationId]: { ...prev[registrationId], isSaving: true },
    }));

    try {
      const res = await fetch("/api/lecturer/save-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_id: registrationId,
          ca_score: caNum,
          exam_score: examNum,
          ca_max: caMax,
          exam_max: examMax,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save score");

      setScoreInputs((prev) => ({
        ...prev,
        [registrationId]: { ...prev[registrationId], isSaving: false, saved: true },
      }));

      if (data.allScored) setAllScored(true);

      // Fast Workflow: Auto-advance focus to the next unscored student in the list!
      const nextStudent = courseStudents[currentIndex + 1];
      if (nextStudent && caInputRefs.current[nextStudent.registrationId]) {
        caInputRefs.current[nextStudent.registrationId]?.focus();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving score");
      setScoreInputs((prev) => ({
        ...prev,
        [registrationId]: { ...prev[registrationId], isSaving: false },
      }));
    }
  }

  async function handleLogout() {
    await fetch("/api/lecturer/auth/logout", { method: "POST" });
    router.push("/lecturer/login");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f8fafc", padding: "3rem", textAlign: "center" }}>
        Loading Lecturer Dashboard...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f8fafc" }}>
      {/* Top Header */}
      <header
        style={{
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.5rem" }}>👨‍🏫</span>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Lecturer Portal</h1>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
              Active Session: <strong>{activeSession}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <NotificationBell role="lecturer" />
          <span style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>{lecturer?.fullName || lecturer?.email}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: "0.4rem 0.85rem",
              background: "#334155",
              color: "#f8fafc",
              border: "1px solid #475569",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Dashboard Body */}
      <div style={{ padding: "1.5rem 2rem", display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.5rem" }}>
        {/* Left Column: Assigned Courses List */}
        <div style={{ background: "#1e293b", padding: "1.25rem", borderRadius: "12px", border: "1px solid #334155", height: "fit-content" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.75rem", color: "#f8fafc" }}>
            📚 Assigned Courses ({activeSession})
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "1rem" }}>
            Select a course to enter or edit student scores.
          </p>

          {assignments.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>No courses assigned to you for session {activeSession}.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {assignments.map((a) => {
                const isSelected = selectedCourse?.id === a.course?.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => a.course && selectCourse(a.course)}
                    style={{
                      padding: "0.85rem",
                      borderRadius: "8px",
                      background: isSelected ? "#3b82f6" : "#0f172a",
                      border: "1px solid #334155",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ fontWeight: "700", color: isSelected ? "#ffffff" : "#60a5fa" }}>{a.course?.code}</div>
                    <div style={{ fontSize: "0.85rem", color: isSelected ? "#e2e8f0" : "#cbd5e1", marginTop: "0.2rem" }}>{a.course?.title}</div>
                    <div style={{ fontSize: "0.75rem", color: isSelected ? "#cbd5e1" : "#94a3b8", marginTop: "0.4rem" }}>
                      {a.course?.department?.name} | {a.course?.semester} Semester
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Score Entry Table & Management Approval Readiness */}
        {selectedCourse ? (
          <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "12px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#60a5fa" }}>
                  {selectedCourse.code} - {selectedCourse.title}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  Units: <strong>{selectedCourse.unit}</strong> | Semester: <strong>{selectedCourse.semester}</strong> | Policy Max: <strong>CA ({caMax}) / Exam ({examMax})</strong>
                </p>
              </div>

              {/* Status Readiness Badge */}
              {isCourseApproved ? (
                <div style={{ padding: "0.5rem 1rem", background: "#065f46", color: "#34d399", borderRadius: "8px", fontWeight: "700", fontSize: "0.85rem" }}>
                  ✓ Approved by Management (Scores Locked)
                </div>
              ) : isCourseRejected ? (
                <div style={{ padding: "0.5rem 1rem", background: "#881337", color: "#fecdd3", borderRadius: "8px", fontWeight: "700", fontSize: "0.85rem" }}>
                  ⚠️ Rejected by Management — Action Required
                </div>
              ) : allScored ? (
                <div style={{ padding: "0.5rem 1rem", background: "#854d0e", color: "#fef08a", borderRadius: "8px", fontWeight: "700", fontSize: "0.85rem" }}>
                  ⏳ Ready for Management Approval
                </div>
              ) : (
                <div style={{ padding: "0.5rem 1rem", background: "#334155", color: "#cbd5e1", borderRadius: "8px", fontWeight: "600", fontSize: "0.85rem" }}>
                  ✍️ Scoring in Progress
                </div>
              )}
            </div>

            {/* Rejection Alert Banner & History */}
            {isCourseRejected && (
              <div
                style={{
                  marginBottom: "1.25rem",
                  padding: "1rem",
                  background: "#450a0a",
                  border: "1px solid #991b1b",
                  borderRadius: "8px",
                  color: "#fca5a5",
                }}
              >
                <h3 style={{ fontWeight: "700", fontSize: "0.95rem", marginBottom: "0.4rem" }}>
                  ⚠️ Management Rejected Submitted Scores:
                </h3>
                {rejectionNotes.map((h, i) => (
                  <div key={i} style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    • <em>{new Date(h.rejectedAt).toLocaleDateString()}</em>: &quot;{h.note}&quot;
                  </div>
                ))}
                <p style={{ fontSize: "0.8rem", color: "#fef08a", marginTop: "0.5rem" }}>
                  Scores are unlocked. Please review the feedback, update scores below, and save to resubmit for approval.
                </p>
              </div>
            )}

            {savingMsg && (
              <div style={{ padding: "0.6rem 1rem", background: "#064e3b", color: "#a7f3d0", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.85rem" }}>
                {savingMsg}
              </div>
            )}

            {/* Registered Students Score Table */}
            {courseStudents.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No students have registered for this course yet.</p>
            ) : (
              <div>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.75rem" }}>
                  ⚡ <strong>Fast Workflow:</strong> Enter CA & Exam scores, then press <strong>Enter</strong> or click <strong>Save & Next ✓</strong> to automatically jump to the next student.
                </p>

                <div style={{ overflowX: "auto", border: "1px solid #334155", borderRadius: "8px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                    <thead style={{ background: "#0f172a", color: "#94a3b8" }}>
                      <tr>
                        <th style={{ padding: "0.6rem 1rem" }}>#</th>
                        <th style={{ padding: "0.6rem 1rem" }}>Matric Number</th>
                        <th style={{ padding: "0.6rem 1rem" }}>Student Name</th>
                        <th style={{ padding: "0.6rem 1rem" }}>CA Score (/{caMax})</th>
                        <th style={{ padding: "0.6rem 1rem" }}>Exam Score (/{examMax})</th>
                        <th style={{ padding: "0.6rem 1rem" }}>Total Score</th>
                        <th style={{ padding: "0.6rem 1rem" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseStudents.map((row, idx) => {
                        const input = scoreInputs[row.registrationId] || { ca: "", exam: "" };
                        const total = (parseFloat(input.ca) || 0) + (parseFloat(input.exam) || 0);

                        return (
                          <tr key={row.registrationId} style={{ borderBottom: "1px solid #334155" }}>
                            <td style={{ padding: "0.6rem 1rem", color: "#64748b" }}>{idx + 1}</td>
                            <td style={{ padding: "0.6rem 1rem", fontWeight: "700", color: "#60a5fa" }}>{row.student.matric_number}</td>
                            <td style={{ padding: "0.6rem 1rem" }}>{row.student.full_name}</td>
                            <td style={{ padding: "0.6rem 1rem" }}>
                              <input
                                type="number"
                                min={0}
                                max={caMax}
                                disabled={isCourseApproved}
                                ref={(el) => { caInputRefs.current[row.registrationId] = el; }}
                                value={input.ca}
                                onChange={(e) =>
                                  setScoreInputs((prev) => ({
                                    ...prev,
                                    [row.registrationId]: { ...prev[row.registrationId], ca: e.target.value, saved: false },
                                  }))
                                }
                                placeholder={`0-${caMax}`}
                                style={{
                                  width: "70px",
                                  padding: "0.4rem",
                                  background: "#0f172a",
                                  border: "1px solid #334155",
                                  borderRadius: "4px",
                                  color: "#fff",
                                  fontSize: "0.85rem",
                                }}
                              />
                            </td>
                            <td style={{ padding: "0.6rem 1rem" }}>
                              <input
                                type="number"
                                min={0}
                                max={examMax}
                                disabled={isCourseApproved}
                                value={input.exam}
                                onChange={(e) =>
                                  setScoreInputs((prev) => ({
                                    ...prev,
                                    [row.registrationId]: { ...prev[row.registrationId], exam: e.target.value, saved: false },
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveRowScore(row.registrationId, idx);
                                }}
                                placeholder={`0-${examMax}`}
                                style={{
                                  width: "70px",
                                  padding: "0.4rem",
                                  background: "#0f172a",
                                  border: "1px solid #334155",
                                  borderRadius: "4px",
                                  color: "#fff",
                                  fontSize: "0.85rem",
                                }}
                              />
                            </td>
                            <td style={{ padding: "0.6rem 1rem", fontWeight: "700", color: "#f8fafc" }}>
                              {total}
                            </td>
                            <td style={{ padding: "0.6rem 1rem" }}>
                              <button
                                onClick={() => handleSaveRowScore(row.registrationId, idx)}
                                disabled={isCourseApproved || input.isSaving}
                                style={{
                                  padding: "0.4rem 0.75rem",
                                  background: input.saved ? "#065f46" : "#3b82f6",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontWeight: "600",
                                  cursor: isCourseApproved ? "not-allowed" : "pointer",
                                  fontSize: "0.8rem",
                                }}
                              >
                                {input.isSaving ? "Saving..." : input.saved ? "✓ Saved" : "Save & Next →"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: "#1e293b", padding: "3rem", borderRadius: "12px", border: "1px solid #334155", textAlign: "center", color: "#64748b" }}>
            Select an assigned course from the left menu to manage score entries.
          </div>
        )}
      </div>
    </div>
  );
}
