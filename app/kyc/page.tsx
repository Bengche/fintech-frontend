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
    if (!file) { setPreview(null); return; }
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label
        style={{
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "var(--color-text-heading)",
        }}
      >
        {label}
        {required && <span style={{ color: "#dc2626", marginLeft: "3px" }}>*</span>}
      </label>
      {hint && (
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
          {hint}
        </p>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0] ?? null);
        }}
        style={{
          border: preview ? "2px solid rgba(15,31,61,0.25)" : "2px dashed var(--color-border)",
          borderRadius: "1rem",
          minHeight: "140px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          overflow: "hidden",
          background: preview ? "#000" : "var(--color-bg-subtle, #f8fafc)",
          transition: "border-color 0.2s, background 0.2s",
          position: "relative",
        }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={label}
              style={{ width: "100%", height: "180px", objectFit: "contain" }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                right: "8px",
                background: "rgba(0,0,0,0.6)",
                borderRadius: "6px",
                padding: "4px 10px",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              Tap to change
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
            <Upload size={28} style={{ color: "var(--color-text-muted)", marginBottom: "0.5rem" }} />
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
              Tap to upload or drag & drop
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
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

// ── Step Progress Bar ─────────────────────────────────────────────────────────
function StepBar({ step, total }: { step: number; total: number }) {
  const t = useTranslations("Kyc");
  const labels = [t("stepPersonal"), t("stepDocument"), t("stepSelfie"), t("stepReview")];
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          marginBottom: "0.75rem",
          overflowX: "auto",
        }}
      >
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
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: 800,
                flexShrink: 0,
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
                transition: "background 0.3s",
              }}
            >
              {i < step ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            {i < total - 1 && (
              <div
                style={{
                  flex: 1,
                  height: "2px",
                  background:
                    i < step ? "var(--color-primary)" : "var(--color-border)",
                  margin: "0 4px",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        ))}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "0.8rem",
          color: "var(--color-text-muted)",
          fontWeight: 600,
        }}
      >
        {t("stepLabel", { current: step + 1, total })} — {labels[step]}
      </p>
    </div>
  );
}

