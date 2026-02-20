"use client";

import { useState } from "react";
import Axios from "axios";
import { useAuth } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
Axios.defaults.withCredentials = true;

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { setUser_id, setUsername } = useAuth();
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      const newFormData = new FormData();
      newFormData.append("email", formData.email);
      newFormData.append("password", formData.password);
      const response = await Axios.post(`${API}/auth/login`, newFormData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      setUser_id(response.data.userId);
      setUsername(response.data.username || null);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      router.push("/dashboard");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        "Login failed. Please check your credentials and try again.";
      setLoginError(message);
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
        {/* Brand mark */}
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
            Welcome back — sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "2rem" }}>
          {loginError && (
            <div
              className="alert alert-danger"
              style={{ marginBottom: "1.25rem" }}
            >
              {loginError}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.125rem",
            }}
          >
            <div>
              <label htmlFor="email" className="label">
                Email or Username
              </label>
              <input
                className="input"
                placeholder="you@example.com"
                type="text"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                className="input"
                placeholder="••••••••••"
                name="password"
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: "0.25rem",
                padding: "0.75rem",
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <p
              style={{
                textAlign: "center",
                margin: "0.75rem 0 0",
                fontSize: "0.875rem",
              }}
            >
              <a
                href="/forgot-password"
                style={{
                  color: "var(--color-primary)",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Forgot your password?
              </a>
            </p>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: "1.5rem",
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
            }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              style={{ color: "var(--color-primary)", fontWeight: 600 }}
            >
              Create one
            </Link>
          </p>
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
