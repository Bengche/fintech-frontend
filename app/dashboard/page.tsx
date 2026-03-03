"use client";
import CreateInvoice from "../components/createInvoice";
import GetAllInvoices from "../components/getAllInvoices";
import FilterInvoice from "../components/filterInvoice";
import RevenueStats from "../components/RevenueStats";
import EscrowBalance from "../components/EscrowBalance";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { InlineSpinner } from "@/app/components/Spinner";
import { useTranslations } from "next-intl";
import { haptic } from "@/hooks/useHaptic";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type Tab = "invoices" | "filter" | "payment" | "stats";

export default function Dashboard() {
  const { user_id } = useAuth();
  const router = useRouter();
  const t = useTranslations("Dashboard");

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("invoices");

  // Holds the refresh function registered by <GetAllInvoices>
  const [triggerRefresh, setTriggerRefresh] = useState<(() => void) | null>(
    null,
  );
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Request payment state
  const [code, setCode] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paySuccess, setPaySuccess] = useState("");
  const [payError, setPayError] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  // Profile navigation
  const [profileLoading, setProfileLoading] = useState(false);

  const goToMyProfile = async () => {
    if (profileLoading) return;
    setProfileLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/profile/user-info/${user_id}`,
        { withCredentials: true },
      );
      router.push(`/profile/${response.data.username}`);
    } catch (err) {
      console.log("Could not load profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleReleaseFunds = async () => {
    haptic("medium");
    if (!code || !invoiceNumber) return;
    setPayLoading(true);
    setPaySuccess("");
    setPayError("");
    try {
      const response = await axios.post(`${API_URL}/api/release-funds`, {
        code,
        invoiceNumber,
      });
      setPaySuccess(response.data.message || t("payoutTab.successDefault"));
      setCode("");
      setInvoiceNumber("");
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      setPayError(
        e.response?.data?.error ||
          e.response?.data?.message ||
          t("payoutTab.errorDefault"),
      );
    } finally {
      setPayLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "invoices", label: t("tabs.invoices") },
    { key: "filter", label: t("tabs.filter") },
    { key: "payment", label: t("tabs.payment") },
    { key: "stats", label: t("tabs.stats") },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}>
      <div
        className="db-container"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "2rem 1.25rem 4rem",
        }}
      >
        {/* â”€â”€ Escrow balance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ marginTop: "1.75rem" }}>
          <EscrowBalance />
        </div>

        {/* â”€â”€ Create invoice â€” primary CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ marginTop: "1.25rem" }}>
          <CreateInvoice
            onCreated={() => {
              setActiveTab("invoices");
              triggerRefresh?.();
            }}
          />
        </div>

        {/* â”€â”€ Tab bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div
          className="db-tabs"
          style={{
            marginTop: "2rem",
            borderBottom: "2px solid var(--color-border)",
            display: "flex",
            gap: "0",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                haptic("soft");
                setActiveTab(t.key);
              }}
              className="db-tab-btn"
              style={{
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === t.key
                    ? "2px solid var(--color-primary)"
                    : "2px solid transparent",
                marginBottom: "-2px",
                padding: "0.625rem 1.25rem",
                fontSize: "0.9rem",
                fontWeight: activeTab === t.key ? 700 : 500,
                color:
                  activeTab === t.key
                    ? "var(--color-primary)"
                    : "var(--color-text-muted)",
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* â”€â”€ Tab content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ marginTop: "1.5rem" }}>
          {/* My Invoices */}
          {activeTab === "invoices" && (
            <div>
              {/* Tab panel header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      color: "var(--color-text-heading)",
                    }}
                  >
                    {t("invoicesTab.title")}
                  </h2>
                  <p
                    style={{
                      margin: "0.2rem 0 0",
                      fontSize: "0.8125rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {t("invoicesTab.subtitle")}
                  </p>
                </div>
                <button
                  className="btn-primary"
                  disabled={refreshLoading}
                  onClick={() => {
                    if (triggerRefresh) {
                      setRefreshLoading(true);
                      triggerRefresh();
                      setTimeout(() => setRefreshLoading(false), 1200);
                    }
                  }}
                  style={{ fontSize: "0.875rem", padding: "0.45rem 1.1rem" }}
                >
                  {refreshLoading ? (
                    <InlineSpinner size="xs" />
                  ) : (
                    t("invoicesTab.refresh")
                  )}
                </button>
              </div>

              <GetAllInvoices
                link=""
                hideHeader
                onRegisterRefresh={(fn) => setTriggerRefresh(() => fn)}
              />
            </div>
          )}

          {/* Revenue & Stats */}
          {activeTab === "stats" && (
            <div>
              <div style={{ marginBottom: "1.25rem" }}>
                <h2
                  style={{
                    margin: "0 0 0.25rem",
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "var(--color-text-heading)",
                  }}
                >
                  {t("statsTab.title")}
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {t("statsTab.subtitle")}
                </p>
              </div>
              <RevenueStats />
            </div>
          )}

          {/* Request Payment */}
          {activeTab === "payment" && (
            <div className="card db-payment-card" style={{ maxWidth: "560px" }}>
              {/* Header */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h2
                  style={{
                    margin: "0 0 0.375rem",
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "var(--color-text-heading)",
                  }}
                >
                  {t("payoutTab.title")}
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {t("payoutTab.body")}
                </p>
              </div>

              {/* Feedback */}
              {paySuccess && (
                <div
                  className="alert alert-success"
                  style={{ marginBottom: "1rem" }}
                >
                  {paySuccess}
                </div>
              )}
              {payError && (
                <div
                  className="alert alert-danger"
                  style={{ marginBottom: "1rem" }}
                >
                  {payError}
                </div>
              )}

              {/* Fields */}
              <div
                className="db-payment-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.875rem",
                  marginBottom: "1.125rem",
                }}
              >
                <div>
                  <label className="label">
                    {t("payoutTab.invoiceNumberLabel")}
                  </label>
                  <input
                    className="input"
                    placeholder={t("payoutTab.invoiceNumberPlaceholder")}
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">{t("payoutTab.codeLabel")}</label>
                  <input
                    className="input"
                    placeholder={t("payoutTab.codePlaceholder")}
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
              </div>

              <button
                className="btn-accent"
                disabled={payLoading || !code || !invoiceNumber}
                onClick={handleReleaseFunds}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "0.7rem",
                }}
              >
                {payLoading ? t("payoutTab.processing") : t("payoutTab.submit")}
              </button>
            </div>
          )}

          {/* Search & Filter */}
          {activeTab === "filter" && <FilterInvoice />}
        </div>
      </div>
    </div>
  );
}
