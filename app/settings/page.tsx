"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Axios from "axios";
import SiteHeader from "../components/SiteHeader";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "next-intl";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  username: string;
  profilepicture: string | null;
  country: string | null;
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
    <div className="card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
      <h2
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
  }, [authLoading, user_id, router]);

  if (authLoading || !user_id) return null;

  if (loadError)
    return (
      <>
        <SiteHeader />
        <main
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
        style={{
          backgroundColor: "var(--color-cloud)",
          minHeight: "calc(100vh - 8rem)",
          padding: "3rem 1.5rem",
        }}
      >
        <div className="page-wrapper" style={{ maxWidth: "680px" }}>
          <h1
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
            style={{
              fontSize: "0.9375rem",
              color: "var(--color-text-muted)",
              marginBottom: "2.5rem",
            }}
          >
            {t("subtitle")}
          </p>

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
          <ChangePasswordForm />
          <DeleteAccountSection />
        </div>
      </main>
    </>
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
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1.25rem" }}>
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
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1.25rem" }}>
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
      ? (current.startsWith("http") ? current : `${API}/uploads/${current}`)
      : null;

  return (
    <Section
      title={t("picture.sectionTitle")}
      subtitle={t("picture.sectionSubtitle")}
    >
      <Feedback msg={msg} />
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          <div
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

          <div style={{ flex: 1 }}>
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
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1.25rem" }}>
          <label className="label" htmlFor="s-phone">
            {t("phone.label")}
          </label>
          <div
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
      <Feedback msg={msg} />
      <form onSubmit={handleSubmit}>
        <div
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
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t("password.saving") : t("password.save")}
        </button>
      </form>
    </Section>
  );
}

// â”€â”€ 6. Delete account â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        className="card"
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

            <Feedback msg={msg} />

            <form onSubmit={handleDelete}>
              <div style={{ marginBottom: "1.25rem" }}>
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

              <div
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
