"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: "800px", width: "100%", textAlign: "center" }}>
        {/* Header Branding */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              background: "rgba(59, 130, 246, 0.15)",
              color: "#3b82f6",
              fontSize: "2.5rem",
              marginBottom: "1rem",
              boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.2)",
            }}
          >
            🏫
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "800", color: "#f8fafc", letterSpacing: "-0.025em" }}>
            FUAB Academic Portal
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "1.1rem", marginTop: "0.5rem" }}>
            Course Registration, Lecturer Scoring & Results Governance System
          </p>

          {/* Database Connection Badge */}
          <div style={{ marginTop: "1rem" }}>
            {loading ? (
              <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Checking system status...</span>
            ) : status?.status === "connected" || status?.isConfigured ? (
              <span
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
                ● Live Supabase Database Connected
              </span>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.35rem 0.85rem",
                  borderRadius: "20px",
                  background: "#854d0e",
                  border: "1px solid #a16207",
                  color: "#fef08a",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                }}
              >
                ⚠️ Check Supabase Environment Credentials
              </span>
            )}
          </div>
        </div>

        {/* Portal Access Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.25rem",
            marginBottom: "3rem",
          }}
        >
          {/* Card 1: Student Portal */}
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "14px",
              padding: "1.75rem 1.25rem",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
              transition: "transform 0.2s ease, border-color 0.2s ease",
            }}
          >
            <div>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🎓</div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#f8fafc" }}>Student Portal</h2>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.4rem", lineHeight: "1.5" }}>
                Course registration, registration status tracking, and official GPA/CGPA results checker.
              </p>
            </div>
            <Link
              href="/student/login"
              style={{
                marginTop: "1.5rem",
                display: "block",
                textAlign: "center",
                padding: "0.75rem",
                borderRadius: "8px",
                background: "#3b82f6",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.95rem",
                textDecoration: "none",
              }}
            >
              Sign In as Student →
            </Link>
          </div>

          {/* Card 2: Lecturer Portal */}
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "14px",
              padding: "1.75rem 1.25rem",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>👨‍🏫</div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#f8fafc" }}>Lecturer Portal</h2>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.4rem", lineHeight: "1.5" }}>
                Assigned courses view, fast score entry with auto-advance, and management rejection review.
              </p>
            </div>
            <Link
              href="/lecturer/login"
              style={{
                marginTop: "1.5rem",
                display: "block",
                textAlign: "center",
                padding: "0.75rem",
                borderRadius: "8px",
                background: "#059669",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.95rem",
                textDecoration: "none",
              }}
            >
              Sign In as Lecturer →
            </Link>
          </div>

          {/* Card 3: Management Portal */}
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "14px",
              padding: "1.75rem 1.25rem",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🏫</div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#f8fafc" }}>Management Portal</h2>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.4rem", lineHeight: "1.5" }}>
                Student CSV upload, academic structure CRUD, score approvals, access lock, and audit logs.
              </p>
            </div>
            <Link
              href="/mgmt-portal-x9k2/login"
              style={{
                marginTop: "1.5rem",
                display: "block",
                textAlign: "center",
                padding: "0.75rem",
                borderRadius: "8px",
                background: "#475569",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.95rem",
                textDecoration: "none",
              }}
            >
              Management Access →
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
          Federal University Academic Portal System © {new Date().getFullYear()} • Powered by Next.js & Supabase
        </p>
      </div>
    </div>
  );
}
