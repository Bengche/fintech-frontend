"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import SiteFooter from "@/app/components/SiteFooter";
import { useTranslations } from "next-intl";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Earning {
  id: number;
  invoice_number: string;
  invoice_amount: number;
  earned_amount: number;
  created_at: string;
  referred_user_name: string;
  referred_user_username: string;
}

interface ReferredUser {
  id: number;
  name: string;
  username: string;
  created_at?: string;
}

interface Withdrawal {
  id: number;
  amount: number;
  momo_number: string;
  status: "pending" | "paid" | "failed";
  created_at: string;
}

interface DashboardData {
  referral_code: string;
  referral_link: string;
  balance: number;
  min_withdrawal: number;
  earnings: Earning[];
  referred_users: ReferredUser[];
  withdrawals: Withdrawal[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReferralPage() {
  const { user_id, authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("Referral");

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Copy-to-clipboard state
  const [copied, setCopied] = useState(false);

  // Show more / show less state for the three list sections
  const SHOW_LIMIT = 3;
  const [showAllEarnings, setShowAllEarnings] = useState(false);
  const [showAllReferrals, setShowAllReferrals] = useState(false);
  const [showAllWithdrawals, setShowAllWithdrawals] = useState(false);

  // ── Redirect if not logged in ──────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && user_id === null) {
      router.push("/login");
    }
  }, [authLoading, user_id, router]);

