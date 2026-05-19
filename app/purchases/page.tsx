"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "next-intl";
import { X, ExternalLink, Download, MessageCircle } from "lucide-react";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type Purchase = {
  invoicenumber: string;
  invoicename: string;
  amount: number;
  currency: string;
  status:
    | "pending"
    | "paid"
    | "delivered"
    | "expired"
    | "disputed"
    | "completed";
  createdat: string;
  paid_at: string | null;
  delivered_at: string | null;
  payment_type: "full" | "installment";
  description: string;
  seller_name: string;
  seller_username: string;
  seller_avatar: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusPill(status: string) {
  const s = status.toLowerCase();
  if (s === "paid" || s === "completed")
    return {
      bg: "var(--color-success-bg)",
      color: "#166534",
      border: "var(--color-success-border)",
    };
  if (s === "delivered")
    return { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" };
  if (s === "pending")
    return {
      bg: "var(--color-warning-bg)",
      color: "#92400e",
      border: "var(--color-warning-border)",
    };
  if (s === "disputed")
    return {
      bg: "var(--color-danger-bg)",
      color: "#991b1b",
      border: "var(--color-danger-border)",
    };
  return {
    bg: "var(--color-mist)",
    color: "var(--color-text-muted)",
    border: "var(--color-border)",
  };
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function fmt(n: number) {
  return Number(n).toLocaleString("en-US");
}

function shortDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function fullDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function canDownload(status: string) {
  const s = status.toLowerCase();
  return s === "paid" || s === "completed" || s === "delivered";
}

function SellerAvatar({
  purchase,
  size = 40,
}: {
  purchase: Purchase;
  size?: number;
}) {
  if (purchase.seller_avatar) {
    return (
      <Image
        src={purchase.seller_avatar}
        alt={purchase.seller_name}
        width={size}
        height={size}
        style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        backgroundColor: "var(--color-primary)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: size * 0.4,
        userSelect: "none",
      }}
    >
      {purchase.seller_name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Purchase Detail Modal ─────────────────────────────────────────────────────

function PurchaseDetailModal({
  purchase,
  onClose,
  t,
  router,
}: {
  purchase: Purchase;
  onClose: () => void;
  t: ReturnType<typeof useTranslations<"Purchases">>;
  router: ReturnType<typeof useRouter>;
}) {
  const pill = statusPill(purchase.status);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState("");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function handleDownloadReceipt() {
    setReceiptLoading(true);
    setReceiptError("");
    try {
      const res = await fetch(
        `${API}/invoice/receipt/${purchase.invoicenumber}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setReceiptError(
          (data as { message?: string }).message || t("receiptFetchError"),
        );
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const isIOS =
        typeof navigator !== "undefined" &&
        /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `fonlok-receipt-${purchase.invoicenumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      setReceiptError(t("receiptFetchError"));
    } finally {
      setReceiptLoading(false);
    }
  }

  return (
    <div
      className="tx-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t("modalTitle")}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="tx-modal">
        <div className="tx-modal-handle-wrap">
          <div className="tx-modal-handle" />
        </div>

        <div className="tx-modal-topbar">
          <span className="tx-modal-topbar-title">{t("modalTitle")}</span>
          <button
            className="tx-modal-close"
            onClick={onClose}
            aria-label={t("close")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Hero */}
        <div className="tx-modal-hero">
          <SellerAvatar purchase={purchase} size={56} />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontWeight: 700,
                color: "var(--color-text-heading)",
                fontSize: "0.95rem",
              }}
            >
              {purchase.seller_name}
            </div>
            <div
              style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}
            >
              @{purchase.seller_username}
            </div>
          </div>
          <div className="tx-modal-amount">
            {fmt(purchase.amount)} {purchase.currency}
          </div>
          <span
            className="tx-status-pill"
            style={{
              background: pill.bg,
              color: pill.color,
              border: `1px solid ${pill.border}`,
            }}
          >
            {statusLabel(purchase.status)}
          </span>
        </div>

        {/* Detail rows */}
        <div className="tx-modal-rows">
          <div className="tx-modal-row">
            <span className="tx-modal-label">{t("modalInvoice")}</span>
            <span className="tx-modal-value">{purchase.invoicename}</span>
          </div>
          <div className="tx-modal-row">
            <span className="tx-modal-label">{t("modalReference")}</span>
            <span className="tx-modal-value mono">
              #{purchase.invoicenumber}
            </span>
          </div>
          <div className="tx-modal-row">
            <span className="tx-modal-label">{t("modalPaidOn")}</span>
            <span className="tx-modal-value">{fullDate(purchase.paid_at)}</span>
          </div>
          {purchase.delivered_at && (
            <div className="tx-modal-row">
              <span className="tx-modal-label">{t("modalDeliveredOn")}</span>
              <span className="tx-modal-value">
                {fullDate(purchase.delivered_at)}
              </span>
            </div>
          )}
          <div className="tx-modal-row">
            <span className="tx-modal-label">{t("modalPaymentType")}</span>
            <span
              className="tx-modal-value"
              style={{ textTransform: "capitalize" }}
            >
              {purchase.payment_type}
            </span>
          </div>
        </div>

        {/* Description */}
        {purchase.description && (
          <div className="tx-modal-desc">
            <p
              style={{
                margin: "0 0 0.35rem",
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {t("modalDescription")}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "0.9rem",
                color: "var(--color-text-body)",
                lineHeight: 1.6,
              }}
            >
              {purchase.description}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="tx-modal-actions">
          <Link
            href={`/pay/${purchase.invoicenumber}`}
            className="btn-ghost"
            style={{
              justifyContent: "center",
              flex: 1,
              textDecoration: "none",
            }}
          >
            <ExternalLink size={14} />
            {t("viewInvoice")}
          </Link>
          <button
            className="btn-ghost"
            onClick={() => {
              onClose();
              router.push(`/chat?seller=${purchase.seller_username}`);
            }}
            style={{ justifyContent: "center", flex: 1 }}
          >
            <MessageCircle size={14} />
            {t("contactSeller")}
          </button>
        </div>
        {canDownload(purchase.status) && (
          <div style={{ marginTop: "0.75rem" }}>
            <button
              className="btn-primary"
              disabled={receiptLoading}
              onClick={handleDownloadReceipt}
              style={{ justifyContent: "center", width: "100%" }}
            >
              <Download size={14} />
              {receiptLoading ? `${t("generating")}…` : t("downloadReceipt")}
            </button>
          </div>
        )}
        {receiptError && (
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.8125rem",
              color: "var(--color-danger)",
              textAlign: "center",
            }}
          >
            {receiptError}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const { user_id } = useAuth();
  const t = useTranslations("Purchases");
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Purchase | null>(null);
  const [completedSelected, setCompletedSelected] = useState<Purchase | null>(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!user_id) return;
      try {
        const res = await axios.get(
          `${API}/transactions/purchases/${user_id}`,
          {
            withCredentials: true,
          },
        );
        setPurchases(res.data.purchases || []);
      } catch {
        setError(t("errorLoad"));
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, [user_id, t]);

  const totalSpent = purchases
    .filter((p) => ["paid", "delivered", "completed"].includes(p.status))
    .reduce((s, p) => s + Number(p.amount), 0);

  const deliveredCount = purchases.filter(
    (p) => p.status === "delivered" || p.status === "completed",
  ).length;

  const completedPurchases = purchases.filter((p) => p.status === "completed");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}>
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "2rem 1.25rem calc(4rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            marginBottom: "1.75rem",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--color-text-heading)",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {t("title")}
            </h1>
            <p
              style={{
                marginTop: "0.25rem",
                fontSize: "0.9rem",
                color: "var(--color-text-muted)",
              }}
            >
              {t("subtitle")}
            </p>
          </div>
          <Link
            href="/dashboard"
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              textDecoration: "none",
              alignSelf: "center",
            }}
          >
            {t("backToDashboard")}
          </Link>
        </div>

        {/* ── Summary stats ── */}
        {!loading && !error && purchases.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            {[
              { label: t("statTotal"), value: purchases.length },
              {
                label: t("statSpent"),
                value: `${fmt(totalSpent)} ${purchases[0]?.currency ?? ""}`,
              },
              { label: t("statDelivered"), value: deliveredCount },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="card"
                style={{ padding: "0.875rem 1rem", textAlign: "center" }}
              >
                <p
                  style={{
                    margin: "0 0 0.2rem",
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    fontSize: "1rem",
                    color: "var(--color-text-heading)",
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="tx-row-list">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  padding: "0.9375rem 1.125rem",
                  display: "flex",
                  gap: "0.875rem",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--color-border)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 14,
                      background: "var(--color-border)",
                      borderRadius: 4,
                      marginBottom: 6,
                      width: "60%",
                    }}
                  />
                  <div
                    style={{
                      height: 12,
                      background: "var(--color-mist)",
                      borderRadius: 4,
                      width: "40%",
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 80,
                    height: 14,
                    background: "var(--color-border)",
                    borderRadius: 4,
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {/* ── Purchase list ── */}
        {!loading && !error && (
          <>
            {purchases.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3.5rem 1.5rem",
                  backgroundColor: "var(--color-white)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "0.9375rem",
                  }}
                >
                  {t("emptyPurchases")}
                </p>
                <Link
                  href="/pay"
                  className="btn-primary"
                  style={{
                    display: "inline-flex",
                    marginTop: "1rem",
                    textDecoration: "none",
                  }}
                >
                  {t("browseSellers")}
                </Link>
              </div>
            ) : (
              <div className="tx-row-list">
                {purchases.map((p, i) => {
                  const pill = statusPill(p.status);
                  return (
                    <button
                      key={`${p.invoicenumber}-${i}`}
                      className="tx-row"
                      onClick={() => setSelected(p)}
                      aria-label={`${p.invoicename} ${p.amount} ${p.currency}`}
                    >
                      <SellerAvatar purchase={p} size={40} />
                      <div className="tx-row-body">
                        <p className="tx-row-name">{p.invoicename}</p>
                        <p className="tx-row-sub">
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--color-text-body)",
                            }}
                          >
                            {p.seller_name}
                          </span>
                          <span
                            style={{
                              color: "var(--color-border-strong)",
                              margin: "0 0.3rem",
                            }}
                          >
                            ·
                          </span>
                          <span>{shortDate(p.createdat)}</span>
                        </p>
                      </div>
                      <div className="tx-row-right">
                        <p className="tx-row-amount">
                          {fmt(p.amount)} {p.currency}
                        </p>
                        <span
                          className="tx-status-pill"
                          style={{
                            background: pill.bg,
                            color: pill.color,
                            border: `1px solid ${pill.border}`,
                          }}
                        >
                          {statusLabel(p.status)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Completed Orders section ── */}
        {!loading && !error && completedPurchases.length > 0 && (
          <div style={{ marginTop: "2.5rem" }}>
            {/* Section header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.875rem",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    color: "var(--color-text-heading)",
                    margin: "0 0 0.2rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {t("completedOrdersTitle")}
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {t("completedOrdersSubtitle")}
                </p>
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "2rem",
                  height: "1.625rem",
                  padding: "0 0.6rem",
                  borderRadius: "9999px",
                  background: "rgba(22,163,74,0.1)",
                  border: "1px solid rgba(22,163,74,0.28)",
                  color: "#166534",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                }}
              >
                {completedPurchases.length}
              </span>
            </div>

            {/* Completed orders list */}
            <div className="tx-row-list">
              {completedPurchases.map((p, i) => {
                const pill = statusPill(p.status);
                return (
                  <button
                    key={`completed-${p.invoicenumber}-${i}`}
                    className="tx-row"
                    onClick={() => setCompletedSelected(p)}
                    aria-label={`${p.invoicename} — ${p.amount} ${p.currency}`}
                    style={{ position: "relative" }}
                  >
                    {/* Green left accent bar */}
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "20%",
                        bottom: "20%",
                        width: "3px",
                        borderRadius: "0 3px 3px 0",
                        background: "rgba(22,163,74,0.7)",
                      }}
                      aria-hidden="true"
                    />
                    <SellerAvatar purchase={p} size={40} />
                    <div className="tx-row-body">
                      <p className="tx-row-name">{p.invoicename}</p>
                      <p className="tx-row-sub">
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--color-text-body)",
                          }}
                        >
                          {p.seller_name}
                        </span>
                        <span
                          style={{
                            color: "var(--color-border-strong)",
                            margin: "0 0.3rem",
                          }}
                        >
                          ·
                        </span>
                        <span>{shortDate(p.delivered_at || p.createdat)}</span>
                      </p>
                    </div>
                    <div className="tx-row-right">
                      <p className="tx-row-amount">
                        {fmt(p.amount)} {p.currency}
                      </p>
                      <span
                        className="tx-status-pill"
                        style={{
                          background: pill.bg,
                          color: pill.color,
                          border: `1px solid ${pill.border}`,
                        }}
                      >
                        {statusLabel(p.status)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Purchase detail modal (all purchases) ── */}
      {selected && (
        <PurchaseDetailModal
          purchase={selected}
          onClose={() => setSelected(null)}
          t={t}
          router={router}
        />
      )}

      {/* ── Completed order detail modal ── */}
      {completedSelected && (
        <PurchaseDetailModal
          purchase={completedSelected}
          onClose={() => setCompletedSelected(null)}
          t={t}
          router={router}
        />
      )}
    </div>
  );
}
