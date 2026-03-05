"use client";

import Axios from "axios";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/UserContext";
import { InlineSpinner } from "@/app/components/Spinner";
import { useTranslations } from "next-intl";

type InvoiceStats = {
  id: number;
  clientemail?: string;
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
  const [milestoneLoadingId, setMilestoneLoadingId] = useState<number | null>(null);
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
  const [paySuccess, setPaySuccess] = useState("");
  const [payError, setPayError] = useState("");
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendError, setResendError] = useState("");
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
    setPaySuccess("");
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
      setPaySuccess(t("paySuccess"));
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

  const isPaid = invoiceStats.status === "paid";
  const isExpired = invoiceStats.status === "expired";
  const isDisabled = isPaid || isExpired || payLoading;

  const statusBadgeClass = isPaid
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
                  color: "var(--color-text-heading)",
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
            {invoiceStats.clientemail && (
              <InvoiceField
                label={t("fieldClientEmail")}
                value={invoiceStats.clientemail}
              />
            )}
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

        {/* ── Milestone progress (installment invoices) ────────────── */}
        {invoiceStats.payment_type === "installment" &&
          milestones.length > 0 && (
            <div className="card" style={{ marginBottom: "1.25rem" }}>
              <h2
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  color: "var(--color-text-heading)",
                  margin: "0 0 0.25rem",
                }}
              >
                {t("milestoneTitle")}
              </h2>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                  margin: "0 0 1.25rem",
                }}
              >
                {t("milestonesReleased", {
                  done: milestones.filter((m) => m.status === "released")
                    .length,
                  total: milestones.length,
                })}
              </p>

              {/* Seller action callout: shown when this is the seller's own invoice and there are milestones to action */}
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
                      marginBottom: "1rem",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 700, color: "#92400e" }}>
                      {t("milestoneSellerActionTitle")}
                    </p>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#78350f", lineHeight: 1.5 }}>
                      {t("milestoneSellerActionBody")}
                    </p>
                  </div>
                )}

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

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {milestones.map((m, i) => {
                  const isSeller = currentUserId === invoiceStats.userid;
                  const prevReleased =
                    i === 0 || milestones[i - 1].status === "released";
                  const canMarkComplete =
                    isSeller &&
                    m.status === "pending" &&
                    prevReleased &&
                    invoiceStats.status === "paid";

                  const badgeStyle: React.CSSProperties = {
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.2rem 0.6rem",
                    borderRadius: "999px",
                    backgroundColor:
                      m.status === "released"
                        ? "#d1fae5"
                        : m.status === "completed"
                          ? "#fef3c7"
                          : m.status === "disputed"
                            ? "#fee2e2"
                            : "#e5e7eb",
                    color:
                      m.status === "released"
                        ? "#065f46"
                        : m.status === "completed"
                          ? "#92400e"
                          : m.status === "disputed"
                            ? "#991b1b"
                            : "#374151",
                  };

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                        padding: "0.875rem 1rem",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor:
                          m.status === "released"
                            ? "var(--color-mist)"
                            : "var(--color-white)",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 600,
                            color: "var(--color-text-heading)",
                            fontSize: "0.9375rem",
                          }}
                        >
                          {i + 1}. {m.label}
                        </p>
                        <p
                          style={{
                            margin: "0.15rem 0 0",
                            fontSize: "0.8125rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {m.amount.toLocaleString()} {invoiceStats.currency}
                          {m.deadline && (
                            <>
                              {" "}
                              &middot; {t("due")}{" "}
                              {new Date(m.deadline).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </>
                          )}
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          flexShrink: 0,
                        }}
                      >
                        <span style={badgeStyle}>
                          {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        </span>
                        {canMarkComplete && (
                          <button
                            onClick={() => markMilestoneComplete(m.id)}
                            disabled={milestoneLoadingId !== null}
                            style={{
                              padding: "0.35rem 0.875rem",
                              borderRadius: "var(--radius-sm)",
                              border: "2px solid var(--color-primary)",
                              backgroundColor: "var(--color-primary)",
                              color: "#fff",
                              fontWeight: 600,
                              fontSize: "0.8125rem",
                              cursor: milestoneLoadingId !== null
                                ? "not-allowed"
                                : "pointer",
                              opacity: milestoneLoadingId !== null ? 0.6 : 1,
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
                              <div
                                style={{
                                  display: "flex",
                                  gap: "0.5rem",
                                  alignItems: "center",
                                }}
                              >
                                <button
                                  onClick={() => releaseMilestoneAsUser(m.id)}
                                  disabled={releaseLoading}
                                  style={{
                                    padding: "0.35rem 0.875rem",
                                    borderRadius: "var(--radius-sm)",
                                    border: "2px solid #16a34a",
                                    backgroundColor: "#16a34a",
                                    color: "#fff",
                                    fontWeight: 600,
                                    fontSize: "0.8125rem",
                                    cursor: releaseLoading
                                      ? "not-allowed"
                                      : "pointer",
                                    opacity: releaseLoading ? 0.6 : 1,
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
                                    padding: "0.35rem 0.875rem",
                                    borderRadius: "var(--radius-sm)",
                                    border: "1px solid var(--color-border)",
                                    backgroundColor: "transparent",
                                    color: "var(--color-text-muted)",
                                    fontWeight: 600,
                                    fontSize: "0.8125rem",
                                    cursor: "pointer",
                                  }}
                                >
                                  {t("releaseCancel")}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setReleaseConfirmId(m.id)}
                                style={{
                                  padding: "0.35rem 0.875rem",
                                  borderRadius: "var(--radius-sm)",
                                  border: "2px solid #16a34a",
                                  backgroundColor: "#16a34a",
                                  color: "#fff",
                                  fontWeight: 600,
                                  fontSize: "0.8125rem",
                                  cursor: "pointer",
                                }}
                              >
                                {t("releasePayment")}
                              </button>
                            )
                          ) : (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {t("checkEmailRelease")}
                            </span>
                          ))}
                      </div>
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

        {/* Already paid */}
        {isPaid && (
          <div
            className="alert alert-success"
            style={{ marginBottom: "1.25rem" }}
          >
            {t("alreadyPaid")}
          </div>
        )}

        {/* Payment form — only show if invoice is payable */}
        {!isPaid && !isExpired && (
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h2
              style={{
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
                margin: "0 0 1.25rem",
              }}
            >
              {t("payTitle")}
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {/* MoMo number */}
              <div>
                <label className="label">{t("momoLabel")}</label>
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
                    onChange={(e) =>
                      setPhoneNumber(
                        e.target.value.replace(/\D/g, "").slice(0, 9),
                      )
                    }
                    style={{
                      borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                    }}
                  />
                </div>
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
              </div>

              {/* Email */}
              <div>
                <label className="label">{t("emailLabel")}</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                />
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
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (!isDisabled) setShowEmailConfirm(true);
                }}
              >
                {payLoading ? <InlineSpinner /> : t("payNow")}
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
                  `${BASE_API_URL}/invoice/receipt/${invoice_number}`,
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
