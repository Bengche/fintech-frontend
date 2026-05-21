"use client";
import { useState, useEffect } from "react";
import Axios from "axios";
import { useAuth } from "@/context/UserContext";
import Link from "next/link";
import { SkeletonRow } from "@/app/components/Spinner";
import { useTranslations } from "next-intl";
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  ExternalLink,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type Transaction = {
  id: number;
  transaction_type: "payment" | "payout";
  amount: number;
  currency: string;
  status: string;
  createdat: string;
  invoicename: string;
  invoicenumber: string;
  gross_amount?: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusPill(status: string) {
  const s = status.toLowerCase();
  if (s === "paid" || s === "success" || s === "completed")
    return {
      bg: "var(--color-success-bg)",
      color: "#166534",
      border: "var(--color-success-border)",
      label: status.charAt(0).toUpperCase() + status.slice(1),
    };
  if (s === "pending")
    return {
      bg: "var(--color-warning-bg)",
      color: "#92400e",
      border: "var(--color-warning-border)",
      label: "Pending",
    };
  if (s === "failed" || s === "disputed")
    return {
      bg: "var(--color-danger-bg)",
      color: "#991b1b",
      border: "var(--color-danger-border)",
      label: status.charAt(0).toUpperCase() + status.slice(1),
    };
  return {
    bg: "var(--color-mist)",
    color: "var(--color-text-muted)",
    border: "var(--color-border)",
    label: status.charAt(0).toUpperCase() + status.slice(1),
  };
}

function shortDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function fullDate(d: string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function canDownload(status: string) {
  const s = status.toLowerCase();
  return s === "paid" || s === "completed" || s === "delivered";
}

// ── Transaction Detail Modal ──────────────────────────────────────────────────

function TransactionDetailModal({
  tx,
  isReceived,
  onClose,
  t,
}: {
  tx: Transaction;
  isReceived: boolean;
  onClose: () => void;
  t: ReturnType<typeof useTranslations<"Transactions">>;
}) {
  const pill = statusPill(tx.status);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const hasInvoice = Boolean(tx.invoicenumber);

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
      const res = await fetch(`${API}/invoice/receipt/${tx.invoicenumber}`, {
        credentials: "include",
      });
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
        a.download = `fonlok-receipt-${tx.invoicenumber}.pdf`;
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

        <div className="tx-modal-hero">
          <div
            className={`tx-modal-hero-icon ${isReceived ? "is-received" : "is-spent"}`}
          >
            {isReceived ? (
              <ArrowDownLeft size={24} />
            ) : (
              <ArrowUpRight size={24} />
            )}
          </div>
          <div className={`tx-modal-amount ${isReceived ? "is-credit" : ""}`}>
            {isReceived ? "+" : "−"}
            {Number(tx.amount).toLocaleString()} {tx.currency}
          </div>
          <span
            className="tx-status-pill"
            style={{
              background: pill.bg,
              color: pill.color,
              border: `1px solid ${pill.border}`,
            }}
          >
            {pill.label}
          </span>
        </div>

        <div className="tx-modal-rows">
          <div className="tx-modal-row">
            <span className="tx-modal-label">{t("modalInvoiceName")}</span>
            <span className="tx-modal-value">{tx.invoicename}</span>
          </div>
          {hasInvoice && (
            <div className="tx-modal-row">
              <span className="tx-modal-label">{t("modalReference")}</span>
              <span className="tx-modal-value mono">#{tx.invoicenumber}</span>
            </div>
          )}
          <div className="tx-modal-row">
            <span className="tx-modal-label">{t("modalDate")}</span>
            <span className="tx-modal-value">{fullDate(tx.createdat)}</span>
          </div>
          <div className="tx-modal-row">
            <span className="tx-modal-label">{t("modalType")}</span>
            <span className="tx-modal-value">{pill.label}</span>
          </div>
          {tx.transaction_type === "payout" &&
            tx.gross_amount !== undefined &&
            tx.gross_amount !== tx.amount && (
              <>
                <div className="tx-modal-row">
                  <span className="tx-modal-label">
                    {t("modalGrossAmount")}
                  </span>
                  <span className="tx-modal-value">
                    {Number(tx.gross_amount).toLocaleString()} {tx.currency}
                  </span>
                </div>
                <div className="tx-modal-row">
                  <span className="tx-modal-label">
                    {t("modalNetReceived")}
                  </span>
                  <span
                    className="tx-modal-value"
                    style={{ color: "var(--color-success)", fontWeight: 600 }}
                  >
                    {Number(tx.amount).toLocaleString()} {tx.currency}
                  </span>
                </div>
              </>
            )}
        </div>

        {/* Action buttons — only shown when there is a linked invoice */}
        {hasInvoice && (
          <div className="tx-modal-actions">
            <Link
              href={
                isReceived
                  ? `/invoice/${tx.invoicenumber}`
                  : `/pay/${tx.invoicenumber}`
              }
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
            {canDownload(tx.status) && (
              <button
                className="btn-primary"
                style={{ justifyContent: "center", flex: 1 }}
                onClick={handleDownloadReceipt}
                disabled={receiptLoading}
              >
                <Download size={14} />
                {receiptLoading ? `${t("generating")}…` : t("downloadReceipt")}
              </button>
            )}
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

export default function TransactionsPage() {
  const { user_id } = useAuth();
  const t = useTranslations("Transactions");
  const [sellerTransactions, setSellerTransactions] = useState<Transaction[]>(
    [],
  );
  const [buyerTransactions, setBuyerTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"received" | "spent">("received");
  const [selected, setSelected] = useState<Transaction | null>(null);

  // Statement state
  const [statementStartDate, setStatementStartDate] = useState("");
  const [statementEndDate, setStatementEndDate] = useState("");
  const [statementLanguage, setStatementLanguage] = useState("en");
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementError, setStatementError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user_id) return;
      try {
        const response = await Axios.get(
          `${API}/transactions/history/${user_id}`,
          { withCredentials: true },
        );
        const dedup = <T extends { id: number }>(arr: T[]): T[] => [
          ...new Map(arr.map((item) => [item.id, item])).values(),
        ];
        setSellerTransactions(dedup(response.data.sellerTransactions));
        setBuyerTransactions(dedup(response.data.buyerTransactions));
      } catch {
        setError(t("errorLoad"));
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user_id, t]);

  const downloadStatement = async () => {
    if (
      statementStartDate &&
      statementEndDate &&
      new Date(statementStartDate) > new Date(statementEndDate)
    ) {
      setStatementError(t("statementDateError"));
      return;
    }
    setStatementLoading(true);
    setStatementError("");
    try {
      const params = new URLSearchParams();
      if (statementStartDate) {
        const start = new Date(statementStartDate);
        start.setHours(0, 0, 0, 0);
        params.set("start_date", start.toISOString());
      }
      if (statementEndDate) {
        const end = new Date(statementEndDate);
        end.setHours(23, 59, 59, 999);
        params.set("end_date", end.toISOString());
      }
      params.set("lang", statementLanguage);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      const res = await Axios.get(
        `${API}/transactions/statement?${params.toString()}`,
        {
          withCredentials: true,
          responseType: "blob",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );

      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        statementStartDate && statementEndDate
          ? `fonlok-statement-${statementStartDate}-to-${statementEndDate}.pdf`
          : "fonlok-statement-full.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Blob; status?: number } };
      if (e.response?.data instanceof Blob) {
        try {
          const text = await e.response.data.text();
          const parsed = JSON.parse(text) as { message?: string };
          setStatementError(parsed.message || t("statementFailed"));
          return;
        } catch {
          /* fall through */
        }
      }
      setStatementError(t("statementFailed"));
    } finally {
      setStatementLoading(false);
    }
  };

  const sortByNewest = (txs: Transaction[]) =>
    [...txs].sort(
      (a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime(),
    );

  const activeTransactions =
    activeTab === "received"
      ? sortByNewest(sellerTransactions)
      : sortByNewest(buyerTransactions);

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

        {/* ── Tab switcher ── */}
        <div
          style={{
            display: "flex",
            backgroundColor: "var(--color-mist)",
            borderRadius: "var(--radius-md)",
            padding: "0.25rem",
            marginBottom: "1.5rem",
            gap: "0.25rem",
          }}
        >
          {(["received", "spent"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "0.5625rem 1rem",
                borderRadius: "calc(var(--radius-md) - 2px)",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
                transition:
                  "background-color 0.15s, color 0.15s, box-shadow 0.15s",
                backgroundColor:
                  activeTab === tab ? "var(--color-white)" : "transparent",
                color:
                  activeTab === tab
                    ? "var(--color-text-heading)"
                    : "var(--color-text-muted)",
                boxShadow: activeTab === tab ? "var(--shadow-card)" : "none",
              }}
            >
              {tab === "received" ? t("tabReceived") : t("tabSpent")}
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.75rem",
                  backgroundColor:
                    activeTab === tab
                      ? "var(--color-mist)"
                      : "var(--color-border)",
                  color:
                    activeTab === tab
                      ? "var(--color-text-body)"
                      : "var(--color-text-muted)",
                  borderRadius: "9999px",
                  padding: "0.1rem 0.5rem",
                }}
              >
                {tab === "received"
                  ? sellerTransactions.length
                  : buyerTransactions.length}
              </span>
            </button>
          ))}
        </div>

        {/* ── Statement download card ── */}
        <div
          className="card"
          style={{
            marginBottom: "1.5rem",
            borderLeft: "4px solid var(--color-primary)",
          }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
              margin: "0 0 0.3rem",
            }}
          >
            {t("downloadStatement")}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              margin: "0 0 1rem",
              lineHeight: 1.6,
            }}
          >
            {t("downloadStatementDesc")}
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            {[
              {
                key: "start",
                label: t("fromDate"),
                value: statementStartDate,
                set: setStatementStartDate,
              },
              {
                key: "end",
                label: t("toDate"),
                value: statementEndDate,
                set: setStatementEndDate,
              },
            ].map(({ key, label, value, set }) => (
              <div key={key} style={{ flex: "1 1 120px" }}>
                <label className="label">{label}</label>
                <input
                  type="date"
                  className="input"
                  value={value}
                  onChange={(e) => {
                    set(e.target.value);
                    setStatementError("");
                  }}
                />
              </div>
            ))}
            <div style={{ flex: "1 1 120px" }}>
              <label className="label">{t("language")}</label>
              <select
                className="input"
                value={statementLanguage}
                onChange={(e) => setStatementLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <button
              onClick={downloadStatement}
              disabled={statementLoading}
              className="btn-primary"
              style={{ padding: "0.625rem 1.25rem", whiteSpace: "nowrap" }}
            >
              <Download size={14} />
              {statementLoading ? `${t("generating")}…` : t("downloadBtn")}
            </button>
          </div>
          {statementError && (
            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.875rem",
                color: "var(--color-danger)",
              }}
            >
              {statementError}
            </p>
          )}
        </div>

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="tx-row-list">
            {[...Array(6)].map((_, i) => (
              <SkeletonRow key={i} cols={3} />
            ))}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {/* ── Transaction list ── */}
        {!loading && !error && (
          <>
            {activeTransactions.length === 0 ? (
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
                  {activeTab === "received"
                    ? t("emptyReceived")
                    : t("emptySpent")}
                </p>
              </div>
            ) : (
              <div className="tx-row-list">
                {activeTransactions.map((tx, i) => {
                  const isReceived = activeTab === "received";
                  const pill = statusPill(tx.status);
                  return (
                    <button
                      key={`${activeTab}-${tx.id}-${i}`}
                      className="tx-row"
                      onClick={() => setSelected(tx)}
                      aria-label={`${tx.invoicename} ${tx.amount} ${tx.currency}`}
                    >
                      <div
                        className={`tx-row-icon ${isReceived ? "is-received" : "is-spent"}`}
                      >
                        {isReceived ? (
                          <ArrowDownLeft size={17} />
                        ) : (
                          <ArrowUpRight size={17} />
                        )}
                      </div>
                      <div className="tx-row-body">
                        <p className="tx-row-name">{tx.invoicename}</p>
                        <p className="tx-row-sub">
                          <span
                            style={{
                              fontFamily:
                                'ui-monospace,"Cascadia Code",monospace',
                              fontSize: "0.7rem",
                            }}
                          >
                            #{tx.invoicenumber}
                          </span>
                          <span
                            style={{
                              color: "var(--color-border-strong)",
                              margin: "0 0.3rem",
                            }}
                          >
                            ·
                          </span>
                          <span>{shortDate(tx.createdat)}</span>
                        </p>
                      </div>
                      <div className="tx-row-right">
                        <p
                          className={`tx-row-amount ${isReceived ? "is-credit" : ""}`}
                        >
                          {isReceived ? "+" : "−"}
                          {Number(tx.amount).toLocaleString()} {tx.currency}
                        </p>
                        <span
                          className="tx-status-pill"
                          style={{
                            background: pill.bg,
                            color: pill.color,
                            border: `1px solid ${pill.border}`,
                          }}
                        >
                          {pill.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Detail modal ── */}
      {selected && (
        <TransactionDetailModal
          tx={selected}
          isReceived={activeTab === "received"}
          onClose={() => setSelected(null)}
          t={t}
        />
      )}
    </div>
  );
}
