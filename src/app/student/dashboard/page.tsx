"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Student, Course, CourseRegistration, Department } from "@/types/db";
import NotificationBell from "@/components/NotificationBell";
import { UniversityShieldIcon, LockIcon, CheckIcon, StudentIcon } from "@/components/Icons";

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
      <div style={{ minHeight: "100vh", background: "#090d16", color: "#f8fafc", padding: "3rem", textAlign: "center" }}>
        Loading Student Portal...
      </div>
    );
  }

  if (!student) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#090d16", color: "#f8fafc" }}>
      {/* Executive Institutional Header */}
      <header
        style={{
          background: "#131b2e",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "rgba(37, 99, 235, 0.15)",
              color: "#60a5fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UniversityShieldIcon size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.15rem", fontWeight: "700", fontFamily: "var(--font-outfit)", color: "#ffffff" }}>
              Student Portal
            </h1>
            <p style={{ fontSize: "0.75rem", color: "#64748b" }}>Academic Services & Official Results</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <NotificationBell role="student" />
          <button
            onClick={handleLogout}
            style={{
              padding: "0.45rem 0.9rem",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#f8fafc",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "6px",
              fontSize: "0.85rem",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.75rem 1.5rem" }}>
        {/* Compact Executive Profile Card */}
        <div
          style={{
            background: "#131b2e",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "1.5rem",
            marginBottom: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "#ffffff", fontFamily: "var(--font-outfit)" }}>
                {student.full_name}
              </h2>
              <p style={{ fontSize: "0.9rem", color: "#60a5fa", fontWeight: "600", marginTop: "0.15rem" }}>
                {student.matric_number}
              </p>
            </div>

            {/* Access Status Indicator Badge */}
            {student.is_locked ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.9rem",
                  borderRadius: "20px",
                  background: "rgba(136, 19, 55, 0.3)",
                  border: "1px solid rgba(244, 63, 94, 0.3)",
                  color: "#fecdd3",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                }}
              >
                <LockIcon size={14} className="text-rose-400" />
                Access Restricted — Contact School Management
              </div>
            ) : (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.9rem",
                  borderRadius: "20px",
                  background: "rgba(6, 95, 70, 0.3)",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  color: "#a7f3d0",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                }}
              >
                <CheckIcon size={14} className="text-emerald-400" />
                Account in Good Standing
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "0.75rem",
              fontSize: "0.85rem",
              color: "#94a3b8",
              paddingTop: "0.85rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div>
              <span style={{ color: "#64748b" }}>Department:</span>{" "}
              <strong style={{ color: "#f8fafc" }}>{student.department?.name || "N/A"}</strong>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>Faculty:</span>{" "}
              <strong style={{ color: "#f8fafc" }}>{student.department?.faculty?.name || "N/A"}</strong>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>Academic Level:</span>{" "}
              <strong style={{ color: "#f8fafc" }}>{student.level} Level</strong>
            </div>
          </div>
        </div>

        {/* Refined Pill Navigation Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "0.75rem" }}>
          {[
            { id: "register", label: "Register Courses" },
            { id: "my_courses", label: "My Registered Courses" },
            { id: "results", label: "Check Results & GPA" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                background: activeTab === tab.id ? "#2563eb" : "transparent",
                color: activeTab === tab.id ? "#ffffff" : "#94a3b8",
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Components */}
        {activeTab === "register" && <RegisterCoursesTab student={student} />}
        {activeTab === "my_courses" && <MyRegisteredCoursesTab />}
        {activeTab === "results" && <CheckResultsTab isLocked={student.is_locked} />}
      </div>
    </div>
  );
}

