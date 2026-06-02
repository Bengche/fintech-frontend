"use client";

import Axios from "axios";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/UserContext";
import { InlineSpinner } from "@/app/components/Spinner";
import { useTranslations } from "next-intl";
import { BRAND } from "@/config/brand";
import MomoLogos from "@/app/components/MomoLogos";
import {
  ShieldCheck,
  ShieldAlert,
  Clock3,
  BadgeCheck,
  LockKeyhole,
} from "lucide-react";

type InvoiceStats = {
  id: number;
  amount: number;
  currency: string;
  status: string;
  invoicenumber: string;
  invoicename: string;
  invoiceid: number;
  userid: number;
  description: string;
  expires_at?: string;
  payment_type?: string;
  seller_name?: string;
  seller_username?: string;
  seller_profilepicture?: string;
  seller_phone?: string;
  seller_kyc_status?: string;
  seller_logo_url?: string;
};

type Milestone = {
  id: number;
  milestone_number: number;
  label: string;
  amount: number;
  deadline?: string;
  status: "pending" | "completed" | "released" | "disputed";
};

export default function InvoicePage() {
  const BASE_API_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const { user_id: currentUserId } = useAuth() ?? {};
  const t = useTranslations("InvoicePage");
  const router = useRouter();

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneLoadingId, setMilestoneLoadingId] = useState<number | null>(
    null,
  );
  const [milestoneActionMsg, setMilestoneActionMsg] = useState("");
  const [milestoneActionError, setMilestoneActionError] = useState("");

  // Buyer-side milestone release (for logged-in buyers)
  const [releaseConfirmId, setReleaseConfirmId] = useState<number | null>(null);
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [releaseError, setReleaseError] = useState("");
  const [releaseSuccessId, setReleaseSuccessId] = useState<number | null>(null);

  const [invoiceStats, setInvoiceStats] = useState<InvoiceStats>({
    id: 0,
    amount: 0,
    currency: "",
    status: "",
    invoicenumber: "",
    invoicename: "",
    invoiceid: 0,
    userid: 0,
    description: "",
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [receiptLanguage, setReceiptLanguage] = useState("en");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendError, setResendError] = useState("");
  const [countdown, setCountdown] = useState("");
  const prefix = 237;
  const paymentNumber = `${prefix}${phoneNumber}`;
  const { invoice_number } = useParams<{ invoice_number: string }>();

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        const response = await Axios.get(
          `${BASE_API_URL}/invoice/link/${invoice_number}`,
        );
        const details: InvoiceStats = response.data.invoice_details;
        setInvoiceStats(details);

        // Fetch milestones if this is an installment invoice
        if (details?.payment_type === "installment") {
          const msRes = await Axios.get(
            `${BASE_API_URL}/invoice/milestones/${invoice_number}`,
          );
          setMilestones(msRes.data.milestones || []);
        }
      } catch (err) {
        console.error("Failed to load invoice:", err);
      }
    };
    fetchInvoiceDetails();
  }, [invoice_number, BASE_API_URL]);

  useEffect(() => {
    if (!invoiceStats.expires_at || invoiceStats.status !== "pending") {
      setCountdown("");
      return;
    }

    const updateCountdown = () => {
      const remaining =
        new Date(invoiceStats.expires_at || "").getTime() - Date.now();

      if (remaining <= 0) {
        setCountdown(t("countdownExpired"));
        return;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
        return;
      }

      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [invoiceStats.expires_at, invoiceStats.status, t]);

  const markMilestoneComplete = async (milestoneId: number) => {
    setMilestoneLoadingId(milestoneId);
    setMilestoneActionMsg("");
    setMilestoneActionError("");
    try {
      await Axios.patch(
        `${BASE_API_URL}/invoice/milestone/${milestoneId}/complete`,
        {},
        { withCredentials: true },
      );
      setMilestoneActionMsg(t("milestoneMarkedComplete"));
      // Refresh milestones
      const msRes = await Axios.get(
        `${BASE_API_URL}/invoice/milestones/${invoice_number}`,
      );
      setMilestones(msRes.data.milestones || []);
    } catch (err: unknown) {
      setMilestoneActionError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("milestoneMarkError"),
      );
    } finally {
      setMilestoneLoadingId(null);
    }
  };

  const releaseMilestoneAsUser = async (milestoneId: number) => {
    setReleaseLoading(true);
    setReleaseError("");
    try {
      await Axios.post(
        `${BASE_API_URL}/api/release-milestone/by-user`,
        { milestone_id: milestoneId },
        { withCredentials: true },
      );
      setReleaseSuccessId(milestoneId);
      setReleaseConfirmId(null);
      const msRes = await Axios.get(
        `${BASE_API_URL}/invoice/milestones/${invoice_number}`,
      );
      setMilestones(msRes.data.milestones || []);
    } catch (err: unknown) {
      setReleaseError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("releaseError"),
      );
      setReleaseConfirmId(null);
    } finally {
      setReleaseLoading(false);
    }
  };

  const makePayment = async () => {
    setPayLoading(true);
    setPayError("");
    try {
      await Axios.post(`${BASE_API_URL}/api/requestPayment`, {
        amount: invoiceStats.amount,
        phoneNumber: paymentNumber,
        invoicename: invoiceStats.invoicename,
        invoicenumber: invoiceStats.invoicenumber,
        invoiceid: invoiceStats.id,
        email: payerEmail,
        userid: currentUserId ?? null,
      });
      // Redirect to the payment-pending page so the buyer sees the
      // confirmation animation while we wait for the MoMo webhook.
      router.push(
        `/payment-pending/${invoiceStats.invoicenumber}?email=${encodeURIComponent(payerEmail)}`,
      );
    } catch (err: unknown) {
      setPayError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("payError"),
      );
    } finally {
      setPayLoading(false);
    }
  };

  const isPaid = ["paid", "delivered", "completed", "refunded"].includes(
    invoiceStats.status,
  );
  const isExpired = invoiceStats.status === "expired";
  const isDisabled = isPaid || isExpired || payLoading;
  const sellerName =
    invoiceStats.seller_name || invoiceStats.seller_username || BRAND.name;
  const displayAmount = invoiceStats.amount
    ? `${invoiceStats.amount.toLocaleString()} ${invoiceStats.currency}`
    : "-";

  const statusBadgeClass =
    invoiceStats.status === "paid" ||
    invoiceStats.status === "completed" ||
    invoiceStats.status === "refunded"
      ? "badge badge-success"
      : isExpired
        ? "badge badge-danger"
        : invoiceStats.status === "delivered"
          ? "badge badge-info"
          : "badge badge-warning";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}>
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "2.5rem 1.25rem",
        }}
      >
        {/* Back link */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            marginBottom: "1.5rem",
            textDecoration: "none",
          }}
        >
          {t("back")}
        </Link>

        <div
          className="card"
          style={{
            marginBottom: "1.25rem",
            padding: "1.5rem",
            background:
              "radial-gradient(circle at top right, rgba(245,158,11,0.16), transparent 32%), linear-gradient(135deg, rgba(15,31,61,1), rgba(15,31,61,0.92))",
            color: "#fff",
            border: "none",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 0.35rem",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {t("payPageEyebrow")}
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(1.45rem, 3vw, 2.25rem)",
                  fontWeight: 800,
                  lineHeight: 1.08,
                  color: "var(--color-accent)",
                }}
              >
                {invoiceStats.invoicename || t("loading")}
              </h1>
            </div>
            {invoiceStats.status && (
              <span
                className={statusBadgeClass}
                style={{
                  fontSize: "0.8125rem",
                  alignSelf: "flex-start",
                  boxShadow: "0 8px 24px rgba(15,31,61,0.18)",
                }}
              >
                {invoiceStats.status.charAt(0).toUpperCase() +
                  invoiceStats.status.slice(1)}
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.6rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <HeroPill
              icon={<ShieldCheck size={14} />}
              label={t("guaranteeBadge")}
            />
            {countdown && !isExpired && (
              <HeroPill
                icon={<Clock3 size={14} />}
                label={`${t("countdownTitle")}: ${countdown}`}
              />
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                padding: "1rem",
                borderRadius: "1rem",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.65rem",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    borderRadius: "999px",
                    padding: "0.2rem 0.5rem",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "999px",
                      background: "#F59E0B",
                      color: "#0F1F3D",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "0.65rem",
                    }}
                  >
                    F
                  </span>
                  Fonlok
                </span>

                {invoiceStats.seller_logo_url && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      borderRadius: "999px",
                      padding: "0.2rem 0.5rem 0.2rem 0.25rem",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background: "rgba(255,255,255,0.14)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={invoiceStats.seller_logo_url}
                      alt="Seller brand logo"
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "999px",
                        objectFit: "cover",
                      }}
                    />
                    {t("sellerBrandLabel")}
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: "0 0 0.35rem",
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                {t("sellerLabel")}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginTop: "0.25rem",
                  flexWrap: "wrap",
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem" }}>
                  {sellerName}
                </p>
                {invoiceStats.seller_kyc_status === "approved" ? (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.28rem 0.75rem",
                      borderRadius: "999px",
                      background: "rgba(34,197,94,0.15)",
                      border: "1.5px solid rgba(34,197,94,0.4)",
                    }}
                  >
                    <BadgeCheck size={14} color="#22c55e" />
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#4ade80",
                        letterSpacing: "0.03em",
                        textTransform: "uppercase",
                      }}
                    >
                      {t("verifiedBadge")}
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.28rem 0.75rem",
                      borderRadius: "999px",
                      background: "rgba(251,191,36,0.12)",
                      border: "1.5px solid rgba(251,191,36,0.35)",
                    }}
                  >
                    <ShieldAlert size={13} color="#FCD34D" />
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#FDE68A",
                        letterSpacing: "0.03em",
                        textTransform: "uppercase",
                      }}
                    >
                      {t("notIdentityVerified")}
                    </span>
                  </div>
                )}
              </div>
              <p
                style={{
                  margin: "0.5rem 0 0",
                  color: "rgba(255,255,255,0.78)",
                  fontSize: "0.88rem",
                  lineHeight: 1.6,
                }}
              >
                {t("trustBody")}
              </p>
            </div>

            <div
              style={{
                padding: "1rem",
                borderRadius: "1rem",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <p
                style={{
                  margin: "0 0 0.35rem",
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                {t("breakdownTitle")}
              </p>
              <p style={{ margin: 0, fontWeight: 800, fontSize: "1.3rem" }}>
                {displayAmount}
              </p>
              <p
                style={{
                  margin: "0.5rem 0 0",
                  color: "rgba(255,255,255,0.78)",
                  fontSize: "0.88rem",
                  lineHeight: 1.6,
                }}
              >
                {t("breakdownSummary")}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice header card */}
        <div className="card" style={{ marginBottom: "1.25rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-text-muted)",
                  marginBottom: "0.25rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("invoiceLabel")}
              </p>
              <h1
                style={{
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                  margin: 0,
                }}
              >
                {invoiceStats.invoicename || t("loading")}
              </h1>
            </div>
            {invoiceStats.status && (
              <span
                className={statusBadgeClass}
                style={{ fontSize: "0.8125rem" }}
              >
                {invoiceStats.status.charAt(0).toUpperCase() +
                  invoiceStats.status.slice(1)}
              </span>
            )}
          </div>

          {/* Invoice details grid */}
          <div
            style={{
              marginTop: "1.5rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "1rem",
            }}
          >
            <InvoiceField
              label={t("fieldAmount")}
              value={
                invoiceStats.amount
                  ? `${invoiceStats.amount.toLocaleString()} ${invoiceStats.currency}`
                  : "—"
              }
              highlight
            />
            <InvoiceField
              label={t("fieldInvoiceNumber")}
              value={invoiceStats.invoicenumber || "—"}
              mono
            />
            {invoiceStats.expires_at && (
              <InvoiceField
                label={t("fieldExpires")}
                value={new Date(invoiceStats.expires_at).toLocaleDateString(
                  "en-GB",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              />
            )}
          </div>

          {invoiceStats.description && (
            <div
              style={{
                marginTop: "1.25rem",
                padding: "1rem",
                backgroundColor: "var(--color-mist)",
                borderRadius: "var(--radius-sm)",
                borderLeft: "3px solid var(--color-border-strong)",
              }}
            >
              <p
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  marginBottom: "0.375rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("fieldDescription")}
              </p>
              <p
                style={{
                  margin: 0,
                  color: "var(--color-text-body)",
                  lineHeight: 1.6,
                }}
              >
                {invoiceStats.description}
              </p>
            </div>
          )}
        </div>

        <div
          className="card"
          style={{
            marginBottom: "1.25rem",
            padding: "1.2rem 1.25rem",
            border: "1px solid rgba(15,31,61,0.09)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 0.3rem",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--color-text-muted)",
                }}
              >
                {t("secureCheckoutTitle")}
              </p>
              <p
                style={{
                  margin: 0,
                  color: "var(--color-text-body)",
                  lineHeight: 1.65,
                  fontSize: "0.9rem",
                }}
              >
                {t("secureCheckoutBody")}
              </p>
            </div>
            <div
              style={{
                minWidth: "240px",
                padding: "1rem",
                borderRadius: "0.9rem",
                background: "var(--color-mist)",
                border: "1px solid var(--color-border)",
              }}
            >
              <BreakdownRow
                label={t("breakdownSubtotal")}
                value={displayAmount}
              />
              <BreakdownRow
                label={t("breakdownBuyerFee")}
                value={t("breakdownBuyerFeeValue")}
              />
              <BreakdownRow
                label={t("breakdownEscrow")}
                value={t("breakdownEscrowValue")}
              />
              <BreakdownRow
                label={t("breakdownBuyerPays")}
                value={displayAmount}
                strong
              />
            </div>
          </div>
        </div>

        {/* ── Milestone progress (installment invoices) ────────────── */}
        {invoiceStats.payment_type === "installment" &&
          milestones.length > 0 && (
            <div
              id="milestones"
              className="card"
              style={{ marginBottom: "1.25rem" }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  marginBottom: "0.25rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    color: "var(--color-text-heading)",
                    margin: 0,
                  }}
                >
                  {t("milestoneTitle")}
                </h2>
                {/* Progress pill */}
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.2rem 0.65rem",
                    borderRadius: "999px",
                    backgroundColor: "#dbeafe",
                    color: "#1e40af",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("milestonesReleased", {
                    done: milestones.filter((m) => m.status === "released")
                      .length,
                    total: milestones.length,
                  })}
                </span>
              </div>

              {/* Seller action callout */}
              {Number(currentUserId) === Number(invoiceStats.userid) &&
                milestones.some(
                  (m, idx) =>
                    m.status === "pending" &&
                    (idx === 0 || milestones[idx - 1].status === "released"),
                ) && (
                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      backgroundColor: "#fffbeb",
                      border: "1.5px solid #f59e0b",
                      borderRadius: "var(--radius-sm)",
                      marginTop: "0.875rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        color: "#92400e",
                      }}
                    >
                      {t("milestoneSellerActionTitle")}
                    </p>
                    <p
                      style={{
                        margin: "0.25rem 0 0",
                        fontSize: "0.8rem",
                        color: "#78350f",
                        lineHeight: 1.5,
                      }}
                    >
                      {t("milestoneSellerActionBody")}
                    </p>
                  </div>
                )}

              {/* Alerts */}
              {milestoneActionMsg && (
                <div
                  className="alert alert-success"
                  style={{ marginBottom: "1rem" }}
                >
                  {milestoneActionMsg}
                </div>
              )}
              {milestoneActionError && (
                <div
                  className="alert alert-danger"
                  style={{ marginBottom: "1rem" }}
                >
                  {milestoneActionError}
                </div>
              )}
              {releaseSuccessId && (
                <div
                  className="alert alert-success"
                  style={{ marginBottom: "1rem" }}
                >
                  {t("releaseSuccess")}
                </div>
              )}
              {releaseError && (
                <div
                  className="alert alert-danger"
                  style={{ marginBottom: "1rem" }}
                >
                  {releaseError}
                </div>
              )}

              {/* Milestone list */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  marginTop: "0.875rem",
                }}
              >
                {milestones.map((m, i) => {
                  const isSeller =
                    Number(currentUserId) === Number(invoiceStats.userid);
                  const prevReleased =
                    i === 0 || milestones[i - 1].status === "released";
                  const canMarkComplete =
                    isSeller &&
                    m.status === "pending" &&
                    prevReleased &&
                    invoiceStats.status === "paid";

                  /* Status badge colours */
                  const statusColour =
                    m.status === "released"
                      ? { bg: "#d1fae5", text: "#065f46" }
                      : m.status === "completed"
                        ? { bg: "#fef3c7", text: "#92400e" }
                        : m.status === "disputed"
                          ? { bg: "#fee2e2", text: "#991b1b" }
                          : { bg: "#e5e7eb", text: "#374151" };

                  const statusLabel =
                    {
                      released: "✓ Released",
                      completed: "Awaiting your release",
                      disputed: "Disputed",
                      pending: "Pending",
                    }[m.status] ?? m.status;

                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: "0.875rem 1rem",
                        border:
                          m.status === "completed" && !isSeller
                            ? "1.5px solid #f59e0b"
                            : canMarkComplete
                              ? "1.5px solid var(--color-primary)"
                              : "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor:
                          m.status === "released"
                            ? "var(--color-mist)"
                            : "var(--color-white)",
                      }}
                    >
                      {/* Row 1: step number + label + status badge */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.625rem",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {/* Numbered circle */}
                          <span
                            style={{
                              flexShrink: 0,
                              width: "1.625rem",
                              height: "1.625rem",
                              borderRadius: "50%",
                              backgroundColor:
                                m.status === "released"
                                  ? "#16a34a"
                                  : m.status === "completed"
                                    ? "#f59e0b"
                                    : "var(--color-border-strong, #94a3b8)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              marginTop: "0.1rem",
                            }}
                          >
                            {m.status === "released" ? "✓" : i + 1}
                          </span>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 600,
                              color: "var(--color-text-heading)",
                              fontSize: "0.9375rem",
                              lineHeight: 1.4,
                              wordBreak: "break-word",
                            }}
                          >
                            {m.label}
                          </p>
                        </div>
                        {/* Status badge */}
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            padding: "0.2rem 0.6rem",
                            borderRadius: "999px",
                            backgroundColor: statusColour.bg,
                            color: statusColour.text,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      {/* Row 2: amount + deadline */}
                      <p
                        style={{
                          margin: "0.375rem 0 0 2.25rem",
                          fontSize: "0.8125rem",
                          color: "var(--color-text-muted)",
                          lineHeight: 1.5,
                        }}
                      >
                        <strong style={{ color: "var(--color-text-body)" }}>
                          {m.amount.toLocaleString()} {invoiceStats.currency}
                        </strong>
                        {m.deadline && (
                          <>
                            {" "}
                            &middot; {t("due")}{" "}
                            {new Date(m.deadline).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </>
                        )}
                      </p>

                      {/* Row 3: action button(s) — full width on mobile */}
                      {(canMarkComplete ||
                        (m.status === "completed" && !isSeller)) && (
                        <div
                          style={{
                            marginTop: "0.75rem",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                          }}
                        >
                          {canMarkComplete && (
                            <button
                              onClick={() => markMilestoneComplete(m.id)}
                              disabled={milestoneLoadingId !== null}
                              style={{
                                flex: "1 1 auto",
                                minHeight: "2.5rem",
                                padding: "0.5rem 1rem",
                                borderRadius: "var(--radius-sm)",
                                border: "2px solid var(--color-primary)",
                                backgroundColor: "var(--color-primary)",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                cursor:
                                  milestoneLoadingId !== null
                                    ? "not-allowed"
                                    : "pointer",
                                opacity: milestoneLoadingId !== null ? 0.6 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.375rem",
                              }}
                            >
                              {milestoneLoadingId === m.id ? (
                                <InlineSpinner size="xs" />
                              ) : (
                                t("markComplete")
                              )}
                            </button>
                          )}

                          {m.status === "completed" &&
                            !isSeller &&
                            (currentUserId ? (
                              releaseConfirmId === m.id ? (
                                <>
                                  <button
                                    onClick={() => releaseMilestoneAsUser(m.id)}
                                    disabled={releaseLoading}
                                    style={{
                                      flex: "1 1 auto",
                                      minHeight: "2.5rem",
                                      padding: "0.5rem 1rem",
                                      borderRadius: "var(--radius-sm)",
                                      border: "2px solid #16a34a",
                                      backgroundColor: "#16a34a",
                                      color: "#fff",
                                      fontWeight: 700,
                                      fontSize: "0.875rem",
                                      cursor: releaseLoading
                                        ? "not-allowed"
                                        : "pointer",
                                      opacity: releaseLoading ? 0.6 : 1,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: "0.375rem",
                                    }}
                                  >
                                    {releaseLoading ? (
                                      <InlineSpinner size="xs" />
                                    ) : (
                                      t("releaseConfirm")
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setReleaseConfirmId(null)}
                                    style={{
                                      flex: "1 1 auto",
                                      minHeight: "2.5rem",
                                      padding: "0.5rem 1rem",
                                      borderRadius: "var(--radius-sm)",
                                      border: "1px solid var(--color-border)",
                                      backgroundColor: "transparent",
                                      color: "var(--color-text-muted)",
                                      fontWeight: 600,
                                      fontSize: "0.875rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {t("releaseCancel")}
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setReleaseConfirmId(m.id)}
                                  style={{
                                    flex: "1 1 auto",
                                    minHeight: "2.5rem",
                                    padding: "0.5rem 1rem",
                                    borderRadius: "var(--radius-sm)",
                                    border: "2px solid #16a34a",
                                    backgroundColor: "#16a34a",
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "0.875rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {t("releasePayment")}
                                </button>
                              )
                            ) : (
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "0.8rem",
                                  color: "#92400e",
                                  fontWeight: 500,
                                  padding: "0.4rem 0",
                                  lineHeight: 1.5,
                                }}
                              >
                                {t("checkEmailRelease")}
                              </p>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Expired warning */}
        {isExpired && (
          <div
            className="alert alert-danger"
            style={{ marginBottom: "1.25rem" }}
          >
            {t("expired")}
          </div>
        )}

        {/* Payment form — always visible; inputs disabled when invoice is no longer payable */}
        {!isExpired && (
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    color: "var(--color-text-heading)",
                    margin: "0 0 0.35rem",
                  }}
                >
                  {t("payTitle")}
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-text-muted)",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                  }}
                >
                  {t("payIntro")}
                </p>
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  borderRadius: "999px",
                  padding: "0.45rem 0.8rem",
                  background: "rgba(15,31,61,0.06)",
                  color: "var(--color-primary)",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                }}
              >
                <LockKeyhole size={14} />
                {t("lockedBadge")}
              </div>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {/* ── Already-paid notice (shown instead of fields being interactable) ── */}
              {isPaid && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.875rem",
                    padding: "1rem 1.125rem",
                    borderRadius: "var(--radius-sm)",
                    background: "#f0fdf4",
                    border: "1.5px solid #86efac",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: "2rem",
                      height: "2rem",
                      borderRadius: "50%",
                      background: "#16a34a",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                  <div>
                    <p
                      style={{
                        margin: "0 0 0.25rem",
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        color: "#14532d",
                      }}
                    >
                      {invoiceStats.status === "refunded"
                        ? "This invoice has been refunded"
                        : invoiceStats.status === "completed"
                          ? "This invoice is complete"
                          : invoiceStats.status === "delivered"
                            ? "Payment received — awaiting release"
                            : t("alreadyPaid")}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.83rem",
                        color: "#166534",
                        lineHeight: 1.5,
                      }}
                    >
                      {invoiceStats.status === "refunded"
                        ? "A refund has been processed for this invoice. No further payment is required."
                        : "This invoice has already been paid. The payment fields below are disabled to prevent a duplicate transaction."}
                    </p>
                  </div>
                </div>
              )}

              {/* Payment method logos */}
              {!isPaid && (
                <div style={{ marginBottom: "0.25rem" }}>
                  <MomoLogos theme="light" size="sm" />
                </div>
              )}

              {/* MoMo number */}
              <div>
                <label
                  className="label"
                  style={isPaid ? { opacity: 0.5 } : undefined}
                >
                  {t("momoLabel")}
                </label>
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  <span
                    style={{
                      padding: "0.625rem 0.875rem",
                      backgroundColor: "var(--color-mist)",
                      border: "1.5px solid var(--color-border)",
                      borderRight: "none",
                      borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)",
                      fontSize: "0.9375rem",
                      color: "var(--color-text-body)",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      opacity: isPaid ? 0.5 : 1,
                    }}
                  >
                    +237
                  </span>
                  <input
                    className="input"
                    placeholder="6XXXXXXXX"
                    name="momoNumber"
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    value={phoneNumber}
                    disabled={isPaid}
                    readOnly={isPaid}
                    onChange={(e) =>
                      !isPaid &&
                      setPhoneNumber(
                        e.target.value.replace(/\D/g, "").slice(0, 9),
                      )
                    }
                    style={{
                      borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                      opacity: isPaid ? 0.5 : 1,
                      cursor: isPaid ? "not-allowed" : undefined,
                      backgroundColor: isPaid ? "var(--color-mist)" : undefined,
                    }}
                  />
                </div>
                {!isPaid && (
                  <p
                    style={{
                      marginTop: "0.3rem",
                      fontSize: "0.8rem",
                      color: "var(--color-danger)",
                      lineHeight: 1.5,
                      fontWeight: 500,
                    }}
                  >
                    {t("momoHint")}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  className="label"
                  style={isPaid ? { opacity: 0.5 } : undefined}
                >
                  {t("emailLabel")}
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={payerEmail}
                  disabled={isPaid}
                  readOnly={isPaid}
                  onChange={(e) => !isPaid && setPayerEmail(e.target.value)}
                  style={{
                    opacity: isPaid ? 0.5 : 1,
                    cursor: isPaid ? "not-allowed" : undefined,
                    backgroundColor: isPaid ? "var(--color-mist)" : undefined,
                  }}
                />
                {!isPaid && (
                  <p
                    style={{
                      marginTop: "0.3rem",
                      fontSize: "0.8rem",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {t("emailHint")}
                  </p>
                )}
              </div>

              {/* Fees notice */}
              <div
                style={{
                  padding: "0.875rem 1rem",
                  backgroundColor: "var(--color-accent-light)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-warning-border)",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "var(--color-text-body)",
                  }}
                >
                  {t("feeNotice")}
                </p>
              </div>

              {/* Terms */}
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {t("termsNotice")}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                <TrustFeature
                  title={t("protectionOneTitle")}
                  body={t("protectionOneBody")}
                />
                <TrustFeature
                  title={t("protectionTwoTitle")}
                  body={t("protectionTwoBody")}
                />
                <TrustFeature
                  title={t("protectionThreeTitle")}
                  body={t("protectionThreeBody")}
                />
              </div>

              {/* Alerts live right above the button so they are immediately visible */}
              {payError && (
                <div className="alert alert-danger" style={{ margin: 0 }}>
                  {payError}
                </div>
              )}

              <button
                className="btn-accent"
                disabled={isDisabled}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "0.8125rem",
                  fontSize: "1rem",
                  opacity: isPaid ? 0.45 : 1,
                  cursor: isPaid ? "not-allowed" : undefined,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (!isDisabled) setShowEmailConfirm(true);
                }}
              >
                {payLoading ? (
                  <InlineSpinner />
                ) : invoiceStats.status === "refunded" ? (
                  "Invoice Refunded"
                ) : invoiceStats.status === "completed" ? (
                  "Invoice Completed"
                ) : isPaid ? (
                  "Payment Already Made"
                ) : (
                  t("payNow")
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Email confirmation modal ────────────────────────────────────── */}
      {showEmailConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,31,61,0.55)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1.25rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEmailConfirm(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              boxShadow: "0 24px 64px rgba(15,31,61,0.18)",
              padding: "2rem 2rem 1.75rem",
              maxWidth: "420px",
              width: "100%",
              position: "relative",
            }}
          >
            {/* Close */}
            <button
              onClick={() => setShowEmailConfirm(false)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "1.25rem",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                lineHeight: 1,
                padding: "0.25rem",
              }}
              aria-label="Close"
            >
              ✕
            </button>

            {/* Icon */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                marginBottom: "1.125rem",
              }}
            >
              ✉️
            </div>

            <h3
              style={{
                margin: "0 0 0.375rem",
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
                lineHeight: 1.3,
              }}
            >
              Confirm your email address
            </h3>
            <p
              style={{
                margin: "0 0 1.25rem",
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                lineHeight: 1.6,
              }}
            >
              Your payment confirmation, receipt, and secure download link will
              be sent to this address. Make sure it&apos;s an inbox you can
              access right now.
            </p>

            {/* Email display */}
            <div
              style={{
                background: "#f8fafc",
                border: "1.5px solid var(--color-border)",
                borderRadius: "10px",
                padding: "0.875rem 1rem",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>📧</span>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  color: "var(--color-text-heading)",
                  wordBreak: "break-all",
                }}
              >
                {payerEmail || (
                  <span
                    style={{
                      color: "var(--color-text-muted)",
                      fontWeight: 400,
                    }}
                  >
                    No email entered
                  </span>
                )}
              </span>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
              }}
            >
              <button
                className="btn-accent"
                disabled={payLoading || !payerEmail}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "0.8125rem",
                  fontSize: "0.9375rem",
                }}
                onClick={() => {
                  setShowEmailConfirm(false);
                  makePayment();
                }}
              >
                {payLoading ? (
                  <InlineSpinner />
                ) : (
                  "Yes, this is correct — Pay now"
                )}
              </button>
              <button
                onClick={() => setShowEmailConfirm(false)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.75rem",
                  fontSize: "0.9rem",
                  color: "var(--color-text-body)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                Edit email address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Receipt */}
      {(invoiceStats.status === "paid" ||
        invoiceStats.status === "delivered") && (
        <div className="card" style={{ textAlign: "center" }}>
          <p
            style={{
              fontWeight: 700,
              color: "var(--color-text-heading)",
              marginBottom: "0.375rem",
              fontSize: "1rem",
            }}
          >
            {t("receiptTitle")}
          </p>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              marginBottom: "1.25rem",
            }}
          >
            {t("receiptBody")}
          </p>
          <button
            className="btn-primary"
            disabled={pdfLoading}
            style={{
              padding: "0.75rem 1.75rem",
              fontSize: "0.9375rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            onClick={async () => {
              setPdfLoading(true);
              try {
                const res = await fetch(
                  `${BASE_API_URL}/invoice/receipt/${invoice_number}?lang=${receiptLanguage}`,
                  { credentials: "include" },
                );
                if (!res.ok) {
                  const data = await res.json();
                  alert(data.message || t("receiptFailedGenerate"));
                  return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                // iOS Safari ignores the `download` attribute on blob URLs.
                // Detect iOS and open in a new tab so the user can save from there.
                const isIOS =
                  typeof navigator !== "undefined" &&
                  /iPad|iPhone|iPod/.test(navigator.userAgent);
                if (isIOS) {
                  window.open(url, "_blank");
                  // Revoke after a short delay to let Safari load the resource
                  setTimeout(() => URL.revokeObjectURL(url), 10000);
                } else {
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `fonlok-receipt-${invoice_number}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
              } catch {
                alert(t("receiptFailedDownload"));
              } finally {
                setPdfLoading(false);
              }
            }}
          >
            📄 {pdfLoading ? t("generatingPdf") : t("downloadPdf")}
          </button>
        </div>
      )}

      {/* Rate this seller — shown to buyers after payment */}
      {(invoiceStats.status === "delivered" ||
        invoiceStats.status === "completed") &&
        invoiceStats.seller_username &&
        Number(currentUserId) !== Number(invoiceStats.userid) && (
          <div
            className="card"
            style={{
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
              padding: "1.25rem",
              borderLeft: "4px solid var(--color-accent)",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: "0 0 0.25rem",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  color: "var(--color-text-heading)",
                }}
              >
                How was your experience?
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.5,
                }}
              >
                Leave a review for @{invoiceStats.seller_username} so other
                buyers know what to expect.
              </p>
            </div>
            <a
              href={`/review/${invoiceStats.seller_username}/${invoiceStats.invoicenumber}`}
              className="btn-accent"
              style={{
                flexShrink: 0,
                fontSize: "0.875rem",
                padding: "0.6rem 1.25rem",
                textDecoration: "none",
              }}
            >
              Leave a review
            </a>
          </div>
        )}

      {/* Create account CTA — shown to guests after payment */}
      {(invoiceStats.status === "paid" ||
        invoiceStats.status === "delivered" ||
        invoiceStats.status === "completed") &&
        !currentUserId && (
          <div
            className="card"
            style={{
              marginBottom: "1.25rem",
              padding: "1.5rem",
              background:
                "linear-gradient(135deg, rgba(15,31,61,0.97), rgba(15,31,61,0.90))",
              color: "#fff",
              border: "none",
            }}
          >
            <p
              style={{
                margin: "0 0 0.25rem",
                fontWeight: 800,
                fontSize: "1.0625rem",
                color: "var(--color-accent)",
              }}
            >
              You just paid safely with Fonlok.
            </p>
            <p
              style={{
                margin: "0 0 1.25rem",
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.72)",
                lineHeight: 1.6,
              }}
            >
              Create a free account to send your own secure invoices, track
              transactions, and get paid without the risk.
            </p>
            <a
              href={`/register${payerEmail ? `?email=${encodeURIComponent(payerEmail)}` : ""}`}
              className="btn-accent"
              style={{
                display: "inline-flex",
                fontSize: "0.9375rem",
                padding: "0.7rem 1.5rem",
                textDecoration: "none",
              }}
            >
              Create a free account
            </a>
          </div>
        )}

      {/* Resend confirmation email — seller only, shown when buyer action is pending */}
      {currentUserId === invoiceStats.userid &&
        (invoiceStats.status === "delivered" ||
          milestones.some((m) => m.status === "completed")) && (
          <div
            className="card"
            style={{
              borderLeft: "4px solid var(--color-accent)",
              display: "flex",
              flexDirection: "column",
              gap: "0.625rem",
            }}
          >
            <div>
              <p
                style={{
                  fontWeight: 700,
                  color: "var(--color-text-heading)",
                  margin: "0 0 0.25rem",
                  fontSize: "0.9375rem",
                }}
              >
                <div style={{ marginBottom: "1rem", textAlign: "left" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      marginBottom: "0.375rem",
                    }}
                  >
                    {t("receiptLanguage")}
                  </label>
                  <select
                    className="input"
                    value={receiptLanguage}
                    onChange={(e) => setReceiptLanguage(e.target.value)}
                    style={{ maxWidth: "180px" }}
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
                {t("resendTitle")}
              </p>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {invoiceStats.payment_type === "installment"
                  ? t("resendBodyInstallment")
                  : t("resendBodyDelivered")}
              </p>
            </div>

            {resendMsg && (
              <p
                style={{
                  color: "var(--color-success)",
                  fontSize: "0.875rem",
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                ✓ {resendMsg}
              </p>
            )}
            {resendError && (
              <p
                style={{
                  color: "var(--color-danger)",
                  fontSize: "0.875rem",
                  margin: 0,
                }}
              >
                {resendError}
              </p>
            )}

            <button
              className="btn-ghost"
              disabled={resendLoading}
              style={{
                alignSelf: "flex-start",
                fontSize: "0.875rem",
                padding: "0.5rem 1rem",
              }}
              onClick={async () => {
                setResendLoading(true);
                setResendMsg("");
                setResendError("");
                try {
                  const res = await Axios.post(
                    `${BASE_API_URL}/invoice/resend-email/${invoice_number}`,
                    {},
                    { withCredentials: true },
                  );
                  setResendMsg(res.data.message);
                } catch (err: unknown) {
                  const axiosErr = err as {
                    response?: { data?: { message?: string } };
                  };
                  setResendError(
                    axiosErr.response?.data?.message || t("resendError"),
                  );
                } finally {
                  setResendLoading(false);
                }
              }}
            >
              {resendLoading ? t("resending") : t("resendBtn")}
            </button>
          </div>
        )}
    </div>
  );
}

function InvoiceField({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
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
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontWeight: highlight ? 700 : 500,
          fontSize: highlight ? "1.125rem" : "0.9375rem",
          color: highlight
            ? "var(--color-primary)"
            : "var(--color-text-heading)",
          fontFamily: mono ? "monospace" : "inherit",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function HeroPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.38rem 0.7rem",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.12)",
        fontSize: "0.78rem",
        fontWeight: 700,
      }}
    >
      {icon}
      {label}
    </span>
  );
}

function BreakdownRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        padding: "0.45rem 0",
        borderBottom: strong ? "none" : "1px solid rgba(15,31,61,0.08)",
      }}
    >
      <span
        style={{
          color: "var(--color-text-muted)",
          fontSize: strong ? "0.9rem" : "0.84rem",
          fontWeight: strong ? 700 : 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: "var(--color-text-heading)",
          fontSize: strong ? "1rem" : "0.88rem",
          fontWeight: strong ? 800 : 700,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function TrustFeature({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        padding: "0.85rem 0.95rem",
        borderRadius: "0.8rem",
        background: "var(--color-mist)",
        border: "1px solid var(--color-border)",
      }}
    >
      <p
        style={{
          margin: "0 0 0.25rem",
          fontSize: "0.86rem",
          fontWeight: 700,
          color: "var(--color-text-heading)",
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: "0.81rem",
          color: "var(--color-text-muted)",
          lineHeight: 1.55,
        }}
      >
        {body}
      </p>
    </div>
  );
}
