"use client";

import Axios from "axios";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import SiteFooter from "@/app/components/SiteFooter";
import Link from "next/link";
import { useAuth } from "@/context/UserContext";
import { InlineSpinner } from "@/app/components/Spinner";

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

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneLoading, setMilestoneLoading] = useState(false);
  const [milestoneActionMsg, setMilestoneActionMsg] = useState("");
  const [milestoneActionError, setMilestoneActionError] = useState("");

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
    setMilestoneLoading(true);
    setMilestoneActionMsg("");
    setMilestoneActionError("");
    try {
      await Axios.patch(
        `${BASE_API_URL}/invoice/milestone/${milestoneId}/complete`,
        {},
        { withCredentials: true },
      );
      setMilestoneActionMsg(
        "Milestone marked complete! The buyer has been notified by email.",
      );
      // Refresh milestones
      const msRes = await Axios.get(
        `${BASE_API_URL}/invoice/milestones/${invoice_number}`,
      );
      setMilestones(msRes.data.milestones || []);
    } catch (err: unknown) {
      setMilestoneActionError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to mark milestone complete.",
      );
    } finally {
      setMilestoneLoading(false);
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
        userid: invoiceStats.userid,
      });
      setPaySuccess(
        "Payment initiated! Please approve the prompt on your phone.",
      );
    } catch (err: unknown) {
      setPayError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Payment failed. Please try again.",
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
      <Navbar />

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
          ← Back
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
                Invoice
              </p>
              <h1
                style={{
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  color: "var(--color-text-heading)",
                  margin: 0,
                }}
              >
                {invoiceStats.invoicename || "Loading…"}
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
              label="Amount"
              value={
                invoiceStats.amount
                  ? `${invoiceStats.amount.toLocaleString()} ${invoiceStats.currency}`
                  : "—"
              }
              highlight
            />
            <InvoiceField
              label="Invoice #"
              value={invoiceStats.invoicenumber || "—"}
              mono
            />
            {invoiceStats.clientemail && (
              <InvoiceField
                label="Client Email"
                value={invoiceStats.clientemail}
              />
            )}
            {invoiceStats.expires_at && (
              <InvoiceField
                label="Expires"
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
                Description
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
                Milestone progress
              </h2>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                  margin: "0 0 1.25rem",
                }}
              >
                {milestones.filter((m) => m.status === "released").length} of{" "}
                {milestones.length} milestones released
              </p>

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
                              &middot; Due{" "}
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
                            disabled={milestoneLoading}
                            style={{
                              padding: "0.35rem 0.875rem",
                              borderRadius: "var(--radius-sm)",
                              border: "2px solid var(--color-primary)",
                              backgroundColor: "var(--color-primary)",
                              color: "#fff",
                              fontWeight: 600,
                              fontSize: "0.8125rem",
                              cursor: milestoneLoading
                                ? "not-allowed"
                                : "pointer",
                              opacity: milestoneLoading ? 0.6 : 1,
                            }}
                          >
                            {milestoneLoading ? (
                              <InlineSpinner size="xs" />
                            ) : (
                              "Mark complete"
                            )}
                          </button>
                        )}
                        {m.status === "completed" && !isSeller && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            Check your email for the release link
                          </span>
                        )}
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
            This invoice has expired and can no longer be paid.
          </div>
        )}

        {/* Already paid */}
        {isPaid && (
          <div
            className="alert alert-success"
            style={{ marginBottom: "1.25rem" }}
          >
            This invoice has already been paid. Thank you!
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
              Pay this invoice
            </h2>

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

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {/* MoMo number */}
              <div>
                <label className="label">Mobile Money number</label>
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
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
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
                  💳 Enter your MTN Mobile Money or Orange Money number. The
                  payment prompt will be sent to this number. Ensure it is
                  correct — an incorrect number may result in a failed or
                  misdirected payment.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="label">Your email address</label>
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
                  ✉️ Use a valid email address you have access to. Once your
                  payment is confirmed, a secure one-time fund release link will
                  be sent to this address. You will need it to release the
                  seller’s payment after receiving your order.
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
                  A <strong>2% processing fee</strong> will be applied to this
                  transaction. The seller receives the amount minus 2%.
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
                By clicking Pay Now, you confirm that you have reviewed the
                seller description above and agree to our Terms of Service and
                Privacy Policy.
              </p>

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
                  if (!isDisabled) makePayment();
                }}
              >
                {payLoading ? <InlineSpinner /> : "Pay Now"}
              </button>
            </div>
          </div>
        )}
      </div>

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
            Payment Receipt
          </p>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              marginBottom: "1.25rem",
            }}
          >
            Download an official PDF receipt for this transaction. Both the
            buyer and seller can keep this for their records.
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
                  alert(data.message || "Failed to generate receipt.");
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
                alert("Failed to download receipt. Please try again.");
              } finally {
                setPdfLoading(false);
              }
            }}
          >
            📄 {pdfLoading ? "Generating…" : "Download Receipt (PDF)"}
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
                Buyer hasn&apos;t responded?
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
                  ? "Resend the milestone release link to the buyer's email in case they missed or deleted it."
                  : "Resend the delivery notification to the buyer's email in case they missed or deleted it."}
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
                    axiosErr.response?.data?.message ||
                      "Failed to resend email. Please try again.",
                  );
                } finally {
                  setResendLoading(false);
                }
              }}
            >
              {resendLoading ? "Sending…" : "✉ Resend confirmation email"}
            </button>
          </div>
        )}

      <SiteFooter />
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
