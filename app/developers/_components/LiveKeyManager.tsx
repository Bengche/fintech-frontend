"use client";
/**
 * LiveKeyManager — apply for, view, and revoke live (sk_live_*) API keys.
 *
 * Differences from SandboxKeyManager:
 *  - Application form collects company_name, website_url, use_case in addition to label.
 *  - Keys start as "pending_approval" and only become active after admin review.
 *  - Status (pending / active / rejected / revoked) is shown per key.
 *  - Full key shown once on creation, then never again.
 */

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/context/UserContext";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const LIVE_GREEN = "#16a34a";
const LIVE_BG = "#f0fdf4";
const LIVE_BORDER = "#bbf7d0";

interface LiveKey {
  id: number;
  key_prefix: string;
  label: string;
  company_name: string;
  website_url: string;
  use_case: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  last_used_at: string | null;
  request_count: number;
  revoked_at: string | null;
}

function keyStatus(k: LiveKey): "active" | "pending" | "rejected" | "revoked" {
  if (k.revoked_at) return "revoked";
  if (k.rejected_at) return "rejected";
  if (k.approved_at) return "active";
  return "pending";
}

const STATUS_STYLE: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  active: { bg: LIVE_BG, color: LIVE_GREEN, label: "Active" },
  pending: { bg: "#FFFBEB", color: "#D97706", label: "Pending approval" },
  rejected: { bg: "#FEF2F2", color: "#DC2626", label: "Rejected" },
  revoked: { bg: "#F1F5F9", color: "#64748B", label: "Revoked" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function LiveKeyManager() {
  const { user_id, authLoading } = useAuth();

  const [keys, setKeys] = useState<LiveKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    label: "",
    company_name: "",
    website_url: "",
    use_case: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [revealedKey, setRevealedKey] = useState<{
    id: number;
    key: string;
    label: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const [revoking, setRevoking] = useState<number | null>(null);

  const fetchKeys = useCallback(async () => {
    if (!user_id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/dev/live-keys`);
      setKeys(res.data.data ?? []);
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to load keys."
          : err instanceof Error
            ? err.message
            : "Failed to load keys.",
      );
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await axios.post(`${API_URL}/dev/live-keys`, form);
      setRevealedKey({
        id: res.data.id,
        key: res.data.key,
        label: res.data.label,
      });
      setForm({ label: "", company_name: "", website_url: "", use_case: "" });
      setShowForm(false);
      fetchKeys();
    } catch (err: unknown) {
      setFormError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to submit application."
          : err instanceof Error
            ? err.message
            : "Failed to submit application.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (keyId: number, label: string) => {
    if (
      !window.confirm(
        `Revoke key "${label}"?\n\nAny integration using this key will immediately lose access. This cannot be undone.`,
      )
    )
      return;
    setRevoking(keyId);
    try {
      await axios.delete(`${API_URL}/dev/live-keys/${keyId}`);
      fetchKeys();
    } catch (err: unknown) {
      alert(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to revoke key."
          : err instanceof Error
            ? err.message
            : "Failed to revoke key.",
      );
    } finally {
      setRevoking(null);
    }
  };

  const handleCopy = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const activeKeys = keys.filter((k) => !k.revoked_at && !k.rejected_at);
  const inactiveKeys = keys.filter((k) => k.revoked_at || k.rejected_at);

  if (authLoading) {
    return (
      <div
        style={{
          background: "var(--color-mist)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "2.5rem",
          textAlign: "center",
          color: "var(--color-text-muted)",
          fontSize: "0.9rem",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user_id) {
    return (
      <div
        style={{
          background: "var(--color-mist)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "2.5rem",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "1rem",
            color: "var(--color-text-muted)",
            marginBottom: "1.25rem",
          }}
        >
          Sign in to apply for and manage your live API keys.
        </p>
        <div
          style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}
        >
          <Link href="/login" className="btn-primary">
            Sign in
          </Link>
          <Link href="/register" className="btn-ghost">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Key revealed banner ─────────────────────────────────────────────── */}
      {revealedKey && (
        <div
          style={{
            background: LIVE_BG,
            border: `1.5px solid ${LIVE_BORDER}`,
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <p
            style={{
              fontWeight: 700,
              color: "#14532D",
              marginBottom: "0.4rem",
              fontSize: "0.9375rem",
            }}
          >
            Application submitted: {revealedKey.label}
          </p>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "#166534",
              marginBottom: "1rem",
              lineHeight: 1.65,
            }}
          >
            Your live key has been generated and is pending admin approval. Copy
            it now — it will <strong>not be shown again</strong>. You will be
            emailed once it is activated.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <code
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: "0.875rem",
                background: "#DCFCE7",
                padding: "0.5rem 0.875rem",
                borderRadius: "6px",
                color: "#14532D",
                wordBreak: "break-all",
                flex: 1,
                minWidth: 0,
              }}
            >
              {revealedKey.key}
            </code>
            <button
              onClick={handleCopy}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: `1.5px solid ${LIVE_GREEN}`,
                background: copied ? LIVE_GREEN : "#fff",
                color: copied ? "#fff" : LIVE_GREEN,
                fontWeight: 600,
                fontSize: "0.8125rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
                flexShrink: 0,
              }}
            >
              {copied ? "Copied" : "Copy key"}
            </button>
            <button
              onClick={() => {
                setRevealedKey(null);
                setCopied(false);
              }}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: "1.5px solid var(--color-border)",
                background: "#fff",
                color: "var(--color-text-muted)",
                fontWeight: 600,
                fontSize: "0.8125rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              I&apos;ve saved it
            </button>
          </div>
        </div>
      )}

      {/* ── Apply button / form ─────────────────────────────────────────────── */}
      {!showForm ? (
        <div style={{ marginBottom: "2rem" }}>
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.65rem 1.375rem",
              borderRadius: "8px",
              background: "#0F1F3D",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Apply for a live key
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <p
              style={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "var(--color-text-heading)",
              }}
            >
              Apply for a live API key
            </p>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormError(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-text-muted)",
                fontSize: "0.8125rem",
                cursor: "pointer",
                padding: "0.25rem",
              }}
            >
              Cancel
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            {(
              [
                {
                  name: "label",
                  label: "Key label",
                  placeholder: "e.g. Production — Njimbong",
                  type: "text",
                  maxLength: 80,
                  required: true,
                },
                {
                  name: "company_name",
                  label: "Company / platform name",
                  placeholder: "e.g. Njimbong",
                  type: "text",
                  maxLength: 200,
                  required: true,
                },
                {
                  name: "website_url",
                  label: "Website URL",
                  placeholder: "https://yourplatform.com",
                  type: "url",
                  maxLength: 500,
                  required: true,
                },
              ] as {
                name: string;
                label: string;
                placeholder: string;
                type: string;
                maxLength: number;
                required: boolean;
              }[]
            ).map((f) => (
              <div key={f.name}>
                <label
                  htmlFor={`lk-${f.name}`}
                  style={{
                    display: "block",
                    fontSize: "0.78125rem",
                    fontWeight: 700,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "0.375rem",
                  }}
                >
                  {f.label}
                </label>
                <input
                  id={`lk-${f.name}`}
                  name={f.name}
                  type={f.type}
                  value={form[f.name as keyof typeof form]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  maxLength={f.maxLength}
                  required={f.required}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.875rem",
                    borderRadius: "8px",
                    border: "1.5px solid var(--color-border)",
                    fontSize: "0.875rem",
                    color: "var(--color-text-body)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="lk-use_case"
              style={{
                display: "block",
                fontSize: "0.78125rem",
                fontWeight: 700,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "0.375rem",
              }}
            >
              Use case description
            </label>
            <textarea
              id="lk-use_case"
              name="use_case"
              value={form.use_case}
              onChange={handleChange}
              placeholder="Describe how you will use the Fonlok API — marketplace escrow, payment collection, etc. (min 20 characters)"
              minLength={20}
              maxLength={1000}
              required
              rows={4}
              style={{
                width: "100%",
                padding: "0.65rem 0.875rem",
                borderRadius: "8px",
                border: "1.5px solid var(--color-border)",
                fontSize: "0.875rem",
                color: "var(--color-text-body)",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
                lineHeight: 1.6,
              }}
            />
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                marginTop: "0.25rem",
              }}
            >
              {form.use_case.length}/1000 characters (minimum 20)
            </p>
          </div>

          {formError && (
            <p
              style={{
                color: "#DC2626",
                fontSize: "0.8125rem",
                marginBottom: "0.875rem",
              }}
            >
              {formError}
            </p>
          )}

          <div
            style={{
              padding: "0.875rem 1rem",
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: "8px",
              fontSize: "0.8125rem",
              color: "#78350F",
              lineHeight: 1.65,
              marginBottom: "1.25rem",
            }}
          >
            Your key will be created immediately and your details sent to the
            Fonlok team for review. The key starts as{" "}
            <strong>pending approval</strong> and will not work until a Fonlok
            admin activates it. You will be emailed when approved.
          </div>

          <button
            type="submit"
            disabled={submitting || form.use_case.length < 20}
            style={{
              padding: "0.65rem 1.5rem",
              borderRadius: "8px",
              background: "#0F1F3D",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              border: "none",
              cursor:
                submitting || form.use_case.length < 20
                  ? "not-allowed"
                  : "pointer",
              opacity: submitting || form.use_case.length < 20 ? 0.6 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Submit application"}
          </button>
        </form>
      )}

      {/* ── Keys table ──────────────────────────────────────────────────────── */}
      {loading ? (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Loading keys...
        </p>
      ) : error ? (
        <p style={{ color: "#DC2626", fontSize: "0.875rem" }}>{error}</p>
      ) : activeKeys.length === 0 && !loading ? (
        <div
          style={{
            background: "var(--color-mist)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "0.9rem",
              lineHeight: 1.7,
            }}
          >
            No live keys yet. Submit an application above to get started.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr
                style={{ background: "var(--color-mist)", textAlign: "left" }}
              >
                {(
                  [
                    "Label",
                    "Key prefix",
                    "Status",
                    "Created",
                    "Last used",
                    "Requests",
                    "",
                  ] as string[]
                ).map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.625rem 1rem",
                      fontWeight: 700,
                      fontSize: "0.78125rem",
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid var(--color-border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeKeys.map((k) => {
                const st = keyStatus(k);
                const stStyle = STATUS_STYLE[st];
                return (
                  <tr
                    key={k.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        fontWeight: 600,
                        color: "var(--color-text-heading)",
                      }}
                    >
                      {k.label}
                      {k.company_name && (
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            fontWeight: 400,
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {k.company_name}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <code
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.8125rem",
                          background: "var(--color-mist)",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          color: "var(--color-text-body)",
                        }}
                      >
                        {k.key_prefix}...
                      </code>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.175rem 0.55rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: stStyle.bg,
                          color: stStyle.color,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {stStyle.label}
                      </span>
                      {k.rejection_reason && (
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            color: "#DC2626",
                            marginTop: "0.25rem",
                          }}
                        >
                          {k.rejection_reason}
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        color: "var(--color-text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(k.created_at)}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        color: "var(--color-text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(k.last_used_at)}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {(k.request_count ?? 0).toLocaleString()}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {st !== "revoked" && (
                        <button
                          onClick={() => handleRevoke(k.id, k.label)}
                          disabled={revoking === k.id}
                          style={{
                            padding: "0.3rem 0.75rem",
                            borderRadius: "6px",
                            border: "1.5px solid #FCA5A5",
                            background: "#FEF2F2",
                            color: "#DC2626",
                            fontWeight: 600,
                            fontSize: "0.78125rem",
                            cursor:
                              revoking === k.id ? "not-allowed" : "pointer",
                            opacity: revoking === k.id ? 0.6 : 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {revoking === k.id ? "Revoking..." : "Revoke"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Revoked / rejected (collapsed) ──────────────────────────────────── */}
      {inactiveKeys.length > 0 && (
        <details
          style={{
            marginTop: "1.5rem",
            borderTop: "1px solid var(--color-border)",
            paddingTop: "1rem",
          }}
        >
          <summary
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              userSelect: "none",
              fontWeight: 600,
            }}
          >
            {inactiveKeys.length} inactive{" "}
            {inactiveKeys.length === 1 ? "key" : "keys"}
          </summary>
          <div
            style={{ overflowX: "auto", marginTop: "0.75rem", opacity: 0.6 }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.8125rem",
              }}
            >
              <tbody>
                {inactiveKeys.map((k) => {
                  const st = keyStatus(k);
                  const stStyle = STATUS_STYLE[st];
                  return (
                    <tr key={k.id}>
                      <td
                        style={{
                          padding: "0.5rem 1rem",
                          color: "var(--color-text-muted)",
                          textDecoration: "line-through",
                        }}
                      >
                        {k.label}
                      </td>
                      <td
                        style={{
                          padding: "0.5rem 1rem",
                          color: "var(--color-text-muted)",
                          fontFamily: "monospace",
                          fontSize: "0.78125rem",
                        }}
                      >
                        {k.key_prefix}...
                      </td>
                      <td style={{ padding: "0.5rem 1rem" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: stStyle.color,
                          }}
                        >
                          {stStyle.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