  // ── Load dashboard data ────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user_id) return;

    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${API_URL}/referral/dashboard`, {
          withCredentials: true,
        });
        setData(res.data);
      } catch (err: unknown) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.error
            ? err.response.data.error
            : t("loadError");
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [authLoading, user_id]);

  // ── Copy referral link ─────────────────────────────────────────────────────
  const copyLink = async () => {
    if (!data) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(data.referral_link);
      } else {
        // Fallback for older browsers / non-HTTPS contexts
        const ta = document.createElement("textarea");
        ta.value = data.referral_link;
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Silent fail — user can copy the link manually
    }
  };

  // ── Submit withdrawal ──────────────────────────────────────────────────────
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawMsg(null);

    const amt = parseInt(withdrawAmount, 10);
    if (!amt || amt <= 0) {
      setWithdrawMsg({ type: "error", text: t("invalidAmount") });
      return;
    }

    if (!data || amt > data.balance) {
      setWithdrawMsg({
        type: "error",
        text: t("amountExceedsBalance"),
      });
      return;
    }

    if (!data || amt < data.min_withdrawal) {
      setWithdrawMsg({
        type: "error",
        text: t("minWithdrawalError", {
          min: fmt(data?.min_withdrawal ?? 2000),
        }),
      });
      return;
    }

    setWithdrawing(true);
    try {
      const res = await axios.post(
        `${API_URL}/referral/withdraw`,
        { amount: amt, momo_number: `237${momoNumber}` },
        { withCredentials: true },
      );
      setWithdrawMsg({ type: "success", text: res.data.message });
      setWithdrawAmount("");
      setMomoNumber("");

      // Refresh the dashboard to show the new balance and withdrawal record
      const updated = await axios.get(`${API_URL}/referral/dashboard`, {
        withCredentials: true,
      });
      setData(updated.data);
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : t("withdrawFailed");
      setWithdrawMsg({ type: "error", text: message });
    } finally {
      setWithdrawing(false);
    }
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (!user_id || loading) {
    return (
      <div
        style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}
      >
        <Navbar />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6rem 1.25rem",
          }}
        >
          <p style={{ color: "var(--color-text-muted)", fontSize: "1rem" }}>
            {t("loading")}
          </p>
        </div>

        <SiteFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}
      >
        <Navbar />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6rem 1.25rem",
          }}
        >
          <div className="alert alert-danger" style={{ maxWidth: "480px" }}>
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>
              {t("errorTitle")}
            </strong>
            {error}
          </div>
        </div>

        <SiteFooter />
      </div>
    );
  }

  if (!data) return null;

  const hasEarnings = data.earnings.length > 0;
  const hasReferrals = data.referred_users.length > 0;
  const hasWithdrawals = data.withdrawals.length > 0;

  const visibleEarnings = showAllEarnings
    ? data.earnings
    : data.earnings.slice(0, SHOW_LIMIT);
  const visibleReferrals = showAllReferrals
    ? data.referred_users
    : data.referred_users.slice(0, SHOW_LIMIT);
  const visibleWithdrawals = showAllWithdrawals
    ? data.withdrawals
    : data.withdrawals.slice(0, SHOW_LIMIT);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}>
      <Navbar />
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "2rem 1.25rem 4rem",
        }}
      >
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.625rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
              margin: 0,
            }}
          >
            {t("title")}
          </h1>
          <p
            style={{
              marginTop: "0.3rem",
              color: "var(--color-text-muted)",
              fontSize: "0.9375rem",
            }}
          >
            {t("subtitle")}
          </p>
        </div>

        {/* ── 1. Balance ──────────────────────────────────────────────────── */}
        <div
          className="card"
          style={{
            marginBottom: "1.5rem",
            background:
              data.balance > 0
                ? "linear-gradient(135deg, #0f1f3d 0%, #1e3a5f 100%)"
                : undefined,
            border: data.balance > 0 ? "none" : undefined,
            boxShadow:
              data.balance > 0 ? "0 4px 24px rgba(15,31,61,0.18)" : undefined,
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color:
                data.balance > 0
                  ? "rgba(255,255,255,0.55)"
                  : "var(--color-text-muted)",
              margin: "0 0 0.5rem",
            }}
          >
            {t("currentBalance")}
          </p>
          <p
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              color: data.balance > 0 ? "#ffffff" : "var(--color-primary)",
              margin: "0 0 0.25rem",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            {fmt(data.balance)}
          </p>
          <p
            style={{
              fontSize: "0.8rem",
              color:
                data.balance > 0
                  ? "rgba(255,255,255,0.45)"
                  : "var(--color-text-muted)",
              margin: 0,
            }}
          >
            {t("minToWithdraw", { min: fmt(data.min_withdrawal) })}
          </p>
        </div>

        {/* ── 2. Referral Code & Link ─────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontSize: "1.0625rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
              margin: "0 0 1.25rem",
            }}
          >
            {t("codeTitle")}
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: "0 0 0.5rem",
                }}
              >
                {t("codeLabel")}
              </p>
              <div
                style={{
                  backgroundColor: "var(--color-mist)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.875rem 1.25rem",
                  fontFamily: "monospace",
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "var(--color-primary)",
                  letterSpacing: "0.15em",
                  display: "inline-block",
                }}
              >
                {data.referral_code}
              </div>
            </div>
            <div>
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: "0 0 0.5rem",
                }}
              >
                {t("shareLinkLabel")}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    backgroundColor: "var(--color-mist)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.625rem 0.875rem",
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {data.referral_link}
                </div>
                <button
                  onClick={copyLink}
                  className="btn-primary"
                  style={{
                    padding: "0.625rem 1.25rem",
                    fontSize: "0.875rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {copied ? t("copied") : t("copy")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Withdraw Earnings ────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              margin: "0 0 1rem",
              fontSize: "1.0625rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
            }}
          >
            {t("withdrawTitle")}
          </h2>
          <form
            onSubmit={handleWithdraw}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "0.875rem",
            }}
          >
            <div>
              <label className="label">{t("withdrawAmountLabel")}</label>
              <input
                type="number"
                min={data.min_withdrawal}
                max={data.balance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Min. ${data.min_withdrawal.toLocaleString()}`}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">{t("momoLabel")}</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  background: "var(--color-white)",
                }}
              >
                <span
                  style={{
                    padding: "0.625rem 0.75rem",
                    background: "var(--color-cloud)",
                    color: "var(--color-text-muted)",
                    fontSize: "0.9rem",
                    borderRight: "1px solid var(--color-border)",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                  }}
                >
                  +237
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={9}
                  value={momoNumber}
                  onChange={(e) =>
                    setMomoNumber(e.target.value.replace(/\D/g, "").slice(0, 9))
                  }
                  placeholder="6XXXXXXXX"
                  style={{
                    border: "none",
                    outline: "none",
                    padding: "0.625rem 0.75rem",
                    fontSize: "0.9375rem",
                    flex: 1,
                    width: 0,
                    background: "transparent",
                  }}
                  required
                />
              </div>
            </div>
            {/* Feedback + submit span full width */}
            {withdrawMsg && (
              <div
                className={`alert ${withdrawMsg.type === "success" ? "alert-success" : "alert-danger"}`}
                style={{ gridColumn: "1 / -1" }}
              >
                {withdrawMsg.text}
              </div>
            )}
            <div style={{ gridColumn: "1 / -1" }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={withdrawing || data.balance < data.min_withdrawal}
                style={{ justifyContent: "center" }}
              >
                {withdrawing ? t("withdrawing") : t("withdrawBtn")}
              </button>
              {data.balance < data.min_withdrawal && (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-text-muted)",
                    margin: "0.5rem 0 0",
                  }}
                >
                  {t("needAtLeast", { min: fmt(data.min_withdrawal) })}
                </p>
              )}
            </div>
          </form>
        </div>

        {/* ── 4. Earnings History ─────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontSize: "1.0625rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
              margin: "0 0 1.25rem",
            }}
          >
            {t("earningsTitle")}
            {hasEarnings && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: "var(--color-text-muted)",
                }}
              >
                ({data.earnings.length})
              </span>
            )}
          </h2>
          {!hasEarnings ? (
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.9rem",
                textAlign: "center",
                padding: "1.5rem 0",
              }}
            >
              {t("noEarnings")}
            </p>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    fontSize: "0.875rem",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{ borderBottom: "2px solid var(--color-border)" }}
                    >
                      {[
                        { label: t("colInvoice"), right: false },
                        { label: t("colSeller"), right: false },
                        { label: t("colInvoiceAmount"), right: true },
                        { label: t("colEarned"), right: true },
                        { label: t("colDate"), right: false },
                      ].map((h) => (
                        <th
                          key={h.label}
                          style={{
                            paddingBottom: "0.75rem",
                            paddingRight: "1rem",
                            textAlign: h.right ? "right" : "left",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--color-text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEarnings.map((e) => (
                      <tr
                        key={e.id}
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        <td
                          style={{
                            padding: "0.75rem 1rem 0.75rem 0",
                            fontFamily: "monospace",
                            fontSize: "0.8125rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {e.invoice_number}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem 0.75rem 0",
                            color: "var(--color-text-body)",
                          }}
                        >
                          {e.referred_user_name}{" "}
                          <span
                            style={{
                              color: "var(--color-text-muted)",
                              fontSize: "0.8rem",
                            }}
                          >
                            @{e.referred_user_username}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem 0.75rem 0",
                            textAlign: "right",
                          }}
                        >
                          {fmt(e.invoice_amount)}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem 0.75rem 0",
                            textAlign: "right",
                            fontWeight: 700,
                            color: "var(--color-success)",
                          }}
                        >
                          +{fmt(e.earned_amount)}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 0 0.75rem 0",
                            color: "var(--color-text-muted)",
                            fontSize: "0.8rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {fmtDate(e.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid var(--color-border)" }}>
                      <td
                        colSpan={3}
                        style={{
                          paddingTop: "0.75rem",
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          color: "var(--color-text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        {t("totalEarned")}
                      </td>
                      <td
                        style={{
                          paddingTop: "0.75rem",
                          textAlign: "right",
                          fontWeight: 800,
                          color: "var(--color-success)",
                          fontSize: "1rem",
                        }}
                      >
                        {fmt(
                          data.earnings.reduce(
                            (s, e) => s + e.earned_amount,
                            0,
                          ),
                        )}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
              {data.earnings.length > SHOW_LIMIT && (
                <button
                  className="btn-ghost"
                  onClick={() => setShowAllEarnings((v) => !v)}
                  style={{
                    marginTop: "0.875rem",
                    fontSize: "0.875rem",
                    width: "100%",
                  }}
                >
                  {showAllEarnings
                    ? "Show less"
                    : `Show ${data.earnings.length - SHOW_LIMIT} more`}
                </button>
              )}
            </>
          )}
        </div>

        {/* ── 5. People You've Referred ───────────────────────────────────── */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontSize: "1.0625rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
              margin: "0 0 1.25rem",
            }}
          >
            {t("referredTitle")}
            {hasReferrals && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: "var(--color-text-muted)",
                }}
              >
                ({data.referred_users.length})
              </span>
            )}
          </h2>
          {!hasReferrals ? (
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.9rem",
                textAlign: "center",
                padding: "1.5rem 0",
              }}
            >
              {t("noReferred")}
            </p>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                {visibleReferrals.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.875rem",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--color-mist)",
                    }}
                  >
                    <div
                      style={{
                        width: "2.25rem",
                        height: "2.25rem",
                        borderRadius: "9999px",
                        backgroundColor: "var(--color-primary-light)",
                        color: "var(--color-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        flexShrink: 0,
                      }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          fontSize: "0.9rem",
                          color: "var(--color-text-heading)",
                        }}
                      >
                        {u.name}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.8rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        @{u.username}
                        {u.created_at ? ` · ${fmtDate(u.created_at)}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {data.referred_users.length > SHOW_LIMIT && (
                <button
                  className="btn-ghost"
                  onClick={() => setShowAllReferrals((v) => !v)}
                  style={{
                    marginTop: "0.875rem",
                    fontSize: "0.875rem",
                    width: "100%",
                  }}
                >
                  {showAllReferrals
                    ? "Show less"
                    : `Show ${data.referred_users.length - SHOW_LIMIT} more`}
                </button>
              )}
            </>
          )}
        </div>

        {/* ── 6. Withdrawal History ───────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontSize: "1.0625rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
              margin: "0 0 1.25rem",
            }}
          >
            {t("withdrawalsTitle")}
            {hasWithdrawals && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: "var(--color-text-muted)",
                }}
              >
                ({data.withdrawals.length})
              </span>
            )}
          </h2>
          {!hasWithdrawals ? (
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.9rem",
                textAlign: "center",
                padding: "1.5rem 0",
              }}
            >
              {t("noWithdrawals")}
            </p>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    fontSize: "0.875rem",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{ borderBottom: "2px solid var(--color-border)" }}
                    >
                      {[
                        t("withdrawColAmount"),
                        t("withdrawColMomo"),
                        t("withdrawColStatus"),
                        t("colDate"),
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            paddingBottom: "0.75rem",
                            paddingRight: "1rem",
                            textAlign: "left",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--color-text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleWithdrawals.map((w) => (
                      <tr
                        key={w.id}
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        <td
                          style={{
                            padding: "0.75rem 1rem 0.75rem 0",
                            fontWeight: 700,
                            color: "var(--color-text-heading)",
                          }}
                        >
                          {fmt(w.amount)}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem 0.75rem 0",
                            fontFamily: "monospace",
                            fontSize: "0.8125rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {w.momo_number}
                        </td>
                        <td style={{ padding: "0.75rem 1rem 0.75rem 0" }}>
                          <span
                            className={`badge ${w.status === "paid" ? "badge-success" : w.status === "pending" ? "badge-warning" : "badge-danger"}`}
                          >
                            {w.status}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 0 0.75rem 0",
                            color: "var(--color-text-muted)",
                            fontSize: "0.8rem",
                          }}
                        >
                          {fmtDate(w.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.withdrawals.length > SHOW_LIMIT && (
                <button
                  className="btn-ghost"
                  onClick={() => setShowAllWithdrawals((v) => !v)}
                  style={{
                    marginTop: "0.875rem",
                    fontSize: "0.875rem",
                    width: "100%",
                  }}
                >
                  {showAllWithdrawals
                    ? "Show less"
                    : `Show ${data.withdrawals.length - SHOW_LIMIT} more`}
                </button>
              )}
            </>
          )}
        </div>

        {/* ── 7. How It Works ─────────────────────────────────────────────── */}
        <div className="card">
          <h2
            style={{
              fontSize: "1.0625rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
              margin: "0 0 1.25rem",
            }}
          >
            {t("howItWorksTitle")}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            <HowItWorksStep
              number="1"
              title={t("step1Title")}
              body={t("step1Body")}
            />
            <HowItWorksStep
              number="2"
              title={t("step2Title")}
              body={t("step2Body")}
            />
            <HowItWorksStep
              number="3"
              title={t("step3Title")}
              body={t("step3Body")}
            />
          </div>
          <div
            style={{
              marginTop: "1.25rem",
              padding: "1rem",
              backgroundColor: "var(--color-mist)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              fontSize: "0.875rem",
              color: "var(--color-text-body)",
            }}
          >
            <p
              style={{
                fontWeight: 700,
                color: "var(--color-text-heading)",
                margin: "0 0 0.5rem",
              }}
            >
              {t("importantTitle")}
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.2rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
                color: "var(--color-text-muted)",
              }}
            >
              <li>{t("bullet1")}</li>
              <li>{t("bullet2")}</li>
              <li>
                {t("minWithdrawal")} <strong>{fmt(data.min_withdrawal)}</strong>
                .
              </li>
              <li>{t("bullet4")}</li>
              <li>{t("bullet5")}</li>
            </ul>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function HowItWorksStep({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        padding: "1rem",
        backgroundColor: "var(--color-mist)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          width: "1.75rem",
          height: "1.75rem",
          borderRadius: "9999px",
          backgroundColor: "var(--color-primary)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "0.875rem",
          marginBottom: "0.625rem",
        }}
      >
        {number}
      </div>
      <p
        style={{
          fontWeight: 700,
          color: "var(--color-text-heading)",
          margin: "0 0 0.375rem",
          fontSize: "0.9rem",
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: "0.8125rem",
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
        }}
      >
        {body}
      </p>
    </div>
  );
}
