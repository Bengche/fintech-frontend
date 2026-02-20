"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Axios from "axios";
import Link from "next/link";

function ResetPasswordForm() {
  const BASE_API_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMessage(
        "No reset token found. Please request a new password reset link.",
      );
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await Axios.post(`${BASE_API_URL}/auth/reset-password`, {
        token,
        password,
      });
      setSuccessMessage(
        response.data.message || "Password updated successfully.",
      );
      // Redirect to login after 3 seconds
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        e.response?.data?.message ||
          "Something went wrong. Please try again or request a new reset link.",
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
            Create a new password
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
                Password updated
              </h2>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.6,
                  marginBottom: "1.5rem",
                }}
              >
                {successMessage} You will be redirected to the sign-in page
                automatically.
              </p>
              <Link
                href="/login"
                className="btn-primary"
                style={{
                  display: "inline-block",
                  padding: "0.625rem 1.5rem",
                  textDecoration: "none",
                }}
              >
                Sign in now
              </Link>
            </div>
          ) : (
            <>
              {!token && (
                <div
                  className="alert alert-danger"
                  style={{ marginBottom: "1rem" }}
                >
                  This reset link is missing a token. Please{" "}
                  <Link
                    href="/forgot-password"
                    style={{ color: "var(--color-danger)", fontWeight: 600 }}
                  >
                    request a new reset link
                  </Link>
                  .
                </div>
              )}

              {errorMessage && (
                <div
                  className="alert alert-danger"
                  style={{ marginBottom: "1rem" }}
                >
                  {errorMessage}{" "}
                  {errorMessage.toLowerCase().includes("expired") ||
                  errorMessage.toLowerCase().includes("invalid") ? (
                    <Link
                      href="/forgot-password"
                      style={{ color: "var(--color-danger)", fontWeight: 600 }}
                    >
                      Request a new link
                    </Link>
                  ) : null}
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
                  <label htmlFor="password" className="label">
                    New password
                  </label>
                  <input
                    className="input"
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="label">
                    Confirm new password
                  </label>
                  <input
                    className="input"
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  {confirmPassword.length > 0 &&
                    password !== confirmPassword && (
                      <p
                        style={{
                          marginTop: "0.3rem",
                          fontSize: "0.8rem",
                          color: "var(--color-danger)",
                        }}
                      >
                        Passwords do not match.
                      </p>
                    )}
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !token}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "0.75rem",
                  }}
                >
                  {loading ? "Updating password…" : "Update password"}
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
                <Link
                  href="/login"
                  style={{ color: "var(--color-primary)", fontWeight: 600 }}
                >
                  ← Back to sign in
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

export default function ResetPassword() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
