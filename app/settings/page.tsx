"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Axios from "axios";
import SiteHeader from "../components/SiteHeader";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "next-intl";
import { usePasskey } from "@/hooks/usePasskey";
import EmailLanguageForm from "./EmailLanguageForm";
import {
  Fingerprint,
  Loader2,
  Trash2,
  Plus,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { BadgeCheck, ShieldAlert, Clock } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  username: string;
  profilepicture: string | null;
  country: string | null;
  preferred_email_language?: "en" | "fr";
  bio?: string;
  tags?: string[];
};

// â”€â”€ Shared feedback component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Feedback({
  msg,
}: {
  msg: { type: "success" | "error"; text: string } | null;
}) {
  if (!msg) return null;
  return (
    <div
      className={`alert alert-${msg.type === "success" ? "success" : "danger"}`}
      style={{ marginBottom: "1.25rem" }}
    >
      {msg.text}
    </div>
  );
}

// â”€â”€ Section card wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="card settings-section"
      style={{ padding: "2rem", marginBottom: "1.5rem" }}
    >
      <h2
        className="settings-section-title"
        style={{
          fontSize: "1.0625rem",
          fontWeight: 700,
          color: "var(--color-text-heading)",
          margin: "0 0 0.25rem",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="settings-section-subtitle"
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            margin: "0 0 1.5rem",
          }}
        >
          {subtitle}
        </p>
      )}
      {!subtitle && <div style={{ marginBottom: "1.5rem" }} />}
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user_id, authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("Settings");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (user_id === null) {
      router.replace("/login");
      return;
    }
    if (!user_id) return;

    Axios.get(`${API}/profile/user-info/${user_id}`, { withCredentials: true })
      .then(async (res) => {
        const username = res.data.username;
        const profileRes = await Axios.get(`${API}/profile/${username}`);
        setProfile(profileRes.data.seller);
      })
      .catch(() => setLoadError(t("loadError")));
  }, [authLoading, user_id, router, t]);

  if (authLoading || !user_id) return null;

  if (loadError)
    return (
      <>
        <SiteHeader />
        <main
          className="settings-page"
          style={{
            backgroundColor: "var(--color-cloud)",
            minHeight: "calc(100vh - 8rem)",
            padding: "3rem 1.5rem",
          }}
        >
          <div
            className="alert alert-danger"
            style={{ maxWidth: 480, margin: "4rem auto" }}
          >
            {loadError}
          </div>
        </main>
      </>
    );

  return (
    <>
      <SiteHeader />
      <main
        className="settings-page"
        style={{
          backgroundColor: "var(--color-cloud)",
          minHeight: "calc(100vh - 8rem)",
          padding: "3rem 1.5rem",
        }}
      >
        <div
          className="page-wrapper settings-shell"
          style={{ maxWidth: "680px" }}
        >
          <h1
            className="settings-title"
            style={{
              fontSize: "1.625rem",
              fontWeight: 800,
              color: "var(--color-text-heading)",
              marginBottom: "0.375rem",
            }}
          >
            {t("title")}
          </h1>
          <p
            className="settings-subtitle"
            style={{
              fontSize: "0.9375rem",
              color: "var(--color-text-muted)",
              marginBottom: "2.5rem",
            }}
          >
            {t("subtitle")}
          </p>

          {profile?.username && (
            <PublicProfileLinkSection username={profile.username} />
          )}

          <UpdateNameForm
            current={profile?.name ?? ""}
            onSaved={(name) => setProfile((p) => (p ? { ...p, name } : p))}
          />
          <UpdateEmailForm
            current={profile?.email ?? ""}
            onSaved={(email) => setProfile((p) => (p ? { ...p, email } : p))}
          />
          <UpdateProfilePictureForm
            current={profile?.profilepicture ?? null}
            onSaved={(pic) =>
              setProfile((p) => (p ? { ...p, profilepicture: pic } : p))
            }
          />
          <UpdatePhoneForm
            current={profile?.phone ?? ""}
            onSaved={(phone) => setProfile((p) => (p ? { ...p, phone } : p))}
          />
          <BioTagsForm
            currentBio={profile?.bio ?? ""}
            currentTags={profile?.tags ?? []}
            onSaved={(bio, tags) =>
              setProfile((p) => (p ? { ...p, bio, tags } : p))
            }
          />
          <EmailLanguageForm
            current={profile?.preferred_email_language ?? "en"}
            onSaved={(preferred_email_language) =>
              setProfile((p) => (p ? { ...p, preferred_email_language } : p))
            }
          />
          <ChangePasswordForm />
          <TwoFactorSection />
          <KycStatusSection />
          <SessionManagerSection />
          <PasskeySection />
          <DeleteAccountSection />
        </div>
      </main>
    </>
  );
}

