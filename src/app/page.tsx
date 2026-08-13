"use client";

import { useEffect, useState } from "react";

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
    <div style={{ padding: "3rem 1.5rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.2rem", color: "#3b82f6", marginBottom: "0.5rem" }}>
        FUAB-CR Portal
      </h1>
      <p style={{ color: "#94a3b8", fontSize: "1.1rem", marginBottom: "2rem" }}>
        School Course Registration & Results Management System
      </p>

      <div
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "12px",
          padding: "2rem",
          textAlign: "left",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4)",
        }}
      >
        <h2 style={{ fontSize: "1.3rem", color: "#f8fafc", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          ⚡ Supabase Database Connection Status
        </h2>

        {loading ? (
          <p style={{ color: "#94a3b8" }}>Checking Supabase database connection...</p>
        ) : (
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "0.4rem 1rem",
                borderRadius: "20px",
                fontSize: "0.9rem",
                fontWeight: "600",
                marginBottom: "1rem",
                background: status?.status === "connected" ? "#065f46" : "#854d0e",
                color: status?.status === "connected" ? "#34d399" : "#fef08a",
              }}
            >
              {status?.status === "connected"
                ? "✓ Connected to Supabase"
                : status?.status === "table_not_found_or_error"
                ? "⚙️ Project Connected (Schema Pending)"
                : "⚠️ Credentials Required"}
            </div>

            <p style={{ color: "#cbd5e1", marginBottom: "0.5rem" }}>
              <strong>Project URL:</strong> <code>{status?.supabaseUrl}</code>
            </p>

            <p style={{ color: "#cbd5e1", marginBottom: "1rem" }}>
              <strong>Status:</strong> {status?.message}
            </p>

            {status?.status !== "connected" && (
              <div
                style={{
                  background: "#0f172a",
                  padding: "1.25rem",
                  borderRadius: "8px",
                  borderLeft: "4px solid #3b82f6",
                  fontSize: "0.9rem",
                  color: "#94a3b8",
                  marginTop: "1rem",
                }}
              >
                <p style={{ fontWeight: "600", color: "#3b82f6", marginBottom: "0.5rem" }}>Quick Setup Checklist:</p>
                <ol style={{ paddingLeft: "1.2rem", lineHeight: "1.6" }}>
                  <li>Create a project at <a href="https://app.supabase.com" target="_blank" rel="noreferrer" style={{ color: "#60a5fa", textDecoration: "underline" }}>app.supabase.com</a>.</li>
                  <li>Copy your <strong>Project URL</strong> and <strong>anon API key</strong> into your <code>.env</code> file.</li>
                  <li>Run the SQL script in <code>supabase/schema.sql</code> in your Supabase SQL Editor to create all 11 tables.</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
