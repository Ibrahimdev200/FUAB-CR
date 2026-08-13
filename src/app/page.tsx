"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UniversityShieldIcon, StudentIcon, LecturerIcon, ManagementIcon } from "@/components/Icons";

interface SupabaseStatusResponse {
  status: string;
  message: string;
  supabaseUrl: string;
  isConfigured: boolean;
  error?: string;
  facultiesCount?: number;
}

export default function HomePage() {
  const [status, setStatus] = useState<SupabaseStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/supabase-status")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        setStatus({
          status: "error",
          message: "Failed to connect to backend service.",
          supabaseUrl: "Unknown",
          isConfigured: false,
          error: String(err),
        });
        setLoading(false);
      });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #090d16 75%)",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "860px", width: "100%", textAlign: "center" }}>
        {/* Institutional Branding Hero */}
        <div style={{ marginBottom: "3rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "76px",
              height: "76px",
              borderRadius: "22px",
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              color: "#818cf8",
              marginBottom: "1.25rem",
              boxShadow: "0 12px 30px -10px rgba(99, 102, 241, 0.3)",
            }}
          >
            <UniversityShieldIcon size={38} />
          </div>

          <h1
            style={{
              fontFamily: "var(--font-outfit)",
              fontSize: "2.75rem",
              fontWeight: "800",
              letterSpacing: "-0.03em",
              color: "#ffffff",
              marginBottom: "0.5rem",
            }}
          >
            Federal University Academic Portal
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
            Official University Platform for Student Registration, Lecturer Scoring, & Results Management
          </p>

          {/* Database Connection Status Pill */}
          <div style={{ marginTop: "1.25rem" }}>
            {loading ? (
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Verifying system connection...</span>
            ) : status?.status === "connected" || status?.isConfigured ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.35rem 0.9rem",
                  borderRadius: "20px",
                  background: "rgba(6, 95, 70, 0.3)",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  color: "#34d399",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399" }} />
                Supabase PostgreSQL Live Connected
              </span>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.35rem 0.9rem",
                  borderRadius: "20px",
                  background: "rgba(133, 77, 14, 0.3)",
                  border: "1px solid rgba(254, 240, 138, 0.3)",
                  color: "#fef08a",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                }}
              >
                ⚠️ Check Supabase Credentials
              </span>
            )}
          </div>
        </div>

        {/* Portal Selection Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
            marginBottom: "3.5rem",
          }}
        >
          {/* Card 1: Student Portal */}
          <div
            style={{
              background: "#131b2e",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "2rem 1.5rem",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.5)",
              transition: "transform 0.2s ease, border-color 0.2s ease",
            }}
          >
            <div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(37, 99, 235, 0.15)",
                  color: "#60a5fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <StudentIcon size={24} />
              </div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#ffffff", marginBottom: "0.4rem" }}>
                Student Portal
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: "1.5" }}>
                Matriculation verification, course registration, and official GPA/CGPA results checker.
              </p>
            </div>
            <Link
              href="/student/login"
              style={{
                marginTop: "1.75rem",
                display: "block",
                textAlign: "center",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.9rem",
                textDecoration: "none",
                transition: "background 0.2s ease",
              }}
            >
              Sign In as Student →
            </Link>
          </div>

          {/* Card 2: Lecturer Portal */}
          <div
            style={{
              background: "#131b2e",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "2rem 1.5rem",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(5, 150, 105, 0.15)",
                  color: "#34d399",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <LecturerIcon size={24} />
              </div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#ffffff", marginBottom: "0.4rem" }}>
                Lecturer Portal
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: "1.5" }}>
                Assigned courses roster, fast score entry with keyboard auto-advance, and rejection notes review.
              </p>
            </div>
            <Link
              href="/lecturer/login"
              style={{
                marginTop: "1.75rem",
                display: "block",
                textAlign: "center",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                background: "#059669",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              Sign In as Lecturer →
            </Link>
          </div>

          {/* Card 3: Management Portal */}
          <div
            style={{
              background: "#131b2e",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "2rem 1.5rem",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(99, 102, 241, 0.15)",
                  color: "#818cf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <ManagementIcon size={24} />
              </div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#ffffff", marginBottom: "0.4rem" }}>
                Management Portal
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: "1.5" }}>
                Student CSV upload, academic structure CRUD, score approvals queue, result access lock, and audit logs.
              </p>
            </div>
            <Link
              href="/mgmt-portal-x9k2/login"
              style={{
                marginTop: "1.75rem",
                display: "block",
                textAlign: "center",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                background: "#4f46e5",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              Management Access →
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "1.5rem" }}>
          <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
            Federal University Academic Portal • Enterprise Management System © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