/* ====================================================================
   TAB 1: Course Registration
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
    <div style={{ background: "#131b2e", padding: "1.5rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#ffffff", fontFamily: "var(--font-outfit)" }}>
          Course Registration ({activeSession} Academic Session)
        </h3>
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.15rem" }}>
          Active Semester: <strong>{activeSemester} Semester</strong>
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.35rem" }}>Department</label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            style={{ width: "100%", padding: "0.65rem", background: "#0b1220", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", color: "#fff", fontSize: "0.85rem" }}
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.35rem" }}>Level</label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(parseInt(e.target.value, 10))}
            style={{ width: "100%", padding: "0.65rem", background: "#0b1220", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", color: "#fff", fontSize: "0.85rem" }}
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
        <div style={{ padding: "0.9rem 1.25rem", background: "rgba(6, 95, 70, 0.3)", border: "1px solid rgba(52, 211, 153, 0.3)", color: "#a7f3d0", borderRadius: "10px", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
          ✓ Registration submitted! Registered <strong>{summary.registeredCount}</strong> course(s).
          {summary.skippedCount > 0 && <span> ({summary.skippedCount} course(s) were previously registered).</span>}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Loading course catalog...</p>
      ) : availableCourses.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No courses published for the selected department & level for {activeSemester} Semester.</p>
      ) : (
        <form onSubmit={handleSubmitRegistration}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {availableCourses.map((c) => {
              const isChecked = selectedCourseIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleCourseSelection(c.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.9rem 1.15rem",
                    background: isChecked ? "rgba(37, 99, 235, 0.12)" : "#0b1220",
                    border: isChecked ? "1px solid #2563eb" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ width: "18px", height: "18px", accentColor: "#2563eb" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "700", color: "#60a5fa", fontSize: "0.95rem" }}>{c.code}</span>
                      <span style={{ fontSize: "0.75rem", background: "rgba(255, 255, 255, 0.08)", padding: "0.2rem 0.5rem", borderRadius: "4px", color: "#cbd5e1" }}>
                        {c.unit} Units
                      </span>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#cbd5e1", marginTop: "0.2rem" }}>{c.title}</div>
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
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.95rem",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting..." : `Submit Registration (${selectedCourseIds.length} Course(s))` }
          </button>
        </form>
      )}
    </div>
  );
}

/* ====================================================================
   TAB 2: My Registered Courses
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
    return <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Loading registered courses...</div>;
  }

  return (
    <div style={{ background: "#131b2e", padding: "1.5rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
      <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#ffffff", fontFamily: "var(--font-outfit)", marginBottom: "1rem" }}>
        My Registered Courses
      </h3>

      {registrations.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No course registrations recorded.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
            <thead style={{ background: "#0b1220", color: "#94a3b8" }}>
              <tr>
                <th style={{ padding: "0.75rem 1rem" }}>Course Code</th>
                <th style={{ padding: "0.75rem 1rem" }}>Course Title</th>
                <th style={{ padding: "0.75rem 1rem" }}>Units</th>
                <th style={{ padding: "0.75rem 1rem" }}>Session</th>
                <th style={{ padding: "0.75rem 1rem" }}>Semester</th>
                <th style={{ padding: "0.75rem 1rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr key={reg.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: "700", color: "#60a5fa" }}>{reg.course?.code}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#f8fafc" }}>{reg.course?.title}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>{reg.course?.unit}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>{reg.session}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>{reg.semester}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      style={{
                        padding: "0.2rem 0.6rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        textTransform: "capitalize",
                        background:
                          reg.status === "approved"
                            ? "rgba(6, 95, 70, 0.4)"
                            : reg.status === "scored"
                            ? "rgba(133, 77, 14, 0.4)"
                            : reg.status === "rejected"
                            ? "rgba(136, 19, 55, 0.4)"
                            : "rgba(255, 255, 255, 0.08)",
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

  if (isLocked) {
    return (
      <div
        style={{
          background: "rgba(136, 19, 55, 0.2)",
          border: "1px solid rgba(244, 63, 94, 0.3)",
          color: "#fca5a5",
          padding: "2rem",
          borderRadius: "14px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "inline-flex", padding: "0.75rem", borderRadius: "12px", background: "rgba(244, 63, 94, 0.2)", color: "#f43f5e", marginBottom: "0.75rem" }}>
          <LockIcon size={28} />
        </div>
        <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "0.4rem", fontFamily: "var(--font-outfit)" }}>
          Result Access Restricted
        </h3>
        <p style={{ fontSize: "0.9rem", color: "#fecdd3" }}>
          Your results are currently locked by school management. Please contact the school management office.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "#131b2e", padding: "1.5rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#ffffff", fontFamily: "var(--font-outfit)" }}>
          Academic Results & GPA Summary
        </h3>

        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          style={{ padding: "0.5rem 0.85rem", background: "#0b1220", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", color: "#fff", fontSize: "0.85rem" }}
        >
          {availableSessions.map((sess) => (
            <option key={sess} value={sess}>{sess} Session</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Fetching approved results...</p>
      ) : results.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No approved results published yet for session {selectedSession}.</p>
      ) : (
        <div>
          {/* Summary Metric Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ background: "#0b1220", padding: "1.25rem", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <p style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
                Session GPA ({selectedSession})
              </p>
              <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "#60a5fa", fontFamily: "var(--font-outfit)", marginTop: "0.2rem" }}>
                {sessionGpa}
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.15rem" }}>{totalSessionUnits} Units Completed</p>
            </div>

            <div style={{ background: "#0b1220", padding: "1.25rem", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <p style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
                Cumulative CGPA
              </p>
              <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "#34d399", fontFamily: "var(--font-outfit)", marginTop: "0.2rem" }}>
                {cgpa}
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.15rem" }}>All Approved Sessions</p>
            </div>
          </div>

          {/* Results Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead style={{ background: "#0b1220", color: "#94a3b8" }}>
                <tr>
                  <th style={{ padding: "0.75rem 1rem" }}>Course</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Units</th>
                  <th style={{ padding: "0.75rem 1rem" }}>CA</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Exam</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Total</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Grade</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: "700", color: "#60a5fa" }}>{r.code}</div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{r.title}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>{r.unit}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>{r.caScore}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>{r.examScore}</td>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: "700", color: "#ffffff" }}>{r.totalScore}</td>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: "800", color: r.grade === "F" ? "#fca5a5" : "#34d399" }}>{r.grade}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>{r.gradePoint.toFixed(1)}</td>
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
