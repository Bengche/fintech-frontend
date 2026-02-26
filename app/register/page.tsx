"use client";
import { useState, useEffect, Suspense } from "react";
import Axios from "axios";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { haptic } from "@/hooks/useHaptic";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

function RegisterForm() {
  const t = useTranslations("Register");
  const [image, setImage] = useState<File | null>(null);
  const [registerMessageSuccess, setRegisterMessageSuccess] = useState("");
  const [registerMessageError, setRegisterMessageError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dob: "",
    country: "",
    referralCode: "",
    image: null,
  });

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setFormData((prev) => ({ ...prev, referralCode: refCode.toUpperCase() }));
    }
  }, [searchParams]);

  const handleRegister = async (e: any) => {
    e.preventDefault();
    haptic("medium");
    setLoading(true);
    const prefix = 237;
    const fullPhoneNumber = `${prefix}${formData.phone}`;
    const newFormData = new FormData();
    newFormData.append("name", formData.name);
    newFormData.append("username", formData.username);
    newFormData.append("email", formData.email);
    newFormData.append("phone", fullPhoneNumber);
    newFormData.append("password", formData.password);
    newFormData.append("dob", formData.dob);
    newFormData.append("country", formData.country);
    if (image) newFormData.append("image", image);
    if (formData.referralCode.trim()) {
      newFormData.append(
        "referral_code",
        formData.referralCode.trim().toUpperCase(),
      );
    }
    try {
      await Axios.post(`${API}/auth/register`, newFormData);
      setRegisterMessageSuccess(t("success"));
      setTimeout(() => setRegisterMessageSuccess(""), 6000);
    } catch (error: any) {
      const message = error.response?.data?.message || t("errors.generic");
      setRegisterMessageError(message);
      setTimeout(() => setRegisterMessageError(""), 6000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) setImage(file);
  };

  // ── Real-time age guard ─────────────────────────────────────────────────────
  // Returns a human-readable "time until 18" string, or null if the user is old enough.
  const ageBlock = (() => {
    if (!formData.dob) return null;
    const birth = new Date(formData.dob);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    // Calculate current age
    let age = today.getFullYear() - birth.getFullYear();
    const mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
    if (age >= 18) return null;
    // Calculate the exact 18th birthday
    const eighteenth = new Date(
      birth.getFullYear() + 18,
      birth.getMonth(),
      birth.getDate(),
    );
    let yLeft = eighteenth.getFullYear() - today.getFullYear();
    let moLeft = eighteenth.getMonth() - today.getMonth();
    let dLeft = eighteenth.getDate() - today.getDate();
    if (dLeft < 0) {
      moLeft--;
      dLeft += new Date(
        eighteenth.getFullYear(),
        eighteenth.getMonth(),
        0,
      ).getDate();
    }
    if (moLeft < 0) {
      yLeft--;
      moLeft += 12;
    }
    const parts: string[] = [];
    if (yLeft > 0) parts.push(`${yLeft} year${yLeft !== 1 ? "s" : ""}`);
    if (moLeft > 0) parts.push(`${moLeft} month${moLeft !== 1 ? "s" : ""}`);
    if (dLeft > 0) parts.push(`${dLeft} day${dLeft !== 1 ? "s" : ""}`);
    if (parts.length === 0) return "less than a day";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    return `${parts[0]}, ${parts[1]} and ${parts[2]}`;
  })();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-cloud)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "2rem 1.25rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
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
            {t("heading")}
          </p>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          <form
            onSubmit={handleRegister}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {/* Row: Name + Username */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.875rem",
              }}
            >
              <div>
                <label htmlFor="name" className="label">
                  {t("name")}
                </label>
                <input
                  className="input"
                  placeholder="Jean-Paul"
                  id="name"
                  name="name"
                  type="text"
                  onChange={handleChange}
                  value={formData.name}
                  required
                />
              </div>
              <div>
                <label htmlFor="username" className="label">
                  {t("username")}
                </label>
                <input
                  className="input"
                  placeholder="jeanpaul"
                  id="username"
                  name="username"
                  type="text"
                  onChange={handleChange}
                  value={formData.username}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                {t("email")}
              </label>
              <input
                className="input"
                placeholder="you@example.com"
                id="email"
                name="email"
                type="email"
                onChange={handleChange}
                value={formData.email}
                required
              />
              <p
                style={{
                  marginTop: "0.3rem",
                  fontSize: "0.8rem",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.5,
                }}
              >
                ⚠️ {t("emailWarning")}
              </p>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="label">
                {t("phone")}
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                <span
                  style={{
                    padding: "0.625rem 0.875rem",
                    backgroundColor: "var(--color-mist)",
                    border: "1.5px solid var(--color-border)",
                    borderRight: "none",
                    borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)",
                    fontSize: "0.9375rem",
                    color: "var(--color-text-body)",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  +237
                </span>
                <input
                  className="input"
                  placeholder="6XXXXXXXX"
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={9}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 9),
                    })
                  }
                  value={formData.phone}
                  required
                  style={{
                    borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                  }}
                />
              </div>
              <p
                style={{
                  marginTop: "0.3rem",
                  fontSize: "0.8rem",
                  color: "var(--color-danger)",
                  lineHeight: 1.5,
                  fontWeight: 500,
                }}
              >
                💸 {t("phoneWarning")}
              </p>
            </div>

            {/* Password row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.875rem",
              }}
            >
              <div>
                <label htmlFor="password" className="label">
                  {t("password")}
                </label>
                <input
                  className="input"
                  placeholder="••••••••"
                  id="password"
                  name="password"
                  type="password"
                  onChange={handleChange}
                  value={formData.password}
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="label">
                  {t("confirmPassword")}
                </label>
                <input
                  className="input"
                  placeholder="••••••••"
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  onChange={handleChange}
                  value={formData.confirmPassword}
                  required
                />
              </div>
            </div>

            {/* DOB + Country */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.875rem",
              }}
            >
              <div>
                <label htmlFor="dob" className="label">
                  {t("dob")}
                </label>
                <input
                  className="input"
                  id="dob"
                  name="dob"
                  type="date"
                  onChange={handleChange}
                  value={formData.dob}
                  required
                  style={ageBlock ? { borderColor: "#dc2626" } : {}}
                />
                {ageBlock && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      padding: "1rem 1.125rem",
                      background: "#fff8f8",
                      border: "1.5px solid #fca5a5",
                      borderRadius: "10px",
                      display: "flex",
                      gap: "0.625rem",
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: "1.2rem", lineHeight: 1.3 }}>
                      🔞
                    </span>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          color: "#991b1b",
                          lineHeight: 1.4,
                        }}
                      >
                        You must be 18 or older to use Fonlok.
                      </p>
                      <p
                        style={{
                          margin: "0.35rem 0 0",
                          fontSize: "0.8125rem",
                          color: "#b91c1c",
                          lineHeight: 1.5,
                        }}
                      >
                        Fonlok is a financial platform that handles real money
                        transactions. To protect minors, we do not permit anyone
                        under 18 to register.
                      </p>
                      <p
                        style={{
                          margin: "0.5rem 0 0",
                          fontSize: "0.8125rem",
                          color: "#7f1d1d",
                          fontWeight: 600,
                          lineHeight: 1.5,
                        }}
                      >
                        You will be eligible to register in{" "}
                        <span
                          style={{
                            background: "#fee2e2",
                            borderRadius: "5px",
                            padding: "0.05rem 0.4rem",
                          }}
                        >
                          {ageBlock}
                        </span>
                        .
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="country" className="label">
                  {t("country")}
                </label>
                <input
                  className="input"
                  placeholder="Cameroon"
                  id="country"
                  name="country"
                  type="text"
                  onChange={handleChange}
                  value={formData.country}
                  required
                />
              </div>
            </div>

            {/* Profile picture */}
            <div>
              <label htmlFor="profilePicture" className="label">
                {t("profilePicture")}
              </label>
              <input
                className="input"
                id="profilePicture"
                name="profilePicture"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ cursor: "pointer" }}
              />
            </div>

            {/* Referral code */}
            <div>
              <label htmlFor="referralCode" className="label">
                {t("referralCode")}{" "}
                <span
                  style={{ fontWeight: 400, color: "var(--color-text-muted)" }}
                >
                  {t("referralCodeOptional")}
                </span>
              </label>
              <input
                className="input"
                placeholder="e.g. AB3XY7"
                id="referralCode"
                name="referralCode"
                type="text"
                maxLength={12}
                onChange={handleChange}
                value={formData.referralCode}
                style={{ textTransform: "uppercase" }}
              />
              <p
                style={{
                  marginTop: "0.3rem",
                  fontSize: "0.8rem",
                  color: "var(--color-text-muted)",
                }}
              >
                {t("referralCodeHint")}
              </p>
            </div>

            {registerMessageSuccess && (
              <div className="alert alert-success">
                {registerMessageSuccess}
              </div>
            )}
            {registerMessageError && (
              <div className="alert alert-danger">{registerMessageError}</div>
            )}

            <button
              type="submit"
              className="btn-accent"
              disabled={loading || !!ageBlock}
              style={{
                opacity: ageBlock ? 0.45 : undefined,
                cursor: ageBlock ? "not-allowed" : undefined,
                width: "100%",
                justifyContent: "center",
                padding: "0.75rem",
                marginTop: "0.5rem",
              }}
            >
              {loading ? t("submitting") : t("submit")}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: "1.5rem",
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
            }}
          >
            {t("haveAccount")}{" "}
            <Link
              href="/login"
              style={{ color: "var(--color-primary)", fontWeight: 600 }}
            >
              {t("signIn")}
            </Link>
          </p>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.25rem",
            fontSize: "0.78rem",
            color: "var(--color-text-muted)",
          }}
        >
          {t("terms")}{" "}
          <Link
            href="/terms"
            style={{
              color: "var(--color-text-muted)",
              textDecoration: "underline",
            }}
          >
            {t("termsLink")}
          </Link>{" "}
          {t("and")}{" "}
          <Link
            href="/privacy"
            style={{
              color: "var(--color-text-muted)",
              textDecoration: "underline",
            }}
          >
            {t("privacyLink")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
