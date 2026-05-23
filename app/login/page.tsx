"use client";

import { useState } from "react";
import Axios from "axios";
import { useAuth } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { haptic } from "@/hooks/useHaptic";
import BiometricButton from "@/app/components/BiometricButton";
Axios.defaults.withCredentials = true;

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function Login() {
  const t = useTranslations("Login");
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { setUser_id, setUsername } = useAuth();
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState<"password" | "otp">("password");
  const [otpCode, setOtpCode] = useState("");
  const [otpInfo, setOtpInfo] = useState("");
  const [otpMaskedEmail, setOtpMaskedEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const finalizeLogin = (response: {
    data: { userId: number; username?: string | null; token?: string };
  }) => {
    setUser_id(response.data.userId);
    setUsername(response.data.username || null);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("authToken", response.data.token);
    }
    router.push("/dashboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic("medium");
    setLoginError("");
    setLoading(true);
    try {
      const response = await Axios.post(
        `${API}/auth/login`,
        { email: formData.email, password: formData.password },
        { withCredentials: true },
      );
      if (response.data.requiresOtp) {
        setAuthStep("otp");
        setOtpCode("");
        setOtpInfo(response.data.message || t("otpSent"));
        setOtpMaskedEmail(response.data.emailMasked || formData.email);
        return;
      }

      finalizeLogin(response);
    } catch (error: unknown) {
      const data = (error as { response?: { data?: { code?: string; message?: string; email?: string } } })
        ?.response?.data;
      if (data?.code === "EMAIL_NOT_VERIFIED") {
        const emailParam = data.email || formData.email;
        router.push(`/verify-email?email=${encodeURIComponent(emailParam)}`);
        return;
      }
      const message =
        data?.message ||
        "Login failed. Please check your credentials and try again.";
      setLoginError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic("medium");
    setLoginError("");
    setLoading(true);
    try {
      const response = await Axios.post(
        `${API}/auth/login/verify-otp`,
        { otp: otpCode },
        { withCredentials: true },
      );
      finalizeLogin(response);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || t("otpError");
      setLoginError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setLoginError("");
    try {
      const response = await Axios.post(
        `${API}/auth/login/resend-otp`,
        {},
        { withCredentials: true },
      );
      setOtpInfo(response.data.message || t("otpResent"));
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || t("otpResendError");
      setLoginError(message);
    } finally {
      setResendLoading(false);
    }
  };

  const backToPassword = () => {
    setAuthStep("password");
    setOtpCode("");
    setOtpInfo("");
    setOtpMaskedEmail("");
    setLoginError("");
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
            {t("subheading")}
          </p>
        </div>

        {/* Card */}
        <div className="card login-card" style={{ padding: "2rem" }}>
          {loginError && (
            <div
              className="alert alert-danger"
              style={{ marginBottom: "1.25rem" }}
            >
              {loginError}
            </div>
          )}

          {authStep === "password" ? (
            <>
              <form
                onSubmit={handleLogin}
                className="login-form"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.125rem",
                }}
              >
                <div>
                  <label htmlFor="email" className="label">
                    {t("email")}
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
                    {t("password")}
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
                  {loading ? t("submitting") : t("submit")}
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
                    {t("forgotPassword")}
                  </a>
                </p>
              </form>

              <BiometricButton />
            </>
          ) : (
            <form
              onSubmit={handleVerifyOtp}
              className="login-otp-form"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div className="login-otp-panel">
                <p className="login-otp-kicker">{t("otpKicker")}</p>
                <h2 className="login-otp-title">{t("otpTitle")}</h2>
                <p className="login-otp-body">
                  {t("otpBody", { email: otpMaskedEmail || formData.email })}
                </p>
                {otpInfo && <p className="login-otp-info">{otpInfo}</p>}
              </div>

              <div>
                <label htmlFor="otp" className="label">
                  {t("otpLabel")}
                </label>
                <input
                  className="input"
                  placeholder="123456"
                  type="text"
                  id="otp"
                  name="otp"
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading || otpCode.length !== 6}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: "0.25rem",
                  padding: "0.75rem",
                }}
              >
                {loading ? t("verifyingOtp") : t("verifyOtp")}
              </button>

              <div className="login-otp-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={backToPassword}
                >
                  {t("backToPassword")}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                >
                  {resendLoading ? t("resendingOtp") : t("resendOtp")}
                </button>
              </div>
            </form>
          )}

          {authStep === "password" && (
            <p
              style={{
                textAlign: "center",
                marginTop: "1.5rem",
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
              }}
            >
              {t("noAccount")}{" "}
              <Link
                href="/register"
                style={{ color: "var(--color-primary)", fontWeight: 600 }}
              >
                {t("register")}
              </Link>
            </p>
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
          {t("protected")}
        </p>
      </div>
    </div>
  );
}
