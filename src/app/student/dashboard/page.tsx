"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Student, Course, CourseRegistration, Department } from "@/types/db";
import NotificationBell from "@/components/NotificationBell";

type TabType = "register" | "my_courses" | "results";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("register");

  useEffect(() => {
    fetch("/api/student/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setStudent(data.student);
      })
      .catch(() => {
        router.push("/student/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/student/auth/logout", { method: "POST" });
    router.push("/student/login");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f8fafc", padding: "2rem", textAlign: "center" }}>
        Loading Student Dashboard...
      </div>
    );
  }

  if (!student) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f8fafc", padding: "1rem" }}>
      {/* Header Bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
          paddingBottom: "0.75rem",
          borderBottom: "1px solid #334155",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🎓</span>
          <h1 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Student Portal</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <NotificationBell role="student" />
          <button
            onClick={handleLogout}
            style={{
              padding: "0.4rem 0.85rem",
              background: "#334155",
              color: "#f8fafc",
              border: "1px solid #475569",
              borderRadius: "6px",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Compact Profile & Status Card */}
      <div
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "12px",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#f8fafc" }}>{student.full_name}</h2>
            <p style={{ fontSize: "0.875rem", color: "#60a5fa", fontWeight: "600" }}>{student.matric_number}</p>
          </div>

          {/* Payment / Access Status Badge */}
          {student.is_locked ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                background: "#450a0a",
                border: "1px solid #991b1b",
                color: "#fca5a5",
                fontSize: "0.8rem",
                fontWeight: "600",
              }}
            >
              🔒 Access restricted — contact school management
            </div>
          ) : (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                background: "#064e3b",
                border: "1px solid #047857",
                color: "#a7f3d0",
                fontSize: "0.8rem",
                fontWeight: "600",
              }}
            >
              ✓ Account in good standing
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "0.5rem",
            fontSize: "0.85rem",
            color: "#94a3b8",
            paddingTop: "0.5rem",
            borderTop: "1px solid #334155",
          }}
        >
          <div>
            <strong>Department:</strong> {student.department?.name || "N/A"}
          </div>
          <div>
            <strong>Faculty:</strong> {student.department?.faculty?.name || "N/A"}
          </div>
          <div>
            <strong>Current Level:</strong> {student.level} Level
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "1px solid #334155", paddingBottom: "0.75rem" }}>
        {[
          { id: "register", label: "📝 Register Courses" },
          { id: "my_courses", label: "📚 Registered Courses" },
          { id: "results", label: "📊 Check Results" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              flex: 1,
              padding: "0.65rem 0.5rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              background: activeTab === tab.id ? "#3b82f6" : "#1e293b",
              color: activeTab === tab.id ? "#ffffff" : "#94a3b8",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === "register" && <RegisterCoursesTab student={student} />}
      {activeTab === "my_courses" && <MyRegisteredCoursesTab />}
      {activeTab === "results" && <CheckResultsTab isLocked={student.is_locked} />}
    </div>
  );
}

