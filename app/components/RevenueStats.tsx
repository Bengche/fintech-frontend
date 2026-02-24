"use client";
import { useState } from "react";
import Axios from "axios";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "next-intl";

interface StatsData {
  totalInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  deliveredInvoices: number;
  totalRevenue: number;
  totalSpent: number;
}

function StatCard({
  value,
  label,
  highlight,
}: {
  value: number;
  label: string;
  highlight?: "success" | "warning" | "info" | "danger";
}) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    success: {
      bg: "var(--color-success-bg)",
      text: "var(--color-success)",
      border: "var(--color-success-border)",
    },
    warning: {
      bg: "var(--color-warning-bg)",
      text: "var(--color-warning)",
      border: "var(--color-warning-border)",
    },
    info: {
      bg: "var(--color-info-bg)",
      text: "var(--color-info)",
      border: "var(--color-info-border)",
    },
    danger: {
      bg: "var(--color-danger-bg)",
      text: "var(--color-danger)",
      border: "var(--color-danger-border)",
    },
  };
  const c = highlight ? colors[highlight] : null;
  return (
    <div
      style={{
        padding: "0.875rem",
        textAlign: "center",
        backgroundColor: c ? c.bg : "var(--color-mist)",
        border: `1px solid ${c ? c.border : "var(--color-border)"}`,
        borderRadius: "var(--radius-sm)",
      }}
    >
      <p
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color: c ? c.text : "var(--color-text-heading)",
          margin: "0 0 0.25rem",
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
          margin: 0,
        }}
      >
        {label}
      </p>
    </div>
  );
}

export default function RevenueStats() {
  const { user_id } = useAuth();
  const t = useTranslations("RevenueStats");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadStats = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await Axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}/invoice/stats/${user_id}`,
      );
      setStats(response.data);
    } catch {
      setErrorMessage(t("errorLoad"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: stats ? "1.25rem" : 0,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
            }}
          >
            {t("title")}
          </h3>
          <p
            style={{
              margin: "0.2rem 0 0",
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
            }}
          >
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={loadStats}
          className="btn-ghost"
          style={{ fontSize: "0.875rem", padding: "0.45rem 1rem" }}
          disabled={isLoading}
        >
          {isLoading ? t("loading") : stats ? t("refresh") : t("viewStats")}
        </button>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" style={{ marginTop: "0.75rem" }}>
          {errorMessage}
        </div>
      )}

      {stats && (
        <div>
          {/* Invoice Overview */}
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.8125rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-text-muted)",
              margin: "0 0 0.75rem",
            }}
          >
            {t("invoiceOverview")}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <StatCard value={stats.totalInvoices} label={t("totalInvoices")} />
            <StatCard
              value={stats.pendingInvoices}
              label={t("pending")}
              highlight="warning"
            />
            <StatCard
              value={stats.paidInvoices}
              label={t("inEscrow")}
              highlight="info"
            />
            <StatCard
              value={stats.deliveredInvoices}
              label={t("delivered")}
              highlight="success"
            />
          </div>

          {/* Revenue */}
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.8125rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-text-muted)",
              margin: "0 0 0.75rem",
            }}
          >
            {t("revenueSpending")}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--color-success-bg)",
                border: "1px solid var(--color-success-border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  margin: "0 0 0.375rem",
                }}
              >
                {t("totalEarned")}
              </p>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--color-success)",
                  margin: 0,
                }}
              >
                {stats.totalRevenue.toLocaleString()} XAF
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  margin: "0.25rem 0 0",
                }}
              >
                {t("fromPayouts")}
              </p>
            </div>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--color-danger-bg)",
                border: "1px solid var(--color-danger-border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  margin: "0 0 0.375rem",
                }}
              >
                {t("totalSpent")}
              </p>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--color-danger)",
                  margin: 0,
                }}
              >
                {stats.totalSpent.toLocaleString()} XAF
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  margin: "0.25rem 0 0",
                }}
              >
                {t("fromPurchases")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
