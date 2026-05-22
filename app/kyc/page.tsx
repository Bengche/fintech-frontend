"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Axios from "axios";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "next-intl";
import SiteHeader from "../components/SiteHeader";
import {
  ShieldCheck,
  BadgeCheck,
  Clock,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Upload,
  User,
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// ── Types ─────────────────────────────────────────────────────────────────────
type DocType = "national_id" | "drivers_license" | "passport";
type KycStatus = "unverified" | "pending" | "approved" | "rejected";

interface KycApplication {
  id: number;
  status: KycStatus;
  document_type: string;
  full_name: string;
  submitted_at: string;
  reviewed_at: string | null;
  admin_note: string | null;
}

interface FormData {
  full_name: string;
  date_of_birth: string;
  nationality: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  document_type: DocType;
  document_number: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

const DOC_LABELS: Record<DocType, string> = {
  national_id: "National ID Card",
  drivers_license: "Driver's Licence",
  passport: "International Passport",
};

// ── Image Upload Preview Component ────────────────────────────────────────────
function ImageUploadBox({
  label,
  hint,
  file,
  onChange,
  required,
}: {
  label: string;
  hint?: string;
  file: File | null;
  onChange: (f: File | null) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      alert("File is too large. Maximum size is 8 MB.");
      return;
    }
    onChange(f);
  };

  return (
    <div className="kyc-form-row">
      <label
        className={`kyc-form-label ${required ? "kyc-form-label--required" : ""}`}
      >
        {label}
      </label>
      {hint && <p className="kyc-form-hint">{hint}</p>}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0] ?? null);
        }}
        className={`kyc-upload-box ${preview ? "has-preview" : ""}`}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="kyc-image-preview" />
            <div className="kyc-preview-label">Tap to change</div>
          </>
        ) : (
          <div className="kyc-upload-placeholder">
            <Upload
              size={28}
              style={{
                color: "var(--color-text-muted)",
                marginBottom: "0.5rem",
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                fontWeight: 600,
              }}
            >
              Tap to upload or drag & drop
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
              }}
            >
              JPEG, PNG, WebP · Max 8 MB
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}

