"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import SiteFooter from "@/app/components/SiteFooter";
import { useAuth } from "@/context/UserContext";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type Purchase = {
  invoicenumber: string;
  invoicename: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "delivered" | "expired" | "disputed";
  createdat: string;
  paid_at: string | null;
  delivered_at: string | null;
  payment_type: "full" | "installment";
  description: string;
  seller_name: string;
  seller_username: string;
  seller_avatar: string | null;
};

const statusConfig: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  pending: { label: "Pending", bg: "#fef9c3", color: "#854d0e" },
  paid: { label: "Paid", bg: "#dcfce7", color: "#166534" },
  delivered: { label: "Delivered", bg: "#dbeafe", color: "#1e40af" },
  expired: { label: "Expired", bg: "#f3f4f6", color: "#6b7280" },
  disputed: { label: "Disputed", bg: "#fee2e2", color: "#991b1b" },
};

function fmt(n: number) {
  return Number(n).toLocaleString("en-US");
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PurchasesPage() {
  const { user_id } = useAuth() ?? {};
  const router = useRouter();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user_id) {
      router.replace("/login");
      return;
    }
    const load = async () => {
      try {
        const res = await axios.get(`${API}/invoice/my-purchases`, {
          withCredentials: true,
        });
        setPurchases(res.data.purchases ?? []);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        setError(
          e.response?.data?.message ??
            "Failed to load your purchases. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user_id, router]);

  const totalSpent = purchases
    .filter((p) => p.status === "paid" || p.status === "delivered")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}>
      <Navbar />

      <div
        style={{
          maxWidth: "1040px",
          margin: "0 auto",
          padding: "2rem 1.25rem",
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--color-navy)",
              margin: 0,
            }}
          >
            My Purchases
          </h1>
          <p
            style={{
              color: "var(--color-slate)",
              marginTop: "0.35rem",
              fontSize: "0.95rem",
            }}
          >
            All invoices you have paid through Fonlok.
          </p>
        </div>

        {/* Summary card */}
        {!loading && !error && purchases.length > 0 && (
          <div
            className="card"
            style={{
              display: "flex",
              gap: "2rem",
              flexWrap: "wrap",
              marginBottom: "1.75rem",
              padding: "1.25rem 1.5rem",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--color-slate)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Total Purchases
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  color: "var(--color-navy)",
                }}
              >
                {purchases.length}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--color-slate)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Total Spent
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  color: "var(--color-gold)",
                }}
              >
                {fmt(totalSpent)} XAF
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--color-slate)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Delivered
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  color: "#16a34a",
                }}
              >
                {purchases.filter((p) => p.status === "delivered").length}
              </div>
            </div>
          </div>
        )}

        {/* States */}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 0",
              color: "var(--color-slate)",
            }}
          >
            Loading your purchases…
          </div>
        )}

        {!loading && error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && purchases.length === 0 && (
          <div
            className="card"
            style={{ textAlign: "center", padding: "4rem 2rem" }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
              🛒
            </div>
            <h2
              style={{
                color: "var(--color-navy)",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              No purchases yet
            </h2>
            <p style={{ color: "var(--color-slate)", fontSize: "0.95rem" }}>
              When you pay an invoice through Fonlok it will appear here along
              with the delivery status and receipt.
            </p>
          </div>
        )}

        {/* Purchase cards */}
        {!loading && !error && purchases.length > 0 && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {purchases.map((p) => {
              const status = statusConfig[p.status] ?? statusConfig.pending;
              const canDownloadReceipt =
                p.status === "paid" || p.status === "delivered";

              return (
                <div
                  key={p.invoicenumber}
                  className="card"
                  style={{
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {/* Top row: name + status badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "1.05rem",
                          color: "var(--color-navy)",
                        }}
                      >
                        {p.invoicename || "Untitled Invoice"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-slate)",
                          marginTop: "0.15rem",
                        }}
                      >
                        #{p.invoicenumber}
                      </div>
                    </div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        backgroundColor: status.bg,
                        color: status.color,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Mid row: seller info + amount */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {p.seller_avatar ? (
                        <img
                          src={`${API}/uploads/${p.seller_avatar}`}
                          alt={p.seller_name}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            backgroundColor: "var(--color-navy)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                          }}
                        >
                          {(p.seller_name ?? "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "var(--color-navy)",
                          }}
                        >
                          {p.seller_name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-slate)",
                          }}
                        >
                          @{p.seller_username}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "1.15rem",
                          fontWeight: 700,
                          color: "var(--color-gold)",
                        }}
                      >
                        {fmt(p.amount)} {p.currency}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-slate)",
                        }}
                      >
                        {p.payment_type === "installment"
                          ? "Installment"
                          : "One-time"}
                        {" · "}Paid {fmtDate(p.paid_at)}
                      </div>
                    </div>
                  </div>

                  {/* Description snippet */}
                  {p.description && (
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--color-slate)",
                        borderTop: "1px solid var(--color-border, #e5e7eb)",
                        paddingTop: "0.6rem",
                      }}
                    >
                      {p.description.length > 120
                        ? p.description.slice(0, 120) + "…"
                        : p.description}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div
                    style={{
                      display: "flex",
                      gap: "0.6rem",
                      flexWrap: "wrap",
                      paddingTop: "0.25rem",
                    }}
                  >
                    <Link
                      href={`/invoice/${p.invoicenumber}`}
                      className="btn-ghost"
                      style={{ fontSize: "0.85rem", padding: "0.45rem 1rem" }}
                    >
                      View Invoice
                    </Link>

                    {canDownloadReceipt && (
                      <a
                        href={`${API}/invoice/receipt/${p.invoicenumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{ fontSize: "0.85rem", padding: "0.45rem 1rem" }}
                      >
                        Download Receipt
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
