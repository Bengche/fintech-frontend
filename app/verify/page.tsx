"use client";
import { useState } from "react";
import axios from "axios";
import Navbar from "@/app/components/Navbar";
import SiteFooter from "@/app/components/SiteFooter";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

interface InvoiceDetails {
  invoice_number: string;
  invoice_name: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  created_at: string;
  paid_at: string | null;
  description: string;
  seller_name: string;
  seller_username: string;
  seller_country: string;
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
      <Navbar />
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
            <VerifiedPanel inv={result.invoice} />
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
      <SiteFooter />
    </>
  );
}

function VerifiedPanel({ inv }: { inv: InvoiceDetails }) {
  return (
    <div
      style={{
        background: "#f0fdf4",
        border: "2px solid #22c55e",
        borderRadius: 12,
        padding: "28px 28px 24px",
        boxShadow: "0 2px 8px rgba(34,197,94,0.10)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: "#22c55e",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
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
          <div style={{ fontSize: 18, fontWeight: 800, color: "#166534" }}>
            Receipt Verified
          </div>
          <div style={{ fontSize: 13, color: "#15803d", marginTop: 2 }}>
            This receipt is authentic and was issued by Fonlok.
          </div>
        </div>
        {/* Fonlok badge */}
        <div
          style={{
            marginLeft: "auto",
            background: "#0F1F3D",
            color: "#F59E0B",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.5,
            whiteSpace: "nowrap",
          }}
        >
          FONLOK
        </div>
      </div>

      {/* Invoice details */}
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          border: "1px solid #bbf7d0",
          overflow: "hidden",
        }}
      >
        <Row label="Invoice No." value={inv.invoice_number} mono />
        <Row label="Invoice Name" value={inv.invoice_name} shade />
        <Row label="Amount" value={fmtAmount(inv.amount, inv.currency)} />
        <Row
          label="Status"
          value=""
          shade
          extra={<StatusBadge status={inv.status} />}
        />
        <Row
          label="Payment Type"
          value={
            inv.payment_type === "installment" ? "Installment" : "One-Time"
          }
        />
        <Row
          label="Seller"
          value={`${inv.seller_name} (@${inv.seller_username})`}
          shade
        />
        {inv.seller_country && (
          <Row label="Seller Country" value={inv.seller_country} />
        )}
        <Row label="Issued" value={fmtDate(inv.created_at)} shade />
        <Row label="Paid" value={fmtDate(inv.paid_at)} />
        {inv.description && (
          <Row label="Description" value={inv.description} shade />
        )}
      </div>

      <p
        style={{
          fontSize: 11,
          color: "#6b7280",
          marginTop: 16,
          marginBottom: 0,
          lineHeight: 1.5,
        }}
      >
        Verified on {new Date().toUTCString()} &bull; Issued by Fonlok Secure
        Escrow &bull; fonlok.com
      </p>
    </div>
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

function Row({
  label,
  value,
  shade,
  mono,
  extra,
}: {
  label: string;
  value: string;
  shade?: boolean;
  mono?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "9px 14px",
        background: shade ? "#f0fdf4" : "#fff",
        borderBottom: "1px solid #dcfce7",
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#6b7280",
          width: 120,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      {extra ?? (
        <span
          style={{
            fontSize: 13,
            color: "#111827",
            fontFamily: mono ? "monospace" : "inherit",
            letterSpacing: mono ? 1 : 0,
            wordBreak: "break-all",
          }}
        >
          {value}
        </span>
      )}
    </div>
  );
}
