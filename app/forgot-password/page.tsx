"use client";

import { useState } from "react";
import Axios from "axios";
import Link from "next/link";

export default function ForgotPassword() {
  const BASE_API_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const response = await Axios.post(
        `${BASE_API_URL}/auth/forgot-password`,
        {
          email: email.trim().toLowerCase(),
        },
      );
      setSuccessMessage(
        response.data.message ||
          "If an account with that email exists, a reset link has been sent.",
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        e.response?.data?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-cloud)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link
            href="/"
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--color-primary)",
              letterSpacing: "-0.03em",
              textDecoration: "none",
            }}
          >
            Fonlok
          </Link>
          <p
            style={{
              marginTop: "0.5rem",
              color: "var(--color-text-muted)",
              fontSize: "0.9375rem",
            }}
          >
            Reset your password
          </p>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          {successMessage ? (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "50%",
                  backgroundColor: "#d1fae5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  fontSize: "1.5rem",
                }}
              >
                ✓
              </div>
              <h2
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  color: "var(--color-text-heading)",
                  marginBottom: "0.5rem",
                }}
              >
                Check your inbox
              </h2>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.6,
                  marginBottom: "1.5rem",
                }}
              >
                {successMessage} The link expires in <strong>1 hour</strong>. If
                you do not see the email, please check your spam folder.
              </p>
              <Link
                href="/login"
                style={{
                  color: "var(--color-primary)",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                }}
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.6,
                  marginBottom: "1.5rem",
                }}
              >
                Enter the email address associated with your account and we will
                send you a secure link to reset your password.
              </p>

              {errorMessage && (
                <div
                  className="alert alert-danger"
                  style={{ marginBottom: "1rem" }}
                >
                  {errorMessage}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div>
                  <label htmlFor="email" className="label">
                    Email address
                  </label>
                  <input
                    className="input"
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "0.75rem",
                  }}
                >
                  {loading ? "Sending reset link…" : "Send reset link"}
                </button>
              </form>

              <p
                style={{
                  textAlign: "center",
                  marginTop: "1.25rem",
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                }}
              >
                Remembered your password?{" "}
                <Link
                  href="/login"
                  style={{ color: "var(--color-primary)", fontWeight: 600 }}
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "0.8125rem",
            color: "var(--color-text-muted)",
          }}
        >
          Your payments are protected by Fonlok Escrow
        </p>
      </div>
    </div>
  );
}