/* ====================================================================
   TAB 1: Course Registration Component
==================================================================== */
function RegisterCoursesTab({ student }: { student: Student }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState(student.department_id);
  const [selectedLevel, setSelectedLevel] = useState(student.level);

  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [activeSession, setActiveSession] = useState("2025/2026");
  const [activeSemester, setActiveSemester] = useState("First");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<{ registeredCount: number; skippedCount: number } | null>(null);

  useEffect(() => {
    fetch("/api/mgmt/departments")
      .then((r) => r.json())
      .then((d) => setDepartments(d.departments || []));
  }, []);

  useEffect(() => {
    loadCourses();
  }, [selectedDeptId, selectedLevel]);

  async function loadCourses() {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/available-courses?department_id=${selectedDeptId}&level=${selectedLevel}`);
      const data = await res.json();

      setAvailableCourses(data.courses || []);
      if (data.activeSession) setActiveSession(data.activeSession);
      if (data.activeSemester) setActiveSemester(data.activeSemester);

      // Default select all available courses
      setSelectedCourseIds((data.courses || []).map((c: Course) => c.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function toggleCourseSelection(id: string) {
    if (selectedCourseIds.includes(id)) {
      setSelectedCourseIds(selectedCourseIds.filter((item) => item !== id));
    } else {
      setSelectedCourseIds([...selectedCourseIds, id]);
    }
  }

  async function handleSubmitRegistration(e: React.FormEvent) {
    e.preventDefault();
    if (selectedCourseIds.length === 0) {
      alert("Please select at least one course.");
      return;
    }

    setSubmitting(true);
    setSummary(null);

    try {
      const res = await fetch("/api/student/register-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_ids: selectedCourseIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setSummary({ registeredCount: data.registeredCount, skippedCount: data.skippedCount });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: "#1e293b", padding: "1.25rem", borderRadius: "12px", border: "1px solid #334155" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>📝 Course Registration ({activeSession} Session)</h2>
        <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
          Active Semester: <strong>{activeSemester} Semester</strong>
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>Department</label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff", fontSize: "0.85rem" }}
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>Level</label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(parseInt(e.target.value, 10))}
            style={{ width: "100%", padding: "0.5rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff", fontSize: "0.85rem" }}
          >
            <option value={100}>100 Level</option>
            <option value={200}>200 Level</option>
            <option value={300}>300 Level</option>
            <option value={400}>400 Level</option>
            <option value={500}>500 Level</option>
          </select>
        </div>
      </div>

      {summary && (
        <div style={{ padding: "0.85rem", background: "#064e3b", border: "1px solid #047857", color: "#a7f3d0", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem" }}>
          ✓ Registration Completed! Successfully registered <strong>{summary.registeredCount}</strong> course(s).
          {summary.skippedCount > 0 && <span> ({summary.skippedCount} course(s) were already registered).</span>}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading available courses...</p>
      ) : availableCourses.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No courses found for selected department & level for {activeSemester} Semester.</p>
      ) : (
        <form onSubmit={handleSubmitRegistration}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
            {availableCourses.map((c) => {
              const isChecked = selectedCourseIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleCourseSelection(c.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.85rem",
                    background: isChecked ? "rgba(59, 130, 246, 0.1)" : "#0f172a",
                    border: isChecked ? "1px solid #3b82f6" : "1px solid #334155",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ width: "18px", height: "18px", accentColor: "#3b82f6" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "700", color: "#60a5fa" }}>{c.code}</span>
                      <span style={{ fontSize: "0.75rem", background: "#334155", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>{c.unit} Units</span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.2rem" }}>{c.title}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "0.85rem",
              background: "#059669",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.95rem",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting Registration..." : `Submit Registration (${selectedCourseIds.length} Course(s))` }
          </button>
        </form>
      )}
    </div>
  );
}

/* ====================================================================
   TAB 2: My Registered Courses Component
==================================================================== */
function MyRegisteredCoursesTab() {
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/my-registrations")
      .then((r) => r.json())
      .then((d) => setRegistrations(d.registrations || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading registered courses...</div>;
  }

  return (
    <div style={{ background: "#1e293b", padding: "1.25rem", borderRadius: "12px", border: "1px solid #334155" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1rem" }}>📚 My Registered Courses</h2>

      {registrations.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>You have not registered any courses yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
            <thead style={{ background: "#0f172a", color: "#94a3b8" }}>
              <tr>
                <th style={{ padding: "0.6rem" }}>Code</th>
                <th style={{ padding: "0.6rem" }}>Title</th>
                <th style={{ padding: "0.6rem" }}>Units</th>
                <th style={{ padding: "0.6rem" }}>Session</th>
                <th style={{ padding: "0.6rem" }}>Semester</th>
                <th style={{ padding: "0.6rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr key={reg.id} style={{ borderBottom: "1px solid #334155" }}>
                  <td style={{ padding: "0.6rem", fontWeight: "700", color: "#60a5fa" }}>{reg.course?.code}</td>
                  <td style={{ padding: "0.6rem" }}>{reg.course?.title}</td>
                  <td style={{ padding: "0.6rem" }}>{reg.course?.unit}</td>
                  <td style={{ padding: "0.6rem" }}>{reg.session}</td>
                  <td style={{ padding: "0.6rem" }}>{reg.semester}</td>
                  <td style={{ padding: "0.6rem" }}>
                    <span
                      style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        textTransform: "capitalize",
                        background:
                          reg.status === "approved"
                            ? "#065f46"
                            : reg.status === "scored"
                            ? "#854d0e"
                            : reg.status === "rejected"
                            ? "#881337"
                            : "#334155",
                        color:
                          reg.status === "approved"
                            ? "#34d399"
                            : reg.status === "scored"
                            ? "#fef08a"
                            : reg.status === "rejected"
                            ? "#fecdd3"
                            : "#cbd5e1",
                      }}
                    >
                      {reg.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ====================================================================
   TAB 3: Check Results Component
==================================================================== */
function CheckResultsTab({ isLocked }: { isLocked: boolean }) {
  interface ResultItem {
    code: string;
    title: string;
    unit: number;
    semester: string;
    caScore: number;
    examScore: number;
    totalScore: number;
    grade: string;
    gradePoint: number;
  }

  const [selectedSession, setSelectedSession] = useState("2025/2026");
  const [availableSessions, setAvailableSessions] = useState<string[]>(["2025/2026"]);

  const [results, setResults] = useState<ResultItem[]>([]);
  const [sessionGpa, setSessionGpa] = useState("0.00");
  const [cgpa, setCgpa] = useState("0.00");
  const [totalSessionUnits, setTotalSessionUnits] = useState(0);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLocked) return;
    loadResults();
  }, [selectedSession, isLocked]);

  async function loadResults() {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/results?session=${selectedSession}`);
      const data = await res.json();

      if (data.availableSessions && data.availableSessions.length > 0) {
        setAvailableSessions(data.availableSessions);
      }

      setResults(data.results || []);
      setSessionGpa(data.sessionGpa || "0.00");
      setCgpa(data.cumulativeCgpa || "0.00");
      setTotalSessionUnits(data.totalSessionUnits || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Access Lock Enforcement Check
  if (isLocked) {
    return (
      <div
        style={{
          background: "#450a0a",
          border: "1px solid #991b1b",
          color: "#fca5a5",
          padding: "1.5rem",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔒</div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.5rem" }}>Result Access Restricted</h3>
        <p style={{ fontSize: "0.9rem" }}>
          Your results are currently locked by school management. Please contact the school management office.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "#1e293b", padding: "1.25rem", borderRadius: "12px", border: "1px solid #334155" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>📊 Academic Results & GPA</h2>

        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          style={{ padding: "0.4rem 0.75rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff", fontSize: "0.85rem" }}
        >
          {availableSessions.map((sess) => (
            <option key={sess} value={sess}>{sess} Session</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Fetching approved results...</p>
      ) : results.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No approved results published yet for session {selectedSession}.</p>
      ) : (
        <div>
          {/* Summary Box */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1.25rem",
              background: "#0f172a",
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid #334155",
            }}
          >
            <div>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Session GPA ({selectedSession})</p>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#60a5fa" }}>{sessionGpa}</h3>
              <p style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>{totalSessionUnits} Total Units Passed</p>
            </div>

            <div>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Cumulative CGPA</p>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#34d399" }}>{cgpa}</h3>
              <p style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>All Approved Sessions</p>
            </div>
          </div>

          {/* Results Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead style={{ background: "#0f172a", color: "#94a3b8" }}>
                <tr>
                  <th style={{ padding: "0.6rem" }}>Course</th>
                  <th style={{ padding: "0.6rem" }}>Units</th>
                  <th style={{ padding: "0.6rem" }}>CA</th>
                  <th style={{ padding: "0.6rem" }}>Exam</th>
                  <th style={{ padding: "0.6rem" }}>Total</th>
                  <th style={{ padding: "0.6rem" }}>Grade</th>
                  <th style={{ padding: "0.6rem" }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "0.6rem" }}>
                      <div style={{ fontWeight: "700", color: "#60a5fa" }}>{r.code}</div>
                      <div style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>{r.title}</div>
                    </td>
                    <td style={{ padding: "0.6rem" }}>{r.unit}</td>
                    <td style={{ padding: "0.6rem" }}>{r.caScore}</td>
                    <td style={{ padding: "0.6rem" }}>{r.examScore}</td>
                    <td style={{ padding: "0.6rem", fontWeight: "700" }}>{r.totalScore}</td>
                    <td style={{ padding: "0.6rem", fontWeight: "800", color: r.grade === "F" ? "#fca5a5" : "#34d399" }}>{r.grade}</td>
                    <td style={{ padding: "0.6rem" }}>{r.gradePoint.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