// ── Bio & Tags Form ──────────────────────────────────────────────────────────
function BioTagsForm({
  currentBio,
  currentTags,
  onSaved,
}: {
  currentBio: string;
  currentTags: string[];
  onSaved: (bio: string, tags: string[]) => void;
}) {
  const t = useTranslations("Settings");
  const [bio, setBio] = useState(currentBio);
  const [tags, setTags] = useState<string[]>(currentTags);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Sync initial values when profile loads
  useEffect(() => {
    setBio(currentBio);
    setTags(currentTags);
  }, [currentBio, currentTags]);

  const addTag = () => {
    const trimmed = tagInput.trim().slice(0, 40);
    if (!trimmed || tags.length >= 10 || tags.includes(trimmed)) return;
    setTags((prev) => [...prev, trimmed]);
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      await Axios.patch(
        `${API}/profile/bio-tags`,
        { bio: bio.trim(), tags },
        { withCredentials: true },
      );
      setFeedback({ type: "success", text: t("bioTags.success") });
      onSaved(bio.trim(), tags);
    } catch {
      setFeedback({ type: "error", text: t("bioTags.error") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      title={t("bioTags.sectionTitle")}
      subtitle={t("bioTags.sectionSubtitle")}
    >
      <form
        onSubmit={handleSave}
        style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.375rem",
            }}
          >
            <label
              className="settings-label"
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-heading)",
              }}
            >
              {t("bioTags.bioLabel")}
            </label>
            <span
              style={{
                fontSize: "0.78rem",
                color: bio.length > 140 ? "#dc2626" : "var(--color-text-muted)",
              }}
            >
              {t("bioTags.bioCounter", { count: String(bio.length) })}
            </span>
          </div>
          <textarea
            className="input"
            placeholder={t("bioTags.bioPlaceholder")}
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            maxLength={160}
            style={{
              minHeight: "80px",
              resize: "vertical",
              fontSize: "0.9rem",
            }}
          />
        </div>

        <div>
          <label
            className="settings-label"
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--color-text-heading)",
              display: "block",
              marginBottom: "0.5rem",
            }}
          >
            {t("bioTags.tagsLabel")}
          </label>
          {tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.4rem",
                marginBottom: "0.625rem",
              }}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "999px",
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    color: "var(--color-accent)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={t("bioTags.removeTag")}
                    onClick={() => removeTag(tag)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: "inherit",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "1rem",
                      lineHeight: 1,
                      opacity: 0.7,
                    }}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
          {tags.length < 10 && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                className="input"
                placeholder={t("bioTags.tagsPlaceholder")}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                maxLength={40}
                style={{ flex: 1, fontSize: "0.9rem" }}
              />
              <button
                type="button"
                className="btn-ghost"
                onClick={addTag}
                disabled={!tagInput.trim()}
              >
                {t("bioTags.addTag")}
              </button>
            </div>
          )}
        </div>

        <Feedback msg={feedback} />
        <button
          className="btn-primary"
          type="submit"
          disabled={saving}
          style={{ alignSelf: "flex-start" }}
        >
          {saving ? t("bioTags.saving") : t("bioTags.save")}
        </button>
      </form>
    </Section>
  );
}

