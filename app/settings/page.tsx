"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Axios from "axios";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { useAuth } from "@/context/UserContext";

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

// ── Shared feedback component ────────────────────────────────────────────────
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

// ── Section card wrapper ─────────────────────────────────────────────────────
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
      .catch(() => setLoadError("Failed to load account information."));
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
        <SiteFooter />
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
            Account settings
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--color-text-muted)",
              marginBottom: "2.5rem",
            }}
          >
            Manage your Fonlok account information.
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
      <SiteFooter />
    </>
  );
}

// ── 1. Update name ───────────────────────────────────────────────────────────
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
      setMsg({ type: "success", text: "Name updated successfully." });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: e.response?.data?.message || "Failed to update name.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Display name">
      <Feedback msg={msg} />
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1.25rem" }}>
          <label className="label" htmlFor="s-name">
            Full name
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
          {loading ? "Saving…" : "Save name"}
        </button>
      </form>
    </Section>
  );
}

// ── 2. Update email ──────────────────────────────────────────────────────────
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
      setMsg({ type: "success", text: "Email updated successfully." });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: e.response?.data?.message || "Failed to update email.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Email address">
      <Feedback msg={msg} />
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1.25rem" }}>
          <label className="label" htmlFor="s-email">
            Email
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
          {loading ? "Saving…" : "Save email"}
        </button>
      </form>
    </Section>
  );
}

// ── 3. Update profile picture ────────────────────────────────────────────────
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setMsg({ type: "error", text: "Image must be 5 MB or smaller." });
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
      setMsg({ type: "success", text: "Profile picture updated." });
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: e.response?.data?.message || "Failed to update profile picture.",
      });
    } finally {
      setLoading(false);
    }
  };

  const avatarSrc = preview
    ? preview
    : current
      ? `${API}/uploads/${current}`
      : null;

  return (
    <Section title="Profile picture" subtitle="JPEG, PNG or WebP · max 5 MB">
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
              Choose image
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
          {loading ? "Uploading…" : "Save picture"}
        </button>
      </form>
    </Section>
  );
}

// ── 4. Update phone ──────────────────────────────────────────────────────────
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
      setMsg({ type: "success", text: "MoMo number updated successfully." });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: e.response?.data?.message || "Failed to update phone.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section
      title="MoMo phone number"
      subtitle="This is the number buyers see on your profile. Payouts are sent to this number."
    >
      <Feedback msg={msg} />
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1.25rem" }}>
          <label className="label" htmlFor="s-phone">
            Phone number
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
              placeholder="6XXXXXXXX (9 digits)"
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
            Must start a with 6... e.g. 677298709 (9 digits after the the fixed
            +237)
          </p>
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving…" : "Save phone number"}
        </button>
      </form>
    </Section>
  );
}

// ── 5. Change password ───────────────────────────────────────────────────────
function ChangePasswordForm() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const update =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (form.next.length < 8) {
      setMsg({
        type: "error",
        text: "New password must be at least 8 characters.",
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
      setMsg({ type: "success", text: "Password changed successfully." });
      setForm({ current: "", next: "", confirm: "" });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: e.response?.data?.message || "Failed to change password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Change password">
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
              label: "Current password",
              key: "current" as const,
              placeholder: "Your current password",
            },
            {
              id: "cp-new",
              label: "New password",
              key: "next" as const,
              placeholder: "At least 8 characters",
            },
            {
              id: "cp-con",
              label: "Confirm new password",
              key: "confirm" as const,
              placeholder: "Repeat new password",
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
          {loading ? "Saving…" : "Change password"}
        </button>
      </form>
    </Section>
  );
}

// ── 6. Delete account ────────────────────────────────────────────────────────
function DeleteAccountSection() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
        text: e.response?.data?.message || "Failed to delete account.",
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
          Delete account
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            margin: "0 0 1.5rem",
            lineHeight: 1.6,
          }}
        >
          Permanently delete your account and all associated data. This cannot
          be undone. Accounts with active escrow transactions cannot be deleted.
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
          Delete my account
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
              Are you absolutely sure?
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--color-text-body)",
                margin: "0 0 1.5rem",
                lineHeight: 1.6,
              }}
            >
              This will <strong>permanently delete</strong> your account,
              profile, invoices, and all data. This cannot be reversed.
              <br />
              <br />
              Enter your password to confirm.
            </p>

            <Feedback msg={msg} />

            <form onSubmit={handleDelete}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="label" htmlFor="del-pass">
                  Your password
                </label>
                <input
                  id="del-pass"
                  className="input"
                  type="password"
                  placeholder="Enter your password to confirm"
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
                  {loading ? "Deleting…" : "Yes, delete my account"}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
