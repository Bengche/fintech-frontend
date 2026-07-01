"use client";
/**
 * SandboxKeyManager — lets authenticated users create, view, and revoke
 * their sandbox API keys from the Developer dashboard.
 *
 * Security:
 *  - The full key is shown exactly once upon creation, never cached in state
 *    after the modal is dismissed.
 *  - Keys are identified in the UI by their prefix (first 16 chars) only.
 *  - Revocation is immediate and permanent — the user must confirm.
 */

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/context/UserContext";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

interface SandboxKey {
  id: number;
  key_prefix: string;
  label: string;
  created_at: string;
  last_used_at: string | null;
  request_count: number;
  revoked_at: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SandboxKeyManager() {
  const { user_id, authLoading } = useAuth();

  const [keys, setKeys] = useState<SandboxKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Revealed key — shown once after creation then cleared.
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
      const res = await axios.get(`${API_URL}/dev/keys`);
      setKeys(res.data.keys);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to load keys."
          : err instanceof Error
          ? err.message
          : "Failed to load keys.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await axios.post(`${API_URL}/dev/keys`, {
        label: newLabel.trim(),
      });
      setRevealedKey({
        id: res.data.id,
        key: res.data.key,
        label: res.data.label,
      });
      setNewLabel("");
      fetchKeys();
    } catch (err: unknown) {
      setCreateError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to create key."
          : err instanceof Error
          ? err.message
          : "Failed to create key.",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: number, label: string) => {
    if (
      !window.confirm(
        `Revoke key "${label}"?\n\nAny application using this key will immediately lose access. This cannot be undone.`,
      )
    ) {
      return;
    }
    setRevoking(keyId);
    try {
      await axios.delete(`${API_URL}/dev/keys/${keyId}`);
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

  const activeKeys = keys.filter((k) => !k.revoked_at);
  const revokedKeys = keys.filter((k) => k.revoked_at);

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
        Loading…
      </div>
    );
  }

  if (!user_id) {
    return (
      <div
        className="sandbox-keys-guest"
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
          Sign in to create and manage your sandbox API keys.
        </p>
        <div
          className="sandbox-keys-guest-actions"
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
    <div className="sandbox-keys-root">
      {/* ── New key revealed ────────────────────────────────────────────────── */}
      {revealedKey && (
        <div
          style={{
            background: "#F0FDF4",
            border: "1.5px solid #22C55E",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <p
            style={{
              fontWeight: 700,
              color: "#15803D",
              marginBottom: "0.4rem",
              fontSize: "0.9375rem",
            }}
          >
            Key created: {revealedKey.label}
          </p>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "#166534",
              marginBottom: "1rem",
              lineHeight: 1.6,
            }}
          >
            This is the only time your key will be shown. Copy it now and store
            it in a secure location (environment variable, secrets manager,
            etc.). You will not be able to view it again.
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
                border: "1.5px solid #22C55E",
                background: copied ? "#22C55E" : "#fff",
                color: copied ? "#fff" : "#15803D",
                fontWeight: 600,
                fontSize: "0.8125rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
                flexShrink: 0,
              }}
            >
              {copied ? "Copied" : "Copy"}
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

      {/* ── Create form ─────────────────────────────────────────────────────── */}
      <form
        className="sandbox-keys-form"
        onSubmit={handleCreate}
        style={{
          background: "var(--color-white)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <p
          style={{
            fontWeight: 700,
            fontSize: "0.9375rem",
            color: "var(--color-text-heading)",
            marginBottom: "1rem",
          }}
        >
          Create a new sandbox key
        </p>
        <div
          className="sandbox-keys-form-row"
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div className="sandbox-keys-input-wrap" style={{ flex: 1, minWidth: "220px" }}>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Local development, CI pipeline"
              maxLength={80}
              required
              style={{
                width: "100%",
                padding: "0.6rem 0.875rem",
                borderRadius: "8px",
                border: "1.5px solid var(--color-border)",
                fontSize: "0.9rem",
                color: "var(--color-text-body)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={creating || !newLabel.trim()}
            className="btn-primary"
            style={{
              fontSize: "0.875rem",
              padding: "0.6rem 1.25rem",
              opacity: creating || !newLabel.trim() ? 0.6 : 1,
              cursor: creating || !newLabel.trim() ? "not-allowed" : "pointer",
            }}
          >
            {creating ? "Creating..." : "Generate key"}
          </button>
        </div>
        {createError && (
          <p
            style={{
              color: "#DC2626",
              fontSize: "0.8125rem",
              marginTop: "0.5rem",
            }}
          >
            {createError}
          </p>
        )}
        <p
          style={{
            fontSize: "0.78125rem",
            color: "var(--color-text-muted)",
            marginTop: "0.5rem",
          }}
        >
          Maximum 5 active keys per account.
        </p>
      </form>

      {/* ── Active keys table ────────────────────────────────────────────────── */}
      {loading ? (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Loading keys...
        </p>
      ) : error ? (
        <p style={{ color: "#DC2626", fontSize: "0.875rem" }}>{error}</p>
      ) : activeKeys.length === 0 ? (
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "0.875rem",
            textAlign: "center",
            padding: "2rem",
            background: "var(--color-mist)",
            borderRadius: "10px",
          }}
        >
          No active keys. Generate one above to start testing.
        </p>
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
                style={{
                  background: "var(--color-mist)",
                  textAlign: "left",
                }}
              >
                {[
                  "Label",
                  "Key prefix",
                  "Created",
                  "Last used",
                  "Requests",
                  "",
                ].map((h) => (
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
              {activeKeys.map((k) => (
                <tr
                  key={k.id}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      fontWeight: 600,
                      color: "var(--color-text-heading)",
                    }}
                  >
                    {k.label}
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
                    {k.request_count.toLocaleString()}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
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
                        cursor: revoking === k.id ? "not-allowed" : "pointer",
                        opacity: revoking === k.id ? 0.6 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {revoking === k.id ? "Revoking..." : "Revoke"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Revoked keys (collapsed) ─────────────────────────────────────────── */}
      {revokedKeys.length > 0 && (
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
            {revokedKeys.length} revoked{" "}
            {revokedKeys.length === 1 ? "key" : "keys"}
          </summary>
          <div
            style={{ overflowX: "auto", marginTop: "0.75rem", opacity: 0.65 }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.8125rem",
              }}
            >
              <tbody>
                {revokedKeys.map((k) => (
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
                    <td
                      style={{
                        padding: "0.5rem 1rem",
                        color: "var(--color-text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Revoked {formatDate(k.revoked_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <style>{`
        @media (max-width: 640px) {
          .sandbox-keys-guest {
            padding: 1.5rem !important;
          }
          .sandbox-keys-guest-actions {
            flex-direction: column;
          }
          .sandbox-keys-form {
            padding: 1rem !important;
          }
          .sandbox-keys-form-row {
            align-items: stretch !important;
          }
          .sandbox-keys-input-wrap {
            min-width: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
