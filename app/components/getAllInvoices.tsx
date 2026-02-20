"use client";
import Axios from "axios";
import { useAuth } from "@/context/UserContext";
import { QRCodeSVG } from "qrcode.react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
import { useState, useEffect, useCallback } from "react";
import DeleteInvoice from "../components/deleteInvoice";
import EditInvoice from "./editInvoice";
import MarkDelivered from "./markDelivered";
import ChatWindow from "./ChatWindow";
import DisputeButton from "./DisputeButton";
import { Copy, Check, QrCode } from "lucide-react";
Axios.defaults.withCredentials = true;

interface Invoice {
  id: number;
  invoicenumber: string;
  invoicename: string;
  amount: number;
  currency: string;
  status: string;
  buyeremail: string;
  paymentlink: string;
  invoicelink: string;
  createdat: string;
  expires_at?: string | null;
  [key: string]: unknown;
}

type GetAllProps = {
  link: string;
  /** When true the internal "Your Invoices" heading and Refresh button are hidden.
   *  The parent tab provides the heading and can trigger refresh via its own button. */
  hideHeader?: boolean;
  /** Forwarded setter so a parent can inject a trigger-refresh function. */
  onRegisterRefresh?: (fn: () => void) => void;
};

const STATUS_TABS = ["all", "pending", "paid", "delivered", "expired"] as const;

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "badge badge-warning",
    paid: "badge badge-info",
    delivered: "badge badge-success",
    expired: "badge badge-neutral",
  };
  return map[status] ?? "badge badge-neutral";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function GetAllInvoices({
  link: _link,
  hideHeader = false,
  onRegisterRefresh,
}: GetAllProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [showQRId, setShowQRId] = useState<number | null>(null);
  const { user_id } = useAuth();

  const getAllInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = `${API}/invoice/all/${user_id}`;
      const response = await Axios.get(endpoint);
      const data = response.data.invoices;
      setInvoices(data && data.length > 0 ? data : null);
    } catch {
      setInvoices(null);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  // Register the refresh function with the parent after mount — never during render
  useEffect(() => {
    if (onRegisterRefresh) onRegisterRefresh(getAllInvoices);
  }, [onRegisterRefresh, getAllInvoices]);

  const handleCopy = async (id: number, copyLink: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(copyLink);
      } else {
        // Fallback for older browsers / non-HTTPS contexts
        const ta = document.createElement("textarea");
        ta.value = copyLink;
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err: unknown) {
      console.log(err instanceof Error ? err.message : err);
    }
  };

  const filtered = invoices
    ? invoices.filter(
        (inv) => statusFilter === "all" || inv.status === statusFilter,
      )
    : [];

  return (
    <div>
      {/* Header row — shown when not embedded in a parent tab */}
      {!hideHeader && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
              margin: 0,
            }}
          >
            Your Invoices
          </h2>
          <button
            className="btn-primary"
            onClick={getAllInvoices}
            disabled={loading}
          >
            {loading ? "Loading\u2026" : "Refresh Invoices"}
          </button>
        </div>
      )}

      {/* Status filter tabs */}
      {invoices && invoices.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "0.375rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: "0.3125rem 0.875rem",
                borderRadius: "999px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor:
                  statusFilter === tab
                    ? "var(--color-primary)"
                    : "var(--color-mist)",
                color:
                  statusFilter === tab
                    ? "var(--color-white)"
                    : "var(--color-text-muted)",
                transition: "background 0.15s",
              }}
            >
              {tab === "all"
                ? "All"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {invoices === null && !loading && (
        <div
          style={{
            textAlign: "center",
            padding: "2.5rem 1rem",
            color: "var(--color-text-muted)",
          }}
        >
          <p style={{ fontSize: "0.9375rem" }}>
            No invoices yet. Click &quot;Refresh Invoices&quot; to load or
            create your first one above.
          </p>
        </div>
      )}

      {filtered.length === 0 && invoices !== null && !loading && (
        <div
          style={{
            textAlign: "center",
            padding: "1.5rem",
            color: "var(--color-text-muted)",
            fontSize: "0.875rem",
          }}
        >
          No invoices match this filter.
        </div>
      )}

      {/* Invoice cards */}
      {filtered.map((invoice) => (
        <div key={invoice.id} className="card" style={{ marginBottom: "1rem" }}>
          {/* Card header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginBottom: "0.875rem",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--color-text-heading)",
                  margin: 0,
                }}
              >
                {invoice.invoicename}
              </p>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                  margin: "0.125rem 0 0",
                }}
              >
                #{invoice.invoicenumber}
              </p>
            </div>
            <span className={statusBadge(invoice.status)}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>

          {/* Details grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "0.5rem",
              marginBottom: "0.875rem",
            }}
          >
            <InvoiceField
              label="Amount"
              value={`${invoice.amount} ${invoice.currency}`}
            />
            <InvoiceField
              label="Created"
              value={new Date(invoice.createdat).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            />
            {invoice.expires_at && (
              <InvoiceField
                label="Expires"
                value={new Date(invoice.expires_at).toLocaleDateString(
                  "en-GB",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  },
                )}
              />
            )}
          </div>

          {/* Invoice link row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "var(--color-mist)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "0.5rem 0.75rem",
              marginBottom: "0.875rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                wordBreak: "break-all",
              }}
            >
              {invoice.invoicelink}
            </span>
            <button
              onClick={() => handleCopy(invoice.id, invoice.invoicelink)}
              className="btn-ghost"
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.625rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              {copiedId === invoice.id ? (
                <>
                  <Check size={13} /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy Link
                </>
              )}
            </button>
          </div>

          {/* Share: WhatsApp + QR toggle */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Pay me for "${invoice.invoicename}" on Fonlok 👉 ${invoice.invoicelink}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.875rem",
                backgroundColor: "#25D366",
                color: "#fff",
                borderRadius: "var(--radius-sm)",
                fontWeight: 600,
                fontSize: "0.8125rem",
                textDecoration: "none",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
            <button
              className="btn-ghost"
              onClick={() =>
                setShowQRId(showQRId === invoice.id ? null : invoice.id)
              }
              style={{
                fontSize: "0.8125rem",
                padding: "0.35rem 0.875rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <QrCode size={14} />
              {showQRId === invoice.id ? "Hide QR" : "Show QR"}
            </button>
          </div>

          {/* QR Code (expandable) */}
          {showQRId === invoice.id && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.875rem",
                backgroundColor: "var(--color-mist)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  padding: "0.75rem",
                  backgroundColor: "#fff",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  display: "inline-block",
                }}
              >
                <QRCodeSVG value={invoice.invoicelink} size={130} />
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                Buyer scans this to open the payment page.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <EditInvoice
              invoice_number={invoice.invoicenumber}
              onEdit={getAllInvoices}
            />
            <DeleteInvoice invoice_id={invoice.id} onDelete={getAllInvoices} />
            {invoice.status === "paid" && (
              <MarkDelivered
                invoice_id={invoice.id}
                onDelivered={getAllInvoices}
              />
            )}
          </div>

          {/* Chat & Dispute */}
          {(invoice.status === "paid" || invoice.status === "delivered") && (
            <div
              style={{
                marginTop: "0.75rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <ChatWindow invoice_number={invoice.invoicenumber} />
              <DisputeButton
                invoice_number={invoice.invoicenumber}
                sender_type="seller"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function InvoiceField({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-mist)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        padding: "0.5rem 0.625rem",
      }}
    >
      <p
        style={{
          fontSize: "0.6875rem",
          fontWeight: 600,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          margin: "0 0 0.125rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "var(--color-text-heading)",
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  );
}
