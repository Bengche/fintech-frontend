"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function AdminLoginPage() {
  const router = useRouter();
  const t = useTranslations("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [tempToken, setTempToken] = useState("");
  const [otp, setOtp] = useState("");

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/admin/login`,
        { email, password },
        { withCredentials: true },
      );
      if (res.data.require2fa) {
        setTempToken(res.data.tempToken);
        setStep("otp");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : t("login.error");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/admin/2fa/login-verify`,
        { tempToken, otp },
        { withCredentials: true },
      );
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Invalid OTP code. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm adm-login">
      <div className="adm-login-card">
        <div className="adm-login-mark" aria-hidden="true">
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
        <h1 className="adm-login-title">{t("login.title")}</h1>
        <p className="adm-login-sub">{t("login.subtitle")}</p>

        <form
          onSubmit={step === "credentials" ? handleCredentials : handleOtp}
        >
          {step === "credentials" ? (
            <>
              <div className="adm-login-field">
                <label htmlFor="admin-email" className="adm-login-label">
                  {t("login.emailLabel")}
                </label>
                <input
                  id="admin-email"
                  className="adm-login-input"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fonlok.com"
                  required
                />
              </div>
              <div className="adm-login-field">
                <label htmlFor="admin-password" className="adm-login-label">
                  {t("login.passwordLabel")}
                </label>
                <input
                  id="admin-password"
                  className="adm-login-input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </>
          ) : (
            <div className="adm-login-field">
              <p className="adm-login-sub" style={{ margin: "0 0 1.1rem" }}>
                Enter the 6-digit code from your authenticator app.
              </p>
              <label htmlFor="admin-otp" className="adm-login-label">
                Authenticator Code
              </label>
              <input
                id="admin-otp"
                className="adm-login-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
                style={{
                  fontSize: "1.5rem",
                  letterSpacing: "0.35em",
                  textAlign: "center",
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError("");
                  setOtp("");
                }}
                style={{
                  marginTop: "0.7rem",
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "var(--adm-muted)",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Back
              </button>
            </div>
          )}

          {error && (
            <div className="adm-login-alert" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="adm-login-submit"
          >
            {loading
              ? t("login.submitting")
              : step === "otp"
                ? "Verify Code"
                : t("login.submit")}
          </button>
        </form>

        <p className="adm-login-foot">{t("login.restricted")}</p>
      </div>
    </div>
  );
}
