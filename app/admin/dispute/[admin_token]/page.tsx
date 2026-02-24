"use client";
import { useState, useEffect } from "react";
import Axios from "axios";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Message = {
  id: number;
  sender_type: string;
  sender_email: string;
  message: string | null;
  file_url: string | null;
  created_at: string;
};

interface DisputeData {
  status: string;
  reason?: string;
  opened_by?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface InvoiceData {
  invoicenumber?: string;
  invoicename?: string;
  amount?: number;
  currency?: string;
  status?: string;
  [key: string]: unknown;
}

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminDisputePage() {
  const { admin_token } = useParams<{ admin_token: string }>();
  const t = useTranslations("Admin");

  const [dispute, setDispute] = useState<DisputeData | null>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [buyer, setBuyer] = useState<UserData | null>(null);
  const [seller, setSeller] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [adminMessage, setAdminMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isResolved, setIsResolved] = useState(false);

  const loadDisputeData = async () => {
    try {
      const response = await Axios.get(`${API}/dispute/admin/${admin_token}`);
      setDispute(response.data.dispute);
      setInvoice(response.data.invoice);
      setBuyer(response.data.buyer);
      setSeller(response.data.seller);
      setMessages(response.data.messages);
      if (response.data.dispute?.status !== "open") {
        setIsResolved(true);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setErrorMessage(err.response?.data?.message || t("dispute.errorLoad"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDisputeData();
    const interval = setInterval(loadDisputeData, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendAdminMessage = async () => {
    if (!adminMessage.trim()) return;
    try {
      await Axios.post(`${API}/dispute/admin/${admin_token}/message`, {
        message: adminMessage,
      });
      setAdminMessage("");
      loadDisputeData();
    } catch {
      setErrorMessage(t("dispute.sendError"));
    }
  };

  const resolveDispute = async (decision: "seller" | "buyer") => {
    const confirmText =
      decision === "seller"
        ? t("dispute.releaseToSeller")
        : t("dispute.refundBuyer");
    if (!window.confirm(confirmText)) return;
    try {
      await Axios.post(`${API}/dispute/admin/${admin_token}/resolve`, {
        decision,
      });
      setSuccessMessage(
        decision === "seller"
          ? t("dispute.releasedSeller")
          : t("dispute.refundedBuyer"),
      );
      setIsResolved(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setErrorMessage(err.response?.data?.message || t("dispute.errorDefault"));
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--color-cloud)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>
          {t("dispute.loading")}
        </p>
      </div>
    );
  }

  // ── Error / invalid link ──────────────────────────────────────────────────────
  if (errorMessage && !dispute) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--color-cloud)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          className="card"
          style={{ maxWidth: "30rem", width: "100%", textAlign: "center" }}
        >
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⛔</p>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-danger)",
              margin: "0 0 0.5rem",
            }}
          >
            {t("dispute.accessDeniedTitle")}
          </h2>
          <p
            style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}
          >
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: "var(--color-primary)",
          padding: "0.875rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            width: "2rem",
            height: "2rem",
            borderRadius: "0.5rem",
            backgroundColor: "var(--color-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="#0F1F3D"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <div>
          <h1
            style={{
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.9375rem",
              margin: 0,
            }}
          >
            {t("dispute.headerTitle")}
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.75rem", margin: 0 }}>
            {t("dispute.headerSubtitle")}
          </p>
        </div>
      </header>

      <main
        style={{
          maxWidth: "56rem",
          margin: "0 auto",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {/* Success alert */}
        {successMessage && (
          <div className="alert alert-success">{successMessage}</div>
        )}

        {/* Error alert (inline) */}
        {errorMessage && dispute && (
          <div className="alert alert-danger">{errorMessage}</div>
        )}

        {/* Resolved banner */}
        {isResolved && (
          <div className="alert alert-info">
            <strong>{t("dispute.resolvedTitle")}</strong>{" "}
            {t("dispute.currentStatus")}{" "}
            <span style={{ textTransform: "capitalize", fontWeight: 600 }}>
              {String(dispute?.status ?? "").replace("_", " ")}
            </span>
          </div>
        )}

        {/* ── Invoice & Dispute Details ─────────────────────────────────────── */}
        <div className="card">
          <h2
            style={{
              margin: "0 0 1rem",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
            }}
          >
            {t("dispute.detailsTitle")}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {[
              {
                label: t("dispute.detailsInvoiceNum"),
                value: invoice?.invoicenumber,
              },
              {
                label: t("dispute.detailsInvoiceName"),
                value: invoice?.invoicename,
              },
              {
                label: t("dispute.detailsAmount"),
                value: `${invoice?.amount?.toLocaleString() ?? "—"} ${invoice?.currency ?? ""}`,
              },
              {
                label: t("dispute.detailsInvoiceStatus"),
                value: invoice?.status,
              },
              {
                label: t("dispute.detailsOpenedBy"),
                value: dispute?.opened_by,
              },
              {
                label: t("dispute.detailsOpenedAt"),
                value: dispute?.created_at
                  ? new Date(dispute.created_at).toLocaleString("en-GB")
                  : "—",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: "0.75rem",
                  backgroundColor: "var(--color-mist)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: "0 0 0.25rem",
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "var(--color-text-heading)",
                    margin: 0,
                  }}
                >
                  {value ?? "—"}
                </p>
              </div>
            ))}
          </div>
          {/* Reason */}
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem",
              backgroundColor: "var(--color-warning-bg)",
              border: "1px solid var(--color-warning-border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: "0 0 0.25rem",
              }}
            >
              {t("dispute.detailsReason")}
            </p>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--color-text-body)",
                margin: 0,
              }}
            >
              {dispute?.reason ?? t("dispute.noReason")}
            </p>
          </div>
        </div>

        {/* ── Buyer & Seller Info ───────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          <div className="card">
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-info)",
                margin: "0 0 0.5rem",
              }}
            >
              {t("dispute.buyerLabel")}
            </p>
            <p
              style={{
                fontWeight: 600,
                color: "var(--color-text-heading)",
                margin: 0,
              }}
            >
              {buyer?.name ?? t("dispute.unknownName")}
            </p>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                margin: "0.2rem 0 0",
              }}
            >
              {buyer?.email ?? "—"}
            </p>
          </div>
          <div className="card">
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-primary)",
                margin: "0 0 0.5rem",
              }}
            >
              {t("dispute.sellerLabel")}
            </p>
            <p
              style={{
                fontWeight: 600,
                color: "var(--color-text-heading)",
                margin: 0,
              }}
            >
              {seller?.name ?? t("dispute.unknownName")}
            </p>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                margin: "0.2rem 0 0",
              }}
            >
              {seller?.email ?? "—"}
            </p>
          </div>
        </div>

        {/* ── Chat History ──────────────────────────────────────────────────── */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid var(--color-border)",
              backgroundColor: "var(--color-mist)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
              }}
            >
              {t("dispute.chatTitle")}
            </h2>
          </div>

          {/* Messages */}
          <div
            style={{
              height: "22rem",
              overflowY: "auto",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.625rem",
              backgroundColor: "var(--color-cloud)",
            }}
          >
            {messages.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontSize: "0.875rem",
                  marginTop: "2rem",
                }}
              >
                {t("dispute.noMessages")}
              </p>
            )}
            {messages.map((msg) => {
              const isAdmin = msg.sender_type === "moderator";
              const isSeller = msg.sender_type === "seller";
              const isBuyer = msg.sender_type === "buyer";
              const isSystem = msg.sender_type === "system";
              const bubbleBg = isAdmin
                ? "var(--color-accent-light)"
                : isSeller
                  ? "var(--color-primary-light)"
                  : isBuyer
                    ? "var(--color-cloud)"
                    : "var(--color-mist)";
              const align =
                isAdmin || isSystem
                  ? "center"
                  : isSeller
                    ? "flex-end"
                    : "flex-start";
              return (
                <div
                  key={msg.id}
                  style={{ display: "flex", justifyContent: align }}
                >
                  <div
                    style={{
                      maxWidth: isAdmin || isSystem ? "80%" : "70%",
                      backgroundColor: bubbleBg,
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.625rem 0.875rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: "var(--color-text-muted)",
                        margin: "0 0 0.25rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {isAdmin
                        ? t("dispute.adminModerator")
                        : isSystem
                          ? t("dispute.systemLabel")
                          : isSeller
                            ? `${t("dispute.sellerLabel")} \u00b7 ${msg.sender_email}`
                            : `${t("dispute.buyerLabel")} \u00b7 ${msg.sender_email}`}
                    </p>
                    {msg.message && (
                      <p style={{ margin: 0, color: "var(--color-text-body)" }}>
                        {msg.message}
                      </p>
                    )}
                    {msg.file_url && (
                      <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "var(--color-primary)",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          textDecoration: "underline",
                        }}
                      >
                        {t("dispute.viewFile")}
                      </a>
                    )}
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        color: "var(--color-text-muted)",
                        margin: "0.375rem 0 0",
                      }}
                    >
                      {new Date(msg.created_at).toLocaleString("en-GB")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Admin message input */}
          {!isResolved && (
            <div
              style={{
                padding: "0.875rem 1rem",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                gap: "0.625rem",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                className="input"
                style={{ flex: 1 }}
                placeholder={t("dispute.messagePlaceholder")}
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendAdminMessage()}
              />
              <button
                onClick={sendAdminMessage}
                className="btn-accent"
                style={{ flexShrink: 0 }}
              >
                {t("dispute.sendBtn")}
              </button>
            </div>
          )}
        </div>

        {/* ── Resolution Buttons ────────────────────────────────────────────── */}
        {!isResolved && (
          <div
            className="card"
            style={{
              border: "1px solid var(--color-danger-border)",
              backgroundColor: "var(--color-danger-bg)",
            }}
          >
            <h2
              style={{
                margin: "0 0 0.5rem",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--color-danger)",
              }}
            >
              {t("dispute.makeDecision")}
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                margin: "0 0 1.25rem",
              }}
            >
              {t("dispute.makeDecisionBody")}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={() => resolveDispute("seller")}
                className="btn-primary"
                style={{ padding: "0.875rem", fontSize: "0.9375rem" }}
              >
                {t("dispute.releaseFunds")}
              </button>
              <button
                onClick={() => resolveDispute("buyer")}
                style={{
                  padding: "0.875rem",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  backgroundColor: "var(--color-danger)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                }}
              >
                {t("dispute.refundBtn")}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
