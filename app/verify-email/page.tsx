"use client";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import Axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const REDIRECT_DELAY = 5; // seconds before auto-redirect to login after success

// ── Digit input cell ─────────────────────────────────────────────────────────
function OtpInput({
  value,
  index,
  inputRefs,
  onChange,
  onKeyDown,
  onPaste,
  disabled,
}: {
  value: string;
  index: number;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onChange: (index: number, val: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
}) {
  return (
    <input
      ref={(el) => {
        inputRefs.current[index] = el;
      }}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(index, e.target.value.replace(/\D/g, ""))}
      onKeyDown={(e) => onKeyDown(index, e)}
      onPaste={onPaste}
      aria-label={`Digit ${index + 1}`}
      style={{
        width: "clamp(42px, 12vw, 56px)",
        height: "clamp(50px, 14vw, 64px)",
        fontSize: "clamp(1.3rem, 4vw, 1.75rem)",
        fontWeight: 700,
        fontFamily: "monospace",
        textAlign: "center",
        border: `2px solid ${value ? "var(--color-primary)" : "var(--color-border)"}`,
        borderRadius: "12px",
        background: value
          ? "rgba(15,31,61,0.04)"
          : "var(--color-surface, #fff)",
        color: "var(--color-text-heading)",
        outline: "none",
        transition: "border-color 0.15s, background 0.15s",
        caretColor: "transparent",
        cursor: disabled ? "not-allowed" : "text",
      }}
      onFocus={(e) => {
        (e.target as HTMLInputElement).style.borderColor =
          "var(--color-primary)";
        (e.target as HTMLInputElement).style.boxShadow =
          "0 0 0 3px rgba(15,31,61,0.12)";
      }}
      onBlur={(e) => {
        (e.target as HTMLInputElement).style.boxShadow = "none";
      }}
    />
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawEmail = searchParams.get("email") || "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState<
    "idle" | "verifying" | "success" | "error" | "expired"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [resendStatus, setResendStatus] = useState<
    "idle" | "sending" | "sent"
  >("idle");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [countdown, setCountdown] = useState(REDIRECT_DELAY);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 80);
  }, []);

  // Start post-success countdown
  useEffect(() => {
    if (status !== "success") return;
    setCountdown(REDIRECT_DELAY);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownRef.current!);
          router.push("/login");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status, router]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [resendCooldown]);

  const handleChange = useCallback(
    (index: number, val: string) => {
      if (!val) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
        return;
      }
      const digit = val.slice(-1);
      setDigits((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });
      if (index < 5) {
        setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
      }
    },
    [],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (digits[index]) {
          setDigits((prev) => {
            const next = [...prev];
            next[index] = "";
            return next;
          });
        } else if (index > 0) {
          setTimeout(() => inputRefs.current[index - 1]?.focus(), 0);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (!text) return;
      const next = ["", "", "", "", "", ""];
      for (let i = 0; i < text.length; i++) next[i] = text[i];
      setDigits(next);
      const lastFilled = Math.min(text.length, 5);
      setTimeout(() => inputRefs.current[lastFilled]?.focus(), 0);
    },
    [],
  );

  const handleVerify = useCallback(async () => {
    const code = digits.join("");
    if (code.length !== 6) return;
    setStatus("verifying");
    setErrorMsg("");
    try {
      await Axios.post(`${API}/auth/verify-email`, {
        email: rawEmail,
        otp: code,
      });
      setStatus("success");
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { code?: string; message?: string } } })
        ?.response?.data;
      if (data?.code === "OTP_EXPIRED") {
        setStatus("expired");
        setErrorMsg(data.message || "Your code has expired.");
      } else {
        setStatus("error");
        setErrorMsg(
          data?.message || "Verification failed. Please try again.",
        );
        // Shake and clear on wrong code
        setDigits(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 60);
      }
    }
  }, [digits, rawEmail]);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (digits.every((d) => d !== "") && status === "idle") {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || resendStatus === "sending") return;
    setResendStatus("sending");
    try {
      await Axios.post(`${API}/auth/resend-verification`, { email: rawEmail });
    } catch {
      // Silent — same response either way
    }
    setResendStatus("sent");
    setResendCooldown(60);
    // Reset expired/error state so user can retry
    if (status === "expired" || status === "error") {
      setStatus("idle");
      setErrorMsg("");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    }
    setTimeout(() => setResendStatus("idle"), 5000);
  }, [rawEmail, resendCooldown, resendStatus, status]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const isLoading = status === "verifying";
  const allFilled = digits.every((d) => d !== "");

  // ── Render ───────────────────────────────────────────────────────────────
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
      <div style={{ width: "100%", maxWidth: "440px" }}>
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
        </div>

        <div className="card" style={{ padding: "clamp(1.5rem, 5vw, 2.25rem)" }}>
          {/* ── Success state ─────────────────────────────────────── */}
          {status === "success" ? (
            <div style={{ textAlign: "center" }}>
              {/* Animated checkmark */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                  border: "2px solid #6ee7b7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.25rem",
                  fontSize: "2rem",
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1
                style={{
                  fontSize: "1.375rem",
                  fontWeight: 800,
                  color: "var(--color-text-heading)",
                  margin: "0 0 0.5rem",
                  letterSpacing: "-0.02em",
                }}
              >
                Email verified
              </h1>
              <p
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "0.9375rem",
                  lineHeight: 1.6,
                  margin: "0 0 1.75rem",
                }}
              >
                Your account is now fully active. Welcome to Fonlok — check
                your inbox for a welcome email with next steps.
              </p>

              {/* Countdown bar */}
              <div
                style={{
                  padding: "0.875rem 1rem",
                  background: "#f0fdf4",
                  border: "1.5px solid #bbf7d0",
                  borderRadius: "10px",
                  marginBottom: "1.25rem",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "#15803d",
                    fontWeight: 500,
                    lineHeight: 1.5,
                  }}
                >
                  Redirecting you to the sign-in page in{" "}
                  <strong>{countdown}</strong> second
                  {countdown !== 1 ? "s" : ""}...
                </p>
                {/* Progress bar */}
                <div
                  style={{
                    marginTop: "0.6rem",
                    height: 4,
                    background: "#dcfce7",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "#22c55e",
                      borderRadius: 99,
                      width: `${((REDIRECT_DELAY - countdown) / REDIRECT_DELAY) * 100}%`,
                      transition: "width 1s linear",
                    }}
                  />
                </div>
              </div>

              <button
                className="btn-accent"
                onClick={() => router.push("/login")}
                style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
              >
                Sign in now
              </button>
            </div>
          ) : (
            /* ── Verification form ──────────────────────────────── */
            <>
              {/* Icon */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, rgba(15,31,61,0.07), rgba(245,158,11,0.18))",
                  border: "1.5px solid rgba(15,31,61,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.25rem",
                }}
              >
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>

              <h1
                style={{
                  fontSize: "clamp(1.2rem, 4vw, 1.375rem)",
                  fontWeight: 800,
                  color: "var(--color-text-heading)",
                  margin: "0 0 0.5rem",
                  textAlign: "center",
                  letterSpacing: "-0.02em",
                }}
              >
                Verify your email
              </h1>
              <p
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "0.9rem",
                  lineHeight: 1.65,
                  margin: "0 0 1.5rem",
                  textAlign: "center",
                }}
              >
                We sent a 6-digit code to{" "}
                {rawEmail ? (
                  <strong style={{ color: "var(--color-text-body)" }}>
                    {rawEmail}
                  </strong>
                ) : (
                  "your email address"
                )}
                . Enter it below to complete your registration.
              </p>

              {/* OTP digit row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "clamp(6px, 2vw, 12px)",
                  marginBottom: "1.25rem",
                }}
              >
                {digits.map((d, i) => (
                  <OtpInput
                    key={i}
                    value={d}
                    index={i}
                    inputRefs={inputRefs}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    disabled={isLoading}
                  />
                ))}
              </div>

              {/* Error / expired messages */}
              {(status === "error" || status === "expired") && errorMsg && (
                <div
                  className="alert alert-danger"
                  style={{ marginBottom: "1rem", textAlign: "center" }}
                >
                  {errorMsg}
                </div>
              )}

              {/* Verify button */}
              <button
                className="btn-accent"
                onClick={handleVerify}
                disabled={!allFilled || isLoading}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "0.75rem",
                  marginBottom: "1rem",
                  opacity: !allFilled && !isLoading ? 0.6 : 1,
                  cursor: !allFilled ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.35)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    Verifying...
                  </span>
                ) : (
                  "Verify email"
                )}
              </button>

              {/* Divider */}
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  margin: "0.25rem 0 1rem",
                }}
              />

              {/* Resend */}
              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                  margin: 0,
                }}
              >
                {resendStatus === "sent" ? (
                  <span style={{ color: "#16a34a", fontWeight: 500 }}>
                    A new code has been sent to your inbox.
                  </span>
                ) : (
                  <>
                    {"Didn't receive it? "}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || resendStatus === "sending"}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor:
                          resendCooldown > 0 || resendStatus === "sending"
                            ? "not-allowed"
                            : "pointer",
                        color:
                          resendCooldown > 0 || resendStatus === "sending"
                            ? "var(--color-text-muted)"
                            : "var(--color-primary)",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        textDecoration: "underline",
                        opacity:
                          resendCooldown > 0 || resendStatus === "sending"
                            ? 0.6
                            : 1,
                      }}
                    >
                      {resendStatus === "sending"
                        ? "Sending..."
                        : resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : "Resend code"}
                    </button>
                  </>
                )}
              </p>

              {/* Tip */}
              <p
                style={{
                  marginTop: "1rem",
                  fontSize: "0.78rem",
                  color: "var(--color-text-muted)",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                Check your spam folder if you don&apos;t see the email within
                a couple of minutes.
              </p>
            </>
          )}
        </div>

        {/* Back to register */}
        {status !== "success" && (
          <p
            style={{
              textAlign: "center",
              marginTop: "1rem",
              fontSize: "0.85rem",
              color: "var(--color-text-muted)",
            }}
          >
            <Link
              href="/register"
              style={{ color: "var(--color-text-muted)", textDecoration: "underline" }}
            >
              Back to registration
            </Link>
          </p>
        )}
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense>
      <VerifyEmailPage />
    </Suspense>
  );
}
