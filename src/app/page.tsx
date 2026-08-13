"use client";

import { useEffect, useState } from "react";

interface StatusResponse {
  status: string;
  message: string;
  projectId: string;
  isKeyConfigured: boolean;
  error?: string;
}

export default function HomePage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/firebase-status")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        setStatus({
          status: "error",
          message: "Failed to connect to backend",
          projectId: "Unknown",
          isKeyConfigured: false,
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
          🔥 Firebase Connection Status
        </h2>

        {loading ? (
          <p style={{ color: "#94a3b8" }}>Checking Firebase status...</p>
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
              {status?.status === "connected" ? "✓ Connected & Active" : "⚠️ Configuration Required"}
            </div>

            <p style={{ color: "#cbd5e1", marginBottom: "0.5rem" }}>
              <strong>Project ID:</strong> <code>{status?.projectId}</code>
            </p>

            <p style={{ color: "#cbd5e1", marginBottom: "1rem" }}>
              <strong>Status:</strong> {status?.message}
            </p>

            {status?.status !== "connected" && (
              <div
                style={{
                  background: "#0f172a",
                  padding: "1rem",
                  borderRadius: "8px",
                  borderLeft: "4px solid #f59e0b",
                  fontSize: "0.9rem",
                  color: "#94a3b8",
                }}
              >
                <p style={{ fontWeight: "600", color: "#f59e0b", marginBottom: "0.25rem" }}>Next Step:</p>
                Follow the 4 steps provided below to paste your Firebase credentials into your <code>.env</code> file. The app will update automatically upon saving!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
