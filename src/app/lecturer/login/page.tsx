// ====================================================================================
// CONSTRAINT REMINDER: Lecturers cannot self-register anywhere on the portal.
// Lecturer accounts are created exclusively by Management in the Management Portal (/mgmt-portal-x9k2).
// ====================================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LecturerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/lecturer/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/lecturer/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#f8fafc",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "2.5rem 2rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(59, 130, 246, 0.15)",
              color: "#3b82f6",
              fontSize: "1.75rem",
              marginBottom: "1rem",
            }}
          >
            👨‍🏫
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#f8fafc" }}>
            Lecturer Portal
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Score Entry & Grade Submission
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#450a0a",
              border: "1px solid #991b1b",
              color: "#fca5a5",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
              Lecturer Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane.smith@fuab.edu.ng"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                background: "#0f172a",
                border: "1px solid #334155",
                color: "#f8fafc",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                background: "#0f172a",
                border: "1px solid #334155",
                color: "#f8fafc",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.5rem",
              width: "100%",
              padding: "0.85rem",
              borderRadius: "8px",
              background: "#3b82f6",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "1rem",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.75rem", color: "#64748b" }}>
          Notice: Accounts are created strictly by School Management. Contact management if you do not have an account.
        </p>
      </div>
    </div>
  );
}