// ── Live Selfie Capture Component ─────────────────────────────────────────────
function SelfieCaptureBox({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (f: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Revoke previous preview URL when it changes
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Stop stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Show existing capture as preview when file already set
  useEffect(() => {
    if (file && !cameraOn) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, cameraOn]);

  const startCamera = async () => {
    setError(null);
    setStarting(true);
    try {
      // Check current permission state before requesting
      let permState: PermissionState | null = null;
      try {
        const status = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        permState = status.state;
      } catch {
        // Permissions API not supported in this browser — proceed anyway
      }

      if (permState === "denied") {
        setError(
          "Camera access has been blocked for this site. To fix this: tap the camera/lock icon in your browser's address bar → tap 'Reset permission' or 'Allow' → then reload this page.",
        );
        setStarting(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setPreview(null);
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError(
          "Camera access was denied. Tap the camera or lock icon in your browser's address bar, set camera to 'Allow', then tap 'Open Camera' again.",
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError(
          "No camera was found on this device. Please use a device with a front-facing camera.",
        );
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setError(
          "Your camera is in use by another app. Please close it and try again.",
        );
      } else {
        setError(
          "Could not start camera. Please ensure camera permissions are allowed for this site and try again.",
        );
      }
    } finally {
      setStarting(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `selfie_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const url = URL.createObjectURL(file);
        setPreview(url);
        onChange(file);
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  const retake = () => {
    setPreview(null);
    startCamera();
  };

  return (
    <div className="kyc-form-row">
      <label className="kyc-form-label kyc-form-label--required">
        Live Selfie
      </label>
      <p className="kyc-form-hint">
        Your camera will open to take a live photo. No uploads from gallery are
        allowed.
      </p>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            marginBottom: "0.75rem",
            fontSize: "0.84rem",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {/* Live camera view */}
      {cameraOn && (
        <div
          style={{
            position: "relative",
            borderRadius: "0.875rem",
            overflow: "hidden",
            background: "#000",
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: "100%",
              display: "block",
              maxHeight: "360px",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "1rem",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={capture}
              style={{
                background: "#fff",
                color: "#0f172a",
                border: "none",
                borderRadius: "999px",
                padding: "0.65rem 1.5rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            >
              Take Photo
            </button>
            <button
              type="button"
              onClick={stopCamera}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "999px",
                padding: "0.65rem 1.25rem",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Captured preview */}
      {preview && !cameraOn && (
        <div
          style={{
            position: "relative",
            borderRadius: "0.875rem",
            overflow: "hidden",
          }}
        >
          <img
            src={preview}
            alt="Selfie preview"
            style={{
              width: "100%",
              display: "block",
              maxHeight: "360px",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "1rem",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={retake}
              style={{
                background: "#fff",
                color: "#0f172a",
                border: "none",
                borderRadius: "999px",
                padding: "0.65rem 1.5rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            >
              Retake
            </button>
          </div>
        </div>
      )}

      {/* Initial state — no camera, no capture yet */}
      {!cameraOn && !preview && (
        <div
          className="kyc-upload-box"
          onClick={startCamera}
          style={{ cursor: starting ? "wait" : "pointer" }}
        >
          <div className="kyc-upload-placeholder">
            {starting ? (
              <Loader2
                size={28}
                style={{
                  color: "var(--color-text-muted)",
                  marginBottom: "0.5rem",
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              <Camera
                size={28}
                style={{
                  color: "var(--color-text-muted)",
                  marginBottom: "0.5rem",
                }}
              />
            )}
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                fontWeight: 600,
              }}
            >
              {starting ? "Starting camera…" : "Tap to open camera"}
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
              }}
            >
              A live photo will be taken — no gallery uploads
            </p>
          </div>
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

// ── Step Progress Bar ─────────────────────────────────────────────────────────
function StepBar({ step, total }: { step: number; total: number }) {
  const t = useTranslations("Kyc");
  const labels = [
    t("stepPersonal"),
    t("stepDocument"),
    t("stepSelfie"),
    t("stepReview"),
  ];
  return (
    <div className="kyc-step-bar">
      <div className="kyc-step-indicators">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < total - 1 ? 1 : "none",
            }}
          >
            <div
              className="kyc-step-indicator"
              style={{
                background:
                  i < step
                    ? "var(--color-primary)"
                    : i === step
                      ? "var(--color-accent, #F59E0B)"
                      : "var(--color-border)",
                color:
                  i < step
                    ? "#fff"
                    : i === step
                      ? "var(--color-primary)"
                      : "var(--color-text-muted)",
              }}
            >
              {i < step ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            {i < total - 1 && (
              <div
                className="kyc-step-connector"
                style={{
                  background:
                    i < step ? "var(--color-primary)" : "var(--color-border)",
                }}
              />
            )}
          </div>
        ))}
      </div>
      <p className="kyc-step-label">
        {t("stepLabel", { current: step + 1, total })} — {labels[step]}
      </p>
    </div>
  );
}

// ── KYC Status Banner ─────────────────────────────────────────────────────────
function StatusBanner({
  status,
  application,
}: {
  status: KycStatus;
  application: KycApplication | null;
}) {
  const t = useTranslations("Kyc");

  if (status === "unverified") return null;

  const configs: Record<
    Exclude<KycStatus, "unverified">,
    {
      bg: string;
      border: string;
      icon: React.ReactNode;
      color: string;
      title: string;
      body: string;
    }
  > = {
    pending: {
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.3)",
      icon: <Clock size={20} color="#92400e" />,
      color: "#92400e",
      title: t("statusPendingTitle"),
      body: t("statusPendingBody"),
    },
    approved: {
      bg: "rgba(22,163,74,0.08)",
      border: "rgba(22,163,74,0.3)",
      icon: <BadgeCheck size={20} color="#166534" />,
      color: "#166534",
      title: t("statusApprovedTitle"),
      body: t("statusApprovedBody"),
    },
    rejected: {
      bg: "rgba(220,38,38,0.08)",
      border: "rgba(220,38,38,0.3)",
      icon: <XCircle size={20} color="#991b1b" />,
      color: "#991b1b",
      title: t("statusRejectedTitle"),
      body: t("statusRejectedBody"),
    },
  };

  const cfg = configs[status as Exclude<KycStatus, "unverified">];

  return (
    <div className={`kyc-status-banner kyc-banner-${status}`}>
      <div className="kyc-banner-icon">{cfg.icon}</div>
      <div className="kyc-banner-content">
        <p className="kyc-banner-title" style={{ color: cfg.color }}>
          {cfg.title}
        </p>
        <p className="kyc-banner-body">{cfg.body}</p>
        {application?.admin_note && status === "rejected" && (
          <div className="kyc-banner-note">
            <p
              style={{
                margin: 0,
                fontSize: "0.83rem",
                fontWeight: 700,
                color: "#991b1b",
              }}
            >
              {t("reviewerNote")}
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.83rem",
                color: "#7f1d1d",
              }}
            >
              {application.admin_note}
            </p>
          </div>
        )}
        {application && (
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "0.78rem",
              color: "var(--color-text-muted)",
            }}
          >
            {t("submittedOn")} {fmtDate(application.submitted_at)}
            {application.reviewed_at && (
              <>
                {" "}
                · {t("reviewedOn")} {fmtDate(application.reviewed_at)}
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function KycPage() {
  const { user_id, authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("Kyc");

  const [kycStatus, setKycStatus] = useState<KycStatus>("unverified");
  const [application, setApplication] = useState<KycApplication | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const [step, setStep] = useState(0); // 0–3
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [form, setForm] = useState<FormData>({
    full_name: "",
    date_of_birth: "",
    nationality: "Cameroonian",
    phone: "",
    address: "",
    city: "",
    country: "Cameroon",
    document_type: "national_id",
    document_number: "",
  });

  const [docFront, setDocFront] = useState<File | null>(null);
  const [docBack, setDocBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const setField = (k: keyof FormData, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ── Load current KYC status ──────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    try {
      const res = await Axios.get(`${API}/kyc/status`, {
        withCredentials: true,
      });
      setKycStatus(res.data.kyc_status || "unverified");
      setApplication(res.data.application || null);
    } catch {
      /* ignore */
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user_id) router.replace("/login");
  }, [authLoading, user_id, router]);

  useEffect(() => {
    if (user_id) void loadStatus();
  }, [user_id, loadStatus]);

  // ── Step validation ────────────────────────────────────────────────────────
  const validateStep = () => {
    if (step === 0) {
      if (!form.full_name.trim() || form.full_name.length < 3)
        return t("errorFullName");
      if (!form.date_of_birth) return t("errorDob");
      if (!form.nationality.trim()) return t("errorNationality");
      if (!form.phone.trim()) return t("errorPhone");
      if (!form.address.trim()) return t("errorAddress");
      if (!form.city.trim()) return t("errorCity");
    }
    if (step === 1) {
      if (!form.document_number.trim()) return t("errorDocNumber");
      if (!docFront)
        return form.document_type === "passport"
          ? t("errorPassportDoc")
          : t("errorDocFront");
      if (form.document_type !== "passport" && !docBack)
        return t("errorDocBack");
    }
    if (step === 2) {
      if (!selfie) return t("errorSelfie");
    }
    return null;
  };

  const [stepError, setStepError] = useState("");

  const goNext = () => {
    const err = validateStep();
    if (err) {
      setStepError(err);
      return;
    }
    setStepError("");
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setStepError("");
    setStep((s) => Math.max(0, s - 1));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (docFront) fd.append("document_front", docFront, docFront.name);
      if (docBack) fd.append("document_back", docBack, docBack.name);
      if (selfie) fd.append("selfie", selfie, selfie.name);

      await Axios.post(`${API}/kyc/submit`, fd, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmitSuccess(true);
      setKycStatus("pending");
      await loadStatus();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setSubmitError(e.response?.data?.message || t("submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || statusLoading) {
    return (
      <>
        <SiteHeader />
        <main
          className="page-container"
          style={{ paddingTop: "3rem", textAlign: "center" }}
        >
          <Loader2
            size={32}
            style={{
              animation: "spin 1s linear infinite",
              color: "var(--color-primary)",
            }}
          />
        </main>
      </>
    );
  }

  const canResubmit = kycStatus === "rejected" || kycStatus === "unverified";
  const showForm = canResubmit && !submitSuccess;

  return (
    <>
      <SiteHeader />
      <main className="kyc-container">
        {/* Page header */}
        <div className="kyc-page-header">
          <div className="kyc-header-top">
            <div className="kyc-header-badge">
              <ShieldCheck size={20} color="#F59E0B" />
            </div>
            <div>
              <h1 className="kyc-header-title">{t("pageTitle")}</h1>
              <p className="kyc-header-subtitle">{t("pageSubtitle")}</p>
            </div>
          </div>

          {/* Why verify — collapsed info banner */}
          <div className="kyc-header-info">
            <Info
              size={16}
              style={{
                flexShrink: 0,
                marginTop: "2px",
                color: "var(--color-primary)",
              }}
            />
            <p>{t("whyVerify")}</p>
          </div>
        </div>

        {/* Status banner */}
        <StatusBanner status={kycStatus} application={application} />

        {/* Success state */}
        {submitSuccess && (
          <div className="kyc-success-box">
            <CheckCircle2
              size={56}
              color="#16a34a"
              style={{ marginBottom: "1rem" }}
            />
            <h2 style={{ color: "#166534" }}>{t("successTitle")}</h2>
            <p>{t("successBody")}</p>
            <button
              className="btn-primary"
              onClick={() => router.push("/dashboard")}
            >
              {t("goToDashboard")}
            </button>
          </div>
        )}

        {/* Approved — show nice badge display */}
        {kycStatus === "approved" && !submitSuccess && (
          <div className="kyc-success-box">
            <BadgeCheck
              size={60}
              color="#16a34a"
              style={{ marginBottom: "1rem" }}
            />
            <h2 style={{ color: "#166534" }}>{t("verifiedTitle")}</h2>
            <p>{t("verifiedBody")}</p>
          </div>
        )}

        {/* Pending — show status only */}
        {kycStatus === "pending" && !submitSuccess && (
          <div className="kyc-success-box">
            <Clock size={48} color="#F59E0B" style={{ marginBottom: "1rem" }} />
            <h2 style={{ color: "#92400e" }}>{t("pendingTitle")}</h2>
            <p>{t("pendingBody")}</p>
          </div>
        )}

        {/* Multi-step form */}
        {showForm && (
          <div
            style={{
              background: "var(--color-white)",
              border: "1px solid var(--color-border)",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              boxShadow: "0 2px 16px rgba(15,31,61,0.06)",
            }}
          >
            <StepBar step={step} total={4} />

            {/* ── Step 0: Personal Information ── */}
            {step === 0 && (
              <div style={{ display: "grid", gap: "1.125rem" }}>
                <SectionHeading
                  icon={<User size={18} />}
                  title={t("stepPersonal")}
                  subtitle={t("stepPersonalHint")}
                />
                <InputRow
                  label={t("fieldFullName")}
                  hint={t("fieldFullNameHint")}
                  required
                >
                  <input
                    className="form-input"
                    type="text"
                    placeholder={t("fieldFullNamePlaceholder")}
                    value={form.full_name}
                    onChange={(e) => setField("full_name", e.target.value)}
                    autoComplete="name"
                  />
                </InputRow>
                <div className="kyc-grid-2col">
                  <InputRow label={t("fieldDob")} required>
                    <input
                      className="form-input"
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) =>
                        setField("date_of_birth", e.target.value)
                      }
                      max={new Date(Date.now() - 16 * 365.25 * 864e5)
                        .toISOString()
                        .slice(0, 10)}
                    />
                  </InputRow>
                  <InputRow label={t("fieldNationality")} required>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Cameroonian"
                      value={form.nationality}
                      onChange={(e) => setField("nationality", e.target.value)}
                    />
                  </InputRow>
                </div>
                <InputRow
                  label={t("fieldPhone")}
                  hint={t("fieldPhoneHint")}
                  required
                >
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="+237 6XX XXX XXX"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    autoComplete="tel"
                  />
                </InputRow>
                <InputRow
                  label={t("fieldAddress")}
                  hint={t("fieldAddressHint")}
                  required
                >
                  <input
                    className="form-input"
                    type="text"
                    placeholder={t("fieldAddressPlaceholder")}
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    autoComplete="street-address"
                  />
                </InputRow>
                <div className="kyc-grid-2col">
                  <InputRow label={t("fieldCity")} required>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Douala"
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      autoComplete="address-level2"
                    />
                  </InputRow>
                  <InputRow label={t("fieldCountry")} required>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Cameroon"
                      value={form.country}
                      onChange={(e) => setField("country", e.target.value)}
                      autoComplete="country-name"
                    />
                  </InputRow>
                </div>
              </div>
            )}

            {/* ── Step 1: Document ── */}
            {step === 1 && (
              <div style={{ display: "grid", gap: "1.25rem" }}>
                <SectionHeading
                  icon={<FileText size={18} />}
                  title={t("stepDocument")}
                  subtitle={t("stepDocumentHint")}
                />

                {/* Document type selector */}
                <InputRow label={t("fieldDocType")} required>
                  <div style={{ display: "grid", gap: "0.6rem" }}>
                    {(
                      [
                        "national_id",
                        "drivers_license",
                        "passport",
                      ] as DocType[]
                    ).map((dt) => (
                      <label
                        key={dt}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.85rem 1rem",
                          borderRadius: "0.75rem",
                          cursor: "pointer",
                          border:
                            form.document_type === dt
                              ? "2px solid var(--color-primary)"
                              : "1.5px solid var(--color-border)",
                          background:
                            form.document_type === dt
                              ? "rgba(15,31,61,0.04)"
                              : "var(--color-white)",
                          transition: "border-color 0.2s, background 0.2s",
                        }}
                      >
                        <input
                          type="radio"
                          name="doc_type"
                          value={dt}
                          checked={form.document_type === dt}
                          onChange={() => {
                            setField("document_type", dt);
                            setDocBack(null);
                          }}
                          style={{ accentColor: "var(--color-primary)" }}
                        />
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: "var(--color-text-heading)",
                          }}
                        >
                          {DOC_LABELS[dt]}
                        </span>
                      </label>
                    ))}
                  </div>
                </InputRow>

                <InputRow
                  label={t("fieldDocNumber")}
                  hint={t("fieldDocNumberHint")}
                  required
                >
                  <input
                    className="form-input"
                    type="text"
                    placeholder={t("fieldDocNumberPlaceholder")}
                    value={form.document_number}
                    onChange={(e) =>
                      setField("document_number", e.target.value)
                    }
                  />
                </InputRow>

                {/* Front image */}
                <ImageUploadBox
                  label={
                    form.document_type === "passport"
                      ? t("fieldPassportDataPage")
                      : t("fieldDocFront")
                  }
                  hint={
                    form.document_type === "passport"
                      ? t("hintPassportDataPage")
                      : t("hintDocFront")
                  }
                  file={docFront}
                  onChange={setDocFront}
                  required
                />

                {/* Back image — not for passport */}
                {form.document_type !== "passport" && (
                  <ImageUploadBox
                    label={t("fieldDocBack")}
                    hint={t("hintDocBack")}
                    file={docBack}
                    onChange={setDocBack}
                    required
                  />
                )}
              </div>
            )}

            {/* ── Step 2: Selfie ── */}
            {step === 2 && (
              <div style={{ display: "grid", gap: "1.25rem" }}>
                <SectionHeading
                  icon={<Camera size={18} />}
                  title={t("stepSelfie")}
                  subtitle={t("stepSelfieHint")}
                />

                <div
                  style={{
                    background: "rgba(15,31,61,0.04)",
                    border: "1px solid rgba(15,31,61,0.1)",
                    borderRadius: "0.875rem",
                    padding: "1rem 1.125rem",
                    display: "flex",
                    gap: "0.625rem",
                  }}
                >
                  <AlertCircle
                    size={16}
                    style={{
                      flexShrink: 0,
                      marginTop: "2px",
                      color: "var(--color-primary)",
                    }}
                  />
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "1rem",
                      fontSize: "0.83rem",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.7,
                    }}
                  >
                    {(t.raw("selfieGuidelines") as string[]).map(
                      (g: string, i: number) => (
                        <li key={i}>{g}</li>
                      ),
                    )}
                  </ul>
                </div>

                <SelfieCaptureBox file={selfie} onChange={setSelfie} />
              </div>
            )}

            {/* ── Step 3: Review & Submit ── */}
            {step === 3 && (
              <div style={{ display: "grid", gap: "1.125rem" }}>
                <SectionHeading
                  icon={<CheckCircle2 size={18} />}
                  title={t("stepReview")}
                  subtitle={t("stepReviewHint")}
                />

                <ReviewRow label={t("fieldFullName")} value={form.full_name} />
                <ReviewRow
                  label={t("fieldDob")}
                  value={fmtDate(form.date_of_birth)}
                />
                <ReviewRow
                  label={t("fieldNationality")}
                  value={form.nationality}
                />
                <ReviewRow label={t("fieldPhone")} value={form.phone} />
                <ReviewRow
                  label={t("fieldAddress")}
                  value={`${form.address}, ${form.city}, ${form.country}`}
                />
                <ReviewRow
                  label={t("fieldDocType")}
                  value={DOC_LABELS[form.document_type]}
                />
                <ReviewRow
                  label={t("fieldDocNumber")}
                  value={form.document_number}
                />
                <ReviewRow
                  label={t("fieldDocFront")}
                  value={docFront ? `✓ ${docFront.name}` : "—"}
                />
                {form.document_type !== "passport" && (
                  <ReviewRow
                    label={t("fieldDocBack")}
                    value={docBack ? `✓ ${docBack.name}` : "—"}
                  />
                )}
                <ReviewRow
                  label={t("fieldSelfie")}
                  value={selfie ? `✓ ${selfie.name}` : "—"}
                />

                <div
                  style={{
                    marginTop: "0.5rem",
                    background: "rgba(15,31,61,0.03)",
                    border: "1px solid rgba(15,31,61,0.1)",
                    borderRadius: "0.75rem",
                    padding: "0.875rem 1rem",
                    fontSize: "0.8rem",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {t("consentNotice")}
                </div>
              </div>
            )}

            {/* Step error */}
            {stepError && (
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "flex-start",
                  background: "rgba(220,38,38,0.06)",
                  border: "1px solid rgba(220,38,38,0.2)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  color: "#991b1b",
                  fontSize: "0.875rem",
                }}
              >
                <AlertCircle
                  size={16}
                  style={{ flexShrink: 0, marginTop: "1px" }}
                />
                {stepError}
              </div>
            )}

            {/* Submit error */}
            {submitError && (
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "flex-start",
                  background: "rgba(220,38,38,0.06)",
                  border: "1px solid rgba(220,38,38,0.2)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  color: "#991b1b",
                  fontSize: "0.875rem",
                }}
              >
                <AlertCircle
                  size={16}
                  style={{ flexShrink: 0, marginTop: "1px" }}
                />
                {submitError}
              </div>
            )}

            {/* Navigation buttons */}
            <div
              className={`kyc-button-row ${step === 0 ? "kyc-button-row--start" : ""}`}
            >
              {step > 0 && (
                <button
                  type="button"
                  className="kyc-btn-secondary"
                  onClick={goBack}
                  disabled={submitting}
                >
                  <ChevronLeft size={16} />
                  {t("back")}
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={goNext}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  {t("next")}
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    minWidth: "160px",
                    justifyContent: "center",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      {t("submitting")}
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      {t("submit")}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="kyc-section-heading">
      <div className="kyc-section-icon">{icon}</div>
      <div>
        <p className="kyc-section-title">{title}</p>
        {subtitle && <p className="kyc-section-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}

function InputRow({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="kyc-form-row">
      <label
        className={`kyc-form-label ${required ? "kyc-form-label--required" : ""}`}
      >
        {label}
      </label>
      {hint && <p className="kyc-form-hint">{hint}</p>}
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="kyc-review-row">
      <span className="kyc-review-label">{label}</span>
      <span className="kyc-review-value">{value}</span>
    </div>
  );
}