// ── KYC Status Banner ─────────────────────────────────────────────────────────
function StatusBanner({ status, application }: { status: KycStatus; application: KycApplication | null }) {
  const t = useTranslations("Kyc");

  if (status === "unverified") return null;

  const configs: Record<Exclude<KycStatus, "unverified">, {
    bg: string; border: string; icon: React.ReactNode; color: string; title: string; body: string;
  }> = {
    pending: {
      bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)",
      icon: <Clock size={20} color="#92400e" />,
      color: "#92400e", title: t("statusPendingTitle"), body: t("statusPendingBody"),
    },
    approved: {
      bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.3)",
      icon: <BadgeCheck size={20} color="#166534" />,
      color: "#166534", title: t("statusApprovedTitle"), body: t("statusApprovedBody"),
    },
    rejected: {
      bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.3)",
      icon: <XCircle size={20} color="#991b1b" />,
      color: "#991b1b", title: t("statusRejectedTitle"), body: t("statusRejectedBody"),
    },
  };

  const cfg = configs[status as Exclude<KycStatus, "unverified">];

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        borderRadius: "1rem",
        padding: "1.125rem 1.25rem",
        marginBottom: "1.75rem",
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
      }}
    >
      <div style={{ flexShrink: 0, marginTop: "2px" }}>{cfg.icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 800, color: cfg.color, fontSize: "1rem" }}>
          {cfg.title}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          {cfg.body}
        </p>
        {application?.admin_note && status === "rejected" && (
          <div
            style={{
              marginTop: "0.75rem",
              background: "rgba(220,38,38,0.06)",
              border: "1px solid rgba(220,38,38,0.2)",
              borderRadius: "0.6rem",
              padding: "0.75rem 1rem",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 700, color: "#991b1b" }}>
              {t("reviewerNote")}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.83rem", color: "#7f1d1d" }}>
              {application.admin_note}
            </p>
          </div>
        )}
        {application && (
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
            {t("submittedOn")} {fmtDate(application.submitted_at)}
            {application.reviewed_at && (
              <> · {t("reviewedOn")} {fmtDate(application.reviewed_at)}</>
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
      const res = await Axios.get(`${API}/kyc/status`, { withCredentials: true });
      setKycStatus(res.data.kyc_status || "unverified");
      setApplication(res.data.application || null);
    } catch { /* ignore */ } finally {
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
      if (!docFront) return form.document_type === "passport" ? t("errorPassportDoc") : t("errorDocFront");
      if (form.document_type !== "passport" && !docBack) return t("errorDocBack");
    }
    if (step === 2) {
      if (!selfie) return t("errorSelfie");
    }
    return null;
  };

  const [stepError, setStepError] = useState("");

  const goNext = () => {
    const err = validateStep();
    if (err) { setStepError(err); return; }
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
      if (docBack)  fd.append("document_back",  docBack,  docBack.name);
      if (selfie)   fd.append("selfie",          selfie,   selfie.name);

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
        <main className="page-container" style={{ paddingTop: "3rem", textAlign: "center" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)" }} />
        </main>
      </>
    );
  }

  const canResubmit = kycStatus === "rejected" || kycStatus === "unverified";
  const showForm = (canResubmit || kycStatus === "unverified") && !submitSuccess;

  return (
    <>
      <SiteHeader />
      <main
        className="page-container"
        style={{
          maxWidth: "640px",
          marginInline: "auto",
          paddingTop: "2rem",
          paddingBottom: "4rem",
          paddingInline: "1rem",
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                width: "2.75rem",
                height: "2.75rem",
                borderRadius: "0.875rem",
                background: "linear-gradient(135deg, #0F1F3D 0%, #1e3a5f 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={20} color="#F59E0B" />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: "var(--color-text-heading)",
                  lineHeight: 1.2,
                }}
              >
                {t("pageTitle")}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                }}
              >
                {t("pageSubtitle")}
              </p>
            </div>
          </div>

          {/* Why verify — collapsed info banner */}
          <div
            style={{
              marginTop: "1rem",
              background: "linear-gradient(135deg, rgba(15,31,61,0.04), rgba(245,158,11,0.08))",
              border: "1px solid rgba(15,31,61,0.1)",
              borderRadius: "0.875rem",
              padding: "0.875rem 1rem",
              display: "flex",
              gap: "0.625rem",
              alignItems: "flex-start",
            }}
          >
            <Info size={16} style={{ flexShrink: 0, marginTop: "2px", color: "var(--color-primary)" }} />
            <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
              {t("whyVerify")}
            </p>
          </div>
        </div>

        {/* Status banner */}
        <StatusBanner status={kycStatus} application={application} />

        {/* Success state */}
        {submitSuccess && (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1.5rem",
              background: "rgba(22,163,74,0.05)",
              border: "1.5px solid rgba(22,163,74,0.25)",
              borderRadius: "1.25rem",
            }}
          >
            <CheckCircle2 size={56} color="#16a34a" style={{ marginBottom: "1rem" }} />
            <h2 style={{ margin: "0 0 0.5rem", color: "#166534", fontSize: "1.35rem", fontWeight: 800 }}>
              {t("successTitle")}
            </h2>
            <p style={{ margin: "0 0 1.5rem", color: "var(--color-text-muted)", lineHeight: 1.6, fontSize: "0.925rem" }}>
              {t("successBody")}
            </p>
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
          <div
            style={{
              textAlign: "center",
              padding: "2.5rem 1.5rem",
              background: "rgba(22,163,74,0.05)",
              border: "1.5px solid rgba(22,163,74,0.2)",
              borderRadius: "1.25rem",
            }}
          >
            <BadgeCheck size={60} color="#16a34a" style={{ marginBottom: "1rem" }} />
            <h2 style={{ margin: "0 0 0.5rem", color: "#166534", fontSize: "1.25rem", fontWeight: 800 }}>
              {t("verifiedTitle")}
            </h2>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              {t("verifiedBody")}
            </p>
          </div>
        )}

        {/* Pending — show status only */}
        {kycStatus === "pending" && !submitSuccess && (
          <div
            style={{
              textAlign: "center",
              padding: "2rem 1.5rem",
              background: "rgba(245,158,11,0.05)",
              border: "1.5px solid rgba(245,158,11,0.2)",
              borderRadius: "1.25rem",
            }}
          >
            <Clock size={48} color="#F59E0B" style={{ marginBottom: "1rem" }} />
            <h2 style={{ margin: "0 0 0.5rem", color: "#92400e", fontSize: "1.1rem", fontWeight: 800 }}>
              {t("pendingTitle")}
            </h2>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>
              {t("pendingBody")}
            </p>
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
                <SectionHeading icon={<User size={18} />} title={t("stepPersonal")} subtitle={t("stepPersonalHint")} />
                <InputRow label={t("fieldFullName")} hint={t("fieldFullNameHint")} required>
                  <input
                    className="form-input"
                    type="text"
                    placeholder={t("fieldFullNamePlaceholder")}
                    value={form.full_name}
                    onChange={(e) => setField("full_name", e.target.value)}
                    autoComplete="name"
                  />
                </InputRow>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <InputRow label={t("fieldDob")} required>
                    <input
                      className="form-input"
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) => setField("date_of_birth", e.target.value)}
                      max={new Date(Date.now() - 16 * 365.25 * 864e5).toISOString().slice(0, 10)}
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
                <InputRow label={t("fieldPhone")} hint={t("fieldPhoneHint")} required>
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="+237 6XX XXX XXX"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    autoComplete="tel"
                  />
                </InputRow>
                <InputRow label={t("fieldAddress")} hint={t("fieldAddressHint")} required>
                  <input
                    className="form-input"
                    type="text"
                    placeholder={t("fieldAddressPlaceholder")}
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    autoComplete="street-address"
                  />
                </InputRow>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
                <SectionHeading icon={<FileText size={18} />} title={t("stepDocument")} subtitle={t("stepDocumentHint")} />

                {/* Document type selector */}
                <InputRow label={t("fieldDocType")} required>
                  <div style={{ display: "grid", gap: "0.6rem" }}>
                    {(["national_id", "drivers_license", "passport"] as DocType[]).map((dt) => (
                      <label
                        key={dt}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.85rem 1rem",
                          borderRadius: "0.75rem",
                          cursor: "pointer",
                          border: form.document_type === dt
                            ? "2px solid var(--color-primary)"
                            : "1.5px solid var(--color-border)",
                          background: form.document_type === dt
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
                        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text-heading)" }}>
                          {DOC_LABELS[dt]}
                        </span>
                      </label>
                    ))}
                  </div>
                </InputRow>

                <InputRow label={t("fieldDocNumber")} hint={t("fieldDocNumberHint")} required>
                  <input
                    className="form-input"
                    type="text"
                    placeholder={t("fieldDocNumberPlaceholder")}
                    value={form.document_number}
                    onChange={(e) => setField("document_number", e.target.value)}
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
                <SectionHeading icon={<Camera size={18} />} title={t("stepSelfie")} subtitle={t("stepSelfieHint")} />

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
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px", color: "var(--color-primary)" }} />
                  <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.83rem", color: "var(--color-text-muted)", lineHeight: 1.7 }}>
                    {(t.raw("selfieGuidelines") as string[]).map((g: string, i: number) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>

                <ImageUploadBox
                  label={t("fieldSelfie")}
                  hint={t("hintSelfie")}
                  file={selfie}
                  onChange={setSelfie}
                  required
                />
              </div>
            )}

            {/* ── Step 3: Review & Submit ── */}
            {step === 3 && (
              <div style={{ display: "grid", gap: "1.125rem" }}>
                <SectionHeading icon={<CheckCircle2 size={18} />} title={t("stepReview")} subtitle={t("stepReviewHint")} />

                <ReviewRow label={t("fieldFullName")}    value={form.full_name} />
                <ReviewRow label={t("fieldDob")}         value={fmtDate(form.date_of_birth)} />
                <ReviewRow label={t("fieldNationality")} value={form.nationality} />
                <ReviewRow label={t("fieldPhone")}       value={form.phone} />
                <ReviewRow label={t("fieldAddress")}     value={`${form.address}, ${form.city}, ${form.country}`} />
                <ReviewRow label={t("fieldDocType")}     value={DOC_LABELS[form.document_type]} />
                <ReviewRow label={t("fieldDocNumber")}   value={form.document_number} />
                <ReviewRow label={t("fieldDocFront")}    value={docFront ? `✓ ${docFront.name}` : "—"} />
                {form.document_type !== "passport" && (
                  <ReviewRow label={t("fieldDocBack")} value={docBack ? `✓ ${docBack.name}` : "—"} />
                )}
                <ReviewRow label={t("fieldSelfie")}     value={selfie ? `✓ ${selfie.name}` : "—"} />

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
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
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
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
                {submitError}
              </div>
            )}

            {/* Navigation buttons */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                marginTop: "1.5rem",
                justifyContent: step === 0 ? "flex-end" : "space-between",
              }}
            >
              {step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={submitting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "0.75rem",
                    border: "1.5px solid var(--color-border)",
                    background: "var(--color-white)",
                    color: "var(--color-text-heading)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
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
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
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
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "160px", justifyContent: "center" }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
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
function SectionHeading({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
        paddingBottom: "0.875rem",
        borderBottom: "1px solid var(--color-border)",
        marginBottom: "0.25rem",
      }}
    >
      <div
        style={{
          width: "2.25rem",
          height: "2.25rem",
          borderRadius: "0.6rem",
          background: "rgba(15,31,61,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-primary)",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontWeight: 800, color: "var(--color-text-heading)", fontSize: "1rem" }}>
          {title}
        </p>
        {subtitle && (
          <p style={{ margin: "3px 0 0", fontSize: "0.83rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label
        style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-heading)" }}
      >
        {label}
        {required && <span style={{ color: "#dc2626", marginLeft: "3px" }}>*</span>}
      </label>
      {hint && (
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "0.7rem 0",
        borderBottom: "1px solid var(--color-border)",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: "0.875rem",
          color: "var(--color-text-heading)",
          fontWeight: 700,
          wordBreak: "break-all",
          textAlign: "right",
          maxWidth: "60%",
        }}
      >
        {value}
      </span>
    </div>
  );
}
