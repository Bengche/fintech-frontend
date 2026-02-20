"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/admin/login`,
        { email, password },
        { withCredentials: true },
      );
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a1628",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "22rem" }}>
        {/* Brand mark */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "3.25rem",
              height: "3.25rem",
              backgroundColor: "var(--color-accent)",
              borderRadius: "0.875rem",
              marginBottom: "1rem",
            }}
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="#0F1F3D"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#ffffff",
              margin: "0 0 0.25rem",
            }}
          >
            Admin Portal
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8", margin: 0 }}>
            Sign in to access the dashboard
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: "#111f38",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "var(--radius-xl)",
            padding: "1.75rem",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="admin-email"
                style={{
                  display: "block",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.375rem",
                }}
              >
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fonlok.com"
                required
                style={{
                  width: "100%",
                  backgroundColor: "#0d1929",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#ffffff",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.625rem 0.875rem",
                  fontSize: "0.9375rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label
                htmlFor="admin-password"
                style={{
                  display: "block",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.375rem",
                }}
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                required
                style={{
                  width: "100%",
                  backgroundColor: "#0d1929",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#ffffff",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.625rem 0.875rem",
                  fontSize: "0.9375rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  color: "#fca5a5",
                  fontSize: "0.875rem",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.625rem 0.875rem",
                  marginBottom: "1rem",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                backgroundColor: loading
                  ? "rgba(245,158,11,0.5)"
                  : "var(--color-accent)",
                color: "#0F1F3D",
                fontWeight: 700,
                fontSize: "0.9375rem",
                padding: "0.6875rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {loading ? "Signing in\u2026" : "Sign In"}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "#475569",
            marginTop: "1.25rem",
          }}
        >
          Restricted area &mdash; authorised personnel only
        </p>
      </div>
    </div>
  );
}
