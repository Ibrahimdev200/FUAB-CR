"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StudentIcon, UniversityShieldIcon } from "@/components/Icons";

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
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(37, 99, 235, 0.12)",
              border: "1px solid rgba(37, 99, 235, 0.25)",
              color: "#60a5fa",
              marginBottom: "1rem",
            }}
          >
            <StudentIcon size={28} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#ffffff" }}>
            Student Portal
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Course Registration & Official Results System
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
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
                Matriculation Number
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
                  background: "#0b1220",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  fontSize: "0.95rem",
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
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.95rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Verifying Matric Record..." : "Continue"}
            </button>
          </form>
        )}

        {/* STEP 2A: FIRST-TIME ACCOUNT CREATION */}
        {step === "register" && (
          <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ background: "#0b1220", padding: "1rem", borderRadius: "10px", borderLeft: "4px solid #2563eb" }}>
              <p style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>Verified Record</p>
              <h3 style={{ fontSize: "1.05rem", color: "#ffffff", fontWeight: "700", marginTop: "0.2rem" }}>{studentDetails?.full_name}</h3>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                {matricNumber} • {studentDetails?.department?.name} ({studentDetails?.level} Level)
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
                Create Password (min 8 characters)
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
                  background: "#0b1220",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
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
                width: "100%",
                padding: "0.85rem",
                borderRadius: "8px",
                background: "#059669",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.95rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating Account..." : "Create Account & Sign In"}
            </button>

            <button
              type="button"
              onClick={() => setStep("matric_check")}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.85rem" }}
            >
              ← Back to Matric Verification
            </button>
          </form>
        )}

        {/* STEP 2B: EXISTING STUDENT LOGIN */}
        {step === "login" && (
          <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ background: "#0b1220", padding: "0.85rem 1rem", borderRadius: "8px" }}>
              <p style={{ fontSize: "0.75rem", color: "#64748b" }}>Welcome back,</p>
              <h3 style={{ fontSize: "1rem", color: "#ffffff", fontWeight: "700" }}>{studentDetails?.full_name}</h3>
              <p style={{ fontSize: "0.8rem", color: "#60a5fa", fontWeight: "600" }}>{matricNumber}</p>
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
                width: "100%",
                padding: "0.85rem",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.95rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing In..." : "Sign In to Portal"}
            </button>

            <button
              type="button"
              onClick={() => setStep("matric_check")}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.85rem" }}
            >
              ← Use a different Matric Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
