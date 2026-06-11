"use client";
import { useState } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

interface Milestone {
  milestone_number: number;
  label: string;
  amount: number;
  status: string;
}

interface InvoiceDetails {
  invoice_number: string;
  invoice_name: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
  expires_at: string | null;
  description: string;
  seller_name: string;
  seller_username: string;
  seller_country: string;
  seller_phone: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  milestones: Milestone[];
}

interface VerifyResp {
  verified: boolean;
  message?: string;
  invoice?: InvoiceDetails;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtAmount(amount: number, currency: string) {
  return `${Number(amount).toLocaleString()} ${currency}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    paid: { bg: "#dcfce7", color: "#166534", label: "Paid" },
    delivered: { bg: "#dbeafe", color: "#1e40af", label: "Delivered" },
    completed: { bg: "#d1fae5", color: "#065f46", label: "Completed" },
  };
  const s = map[status] ?? { bg: "#f3f4f6", color: "#374151", label: status };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {s.label}
    </span>
  );
}

export default function VerifyReceiptPage() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResp | null>(null);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setResult(null);
    const num = invoiceNumber.trim();
    const c = code.trim().replace(/\s+/g, "").toUpperCase();
    if (!num || !c) {
      setFormError(
        "Please enter both the invoice number and verification code.",
      );
      return;
    }
    if (c.length !== 16) {
      setFormError("The verification code must be 16 characters long.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post<VerifyResp>(`${API}/invoice/verify`, {
        invoice_number: num,
        code: c,
      });
      setResult(res.data);
    } catch {
      setResult({
        verified: false,
        message: "An error occurred while verifying. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main
        style={{
          minHeight: "calc(100vh - 62px)",
          background: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "48px 16px 80px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 560 }}>
          {/* Page header */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                background: "#0F1F3D",
                borderRadius: "50%",
                marginBottom: 14,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#0F1F3D",
                margin: "0 0 8px",
              }}
            >
              Verify Fonlok Receipt
            </h1>
            <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
              Enter the invoice number and verification code printed on your
              receipt to confirm its authenticity.
            </p>
          </div>

          {/* Form card */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "32px 28px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              marginBottom: 24,
            }}
          >
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#374151",
                    marginBottom: 6,
                  }}
                >
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-20240001"
                  autoComplete="off"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#374151",
                    marginBottom: 6,
                  }}
                >
                  Verification Code
                  <span
                    style={{ fontWeight: 400, color: "#9ca3af", marginLeft: 6 }}
                  >
                    (16 characters, found on the receipt)
                  </span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2  C3D4  E5F6  7890"
                  maxLength={20}
                  autoComplete="off"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: "monospace",
                    letterSpacing: 2,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {formError && (
                <p
                  style={{
                    color: "#dc2626",
                    fontSize: 13,
                    marginBottom: 16,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 6,
                    padding: "8px 12px",
                  }}
                >
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: loading ? "#94a3b8" : "#0F1F3D",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 0",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {loading ? "Verifying..." : "Verify Receipt"}
              </button>
            </form>
          </div>

          {/* Result panel */}
          {result && result.verified && result.invoice && (
            <VerifiedPanel inv={result.invoice} code={code} />
          )}
          {result && !result.verified && (
            <NotVerifiedPanel message={result.message ?? ""} />
          )}

          {/* Info note */}
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              textAlign: "center",
              marginTop: 24,
              lineHeight: 1.6,
            }}
          >
            Verification codes are cryptographically generated by Fonlok and
            unique to each transaction. They cannot be replicated without access
            to Fonlok&apos;s secure servers.
          </p>
        </div>
      </main>
    </>
  );
}

function formatVerifyCode(code: string) {
  const c = code.replace(/\s+/g, "");
  if (c.length !== 16) return code;
  return `${c.slice(0, 4)}  ${c.slice(4, 8)}  ${c.slice(8, 12)}  ${c.slice(12, 16)}`;
}

function MilestoneBadge({ status }: { status: string }) {
  const isPaid = ["paid", "released", "completed"].includes(status);
  const map: Record<string, { color: string; label: string }> = {
    paid: { color: "#166534", label: "Paid" },
    released: { color: "#1e40af", label: "Released" },
    pending: { color: "#92400e", label: "Pending" },
    completed: { color: "#065f46", label: "Completed" },
  };
  const s = map[status] ?? { color: "#374151", label: status };
  return (
    <span style={{ color: s.color, fontWeight: 600, fontSize: 12 }}>
      {isPaid ? "✓ " : "· "}
      {s.label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1.2,
        color: "#64748b",
        textTransform: "uppercase",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function PartyRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 7,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#94a3b8",
          width: 58,
          flexShrink: 0,
          paddingTop: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#1e293b",
          fontWeight: 500,
          fontFamily: mono ? "monospace" : "inherit",
          wordBreak: "break-all",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function VerifiedPanel({
  inv,
  code,
}: {
  inv: InvoiceDetails;
  code: string;
}) {
  const navy = "#0F1F3D";
  const amber = "#F59E0B";
  const hasBuyer = inv.buyer_name || inv.buyer_email || inv.buyer_phone;
  const hasMilestones = inv.milestones && inv.milestones.length > 0;
  const verifiedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });

  return (
    <>
      <style>{`
        .fonlok-receipt-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .fonlok-detail-table {
          width: 100%;
          border-collapse: collapse;
        }
        .fonlok-detail-table tr td {
          padding: 10px 14px;
          font-size: 13px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: top;
          color: #1e293b;
        }
        .fonlok-detail-table tr:last-child td {
          border-bottom: none;
        }
        .fonlok-detail-table tr td:first-child {
          font-weight: 600;
          color: #64748b;
          white-space: nowrap;
          width: 150px;
        }
        .fonlok-milestone-table {
          width: 100%;
          border-collapse: collapse;
        }
        .fonlok-milestone-table th {
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #64748b;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .fonlok-milestone-table td {
          padding: 9px 12px;
          font-size: 13px;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
        }
        .fonlok-milestone-table tr:last-child td {
          border-bottom: none;
        }
        @media (max-width: 580px) {
          .fonlok-receipt-grid {
            grid-template-columns: 1fr;
          }
          .fonlok-detail-table tr td:first-child {
            width: 110px;
          }
        }
      `}</style>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(15,31,61,0.10)",
        }}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <div
          style={{
            background: navy,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: "#22c55e",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: 0.5,
                }}
              >
                RECEIPT VERIFIED
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                Authentic — Issued by Fonlok Secure Escrow
              </div>
            </div>
          </div>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              border: `2px solid ${amber}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: amber,
                letterSpacing: 0.5,
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              <div>FONLOK</div>
              <div>VERIFIED</div>
            </div>
          </div>
        </div>

        {/* ── Amber accent bar ───────────────────────────────── */}
        <div style={{ height: 3, background: amber }} />

        {/* ── Invoice summary ────────────────────────────────── */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f1f5f9",
            background: "#fafbfc",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: navy,
                  marginBottom: 4,
                  lineHeight: 1.3,
                }}
              >
                {inv.invoice_name}
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: "#94a3b8",
                  letterSpacing: 1,
                  marginBottom: 10,
                }}
              >
                {inv.invoice_number}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <StatusBadge status={inv.status} />
                <span
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {inv.payment_type === "installment"
                    ? "Installment"
                    : "One-Time"}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: navy,
                  letterSpacing: -0.5,
                  whiteSpace: "nowrap",
                }}
              >
                {fmtAmount(inv.amount, inv.currency)}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                Total Amount
              </div>
            </div>
          </div>
        </div>

        {/* ── Parties ───────────────────────────────────────── */}
        <div
          style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}
        >
          <div className="fonlok-receipt-grid">
            {/* Seller */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: 1.3,
                  color: navy,
                  textTransform: "uppercase",
                  paddingBottom: 8,
                  marginBottom: 10,
                  borderBottom: `2px solid ${amber}`,
                  display: "inline-block",
                }}
              >
                FROM — SELLER
              </div>
              <PartyRow label="Name" value={inv.seller_name} />
              <PartyRow
                label="Username"
                value={`@${inv.seller_username}`}
                mono
              />
              {inv.seller_phone && (
                <PartyRow label="Phone" value={inv.seller_phone} />
              )}
              {inv.seller_country && (
                <PartyRow label="Country" value={inv.seller_country} />
              )}
            </div>

            {/* Buyer */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: 1.3,
                  color: navy,
                  textTransform: "uppercase",
                  paddingBottom: 8,
                  marginBottom: 10,
                  borderBottom: `2px solid ${amber}`,
                  display: "inline-block",
                }}
              >
                TO — BUYER
              </div>
              {hasBuyer ? (
                <>
                  {inv.buyer_name && (
                    <PartyRow label="Name" value={inv.buyer_name} />
                  )}
                  {inv.buyer_email && (
                    <PartyRow label="Email" value={inv.buyer_email} />
                  )}
                  {inv.buyer_phone && (
                    <PartyRow label="Phone" value={inv.buyer_phone} />
                  )}
                </>
              ) : (
                <div
                  style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}
                >
                  Buyer information is not available for this receipt.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Transaction details ────────────────────────────── */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: hasMilestones ? "1px solid #f1f5f9" : "none",
          }}
        >
          <SectionLabel>Transaction Details</SectionLabel>
          <table className="fonlok-detail-table">
            <tbody>
              <tr>
                <td>Issued</td>
                <td>{fmtDate(inv.created_at)}</td>
              </tr>
              <tr>
                <td>Paid</td>
                <td>{fmtDate(inv.paid_at)}</td>
              </tr>
              {inv.delivered_at && (
                <tr>
                  <td>Delivered</td>
                  <td>{fmtDate(inv.delivered_at)}</td>
                </tr>
              )}
              <tr>
                <td>Payment Type</td>
                <td>
                  {inv.payment_type === "installment"
                    ? "Installment / Milestones"
                    : "One-Time Payment"}
                </td>
              </tr>
              <tr>
                <td>Currency</td>
                <td>{inv.currency}</td>
              </tr>
              {inv.description && (
                <tr>
                  <td>Description</td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{inv.description}</td>
                </tr>
              )}
              {inv.expires_at && (
                <tr>
                  <td>Expires</td>
                  <td>{fmtDate(inv.expires_at)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Milestones ─────────────────────────────────────── */}
        {hasMilestones && (
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <SectionLabel>Milestone Breakdown</SectionLabel>
            <div style={{ overflowX: "auto" }}>
              <table className="fonlok-milestone-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>Label</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.milestones.map((m) => (
                    <tr key={m.milestone_number}>
                      <td style={{ color: "#94a3b8", fontSize: 12 }}>
                        {m.milestone_number}
                      </td>
                      <td style={{ fontWeight: 500 }}>{m.label}</td>
                      <td style={{ fontFamily: "monospace" }}>
                        {fmtAmount(m.amount, inv.currency)}
                      </td>
                      <td>
                        <MilestoneBadge status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Verification footer ────────────────────────────── */}
        <div
          style={{
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            padding: "16px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  marginBottom: 5,
                }}
              >
                Verification Code
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 16,
                  fontWeight: 700,
                  color: navy,
                  letterSpacing: 3,
                }}
              >
                {formatVerifyCode(code)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{ fontSize: 11, color: "#64748b", lineHeight: 1.7 }}
              >
                Verified {verifiedAt}
                <br />
                <a
                  href="https://fonlok.com/verify"
                  style={{
                    color: navy,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  fonlok.com/verify
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function NotVerifiedPanel({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "#fff1f2",
        border: "2px solid #f43f5e",
        borderRadius: 12,
        padding: "28px 28px 24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            background: "#f43f5e",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#be123c" }}>
            Verification Failed
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#9f1239",
              marginTop: 6,
              lineHeight: 1.6,
            }}
          >
            {message ||
              "The details you entered could not be verified. Please check the invoice number and code and try again."}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 20,
          background: "#ffe4e6",
          borderRadius: 8,
          padding: "12px 16px",
          fontSize: 13,
          color: "#9f1239",
          lineHeight: 1.6,
        }}
      >
        <strong>Important:</strong> If you received this receipt from someone
        claiming it is valid but verification fails, please do not proceed with
        any further payment or transfer. Contact us at{" "}
        <a
          href="mailto:support@fonlok.com"
          style={{ color: "#be123c", fontWeight: 600 }}
        >
          support@fonlok.com
        </a>
        .
      </div>
    </div>
  );
}

