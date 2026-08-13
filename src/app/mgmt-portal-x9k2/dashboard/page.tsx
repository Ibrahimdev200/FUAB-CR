"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AcademicSettings,
  Course,
  Department,
  Faculty,
  GradingPolicy,
  GradeBoundary,
  Lecturer,
  Student,
  AuditLog,
} from "@/types/db";
import NotificationBell from "@/components/NotificationBell";

type TabType =
  | "upload"
  | "faculties_courses"
  | "lecturers"
  | "grading"
  | "approvals"
  | "access"
  | "registrations"
  | "academic"
  | "audit_logs";

export default function ManagementDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("upload");
  const [adminUser, setAdminUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Global Academic Settings State
  const [academicSettings, setAcademicSettings] = useState<AcademicSettings>({
    id: "",
    active_session: "2025/2026",
    active_semester: "First",
    updated_at: "",
  });

  // Check auth session
  useEffect(() => {
    fetch("/api/mgmt/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setAdminUser(data.user);
        loadAcademicSettings();
      })
      .catch(() => {
        router.push("/mgmt-portal-x9k2/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function loadAcademicSettings() {
    try {
      const res = await fetch("/api/mgmt/academic-settings");
      const data = await res.json();
      if (data.settings) setAcademicSettings(data.settings);
    } catch (err) {
      console.error("Failed to load academic settings", err);
    }
  }

  async function handleLogout() {
    await fetch("/api/mgmt/auth/logout", { method: "POST" });
    router.push("/mgmt-portal-x9k2/login");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f8fafc", padding: "3rem", textAlign: "center" }}>
        Loading Management Portal...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f8fafc" }}>
      {/* Top Navigation Bar */}
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
          <span style={{ fontSize: "1.5rem" }}>🛡️</span>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Management Portal</h1>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
              Active Session: <strong>{academicSettings.active_session}</strong> | Semester: <strong>{academicSettings.active_semester}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <NotificationBell role="management" />
          <span style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>{adminUser?.email}</span>
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

      {/* Main Container */}
      <div style={{ padding: "1.5rem 2rem" }}>
        {/* Tab Selection */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            borderBottom: "1px solid #334155",
            paddingBottom: "0.75rem",
            marginBottom: "1.5rem",
            overflowX: "auto",
          }}
        >
          {[
            { id: "upload", label: "📁 Upload Student Data" },
            { id: "faculties_courses", label: "🏛️ Faculties, Depts & Courses" },
            { id: "lecturers", label: "👨‍🏫 Manage Lecturers" },
            { id: "grading", label: "⚖️ Grading Policy" },
            { id: "approvals", label: "✅ Approvals & Rejections" },
            { id: "access", label: "🔒 Student Access Control" },
            { id: "registrations", label: "📋 Registrations Report" },
            { id: "academic", label: "⚙️ Academic Settings" },
            { id: "audit_logs", label: "📜 Audit Logs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                padding: "0.6rem 1.1rem",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: activeTab === tab.id ? "#3b82f6" : "#1e293b",
                color: activeTab === tab.id ? "#ffffff" : "#94a3b8",
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Panels */}
        {activeTab === "upload" && <UploadStudentDataTab />}
        {activeTab === "faculties_courses" && <FacultiesCoursesTab />}
        {activeTab === "lecturers" && <ManageLecturersTab activeSession={academicSettings.active_session} />}
        {activeTab === "grading" && <GradingPolicyTab activeSession={academicSettings.active_session} />}
        {activeTab === "approvals" && <ApprovalsTab activeSession={academicSettings.active_session} />}
        {activeTab === "access" && <StudentAccessControlTab />}
        {activeTab === "registrations" && <ViewRegistrationsTab activeSession={academicSettings.active_session} />}
        {activeTab === "academic" && (
          <AcademicSettingsTab settings={academicSettings} onUpdated={setAcademicSettings} />
        )}
        {activeTab === "audit_logs" && <AuditLogsTab />}
      </div>
    </div>
  );
}

/* ====================================================================
   SECTION A: Upload Student Data Tab
==================================================================== */
function UploadStudentDataTab() {
  const [rawText, setRawText] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [parsedRows, setParsedRows] = useState<Array<{ matric_number: string; full_name: string; department: string; level: number }>>([]);
  const [uploading, setUploading] = useState(false);
  const [resultSummary, setResultSummary] = useState<{ uploaded: number; skipped: number; errors: string[] } | null>(null);

  useEffect(() => {
    fetch("/api/mgmt/departments")
      .then((res) => res.json())
      .then((data) => setDepartments(data.departments || []));
  }, []);

  function handleParse() {
    const lines = rawText.split("\n").filter((l) => l.trim().length > 0);
    const parsed: Array<{ matric_number: string; full_name: string; department: string; level: number }> = [];

    lines.forEach((line) => {
      // Expect CSV format: matric_number, full_name, department_id/name, level
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        parsed.push({
          matric_number: parts[0],
          full_name: parts[1],
          department: parts[2] || (departments[0]?.name || "Computer Science"),
          level: parseInt(parts[3] || "100", 10),
        });
      }
    });

    setParsedRows(parsed);
    setResultSummary(null);
  }

  async function handleConfirmUpload() {
    setUploading(true);
    setResultSummary(null);

    try {
      const res = await fetch("/api/mgmt/upload-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: parsedRows }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setResultSummary({ uploaded: data.uploaded, skipped: data.skipped, errors: data.errors });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "12px", border: "1px solid #334155" }}>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", color: "#f8fafc" }}>📥 Bulk Upload Student Data</h2>
      <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
        Paste CSV lines or upload data (Format per line: <code>matric_number, full_name, department_id_or_name, level</code>).
      </p>

      <textarea
        rows={6}
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder={`FUAB/2024/001, John Doe, Computer Science, 100\nFUAB/2024/002, Jane Smith, Electrical Engineering, 200`}
        style={{
          width: "100%",
          padding: "0.85rem",
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "8px",
          color: "#f8fafc",
          fontSize: "0.9rem",
          marginBottom: "1rem",
          fontFamily: "monospace",
        }}
      />

      <button
        onClick={handleParse}
        style={{
          padding: "0.6rem 1.25rem",
          background: "#3b82f6",
          color: "#ffffff",
          border: "none",
          borderRadius: "6px",
          fontWeight: "600",
          cursor: "pointer",
          marginBottom: "1.5rem",
        }}
      >
        Preview Data Table ({rawText.split("\n").filter((l) => l.trim()).length} lines)
      </button>

      {parsedRows.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h3 style={{ fontSize: "1rem", color: "#cbd5e1", marginBottom: "0.75rem" }}>
            Previewing {parsedRows.length} Record(s) Before Confirmation:
          </h3>
          <div style={{ overflowX: "auto", maxHeight: "250px", border: "1px solid #334155", borderRadius: "8px", marginBottom: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead style={{ background: "#0f172a", color: "#94a3b8" }}>
                <tr>
                  <th style={{ padding: "0.6rem 1rem" }}>#</th>
                  <th style={{ padding: "0.6rem 1rem" }}>Matric Number</th>
                  <th style={{ padding: "0.6rem 1rem" }}>Full Name</th>
                  <th style={{ padding: "0.6rem 1rem" }}>Department</th>
                  <th style={{ padding: "0.6rem 1rem" }}>Level</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "0.5rem 1rem", color: "#64748b" }}>{idx + 1}</td>
                    <td style={{ padding: "0.5rem 1rem" }}>{row.matric_number}</td>
                    <td style={{ padding: "0.5rem 1rem" }}>{row.full_name}</td>
                    <td style={{ padding: "0.5rem 1rem" }}>{row.department}</td>
                    <td style={{ padding: "0.5rem 1rem" }}>{row.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleConfirmUpload}
            disabled={uploading}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#059669",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Saving to PreloadedMatric..." : "Confirm & Import All Records"}
          </button>
        </div>
      )}

      {resultSummary && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            borderRadius: "8px",
            background: "#064e3b",
            border: "1px solid #047857",
            color: "#a7f3d0",
          }}
        >
          <h4 style={{ fontWeight: "700", marginBottom: "0.5rem" }}>Upload Summary Result:</h4>
          <p>✓ Successfully imported/updated: <strong>{resultSummary.uploaded}</strong> record(s)</p>
          <p>⚠️ Skipped / duplicate records: <strong>{resultSummary.skipped}</strong> record(s)</p>
          {resultSummary.errors.length > 0 && (
            <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#fca5a5" }}>
              <strong>Log notes:</strong>
              <ul>
                {resultSummary.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ====================================================================
   SECTION B: Manage Faculties, Departments & Courses
==================================================================== */
function FacultiesCoursesTab() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Forms state
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptFacultyId, setNewDeptFacultyId] = useState("");

  const [courseForm, setCourseForm] = useState({
    code: "",
    title: "",
    unit: 3,
    level: 100,
    semester: "First",
    department_id: "",
  });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [facRes, deptRes, crsRes] = await Promise.all([
      fetch("/api/mgmt/faculties").then((r) => r.json()),
      fetch("/api/mgmt/departments").then((r) => r.json()),
      fetch("/api/mgmt/courses").then((r) => r.json()),
    ]);
    setFaculties(facRes.faculties || []);
    setDepartments(deptRes.departments || []);
    setCourses(crsRes.courses || []);
    if (facRes.faculties?.length > 0 && !newDeptFacultyId) {
      setNewDeptFacultyId(facRes.faculties[0].id);
    }
    if (deptRes.departments?.length > 0 && !courseForm.department_id) {
      setCourseForm((prev) => ({ ...prev, department_id: deptRes.departments[0].id }));
    }
  }

  async function handleAddFaculty(e: React.FormEvent) {
    e.preventDefault();
    if (!newFacultyName.trim()) return;
    await fetch("/api/mgmt/faculties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFacultyName }),
    });
    setNewFacultyName("");
    loadAll();
  }

  async function handleAddDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptFacultyId) return;
    await fetch("/api/mgmt/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDeptName, faculty_id: newDeptFacultyId }),
    });
    setNewDeptName("");
    loadAll();
  }

  async function handleAddCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!courseForm.code || !courseForm.title || !courseForm.department_id) return;
    await fetch("/api/mgmt/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseForm),
    });
    setCourseForm({ code: "", title: "", unit: 3, level: 100, semester: "First", department_id: departments[0]?.id || "" });
    loadAll();
  }

  async function handleDeleteCourse(id: string) {
    if (!confirm("Are you sure you want to delete this course?")) return;
    await fetch(`/api/mgmt/courses/${id}`, { method: "DELETE" });
    loadAll();
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      {/* Faculties & Departments Column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Faculties Box */}
        <div style={{ background: "#1e293b", padding: "1.25rem", borderRadius: "12px", border: "1px solid #334155" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>🏛️ Faculties</h3>
          <form onSubmit={handleAddFaculty} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Faculty Name (e.g. Science)"
              value={newFacultyName}
              onChange={(e) => setNewFacultyName(e.target.value)}
              style={{ flex: 1, padding: "0.5rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
            />
            <button type="submit" style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px" }}>
              Add
            </button>
          </form>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {faculties.map((f) => (
              <li key={f.id} style={{ padding: "0.4rem 0", borderBottom: "1px solid #334155", color: "#cbd5e1" }}>
                {f.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Departments Box */}
        <div style={{ background: "#1e293b", padding: "1.25rem", borderRadius: "12px", border: "1px solid #334155" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>🏢 Departments</h3>
          <form onSubmit={handleAddDepartment} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
            <select
              value={newDeptFacultyId}
              onChange={(e) => setNewDeptFacultyId(e.target.value)}
              style={{ padding: "0.5rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
            >
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder="Department Name (e.g. Computer Science)"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                style={{ flex: 1, padding: "0.5rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
              />
              <button type="submit" style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px" }}>
                Add
              </button>
            </div>
          </form>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {departments.map((d) => (
              <li key={d.id} style={{ padding: "0.4rem 0", borderBottom: "1px solid #334155", color: "#cbd5e1" }}>
                <strong>{d.name}</strong> <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>({d.faculty?.name})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Courses Column */}
      <div style={{ background: "#1e293b", padding: "1.25rem", borderRadius: "12px", border: "1px solid #334155" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>📚 Courses Catalog</h3>
        <form onSubmit={handleAddCourse} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Code (e.g. CSC101)"
              value={courseForm.code}
              onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
              style={{ padding: "0.5rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
            />
            <input
              type="text"
              placeholder="Course Title"
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              style={{ padding: "0.5rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
            <input
              type="number"
              placeholder="Units"
              value={courseForm.unit}
              onChange={(e) => setCourseForm({ ...courseForm, unit: parseInt(e.target.value, 10) })}
              style={{ padding: "0.5rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
            />
            <select
              value={courseForm.level}
              onChange={(e) => setCourseForm({ ...courseForm, level: parseInt(e.target.value, 10) })}
              style={{ padding: "0.5rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
            >
              <option value={100}>100 Level</option>
              <option value={200}>200 Level</option>
              <option value={300}>300 Level</option>
              <option value={400}>400 Level</option>
              <option value={500}>500 Level</option>
            </select>
            <select
              value={courseForm.semester}
              onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })}
              style={{ padding: "0.5rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
            >
              <option value="First">First Semester</option>
              <option value="Second">Second Semester</option>
            </select>
          </div>
          <select
            value={courseForm.department_id}
            onChange={(e) => setCourseForm({ ...courseForm, department_id: e.target.value })}
            style={{ padding: "0.5rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.faculty?.name})
              </option>
            ))}
          </select>
          <button type="submit" style={{ padding: "0.6rem", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600" }}>
            Add Course to Catalog
          </button>
        </form>

        <div style={{ overflowY: "auto", maxHeight: "350px", border: "1px solid #334155", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead style={{ background: "#0f172a", color: "#94a3b8" }}>
              <tr>
                <th style={{ padding: "0.5rem" }}>Code</th>
                <th style={{ padding: "0.5rem" }}>Title</th>
                <th style={{ padding: "0.5rem" }}>Units</th>
                <th style={{ padding: "0.5rem" }}>Sem</th>
                <th style={{ padding: "0.5rem" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #334155" }}>
                  <td style={{ padding: "0.5rem", fontWeight: "700", color: "#60a5fa" }}>{c.code}</td>
                  <td style={{ padding: "0.5rem" }}>{c.title}</td>
                  <td style={{ padding: "0.5rem" }}>{c.unit}</td>
                  <td style={{ padding: "0.5rem" }}>{c.semester}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <button
                      onClick={() => handleDeleteCourse(c.id)}
                      style={{ background: "#991b1b", color: "#fff", border: "none", borderRadius: "4px", padding: "0.2rem 0.5rem", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================
   SECTION C: Manage Lecturers
==================================================================== */
function ManageLecturersTab({ activeSession }: { activeSession: string }) {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [selectedLecturerId, setSelectedLecturerId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  useEffect(() => {
    loadLecturers();
    fetch("/api/mgmt/courses")
      .then((r) => r.json())
      .then((data) => setCourses(data.courses || []));
  }, []);

  async function loadLecturers() {
    const res = await fetch("/api/mgmt/lecturers");
    const data = await res.json();
    setLecturers(data.lecturers || []);
    if (data.lecturers?.length > 0 && !selectedLecturerId) {
      setSelectedLecturerId(data.lecturers[0].id);
    }
  }

  async function handleCreateLecturer(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email || !password) return;

    const res = await fetch("/api/mgmt/lecturers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to create lecturer");
      return;
    }

    setFullName("");
    setEmail("");
    setPassword("");
    loadLecturers();
  }

  async function handleAssignCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLecturerId || !selectedCourseId) return;

    await fetch("/api/mgmt/lecturers/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lecturer_id: selectedLecturerId,
        course_id: selectedCourseId,
        academic_session: activeSession,
      }),
    });

    loadLecturers();
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      {/* Create Lecturer Form */}
      <div style={{ background: "#1e293b", padding: "1.25rem", borderRadius: "12px", border: "1px solid #334155" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>👨‍🏫 Create Lecturer Account</h3>
        <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "1rem" }}>
          Lecturers cannot self-register. Only Management can create accounts here.
        </p>

        <form onSubmit={handleCreateLecturer} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <input
            type="text"
            placeholder="Full Name (e.g. Dr. Jane Smith)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ padding: "0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
          />
          <input
            type="email"
            placeholder="Lecturer Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: "0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
          />
          <input
            type="password"
            placeholder="Initial Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
          />
          <button type="submit" style={{ padding: "0.6rem", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600" }}>
            Create Lecturer
          </button>
        </form>

        <hr style={{ borderColor: "#334155", margin: "1.5rem 0" }} />

        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>📌 Assign Course to Lecturer</h3>
        <form onSubmit={handleAssignCourse} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <select
            value={selectedLecturerId}
            onChange={(e) => setSelectedLecturerId(e.target.value)}
            style={{ padding: "0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
          >
            {lecturers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.full_name} ({l.email})
              </option>
            ))}
          </select>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            style={{ padding: "0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
          >
            <option value="">-- Select Course to Assign --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>
          <button type="submit" style={{ padding: "0.6rem", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600" }}>
            Assign Course for Session ({activeSession})
          </button>
        </form>
      </div>

      {/* Lecturers List */}
      <div style={{ background: "#1e293b", padding: "1.25rem", borderRadius: "12px", border: "1px solid #334155" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>📋 Active Lecturers & Assigned Courses</h3>
        <div style={{ overflowY: "auto", maxHeight: "450px" }}>
          {lecturers.map((l) => (
            <div key={l.id} style={{ background: "#0f172a", padding: "1rem", borderRadius: "8px", marginBottom: "0.75rem", border: "1px solid #334155" }}>
              <div style={{ fontWeight: "700", color: "#60a5fa" }}>{l.full_name}</div>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{l.email}</div>
              <div style={{ marginTop: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: "600" }}>Assigned Courses:</span>
                {l.assignments && l.assignments.length > 0 ? (
                  <ul style={{ paddingLeft: "1rem", marginTop: "0.25rem", fontSize: "0.8rem", color: "#a7f3d0" }}>
                    {l.assignments.map((a) => (
                      <li key={a.id}>
                        {a.course?.code} ({a.session})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: "0.8rem", color: "#64748b" }}>No courses assigned yet</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ====================================================================
   SECTION D: Grading Policy
==================================================================== */
function GradingPolicyTab({ activeSession }: { activeSession: string }) {
  const [caWeight, setCaWeight] = useState(30);
  const [examWeight, setExamWeight] = useState(70);
  const [boundaries, setBoundaries] = useState<GradeBoundary[]>([
    { grade: "A", minScore: 70, maxScore: 100, gradePoint: 5.0 },
    { grade: "B", minScore: 60, maxScore: 69.99, gradePoint: 4.0 },
    { grade: "C", minScore: 50, maxScore: 59.99, gradePoint: 3.0 },
    { grade: "D", minScore: 45, maxScore: 49.99, gradePoint: 2.0 },
    { grade: "E", minScore: 40, maxScore: 44.99, gradePoint: 1.0 },
    { grade: "F", minScore: 0, maxScore: 39.99, gradePoint: 0.0 },
  ]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/mgmt/grading-policy?session=${activeSession}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.policy) {
          setCaWeight(data.policy.ca_weight_percent);
          setExamWeight(data.policy.exam_weight_percent);
          if (Array.isArray(data.policy.grade_boundaries)) {
            setBoundaries(data.policy.grade_boundaries);
          }
        }
      });
  }, [activeSession]);

  async function handleSavePolicy(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);

    const res = await fetch("/api/mgmt/grading-policy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        academic_session: activeSession,
        ca_weight_percent: caWeight,
        exam_weight_percent: examWeight,
        grade_boundaries: boundaries,
      }),
    });

    if (res.ok) setSaved(true);
    else alert("Failed to save grading policy");
  }

  return (
    <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "12px", border: "1px solid #334155", maxWidth: "700px" }}>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>⚖️ Grading Policy ({activeSession})</h2>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Configure the score weights and letter grade boundaries for session {activeSession}.
      </p>

      {saved && (
        <div style={{ padding: "0.75rem", background: "#064e3b", color: "#a7f3d0", borderRadius: "6px", marginBottom: "1rem" }}>
          ✓ Grading policy saved successfully!
        </div>
      )}

      <form onSubmit={handleSavePolicy} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>CA Weight (%)</label>
            <input
              type="number"
              value={caWeight}
              onChange={(e) => {
                const val = parseInt(e.target.value || "0", 10);
                setCaWeight(val);
                setExamWeight(100 - val);
              }}
              style={{ width: "100%", padding: "0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Exam Weight (%)</label>
            <input
              type="number"
              value={examWeight}
              onChange={(e) => {
                const val = parseInt(e.target.value || "0", 10);
                setExamWeight(val);
                setCaWeight(100 - val);
              }}
              style={{ width: "100%", padding: "0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
            />
          </div>
        </div>

        <h3 style={{ fontSize: "1rem", color: "#cbd5e1", marginTop: "0.5rem" }}>Grade Boundaries & Grade Points</h3>
        <div style={{ border: "1px solid #334155", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead style={{ background: "#0f172a", color: "#94a3b8" }}>
              <tr>
                <th style={{ padding: "0.5rem" }}>Grade</th>
                <th style={{ padding: "0.5rem" }}>Min Score</th>
                <th style={{ padding: "0.5rem" }}>Max Score</th>
                <th style={{ padding: "0.5rem" }}>Grade Point</th>
              </tr>
            </thead>
            <tbody>
              {boundaries.map((b, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #334155" }}>
                  <td style={{ padding: "0.5rem", fontWeight: "700", textAlign: "center" }}>{b.grade}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <input
                      type="number"
                      value={b.minScore}
                      onChange={(e) => {
                        const copy = [...boundaries];
                        copy[idx].minScore = parseFloat(e.target.value);
                        setBoundaries(copy);
                      }}
                      style={{ width: "100%", padding: "0.3rem", background: "#0f172a", border: "1px solid #334155", color: "#fff" }}
                    />
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <input
                      type="number"
                      value={b.maxScore}
                      onChange={(e) => {
                        const copy = [...boundaries];
                        copy[idx].maxScore = parseFloat(e.target.value);
                        setBoundaries(copy);
                      }}
                      style={{ width: "100%", padding: "0.3rem", background: "#0f172a", border: "1px solid #334155", color: "#fff" }}
                    />
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <input
                      type="number"
                      step="0.1"
                      value={b.gradePoint}
                      onChange={(e) => {
                        const copy = [...boundaries];
                        copy[idx].gradePoint = parseFloat(e.target.value);
                        setBoundaries(copy);
                      }}
                      style={{ width: "100%", padding: "0.3rem", background: "#0f172a", border: "1px solid #334155", color: "#fff" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="submit" style={{ padding: "0.75rem", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
          Save Grading Policy
        </button>
      </form>
    </div>
  );
}

/* ====================================================================
   SECTION E: Approvals & Rejections
==================================================================== */
function ApprovalsTab({ activeSession }: { activeSession: string }) {
  interface ApprovalGroup {
    course: { id: string; code: string; title: string };
    session: string;
    semester: string;
    totalStudents: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    rejectionHistory: Array<{ rejectedAt: string; rejectedBy: string; note: string }>;
  }

  const [approvals, setApprovals] = useState<ApprovalGroup[]>([]);
  const [rejectingCourseId, setRejectingCourseId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    loadApprovals();
  }, [activeSession]);

  async function loadApprovals() {
    const res = await fetch(`/api/mgmt/approvals?session=${activeSession}`);
    const data = await res.json();
    setApprovals(data.approvals || []);
  }

  async function handleApprove(courseId: string, semester: string) {
    const res = await fetch(`/api/mgmt/approvals/${courseId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ academic_session: activeSession, semester }),
    });

    if (res.ok) loadApprovals();
    else alert("Approval failed");
  }

  async function handleRejectConfirm(courseId: string, semester: string) {
    if (!rejectNote.trim()) {
      alert("Please provide a rejection note");
      return;
    }

    const res = await fetch(`/api/mgmt/approvals/${courseId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ academic_session: activeSession, semester, note: rejectNote }),
    });

    if (res.ok) {
      setRejectingCourseId(null);
      setRejectNote("");
      loadApprovals();
    } else {
      alert("Rejection failed");
    }
  }

  return (
    <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "12px", border: "1px solid #334155" }}>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>✅ Score Submissions & Approvals</h2>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Review lecturer score submissions. Approve to publish grades or Reject to send back with feedback notes.
      </p>

      {approvals.length === 0 ? (
        <p style={{ color: "#64748b" }}>No score submissions pending for session {activeSession}.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {approvals.map((app, idx) => (
            <div key={idx} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", color: "#60a5fa" }}>
                    {app.course.code} - {app.course.title}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    Session: {app.session} | Semester: {app.semester} | Total Students: {app.totalStudents}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {app.approvedCount > 0 && <span style={{ padding: "0.3rem 0.6rem", background: "#065f46", color: "#34d399", borderRadius: "4px", fontSize: "0.8rem" }}>Approved ({app.approvedCount})</span>}
                  {app.pendingCount > 0 && <span style={{ padding: "0.3rem 0.6rem", background: "#854d0e", color: "#fef08a", borderRadius: "4px", fontSize: "0.8rem" }}>Pending ({app.pendingCount})</span>}
                  {app.rejectedCount > 0 && <span style={{ padding: "0.3rem 0.6rem", background: "#881337", color: "#fecdd3", borderRadius: "4px", fontSize: "0.8rem" }}>Rejected ({app.rejectedCount})</span>}

                  <button
                    onClick={() => handleApprove(app.course.id, app.semester)}
                    style={{ padding: "0.5rem 1rem", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => setRejectingCourseId(app.course.id)}
                    style={{ padding: "0.5rem 1rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Rejection Modal/Form */}
              {rejectingCourseId === app.course.id && (
                <div style={{ marginTop: "1rem", padding: "1rem", background: "#1e293b", borderRadius: "6px", border: "1px solid #dc2626" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#fca5a5", marginBottom: "0.5rem" }}>
                    Reason for Rejection (Visible to Lecturer):
                  </label>
                  <input
                    type="text"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="e.g. Please recheck CA scores for CSC101 students"
                    style={{ width: "100%", padding: "0.5rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "4px", color: "#fff", marginBottom: "0.5rem" }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleRejectConfirm(app.course.id, app.semester)}
                      style={{ padding: "0.4rem 0.8rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px" }}
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => setRejectingCourseId(null)}
                      style={{ padding: "0.4rem 0.8rem", background: "#475569", color: "#fff", border: "none", borderRadius: "4px" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Rejection Note History */}
              {app.rejectionHistory && app.rejectionHistory.length > 0 && (
                <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#fca5a5", background: "#450a0a", padding: "0.5rem", borderRadius: "4px" }}>
                  <strong>Previous Rejection Notes History:</strong>
                  {app.rejectionHistory.map((h, i) => (
                    <div key={i} style={{ marginTop: "0.25rem" }}>
                      • <em>{new Date(h.rejectedAt).toLocaleDateString()}</em> by {h.rejectedBy}: &quot;{h.note}&quot;
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ====================================================================
   SECTION F: Student Access Control
==================================================================== */
function StudentAccessControlTab() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    const res = await fetch("/api/mgmt/student-access");
    const data = await res.json();
    setStudents(data.students || []);
  }

  async function handleToggleLock(studentId: string, currentLock: boolean) {
    const reason = !currentLock ? prompt("Reason for locking results access (e.g. owing school fees):") || "Admin restriction" : "";

    const res = await fetch("/api/mgmt/student-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, is_locked: !currentLock, lock_reason: reason }),
    });

    if (res.ok) loadStudents();
  }

  const filtered = students.filter(
    (s) =>
      s.matric_number.toLowerCase().includes(search.toLowerCase()) ||
      s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "12px", border: "1px solid #334155" }}>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>🔒 Student Access Control</h2>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1rem" }}>
        Lock or unlock result viewing permissions for individual students (e.g. for fee clearance).
      </p>

      <input
        type="text"
        placeholder="Search student by matric number or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", padding: "0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff", marginBottom: "1rem" }}
      />

      <div style={{ overflowX: "auto", border: "1px solid #334155", borderRadius: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
          <thead style={{ background: "#0f172a", color: "#94a3b8" }}>
            <tr>
              <th style={{ padding: "0.6rem 1rem" }}>Matric Number</th>
              <th style={{ padding: "0.6rem 1rem" }}>Full Name</th>
              <th style={{ padding: "0.6rem 1rem" }}>Department</th>
              <th style={{ padding: "0.6rem 1rem" }}>Level</th>
              <th style={{ padding: "0.6rem 1rem" }}>Access Status</th>
              <th style={{ padding: "0.6rem 1rem" }}>Reason / Note</th>
              <th style={{ padding: "0.6rem 1rem" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #334155" }}>
                <td style={{ padding: "0.6rem 1rem", fontWeight: "700", color: "#60a5fa" }}>{s.matric_number}</td>
                <td style={{ padding: "0.6rem 1rem" }}>{s.full_name}</td>
                <td style={{ padding: "0.6rem 1rem" }}>{s.department?.name}</td>
                <td style={{ padding: "0.6rem 1rem" }}>{s.level}</td>
                <td style={{ padding: "0.6rem 1rem" }}>
                  {s.is_locked ? (
                    <span style={{ color: "#fca5a5", background: "#881337", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: "600" }}>🔒 Locked</span>
                  ) : (
                    <span style={{ color: "#6ee7b7", background: "#065f46", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: "600" }}>🔓 Unlocked</span>
                  )}
                </td>
                <td style={{ padding: "0.6rem 1rem", color: "#94a3b8", fontSize: "0.8rem" }}>{s.lock_reason || "-"}</td>
                <td style={{ padding: "0.6rem 1rem" }}>
                  <button
                    onClick={() => handleToggleLock(s.id, s.is_locked)}
                    style={{
                      padding: "0.3rem 0.75rem",
                      background: s.is_locked ? "#059669" : "#dc2626",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    {s.is_locked ? "Unlock Results" : "Lock Access"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ====================================================================
   SECTION G: View Registrations (Reporting)
==================================================================== */
function ViewRegistrationsTab({ activeSession }: { activeSession: string }) {
  interface RegistrationRecord {
    id: string;
    session: string;
    semester: string;
    status: string;
    created_at: string;
    student?: { matric_number: string; full_name: string; level: number };
    course?: { code: string; title: string };
  }

  const [regs, setRegs] = useState<RegistrationRecord[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  useEffect(() => {
    fetch("/api/mgmt/faculties").then((r) => r.json()).then((d) => setFaculties(d.faculties || []));
    fetch("/api/mgmt/departments").then((r) => r.json()).then((d) => setDepartments(d.departments || []));
    loadRegistrations();
  }, [activeSession, selectedFaculty, selectedDept, selectedLevel]);

  async function loadRegistrations() {
    const query = new URLSearchParams();
    query.set("session", activeSession);
    if (selectedFaculty) query.set("faculty_id", selectedFaculty);
    if (selectedDept) query.set("department_id", selectedDept);
    if (selectedLevel) query.set("level", selectedLevel);

    const res = await fetch(`/api/mgmt/registrations?${query.toString()}`);
    const data = await res.json();
    setRegs(data.registrations || []);
  }

  return (
    <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "12px", border: "1px solid #334155" }}>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>📊 Course Registrations Report</h2>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1rem" }}>
        Read-only reporting filter across student registrations.
      </p>

      {/* Filter Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
        <select
          value={selectedFaculty}
          onChange={(e) => setSelectedFaculty(e.target.value)}
          style={{ padding: "0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
        >
          <option value="">-- All Faculties --</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          style={{ padding: "0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
        >
          <option value="">-- All Departments --</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          style={{ padding: "0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
        >
          <option value="">-- All Levels --</option>
          <option value="100">100 Level</option>
          <option value="200">200 Level</option>
          <option value="300">300 Level</option>
          <option value="400">400 Level</option>
          <option value="500">500 Level</option>
        </select>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #334155", borderRadius: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
          <thead style={{ background: "#0f172a", color: "#94a3b8" }}>
            <tr>
              <th style={{ padding: "0.6rem 1rem" }}>Matric Number</th>
              <th style={{ padding: "0.6rem 1rem" }}>Student Name</th>
              <th style={{ padding: "0.6rem 1rem" }}>Course Code</th>
              <th style={{ padding: "0.6rem 1rem" }}>Course Title</th>
              <th style={{ padding: "0.6rem 1rem" }}>Session</th>
              <th style={{ padding: "0.6rem 1rem" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {regs.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #334155" }}>
                <td style={{ padding: "0.6rem 1rem", fontWeight: "700", color: "#60a5fa" }}>{r.student?.matric_number}</td>
                <td style={{ padding: "0.6rem 1rem" }}>{r.student?.full_name}</td>
                <td style={{ padding: "0.6rem 1rem", fontWeight: "600" }}>{r.course?.code}</td>
                <td style={{ padding: "0.6rem 1rem" }}>{r.course?.title}</td>
                <td style={{ padding: "0.6rem 1rem" }}>{r.session}</td>
                <td style={{ padding: "0.6rem 1rem" }}>
                  <span style={{ textTransform: "capitalize", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "#334155", color: "#cbd5e1" }}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ====================================================================
   SECTION H: Academic Settings
==================================================================== */
function AcademicSettingsTab({
  settings,
  onUpdated,
}: {
  settings: AcademicSettings;
  onUpdated: (s: AcademicSettings) => void;
}) {
  const [sessionVal, setSessionVal] = useState(settings.active_session);
  const [semesterVal, setSemesterVal] = useState(settings.active_semester);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");

    try {
      const res = await fetch("/api/mgmt/academic-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_session: sessionVal, active_semester: semesterVal }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");

      onUpdated(data.settings);
      setMsg("✓ Active session and semester updated globally!");
    } catch (err: unknown) {
      setMsg(`⚠️ ${err instanceof Error ? err.message : "Error saving"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "12px", border: "1px solid #334155", maxWidth: "500px" }}>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>⚙️ Global Academic Settings</h2>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Set the active academic session and semester pre-filled across student registration and lecturer scoring portals.
      </p>

      {msg && <div style={{ padding: "0.75rem", background: "#0f172a", border: "1px solid #3b82f6", borderRadius: "6px", marginBottom: "1rem", color: "#60a5fa" }}>{msg}</div>}

      <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.4rem" }}>Active Academic Session</label>
          <input
            type="text"
            required
            value={sessionVal}
            onChange={(e) => setSessionVal(e.target.value)}
            placeholder="e.g. 2025/2026"
            style={{ width: "100%", padding: "0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.4rem" }}>Active Semester</label>
          <select
            value={semesterVal}
            onChange={(e) => setSemesterVal(e.target.value)}
            style={{ width: "100%", padding: "0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
          >
            <option value="First">First Semester</option>
            <option value="Second">Second Semester</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{ padding: "0.75rem", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Saving..." : "Save Active Session & Semester"}
        </button>
      </form>
    </div>
  );
}

/* ====================================================================
   SECTION 9: Audit Logs Tab
==================================================================== */
function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/mgmt/audit-logs")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.actor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "12px", border: "1px solid #334155" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>📜 System Audit Trail</h2>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            Immutable record of management approvals, rejections, score entries, and access locks.
          </p>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter audit logs..."
          style={{
            padding: "0.5rem 0.85rem",
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: "6px",
            color: "#fff",
            fontSize: "0.85rem",
            width: "240px",
          }}
        />
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading audit trail...</p>
      ) : filteredLogs.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No audit log entries found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
            <thead style={{ background: "#0f172a", color: "#94a3b8" }}>
              <tr>
                <th style={{ padding: "0.6rem 1rem" }}>Timestamp</th>
                <th style={{ padding: "0.6rem 1rem" }}>Actor</th>
                <th style={{ padding: "0.6rem 1rem" }}>Role</th>
                <th style={{ padding: "0.6rem 1rem" }}>Action</th>
                <th style={{ padding: "0.6rem 1rem" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #334155" }}>
                  <td style={{ padding: "0.6rem 1rem", whiteSpace: "nowrap", color: "#cbd5e1" }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "0.6rem 1rem", fontWeight: "600", color: "#60a5fa" }}>{log.actor_email}</td>
                  <td style={{ padding: "0.6rem 1rem", textTransform: "capitalize" }}>{log.actor_role}</td>
                  <td style={{ padding: "0.6rem 1rem" }}>
                    <span
                      style={{
                        padding: "0.15rem 0.45rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        background:
                          log.action.includes("approved")
                            ? "#065f46"
                            : log.action.includes("rejected")
                            ? "#881337"
                            : log.action.includes("locked")
                            ? "#854d0e"
                            : "#334155",
                        color:
                          log.action.includes("approved")
                            ? "#34d399"
                            : log.action.includes("rejected")
                            ? "#fecdd3"
                            : log.action.includes("locked")
                            ? "#fef08a"
                            : "#cbd5e1",
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "0.6rem 1rem" }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
