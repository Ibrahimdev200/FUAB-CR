"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentLoginPage() {
  const router = useRouter();

  // Multi-step form state
  const [step, setStep] = useState<"matric_check" | "register" | "login">("matric_check");
  const [matricNumber, setMatricNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [studentDetails, setStudentDetails] = useState<{
    full_name: string;
    level: number;
    department?: { name: string };
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckMatric(e: React.FormEvent) {
    e.preventDefault();
    if (!matricNumber.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/student/auth/check-matric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matric_number: matricNumber }),
      });

      const data = await res.json();

      if (!data.exists) {
        setError(data.error || "Matriculation number not found.");
        return;
      }

      setStudentDetails(data.preloadedData);

      if (data.isRegistered) {
        setStep("login");
      } else {
        setStep("register");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error verifying matric number");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/student/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matric_number: matricNumber,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      router.push("/student/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/student/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matric_number: matricNumber,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      router.push("/student/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
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
          padding: "2.5rem 1.75rem",
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
            🎓
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#f8fafc" }}>
            Student Portal
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Course Registration & Results Management
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#450a0a",
              border: "1px solid #991b1b",
              color: "#fca5a5",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
              lineHeight: "1.4",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* STEP 1: MATRIC CHECK FORM */}
        {step === "matric_check" && (
          <form onSubmit={handleCheckMatric} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
                Enter Your Matriculation Number
              </label>
              <input
                type="text"
                required
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                placeholder="e.g. FUAB/2024/001"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  color: "#f8fafc",
                  fontSize: "1rem",
                  outline: "none",
                  textTransform: "uppercase",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
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
              {loading ? "Verifying Record..." : "Continue"}
            </button>
          </form>
        )}

        {/* STEP 2A: FIRST-TIME ACCOUNT CREATION */}
        {step === "register" && (
          <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ background: "#0f172a", padding: "1rem", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Verification Successful:</p>
              <h3 style={{ fontSize: "1.05rem", color: "#f8fafc", fontWeight: "700" }}>{studentDetails?.full_name}</h3>
              <p style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                {matricNumber} | {studentDetails?.department?.name || "Department"} ({studentDetails?.level} Level)
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
                Create Your Account Password (min 8 chars)
              </label>
              <input
                type="password"
                required
                minLength={8}
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

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
                Confirm Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                width: "100%",
                padding: "0.85rem",
                borderRadius: "8px",
                background: "#059669",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "1rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating Account..." : "Create Account & Sign In"}
            </button>

            <button
              type="button"
              onClick={() => setStep("matric_check")}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.85rem" }}
            >
              ← Back to Matric Check
            </button>
          </form>
        )}

        {/* STEP 2B: EXISTING STUDENT LOGIN */}
        {step === "login" && (
          <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ background: "#0f172a", padding: "0.85rem 1rem", borderRadius: "8px" }}>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Welcome back,</p>
              <h3 style={{ fontSize: "1rem", color: "#f8fafc", fontWeight: "700" }}>{studentDetails?.full_name}</h3>
              <p style={{ fontSize: "0.8rem", color: "#60a5fa", fontWeight: "600" }}>{matricNumber}</p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
                Enter Your Password
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
                width: "100%",
                padding: "0.85rem",
                borderRadius: "8px",
                background: "#3b82f6",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "1rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing In..." : "Sign In to Portal"}
            </button>

            <button
              type="button"
              onClick={() => setStep("matric_check")}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.85rem" }}
            >
              ← Use a different Matric Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
