"use client";
import { useState, useEffect } from "react";
import Axios from "axios";
import { useAuth } from "@/context/UserContext";
import Link from "next/link";
import { SkeletonRow } from "@/app/components/Spinner";
import { useTranslations } from "next-intl";

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
};

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

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user_id) return;
      try {
        const response = await Axios.get(
          `${API}/transactions/history/${user_id}`,
          { withCredentials: true },
        );
        // Deduplicate by id to guard against JOIN duplicates from the backend
        const dedup = <T extends { id: number }>(arr: T[]): T[] => [
          ...new Map(arr.map((t) => [t.id, t])).values(),
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
  }, [user_id]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusBadge = (status: string) => {
    const cls =
      status === "paid" || status === "success"
        ? "badge badge-success"
        : status === "pending"
          ? "badge badge-warning"
          : status === "failed"
            ? "badge badge-danger"
            : "badge badge-neutral";
    return (
      <span className={cls}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const activeTransactions =
    activeTab === "received" ? sellerTransactions : buyerTransactions;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}>

      <div
        style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem 1.25rem" }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: "1.75rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
                margin: 0,
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
            }}
          >
            {t("backToDashboard")}
          </Link>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "inline-flex",
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
                padding: "0.5rem 1.25rem",
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

        {/* Loading / error states */}
        {loading && (
          <div
            style={{
              background: "var(--color-white)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            {[...Array(6)].map((_, i) => (
              <SkeletonRow key={i} cols={4} />
            ))}
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Transaction list */}
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {activeTransactions.map((tx, i) => (
                  <div
                    key={`${activeTab}-${tx.id}-${i}`}
                    className="card"
                    style={{ padding: "1.125rem 1.375rem" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontWeight: 600,
                            color: "var(--color-text-heading)",
                            margin: "0 0 0.2rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tx.invoicename}
                        </p>
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-text-muted)",
                            margin: 0,
                            fontFamily: "monospace",
                          }}
                        >
                          #{tx.invoicenumber}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p
                          style={{
                            fontWeight: 700,
                            fontSize: "1.0625rem",
                            margin: "0 0 0.25rem",
                            color:
                              activeTab === "received"
                                ? "var(--color-success)"
                                : "var(--color-text-heading)",
                          }}
                        >
                          {activeTab === "received" ? "+" : "âˆ’"}
                          {tx.amount.toLocaleString()} {tx.currency}
                        </p>
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-text-muted)",
                            margin: 0,
                          }}
                        >
                          {formatDate(tx.createdat)}
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: "0.625rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {statusBadge(tx.status)}
                      {tx.status === "paid" && (
                        <a
                          href={`${API}/invoice/receipt/${tx.invoicenumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: "var(--color-primary)",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          â†“ {t("downloadReceipt")}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
