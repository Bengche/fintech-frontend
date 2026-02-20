"use client";
import CreateInvoice from "../components/createInvoice";
import GetAllInvoices from "../components/getAllInvoices";
import FilterInvoice from "../components/filterInvoice";
import RevenueStats from "../components/RevenueStats";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { InlineSpinner } from "@/app/components/Spinner";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type Tab = "invoices" | "filter" | "payment" | "stats";

export default function Dashboard() {
  const { user_id } = useAuth();
  const router = useRouter();

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
    if (!code || !invoiceNumber) return;
    setPayLoading(true);
    setPaySuccess("");
    setPayError("");
    try {
      const response = await axios.post(`${API_URL}/api/release-funds`, {
        code,
        invoiceNumber,
      });
      setPaySuccess(response.data.message || "Funds released successfully!");
      setCode("");
      setInvoiceNumber("");
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      setPayError(
        e.response?.data?.error ||
          e.response?.data?.message ||
          "Failed to release funds. Please check your code and invoice number.",
      );
    } finally {
      setPayLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "invoices", label: "My Invoices" },
    { key: "filter", label: "Search & Filter" },
    { key: "payment", label: "Request Payout" },
    { key: "stats", label: "Revenue & Stats" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}>
      <Navbar />

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "2rem 1.25rem 4rem",
        }}
      >
        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.75rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.625rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
                margin: 0,
              }}
            >
              Dashboard
            </h1>
            <p
              style={{
                marginTop: "0.3rem",
                color: "var(--color-text-muted)",
                fontSize: "0.9rem",
                margin: "0.3rem 0 0",
              }}
            >
              Manage your invoices and track your earnings
            </p>
          </div>

          {/* Secondary nav links */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => router.push("/transactions")}
              className="btn-ghost"
              style={{ fontSize: "0.8125rem", padding: "0.4rem 0.875rem" }}
            >
              Transactions
            </button>
            <button
              onClick={goToMyProfile}
              className="btn-ghost"
              disabled={profileLoading}
              style={{
                fontSize: "0.8125rem",
                padding: "0.4rem 0.875rem",
                opacity: profileLoading ? 0.65 : 1,
                cursor: profileLoading ? "not-allowed" : "pointer",
              }}
            >
              {profileLoading ? <InlineSpinner size="xs" /> : "My Profile"}
            </button>
            <button
              onClick={() => router.push("/referral")}
              className="btn-ghost"
              style={{ fontSize: "0.8125rem", padding: "0.4rem 0.875rem" }}
            >
              Referrals
            </button>
          </div>
        </div>

        {/* ── Create invoice — primary CTA ─────────────────────────────────── */}
        <div style={{ marginTop: "1.75rem" }}>
          <CreateInvoice />
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────────── */}
        <div
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
              onClick={() => setActiveTab(t.key)}
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

        {/* ── Tab content ──────────────────────────────────────────────────── */}
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
                    Your Invoices
                  </h2>
                  <p
                    style={{
                      margin: "0.2rem 0 0",
                      fontSize: "0.8125rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    All invoices you have created
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
                    "Refresh Invoices"
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

          {/* Search & Filter */}
          {activeTab === "filter" && <FilterInvoice />}

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
                  Revenue &amp; Stats
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  An overview of your earnings and invoice activity
                </p>
              </div>
              <RevenueStats />
            </div>
          )}

          {/* Request Payment */}
          {activeTab === "payment" && (
            <div className="card" style={{ maxWidth: "560px" }}>
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
                  Already completed an invoice?
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Once the buyer confirms delivery, they receive a unique code.
                  Enter it below along with your invoice number to release your
                  funds instantly.
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
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.875rem",
                  marginBottom: "1.125rem",
                }}
              >
                <div>
                  <label className="label">Invoice number</label>
                  <input
                    className="input"
                    placeholder="e.g. INV-00001"
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">
                    Buyer&apos;s confirmation code
                  </label>
                  <input
                    className="input"
                    placeholder="Enter code"
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
                {payLoading ? "Processing…" : "Request Payment"}
              </button>
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
