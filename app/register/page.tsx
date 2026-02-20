"use client";
import { useState, useEffect, Suspense } from "react";
import Axios from "axios";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

function RegisterForm() {
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
      setRegisterMessageSuccess(
        "Account created successfully! You can now sign in.",
      );
      setTimeout(() => setRegisterMessageSuccess(""), 6000);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
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
            Create your free account
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
                  Full name
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
                  Username
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
                Email address
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
                ⚠️ Use an email address you actively check. All transaction
                receipts, payout confirmations, dispute notifications, and
                account security alerts will be sent to this address. You will
                not be able to recover your account without access to this
                email.
              </p>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="label">
                Phone number
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
                  onChange={handleChange}
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
                💸 This must be your active MTN Mobile Money or Orange Money
                number. All seller payouts are sent directly to this number. If
                you enter the wrong number, funds sent to it cannot be
                recovered.
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
                  Password
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
                  Confirm password
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
                  Date of birth
                </label>
                <input
                  className="input"
                  id="dob"
                  name="dob"
                  type="date"
                  onChange={handleChange}
                  value={formData.dob}
                  required
                />
              </div>
              <div>
                <label htmlFor="country" className="label">
                  Country
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
                Profile picture (optional)
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
                Referral code{" "}
                <span
                  style={{ fontWeight: 400, color: "var(--color-text-muted)" }}
                >
                  (optional)
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
                If someone referred you, enter their code to link your account.
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
              disabled={loading}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "0.75rem",
                marginTop: "0.5rem",
              }}
            >
              {loading ? "Creating account…" : "Create account"}
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
            Already have an account?{" "}
            <Link
              href="/login"
              style={{ color: "var(--color-primary)", fontWeight: 600 }}
            >
              Sign in
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
          By creating an account you agree to our Terms of Service and Privacy
          Policy.
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
