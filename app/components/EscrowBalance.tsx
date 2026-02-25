"use client";
import { useEffect, useState } from "react";
import Axios from "axios";
import { useAuth } from "@/context/UserContext";
import { Lock, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const FEE = 0.03;

interface EscrowData {
  invoiceCount: number;
  grossAmount: number;
  netAmount: number;
}

export default function EscrowBalance() {
  const { user_id } = useAuth();
  const [data, setData] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await Axios.get(`${API}/invoice/escrow-balance/${user_id}`, {
        withCredentials: true,
      });
      setData(res.data);
    } catch {
      /* silently ignore — not critical */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user_id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user_id]);

  // Nothing to show until the first load completes
  if (loading) return null;

  // No funds in escrow — show a subtle empty state so the card doesn't vanish
  const hasBalance = data && data.netAmount > 0;

  return (
    <div
      className="db-escrow"
      style={{
        background: hasBalance
          ? "linear-gradient(135deg, #0f1f3d 0%, #1e3a5f 100%)"
          : "var(--color-white)",
        border: hasBalance ? "none" : "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "1.25rem 1.5rem",
        boxShadow: hasBalance
          ? "0 4px 24px rgba(15,31,61,0.18)"
          : "var(--shadow-card)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      {/* Left — icon + labels */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div
          style={{
            width: "2.75rem",
            height: "2.75rem",
            borderRadius: "50%",
            backgroundColor: hasBalance
              ? "rgba(255,255,255,0.12)"
              : "var(--color-mist)",
            border: hasBalance
              ? "1px solid rgba(255,255,255,0.2)"
              : "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Lock
            size={18}
            color={hasBalance ? "#93c5fd" : "var(--color-text-muted)"}
          />
        </div>

        <div>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: hasBalance
                ? "rgba(255,255,255,0.6)"
                : "var(--color-text-muted)",
            }}
          >
            Pending Escrow Balance
          </p>

          {hasBalance ? (
            <>
              <p
                style={{
                  margin: "0.2rem 0 0",
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1.15,
                  letterSpacing: "-0.01em",
                }}
              >
                {data!.netAmount.toLocaleString()}{" "}
                <span
                  style={{ fontSize: "1rem", fontWeight: 600, opacity: 0.7 }}
                >
                  XAF
                </span>
              </p>
              <p
                style={{
                  margin: "0.3rem 0 0",
                  fontSize: "0.78rem",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                After {(FEE * 100).toFixed(0)}% platform fee &nbsp;·&nbsp;{" "}
                {data!.invoiceCount}{" "}
                {data!.invoiceCount === 1 ? "invoice" : "invoices"} awaiting
                buyer confirmation
              </p>
            </>
          ) : (
            <p
              style={{
                margin: "0.25rem 0 0",
                fontSize: "0.9rem",
                color: "var(--color-text-muted)",
              }}
            >
              No funds in escrow right now.
            </p>
          )}
        </div>
      </div>

      {/* Right — info badges + refresh */}
      <div
        className="db-escrow-right"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          flexShrink: 1,
        }}
      >
        {hasBalance && (
          <div
            className="db-escrow-badges"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
              textAlign: "right",
            }}
          >
            <span
              className="db-escrow-badge"
              style={{
                fontSize: "0.6875rem",
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "999px",
                padding: "0.2rem 0.65rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Gross: {data!.grossAmount.toLocaleString()} XAF
            </span>
            <span
              className="db-escrow-badge"
              style={{
                fontSize: "0.6875rem",
                backgroundColor: "rgba(16,185,129,0.18)",
                color: "#6ee7b7",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: "999px",
                padding: "0.2rem 0.65rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Held securely in escrow
            </span>
          </div>
        )}

        <button
          onClick={() => load(true)}
          disabled={refreshing}
          title="Refresh balance"
          style={{
            background: "none",
            border: hasBalance
              ? "1px solid rgba(255,255,255,0.2)"
              : "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            cursor: refreshing ? "not-allowed" : "pointer",
            padding: "0.45rem",
            display: "flex",
            alignItems: "center",
            opacity: refreshing ? 0.5 : 1,
            transition: "opacity 0.15s",
            color: hasBalance
              ? "rgba(255,255,255,0.6)"
              : "var(--color-text-muted)",
          }}
        >
          <RefreshCw
            size={15}
            style={{
              animation: refreshing ? "spin 0.8s linear infinite" : "none",
            }}
          />
        </button>
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
