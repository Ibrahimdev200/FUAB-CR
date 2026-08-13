"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ManagementIcon } from "@/components/Icons";

export default function ManagementLoginPage() {
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
      const res = await fetch("/api/mgmt/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/mgmt-portal-x9k2/dashboard");
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
        background: "radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #090d16 80%)",
        color: "#f8fafc",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#131b2e",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "2.5rem 2rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
        }}
        className="animate-fade-in"
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              color: "#818cf8",
              marginBottom: "1rem",
            }}
          >
            <ManagementIcon size={28} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#ffffff", fontFamily: "var(--font-outfit)" }}>
            Management Portal
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Academic Administration & Governance System
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(153, 27, 27, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              marginBottom: "1.5rem",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
              Administrator Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@fuab.edu.ng"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                background: "#0b1220",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                fontSize: "0.95rem",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
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
                background: "#0b1220",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                fontSize: "0.95rem",
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
              background: "#4f46e5",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "0.95rem",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Authenticating..." : "Sign In to Management"}
          </button>
        </form>

        <p style={{ marginTop: "1.75rem", textAlign: "center", fontSize: "0.75rem", color: "#64748b" }}>
          Restricted Portal • Authorized Management Personnel Only
        </p>
      </div>
    </div>
  );
}