function PublicProfileLinkSection({ username }: { username: string }) {
  const t = useTranslations("Settings");
  const [copied, setCopied] = useState(false);

  const profilePath = `/seller/${username}`;
  const profileUrl =
    typeof window === "undefined"
      ? `https://fonlok.com${profilePath}`
      : `${window.location.origin}${profilePath}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    t("publicProfile.whatsappText", { url: profileUrl }),
  )}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(profileUrl);
      } else {
        const area = document.createElement("textarea");
        area.value = profileUrl;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.focus();
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard failures quietly
    }
  };

  return (
    <Section
      title={t("publicProfile.sectionTitle")}
      subtitle={t("publicProfile.sectionSubtitle")}
    >
      <div
        className="settings-link-row"
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.875rem 1rem",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-white)",
          marginBottom: "0.875rem",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "monospace",
            color: "var(--color-text-heading)",
            fontSize: "0.825rem",
            wordBreak: "break-all",
          }}
        >
          {profileUrl}
        </p>
        <button className="btn-ghost" type="button" onClick={handleCopy}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? t("publicProfile.copied") : t("publicProfile.copy")}
        </button>
      </div>

      <div
        className="settings-link-actions"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.625rem",
          flexWrap: "wrap",
        }}
      >
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer noopener"
          style={{ textDecoration: "none" }}
        >
          <button className="btn-accent" type="button">
            <MessageCircle size={15} />
            {t("publicProfile.whatsapp")}
          </button>
        </a>
        <Link href={profilePath} target="_blank" rel="noreferrer noopener">
          <button className="btn-primary" type="button">
            <ExternalLink size={15} />
            {t("publicProfile.open")}
          </button>
        </Link>
      </div>
    </Section>
  );
}

// ── KYC Status Section ────────────────────────────────────────────────────────
function KycStatusSection() {
  const t = useTranslations("Settings");
  const [kycStatus, setKycStatus] = useState<string>("unverified");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Axios.get(`${API}/kyc/status`, { withCredentials: true })
      .then((res) => setKycStatus(res.data.kyc_status || "unverified"))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const badge = () => {
    if (loading) return null;
    if (kycStatus === "approved")
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.28rem 0.75rem",
            borderRadius: "999px",
            background: "rgba(22,163,74,0.1)",
            border: "1.5px solid rgba(22,163,74,0.3)",
            color: "#166534",
            fontSize: "0.78rem",
            fontWeight: 800,
          }}
        >
          <BadgeCheck size={13} /> {t("kyc.statusApproved")}
        </span>
      );
    if (kycStatus === "pending")
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.28rem 0.75rem",
            borderRadius: "999px",
            background: "rgba(245,158,11,0.1)",
            border: "1.5px solid rgba(245,158,11,0.3)",
            color: "#92400e",
            fontSize: "0.78rem",
            fontWeight: 800,
          }}
        >
          <Clock size={13} /> {t("kyc.statusPending")}
        </span>
      );
    if (kycStatus === "rejected")
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.28rem 0.75rem",
            borderRadius: "999px",
            background: "rgba(220,38,38,0.08)",
            border: "1.5px solid rgba(220,38,38,0.2)",
            color: "#991b1b",
            fontSize: "0.78rem",
            fontWeight: 800,
          }}
        >
          <ShieldAlert size={13} /> {t("kyc.statusRejected")}
        </span>
      );
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.28rem 0.75rem",
          borderRadius: "999px",
          background: "rgba(100,116,139,0.08)",
          border: "1.5px solid rgba(100,116,139,0.2)",
          color: "#475569",
          fontSize: "0.78rem",
          fontWeight: 700,
        }}
      >
        <ShieldAlert size={13} /> {t("kyc.statusUnverified")}
      </span>
    );
  };

  return (
    <Section title={t("kyc.sectionTitle")} subtitle={t("kyc.sectionSubtitle")}>
      <div
        className="settings-kyc-row"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          padding: "1rem 1.125rem",
          borderRadius: "0.875rem",
          background:
            kycStatus === "approved"
              ? "rgba(22,163,74,0.05)"
              : "linear-gradient(135deg, rgba(15,31,61,0.04), rgba(245,158,11,0.08))",
          border:
            kycStatus === "approved"
              ? "1.5px solid rgba(22,163,74,0.2)"
              : "1px solid rgba(15,31,61,0.08)",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              color: "var(--color-text-heading)",
              fontSize: "0.95rem",
            }}
          >
            {t("kyc.verificationStatus")}
          </p>
          <div style={{ marginTop: "0.4rem" }}>{badge()}</div>
        </div>
        {kycStatus !== "approved" && (
          <Link href="/kyc" style={{ textDecoration: "none" }}>
            <button
              className="btn-primary settings-inline-cta"
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.875rem",
              }}
            >
              <ShieldCheck size={15} />
              {kycStatus === "rejected"
                ? t("kyc.resubmit")
                : kycStatus === "pending"
                  ? t("kyc.viewStatus")
                  : t("kyc.getVerified")}
            </button>
          </Link>
        )}
      </div>
    </Section>
  );
}

function SessionManagerSection() {
  const t = useTranslations("Settings");

  return (
    <Section
      title={t("sessions.sectionTitle")}
      subtitle={t("sessions.sectionSubtitle")}
    >
      <Link
        href="/settings/sessions"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1rem 1.125rem",
          borderRadius: "0.875rem",
          background:
            "linear-gradient(135deg, rgba(15,31,61,0.05), rgba(245,158,11,0.12))",
          border: "1px solid rgba(15,31,61,0.08)",
          textDecoration: "none",
          transition: "box-shadow 0.15s, border-color 0.15s",
        }}
        className="settings-sessions-link"
      >
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "0.8rem",
              background: "rgba(15,31,61,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary)",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                color: "var(--color-text-heading)",
                fontSize: "0.95rem",
              }}
            >
              {t("sessions.manageLink")}
            </p>
            <p
              style={{
                margin: "0.15rem 0 0",
                color: "var(--color-text-muted)",
                fontSize: "0.84rem",
                lineHeight: 1.5,
              }}
            >
              {t("sessions.manageLinkHint")}
            </p>
          </div>
        </div>
        <ExternalLink
          size={16}
          style={{ color: "var(--color-text-muted)", flexShrink: 0 }}
        />
      </Link>
    </Section>
  );
}

// â”€â”€ 1. Update name â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function UpdateNameForm({
  current,
  onSaved,
}: {
  current: string;
  onSaved: (name: string) => void;
}) {
  const [name, setName] = useState(current);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const t = useTranslations("Settings");

  useEffect(() => {
    if (current) setName(current);
  }, [current]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await Axios.patch(
        `${API}/user/update-name`,
        { name: name.trim() },
        { withCredentials: true },
      );
      onSaved(res.data.name);
      setMsg({ type: "success", text: t("name.success") });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: e.response?.data?.message || t("name.error"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title={t("name.sectionTitle")}>
      <Feedback msg={msg} />
      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-field" style={{ marginBottom: "1.25rem" }}>
          <label className="label" htmlFor="s-name">
            {t("name.label")}
          </label>
          <input
            id="s-name"
            className="input"
            type="text"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t("name.saving") : t("name.save")}
        </button>
      </form>
    </Section>
  );
}

// â”€â”€ 2. Update email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function UpdateEmailForm({
  current,
  onSaved,
}: {
  current: string;
  onSaved: (email: string) => void;
}) {
  const [email, setEmail] = useState(current);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const t = useTranslations("Settings");

  useEffect(() => {
    if (current) setEmail(current);
  }, [current]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await Axios.patch(
        `${API}/user/update-email`,
        { email },
        { withCredentials: true },
      );
      onSaved(res.data.email);
      setMsg({ type: "success", text: t("email.success") });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: e.response?.data?.message || t("email.error"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title={t("email.sectionTitle")}>
      <Feedback msg={msg} />
      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-field" style={{ marginBottom: "1.25rem" }}>
          <label className="label" htmlFor="s-email">
            {t("email.label")}
          </label>
          <input
            id="s-email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t("email.saving") : t("email.save")}
        </button>
      </form>
    </Section>
  );
}

// â”€â”€ 3. Update profile picture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function UpdateProfilePictureForm({
  current,
  onSaved,
}: {
  current: string | null;
  onSaved: (filename: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("Settings");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setMsg({ type: "error", text: t("picture.sizeError") });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setMsg(null);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await Axios.patch(
        `${API}/user/update-profile-picture`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      onSaved(res.data.profilepicture);
      setMsg({ type: "success", text: t("picture.success") });
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: e.response?.data?.message || t("picture.error"),
      });
    } finally {
      setLoading(false);
    }
  };

  const avatarSrc = preview
    ? preview
    : current
      ? current.startsWith("http")
        ? current
        : `${API}/uploads/${current}`
      : null;

  return (
    <Section
      title={t("picture.sectionTitle")}
      subtitle={t("picture.sectionSubtitle")}
    >
      <Feedback msg={msg} />
      <form className="settings-form" onSubmit={handleSubmit}>
        <div
          className="settings-avatar-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          <div
            className="settings-avatar-preview"
            style={{
              width: 72,
              height: 72,
              borderRadius: "9999px",
              overflow: "hidden",
              border: "2px solid var(--color-border)",
              flexShrink: 0,
              backgroundColor: "var(--color-primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--color-primary)",
            }}
          >
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              "?"
            )}
          </div>

          <div className="settings-avatar-controls" style={{ flex: 1 }}>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              id="pic-input"
              onChange={handleFile}
            />
            <label
              htmlFor="pic-input"
              className="btn-ghost"
              style={{ cursor: "pointer", display: "inline-block" }}
            >
              {t("picture.chooseImage")}
            </label>
            {file && (
              <p
                style={{
                  margin: "0.375rem 0 0",
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                }}
              >
                {file.name}
              </p>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !file}
        >
          {loading ? t("picture.uploading") : t("picture.save")}
        </button>
      </form>
    </Section>
  );
}

// â”€â”€ 4. Update phone â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function UpdatePhoneForm({
  current,
  onSaved,
}: {
  current: string;
  onSaved: (phone: string) => void;
}) {
  const rawInitial = current?.startsWith("237")
    ? current.slice(3)
    : (current ?? "");
  const [local, setLocal] = useState(rawInitial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const t = useTranslations("Settings");

  useEffect(() => {
    setLocal(current?.startsWith("237") ? current.slice(3) : (current ?? ""));
  }, [current]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const phone = `237${local.replace(/\D/g, "")}`;
    try {
      const res = await Axios.patch(
        `${API}/user/update-phone`,
        { phone },
        { withCredentials: true },
      );
      onSaved(res.data.phone);
      setMsg({ type: "success", text: t("phone.success") });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: e.response?.data?.message || t("phone.error"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section
      title={t("phone.sectionTitle")}
      subtitle={t("phone.sectionSubtitle")}
    >
      <Feedback msg={msg} />
      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-field" style={{ marginBottom: "1.25rem" }}>
          <label className="label" htmlFor="s-phone">
            {t("phone.label")}
          </label>
          <div
            className="settings-phone-wrap"
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              background: "var(--color-white)",
            }}
          >
            <span
              className="settings-phone-prefix"
              style={{
                padding: "0.625rem 0.75rem",
                background: "var(--color-cloud)",
                color: "var(--color-text-muted)",
                fontSize: "0.9rem",
                borderRight: "1px solid var(--color-border)",
                whiteSpace: "nowrap",
              }}
            >
              +237
            </span>
            <input
              className="settings-phone-input"
              id="s-phone"
              type="tel"
              placeholder={t("phone.inputPlaceholder")}
              maxLength={9}
              value={local}
              onChange={(e) => setLocal(e.target.value.replace(/\D/g, ""))}
              style={{
                border: "none",
                outline: "none",
                padding: "0.625rem 0.75rem",
                fontSize: "0.9375rem",
                flex: 1,
                width: 0,
              }}
              required
            />
          </div>
          <p
            style={{
              margin: "0.375rem 0 0",
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
            }}
          >
            {t("phone.hint")}
          </p>
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t("phone.saving") : t("phone.save")}
        </button>
      </form>
    </Section>
  );
}

// â”€â”€ 5. Change password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChangePasswordForm() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const t = useTranslations("Settings");

  const update =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setMsg({ type: "error", text: t("password.mismatch") });
      return;
    }
    if (form.next.length < 8) {
      setMsg({
        type: "error",
        text: t("password.tooShort"),
      });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      await Axios.patch(
        `${API}/user/change-password`,
        { current_password: form.current, new_password: form.next },
        { withCredentials: true },
      );
      setMsg({ type: "success", text: t("password.success") });
      setForm({ current: "", next: "", confirm: "" });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: e.response?.data?.message || t("password.error"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title={t("password.sectionTitle")}>
      <form className="settings-form" onSubmit={handleSubmit}>
        <div
          className="settings-password-grid"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.125rem",
            marginBottom: "1.5rem",
          }}
        >
          {[
            {
              id: "cp-cur",
              label: t("password.currentLabel"),
              key: "current" as const,
              placeholder: t("password.currentPlaceholder"),
            },
            {
              id: "cp-new",
              label: t("password.newLabel"),
              key: "next" as const,
              placeholder: t("password.newPlaceholder"),
            },
            {
              id: "cp-con",
              label: t("password.confirmLabel"),
              key: "confirm" as const,
              placeholder: t("password.confirmPlaceholder"),
            },
          ].map((f) => (
            <div key={f.id}>
              <label className="label" htmlFor={f.id}>
                {f.label}
              </label>
              <input
                id={f.id}
                className="input"
                type="password"
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={update(f.key)}
                required
              />
            </div>
          ))}
        </div>
        <Feedback msg={msg} />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t("password.saving") : t("password.save")}
        </button>
      </form>
    </Section>
  );
}

// â”€â”€ 6. Delete account â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// ── Biometrics & Passkeys ────────────────────────────────────────────────────
// ── Two-Factor Authentication ────────────────────────────────────────────────
function TwoFactorSection() {
  const t = useTranslations("Settings");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    Axios.get(`${API}/user/two-factor`, { withCredentials: true })
      .then((res) => setEnabled(Boolean(res.data.two_factor_enabled)))
      .catch(() => setMsg({ type: "error", text: t("twoFactor.loadError") }))
      .finally(() => setLoading(false));
  }, [t]);

  const toggleTwoFactor = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await Axios.patch(
        `${API}/user/two-factor`,
        { enabled: !enabled },
        { withCredentials: true },
      );
      setEnabled(Boolean(res.data.two_factor_enabled));
      setMsg({
        type: "success",
        text: !enabled
          ? t("twoFactor.enabledSuccess")
          : t("twoFactor.disabledSuccess"),
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: e.response?.data?.message || t("twoFactor.error"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      title={t("twoFactor.sectionTitle")}
      subtitle={t("twoFactor.sectionSubtitle")}
    >
      <Feedback msg={msg} />
      <div className="settings-2fa-panel">
        <div className="settings-2fa-copy">
          <p className="settings-2fa-title">
            {enabled ? t("twoFactor.onTitle") : t("twoFactor.offTitle")}
          </p>
          <p className="settings-2fa-body">
            {enabled ? t("twoFactor.onBody") : t("twoFactor.offBody")}
          </p>
          <div className={`settings-2fa-badge ${enabled ? "is-on" : "is-off"}`}>
            {enabled ? <BadgeCheck size={13} /> : <Clock size={13} />}
            {enabled ? t("twoFactor.enabled") : t("twoFactor.disabled")}
          </div>
        </div>

        <button
          type="button"
          className={`btn-primary settings-2fa-btn ${enabled ? "settings-2fa-btn-off" : ""}`}
          onClick={toggleTwoFactor}
          disabled={loading || saving}
          style={{ justifyContent: "center" }}
        >
          {saving
            ? t("twoFactor.saving")
            : enabled
              ? t("twoFactor.disable")
              : t("twoFactor.enable")}
        </button>
      </div>
      <p className="settings-2fa-note">{t("twoFactor.note")}</p>
    </Section>
  );
}

// ── Biometrics & Passkeys ────────────────────────────────────────────────────
function PasskeySection() {
  const {
    isAvailable,
    checkingAvailability,
    registerPasskey,
    registerLoading,
    registerError,
    passkeys,
    listLoading,
    refreshPasskeys,
    removePasskey,
    removeLoading,
  } = usePasskey();

  const [deviceName, setDeviceName] = useState("");
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    refreshPasskeys();
  }, [refreshPasskeys]);

  if (checkingAvailability) return null;
  if (!isAvailable) return null;

  return (
    <Section
      title="Face ID / Fingerprint Login"
      subtitle="Sign in instantly with your fingerprint, Face ID, or Windows Hello — no password needed."
    >
      {listLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--color-text-muted)",
            fontSize: "0.875rem",
          }}
        >
          <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
          Loading\u2026
        </div>
      ) : passkeys.length === 0 ? (
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            marginBottom: "1rem",
          }}
        >
          No passkeys registered yet on this account.
        </p>
      ) : (
        <ul
          className="settings-passkey-list"
          style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem" }}
        >
          {passkeys.map((pk) => (
            <li
              key={pk.id}
              className="settings-passkey-item"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                background: "var(--color-cloud, #f8fafc)",
                marginBottom: "0.625rem",
                border: "1px solid var(--color-border, #e2e8f0)",
              }}
            >
              <div
                className="settings-passkey-main"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                }}
              >
                <Fingerprint size={18} color="var(--color-primary)" />
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      color: "var(--color-text-heading)",
                    }}
                  >
                    {pk.device_name ?? "Unnamed device"}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8125rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Added {new Date(pk.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removePasskey(pk.id)}
                disabled={removeLoading === pk.id}
                className="settings-passkey-remove"
                style={{
                  background: "none",
                  border: "none",
                  cursor: removeLoading === pk.id ? "default" : "pointer",
                  color: "var(--color-danger, #dc2626)",
                  padding: "0.375rem",
                  borderRadius: "0.375rem",
                  opacity: removeLoading === pk.id ? 0.5 : 1,
                }}
              >
                {removeLoading === pk.id ? (
                  <Loader2
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {registerError && (
        <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>
          {registerError}
        </div>
      )}

      {showInput ? (
        <div
          className="settings-passkey-register"
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <input
            className="input"
            placeholder="Device name (optional, e.g. My iPhone)"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            maxLength={60}
          />
          <div
            className="settings-passkey-register-actions"
            style={{ display: "flex", gap: "0.75rem" }}
          >
            <button
              type="button"
              className="btn-primary"
              onClick={async () => {
                const ok = await registerPasskey(
                  deviceName.trim() || undefined,
                );
                if (ok === true) {
                  await refreshPasskeys();
                  setShowInput(false);
                  setDeviceName("");
                }
              }}
              disabled={registerLoading}
              style={{
                flex: 1,
                justifyContent: "center",
                padding: "0.6875rem",
              }}
            >
              {registerLoading ? "Registering\u2026" : "Register this device"}
            </button>
            <button
              type="button"
              className="settings-passkey-cancel"
              onClick={() => {
                setShowInput(false);
                setDeviceName("");
              }}
              style={{
                padding: "0.6875rem 1rem",
                borderRadius: "var(--radius-btn, 0.5rem)",
                border: "1.5px solid var(--color-border, #e2e8f0)",
                background: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="settings-passkey-add"
          onClick={() => setShowInput(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.125rem",
            borderRadius: "var(--radius-btn, 0.5rem)",
            border: "1.5px solid var(--color-primary)",
            background: "none",
            color: "var(--color-primary)",
            fontWeight: 600,
            fontSize: "0.9375rem",
            cursor: "pointer",
          }}
        >
          <Plus size={16} />
          Add biometric
        </button>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Section>
  );
}

function DeleteAccountSection() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const t = useTranslations("Settings");

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await Axios.delete(`${API}/user/delete-account`, {
        data: { password },
        withCredentials: true,
      });
      router.replace("/");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: e.response?.data?.message || t("delete.error"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="card settings-danger-card"
        style={{
          padding: "2rem",
          marginBottom: "1.5rem",
          borderLeft: "4px solid var(--color-danger, #dc2626)",
        }}
      >
        <h2
          style={{
            fontSize: "1.0625rem",
            fontWeight: 700,
            color: "var(--color-danger, #dc2626)",
            margin: "0 0 0.375rem",
          }}
        >
          {t("delete.sectionTitle")}
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            margin: "0 0 1.5rem",
            lineHeight: 1.6,
          }}
        >
          {t("delete.sectionBody")}
        </p>
        <button
          className="btn-primary"
          style={{
            background: "var(--color-danger, #dc2626)",
            borderColor: "var(--color-danger, #dc2626)",
          }}
          onClick={() => {
            setShowModal(true);
            setMsg(null);
            setPassword("");
          }}
        >
          {t("delete.trigger")}
        </button>
      </div>

      {showModal && (
        <div
          className="settings-modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="settings-modal"
            style={{
              backgroundColor: "var(--color-white, #fff)",
              borderRadius: "var(--radius-md, 12px)",
              padding: "2rem",
              width: "100%",
              maxWidth: "440px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                fontSize: "1.1875rem",
                fontWeight: 800,
                color: "var(--color-danger, #dc2626)",
                margin: "0 0 0.75rem",
              }}
            >
              {t("delete.modalTitle")}
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--color-text-body)",
                margin: "0 0 1.5rem",
                lineHeight: 1.6,
              }}
            >
              {t("delete.modalBody")}
              <br />
              <br />
              {t("delete.modalBodyConfirm")}
            </p>

            <form className="settings-form" onSubmit={handleDelete}>
              <div
                className="settings-field"
                style={{ marginBottom: "1.25rem" }}
              >
                <label className="label" htmlFor="del-pass">
                  {t("delete.passwordLabel")}
                </label>
                <input
                  id="del-pass"
                  className="input"
                  type="password"
                  placeholder={t("delete.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <Feedback msg={msg} />
              <div
                className="settings-modal-actions"
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
              >
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !password}
                  style={{
                    background: "var(--color-danger, #dc2626)",
                    borderColor: "var(--color-danger, #dc2626)",
                    flex: 1,
                    justifyContent: "center",
                  }}
                >
                  {loading ? t("delete.deleting") : t("delete.confirm")}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {t("delete.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
