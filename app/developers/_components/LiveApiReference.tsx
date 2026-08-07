/**
 * LiveApiReference
 *
 * Static documentation section for the Fonlok live (production) API.
 * Server component — no client-side state or effects required.
 *
 * Endpoints documented:
 *  GET  /v1/ping
 *  POST /v1/invoices
 *  GET  /v1/invoices/:invoice_id
 *  POST /v1/payments/initiate
 *  GET  /v1/payments/:reference/status
 *  POST /v1/payments/release
 *  POST /v1/payments/dispute
 *  POST /v1/wallet/pay
 *  POST /v1/webhooks/register
 *  GET  /v1/webhooks
 *  DELETE /v1/webhooks/:id
 *
 * Webhook events:
 *  payment.initiated | payment.confirmed | payment.disputed | payment.released
 */

import type { ReactNode } from "react";
import CodeTabs from "./CodeTabs";

const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://your-backend.railway.app";

// ── Palette ───────────────────────────────────────────────────────────────────

const LIVE_GREEN = "#16a34a";
const LIVE_BG = "#f0fdf4";
const LIVE_BORDER = "#bbf7d0";
const CODE_BG = "#1E2029";
const CODE_TEXT = "#ABB2BF";

// ── Sub-components ────────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: "GET" | "POST" | "DELETE" }) {
  const styles: Record<string, { bg: string; color: string }> = {
    GET: { bg: "#E2E8F0", color: "#334155" },
    POST: { bg: "#0F1F3D", color: "#F59E0B" },
    DELETE: { bg: "#FEE2E2", color: "#DC2626" },
  };
  const s = styles[method];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.175rem 0.55rem",
        borderRadius: "4px",
        background: s.bg,
        color: s.color,
        fontFamily: "monospace",
        fontSize: "0.75rem",
        fontWeight: 800,
        letterSpacing: "0.05em",
        flexShrink: 0,
      }}
    >
      {method}
    </span>
  );
}

function CodeBlock({ label, children }: { label?: string; children: string }) {
  return (
    <div
      style={{
        background: CODE_BG,
        borderRadius: "10px",
        overflow: "hidden",
        marginBottom: "1.25rem",
      }}
    >
      {label && (
        <div
          style={{
            padding: "0.45rem 1.25rem",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            fontSize: "0.6875rem",
            fontWeight: 700,
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {label}
        </div>
      )}
      <pre
        style={{
          margin: 0,
          padding: "1.125rem 1.25rem",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "0.8125rem",
          color: CODE_TEXT,
          lineHeight: 1.75,
          overflowX: "auto",
          whiteSpace: "pre",
        }}
      >
        {children}
      </pre>
    </div>
  );
}

interface ParamRow {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

function ParamsTable({ rows }: { rows: ParamRow[] }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div style={{ overflowX: "auto", marginBottom: "1.25rem" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.875rem",
        }}
      >
        <thead>
          <tr style={{ background: "#F8FAFC" }}>
            {(["Field", "Type", "Required", "Description"] as const).map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: "0.6rem 0.875rem",
                    textAlign: "left",
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    color: "#64748B",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    borderBottom: "2px solid #E2E8F0",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} style={{ borderBottom: "1px solid #E2E8F0" }}>
              <td
                style={{
                  padding: "0.75rem 0.875rem",
                  verticalAlign: "top",
                  whiteSpace: "nowrap",
                }}
              >
                <code
                  style={{
                    fontFamily: "monospace",
                    color: "#0F1F3D",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                  }}
                >
                  {row.name}
                </code>
              </td>
              <td
                style={{
                  padding: "0.75rem 0.875rem",
                  verticalAlign: "top",
                  color: "#64748B",
                  whiteSpace: "nowrap",
                }}
              >
                {row.type}
              </td>
              <td
                style={{
                  padding: "0.75rem 0.875rem",
                  verticalAlign: "top",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.1rem 0.45rem",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    background: row.required ? "#FEF3C7" : "#F1F5F9",
                    color: row.required ? "#92400E" : "#64748B",
                  }}
                >
                  {row.required ? "required" : "optional"}
                </span>
              </td>
              <td
                style={{
                  padding: "0.75rem 0.875rem",
                  verticalAlign: "top",
                  color: "#475569",
                  lineHeight: 1.65,
                }}
              >
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface EndpointProps {
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
  params?: ParamRow[];
  curlExample?: string;
  jsExample?: string;
  pythonExample?: string;
  responseExample: string;
  notes?: ReactNode;
}

function Endpoint({
  method,
  path,
  description,
  params,
  curlExample,
  jsExample,
  pythonExample,
  responseExample,
  notes,
}: EndpointProps) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: "12px",
        overflow: "hidden",
        marginBottom: "1.5rem",
      }}
    >
      {/* Header row */}
      <div
        style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
          background: "#FAFBFC",
        }}
      >
        <MethodBadge method={method} />
        <code
          style={{
            fontFamily: "monospace",
            fontSize: "0.9375rem",
            fontWeight: 700,
            color: "#0F1F3D",
            letterSpacing: "-0.01em",
          }}
        >
          {path}
        </code>
      </div>

      {/* Body */}
      <div style={{ padding: "1.375rem 1.5rem" }}>
        <p
          style={{
            fontSize: "0.9rem",
            color: "#475569",
            lineHeight: 1.75,
            marginBottom: "1.25rem",
          }}
        >
          {description}
        </p>

        {notes && (
          <div
            style={{
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: "8px",
              padding: "0.875rem 1rem",
              marginBottom: "1.25rem",
              fontSize: "0.875rem",
              color: "#78350F",
              lineHeight: 1.7,
            }}
          >
            {notes}
          </div>
        )}

        {params && params.length > 0 && (
          <>
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: "0.625rem",
              }}
            >
              Request body
            </p>
            <ParamsTable rows={params} />
          </>
        )}

        {(curlExample || jsExample || pythonExample) && (
          <CodeTabs curl={curlExample} js={jsExample} python={pythonExample} />
        )}

        <p
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: "0.625rem",
          }}
        >
          Response
        </p>
        <CodeBlock label="JSON">{responseExample}</CodeBlock>
      </div>
    </div>
  );
}

function GroupHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div style={{ marginTop: "3.5rem", marginBottom: "1.75rem" }}>
      <h3
        style={{
          fontSize: "1.25rem",
          fontWeight: 800,
          color: "#0F1F3D",
          marginBottom: description ? "0.5rem" : "1rem",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: "0.9rem",
            color: "#64748B",
            lineHeight: 1.7,
            maxWidth: "640px",
            marginBottom: "1rem",
          }}
        >
          {description}
        </p>
      )}
      <div
        style={{
          height: "2px",
          background: "linear-gradient(to right, #E2E8F0, transparent)",
          borderRadius: "1px",
        }}
      />
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function LiveApiReference() {
  return (
    <section
      id="live-api"
      className="dev-section"
      style={{
        background: "#F8FAFC",
        padding: "5rem 1.5rem",
        borderBottom: "1px solid #E2E8F0",
        scrollMarginTop: "72px",
      }}
    >
      <div className="page-wrapper">
        {/* ── Section header ────────────────────────────────────────────── */}
        <div style={{ marginBottom: "3rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              background: LIVE_BG,
              border: `1px solid ${LIVE_BORDER}`,
              color: LIVE_GREEN,
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              padding: "0.325rem 0.875rem",
              borderRadius: "999px",
              marginBottom: "1.25rem",
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
              <circle cx="4" cy="4" r="4" opacity="0.25" />
              <circle cx="4" cy="4" r="2" />
            </svg>
            Live API
          </span>

          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 800,
              color: "#0F1F3D",
              marginBottom: "0.75rem",
              letterSpacing: "-0.015em",
            }}
          >
            Live API reference
          </h2>
          <p
            style={{
              fontSize: "1rem",
              color: "#64748B",
              maxWidth: "620px",
              lineHeight: 1.75,
              marginBottom: "2rem",
            }}
          >
            Complete reference for all production endpoints. The live API
            processes real Mobile Money payments in XAF. Every request must be
            authenticated with a{" "}
            <code
              style={{
                fontFamily: "monospace",
                background: "#E2E8F0",
                padding: "0.1rem 0.4rem",
                borderRadius: "4px",
                fontSize: "0.875em",
                color: "#0F1F3D",
              }}
            >
              sk_live_
            </code>{" "}
            key obtained from your Fonlok account. Keys are available to
            approved integration partners — contact{" "}
            <a
              href="mailto:support@fonlok.com?subject=Production API Access"
              style={{ color: LIVE_GREEN, fontWeight: 600 }}
            >
              support@fonlok.com
            </a>{" "}
            to apply.
          </p>

          {/* Base URL */}
          <div
            style={{
              background: CODE_BG,
              borderRadius: "10px",
              overflow: "hidden",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                padding: "0.45rem 1.25rem",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.35)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Base URL
            </div>
            <pre
              style={{
                margin: 0,
                padding: "0.875rem 1.25rem",
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: "0.875rem",
                color: "#98C379",
                lineHeight: 1.6,
                overflowX: "auto",
              }}
            >
              {BASE}
            </pre>
          </div>

          {/* Auth header */}
          <div
            style={{
              background: CODE_BG,
              borderRadius: "10px",
              overflow: "hidden",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                padding: "0.45rem 1.25rem",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.35)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Authorization header — required on every request
            </div>
            <pre
              style={{
                margin: 0,
                padding: "0.875rem 1.25rem",
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: "0.875rem",
                color: CODE_TEXT,
                lineHeight: 1.6,
                overflowX: "auto",
              }}
            >
              <span style={{ color: "#61AFEF" }}>Authorization</span>
              {": "}
              <span style={{ color: "#98C379" }}>
                Bearer sk_live_a1b2c3d4...
              </span>
            </pre>
          </div>

          {/* Fees callout */}
          <div
            style={{
              background: LIVE_BG,
              border: `1px solid ${LIVE_BORDER}`,
              borderRadius: "10px",
              padding: "1rem 1.25rem",
              fontSize: "0.875rem",
              color: "#14532D",
              lineHeight: 1.75,
            }}
          >
            <strong>Fees:</strong> Fonlok charges a 3% platform fee deducted at
            release. The{" "}
            <code style={{ fontFamily: "monospace", fontSize: "0.875em" }}>
              POST /v1/payments/release
            </code>{" "}
            response includes the exact fee and net amount.{" "}
            <strong>Currency:</strong> Only XAF (Central African Franc) is
            supported.
          </div>
        </div>

        {/* ── GET /v1/ping ──────────────────────────────────────────────── */}
        <Endpoint
          method="GET"
          path="/v1/ping"
          description="Health check. Verifies that your live key is valid and the API is reachable. Returns a JSON object confirming the environment. Does not initiate any transaction."
          curlExample={`curl ${BASE}/v1/ping \\
  -H "Authorization: Bearer sk_live_..."`}
          jsExample={`const res = await fetch('${BASE}/v1/ping', {
  headers: { Authorization: 'Bearer sk_live_...' }
});
const data = await res.json();`}
          pythonExample={`import requests

res = requests.get('${BASE}/v1/ping',
    headers={'Authorization': 'Bearer sk_live_...'})
data = res.json()`}
          responseExample={`{
  "object": "api_status",
  "status": "ok",
  "environment": "production",
  "key_label": "My Integration",
  "message": "Fonlok live API is operational. Real transactions will be processed.",
  "timestamp": "2025-01-15T10:30:00.000Z"
}`}
        />

        {/* ── INVOICES ──────────────────────────────────────────────────── */}
        <GroupHeader
          title="Invoices"
          description="Create and retrieve escrow invoices. Each invoice represents one transaction — funds are held by Fonlok until you call POST /v1/payments/release. No Fonlok account is required for the seller or buyer."
        />

        <Endpoint
          method="POST"
          path="/v1/invoices"
          description="Create a new escrow invoice on behalf of any seller on your platform. Returns a payment_url you can redirect the buyer to, or use POST /v1/payments/initiate to trigger a direct MoMo push instead."
          params={[
            {
              name: "title",
              type: "string",
              required: true,
              description:
                "Invoice title, max 200 chars. Shown to buyer on the payment page.",
            },
            {
              name: "amount",
              type: "number",
              required: true,
              description: "Invoice amount in XAF. Minimum 500 XAF.",
            },
            {
              name: "currency",
              type: "string",
              required: false,
              description:
                'Currency code. Only "XAF" is supported. Defaults to "XAF".',
            },
            {
              name: "seller_name",
              type: "string",
              required: true,
              description: "Seller's full name, max 200 chars.",
            },
            {
              name: "seller_email",
              type: "string",
              required: true,
              description:
                "Seller's email. Fonlok sends payout confirmation and PDF receipt here.",
            },
            {
              name: "seller_phone",
              type: "string",
              required: true,
              description:
                "Seller's MTN or Orange MoMo number in international format, e.g. 237670000001. This is where the payout is sent.",
            },
            {
              name: "buyer_email",
              type: "string",
              required: false,
              description:
                "Buyer's email. Fonlok sends payment confirmation and PDF receipt here.",
            },
            {
              name: "buyer_phone",
              type: "string",
              required: false,
              description:
                "Buyer's MoMo number. Can also be supplied later when calling POST /v1/payments/initiate.",
            },
            {
              name: "description",
              type: "string",
              required: false,
              description: "Item description, max 2000 chars.",
            },
            {
              name: "reference",
              type: "string",
              required: false,
              description:
                "Your internal order or reference ID, max 200 chars. Must be unique per API key. Returned as external_reference.",
            },
            {
              name: "expires_at",
              type: "string",
              required: false,
              description:
                'ISO 8601 expiry date, e.g. "2026-12-31". After this date the payment URL becomes inactive.',
            },
          ]}
          curlExample={`curl ${BASE}/v1/invoices \\
  -X POST \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "iPhone 15 Pro",
    "amount": 850000,
    "seller_name": "Jean Fotso",
    "seller_email": "jean@example.com",
    "seller_phone": "237670000001",
    "buyer_email": "buyer@example.com",
    "description": "Brand new, sealed box",
    "reference": "order_789",
    "expires_at": "2026-12-31"
  }'`}
          jsExample={`const res = await fetch('${BASE}/v1/invoices', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer sk_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'iPhone 15 Pro',
    amount: 850000,
    seller_name: 'Jean Fotso',
    seller_email: 'jean@example.com',
    seller_phone: '237670000001',
    buyer_email: 'buyer@example.com',
    description: 'Brand new, sealed box',
    reference: 'order_789',
    expires_at: '2026-12-31'
  })
});
const invoice = await res.json();`}
          pythonExample={`import requests

res = requests.post('${BASE}/v1/invoices',
    headers={'Authorization': 'Bearer sk_live_...'},
    json={
        'title': 'iPhone 15 Pro',
        'amount': 850000,
        'seller_name': 'Jean Fotso',
        'seller_email': 'jean@example.com',
        'seller_phone': '237670000001',
        'buyer_email': 'buyer@example.com',
        'description': 'Brand new, sealed box',
        'reference': 'order_789',
        'expires_at': '2026-12-31'
    })
invoice = res.json()`}
          responseExample={`HTTP 201 Created

{
  "object": "invoice",
  "id": "42-a1b2c3d4e5f6",
  "title": "iPhone 15 Pro",
  "description": "Brand new, sealed box",
  "amount": 850000,
  "currency": "XAF",
  "seller": {
    "name": "Jean Fotso",
    "email": "jean@example.com",
    "phone": "237670000001"
  },
  "buyer_email": "buyer@example.com",
  "buyer_phone": null,
  "status": "pending",
  "payment_url": "https://fonlok.com/pay/42-a1b2c3d4e5f6",
  "external_reference": "order_789",
  "expires_at": "2026-12-31T00:00:00.000Z",
  "created_at": "2025-01-15T10:30:00.000Z"
}`}
          notes={
            <>
              If you supply a <code>reference</code> that already exists for
              your API key, the request returns{" "}
              <code>409 duplicate_reference</code>. The <code>payment_url</code>{" "}
              is always present and active — share it with the buyer to let them
              pay directly through the Fonlok payment page.
            </>
          }
        />

        <Endpoint
          method="GET"
          path="/v1/invoices/:invoice_id"
          description="Retrieve a single invoice by its ID (the invoicenumber returned on creation). Returns the complete invoice object including current status, payment URL, timestamps, and — when disputed — secure chat links for both parties."
          curlExample={`curl ${BASE}/v1/invoices/42-a1b2c3d4e5f6 \\
  -H "Authorization: Bearer sk_live_..."`}
          jsExample={`const res = await fetch('${BASE}/v1/invoices/42-a1b2c3d4e5f6', {
  headers: { Authorization: 'Bearer sk_live_...' }
});
const invoice = await res.json();`}
          pythonExample={`import requests

res = requests.get('${BASE}/v1/invoices/42-a1b2c3d4e5f6',
    headers={'Authorization': 'Bearer sk_live_...'})
invoice = res.json()`}
          responseExample={`{
  "object": "invoice",
  "id": "42-a1b2c3d4e5f6",
  "title": "iPhone 15 Pro",
  "description": "Brand new, sealed box",
  "amount": 850000,
  "currency": "XAF",
  "seller": {
    "name": "Jean Fotso",
    "email": "jean@example.com",
    "phone": "237670000001"
  },
  "buyer_email": "buyer@example.com",
  "buyer_phone": "237670000000",
  "status": "paid",
  "payment_url": "https://fonlok.com/pay/42-a1b2c3d4e5f6",
  "external_reference": "order_789",
  "expires_at": "2026-12-31T00:00:00.000Z",
  "created_at": "2025-01-15T10:30:00.000Z",
  "paid_at": "2025-01-15T10:33:00.000Z",
  "delivered_at": null

  // When status is "disputed", an extra field appears:
  // "chat_links": {
  //   "buyer":  "https://fonlok.com/chat/42-a1b2c3d4e5f6?token=abc123...&role=buyer",
  //   "seller": "https://fonlok.com/chat/42-a1b2c3d4e5f6?token=def456...&role=seller"
  // }
}`}
          notes={
            <>
              <strong>Status values:</strong> <code>pending</code> →{" "}
              <code>paid</code> → <code>completed</code> (or{" "}
              <code>disputed</code>). Also possible: <code>delivered</code>,{" "}
              <code>cancelled</code>, <code>refunded</code>. The{" "}
              <code>payment_url</code> field is always returned regardless of
              status.
            </>
          }
        />

        {/* ── PAYMENTS ──────────────────────────────────────────────────── */}
        <GroupHeader
          title="Payments"
          description="Initiate and settle payments. A confirmed payment puts funds in escrow. Call /v1/payments/release when the buyer is satisfied, or /v1/payments/dispute if there is a problem."
        />

        <Endpoint
          method="POST"
          path="/v1/payments/initiate"
          description="Send a Mobile Money USSD push prompt to the buyer's phone via Campay. The buyer receives a pop-up on their handset and approves or declines the charge. Returns a reference UUID for polling status. Only invoices in 'pending' status can be initiated."
          params={[
            {
              name: "invoice_id",
              type: "string",
              required: true,
              description: "Invoice ID returned when the invoice was created.",
            },
            {
              name: "phone_number",
              type: "string",
              required: true,
              description:
                "Buyer's MTN or Orange MoMo number in international format, e.g. 237670000000. Fonlok auto-detects the network (6xx = MTN, 2xx = Orange).",
            },
            {
              name: "buyer_email",
              type: "string",
              required: false,
              description:
                "Buyer email for confirmation emails. Overrides the buyer_email set on the invoice.",
            },
          ]}
          curlExample={`curl ${BASE}/v1/payments/initiate \\
  -X POST \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "invoice_id": "42-a1b2c3d4e5f6",
    "phone_number": "237670000000",
    "buyer_email": "buyer@example.com"
  }'`}
          jsExample={`const res = await fetch('${BASE}/v1/payments/initiate', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer sk_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    invoice_id: '42-a1b2c3d4e5f6',
    phone_number: '237670000000',
    buyer_email: 'buyer@example.com'
  })
});
const payment = await res.json();`}
          pythonExample={`import requests

res = requests.post('${BASE}/v1/payments/initiate',
    headers={'Authorization': 'Bearer sk_live_...'},
    json={
        'invoice_id': '42-a1b2c3d4e5f6',
        'phone_number': '237670000000',
        'buyer_email': 'buyer@example.com'
    })
payment = res.json()`}
          responseExample={`HTTP 201 Created

{
  "object": "payment",
  "reference": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "invoice_id": "42-a1b2c3d4e5f6",
  "amount": 850000,
  "currency": "XAF",
  "provider": "mtn",
  "phone_number": "237670000000",
  "status": "pending",
  "message": "A mtn Mobile Money prompt has been sent to 237670000000. The buyer must approve it on their phone.",
  "created_at": "2025-01-15T10:31:00.000Z"
}`}
          notes={
            <>
              <strong>Number format:</strong> 12 digits starting with{" "}
              <code>237</code>. MTN numbers start with <code>2376</code>, Orange
              with <code>2372</code>. The <code>reference</code> UUID in the
              response is used for polling status. Prefer webhooks over polling
              in production — the <code>payment.confirmed</code> event fires
              immediately when Campay confirms.
            </>
          }
        />

        <Endpoint
          method="GET"
          path="/v1/payments/:reference/status"
          description="Poll the status of a payment using the reference UUID returned by POST /v1/payments/initiate. Returns the payment status and the associated invoice status."
          curlExample={`curl ${BASE}/v1/payments/a1b2c3d4-e5f6-7890-abcd-ef1234567890/status \\
  -H "Authorization: Bearer sk_live_..."`}
          jsExample={`const res = await fetch('${BASE}/v1/payments/a1b2c3d4-e5f6-7890-abcd-ef1234567890/status', {
  headers: { Authorization: 'Bearer sk_live_...' }
});
const status = await res.json();`}
          pythonExample={`import requests

ref = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
res = requests.get(f'${BASE}/v1/payments/{ref}/status',
    headers={'Authorization': 'Bearer sk_live_...'})
status = res.json()`}
          responseExample={`{
  "object": "payment_status",
  "reference": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "invoice_id": "42-a1b2c3d4e5f6",
  "amount": 850000,
  "currency": "XAF",
  "provider": "mtn",
  "status": "paid",
  "invoice_status": "paid",
  "created_at": "2025-01-15T10:31:00.000Z"
}`}
          notes={
            <>
              <strong>Payment status:</strong> <code>pending</code> (awaiting
              buyer action), <code>paid</code> (confirmed, funds in escrow),{" "}
              <code>failed</code> (declined or timed out).{" "}
              <strong>Invoice status:</strong> mirrors the invoice lifecycle —{" "}
              <code>pending</code>, <code>paid</code>, <code>completed</code>,{" "}
              <code>disputed</code>, <code>cancelled</code>.
            </>
          }
        />

        <Endpoint
          method="POST"
          path="/v1/payments/release"
          description="Release escrowed funds to the seller after the buyer confirms receipt. Fonlok deducts a 3% platform fee and disburses the net amount directly to the seller's MoMo phone. Sends PDF receipt emails to both seller and buyer. Only 'paid' invoices created via the API can be released through this endpoint."
          params={[
            {
              name: "invoice_id",
              type: "string",
              required: true,
              description:
                "Invoice ID to release. Must be in 'paid' status and created via the API.",
            },
          ]}
          curlExample={`curl ${BASE}/v1/payments/release \\
  -X POST \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"invoice_id": "42-a1b2c3d4e5f6"}'`}
          jsExample={`const res = await fetch('${BASE}/v1/payments/release', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer sk_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ invoice_id: '42-a1b2c3d4e5f6' })
});
const release = await res.json();`}
          pythonExample={`import requests

res = requests.post('${BASE}/v1/payments/release',
    headers={'Authorization': 'Bearer sk_live_...'},
    json={'invoice_id': '42-a1b2c3d4e5f6'})
release = res.json()`}
          responseExample={`{
  "object": "release",
  "invoice_id": "42-a1b2c3d4e5f6",
  "status": "completed",
  "gross_amount": 850000,
  "platform_fee": 17000,
  "seller_receives": 833000,
  "currency": "XAF",
  "seller_phone": "237670000001",
  "message": "833,000 XAF dispatched to 237670000001 via Mobile Money.",
  "released_at": "2025-01-15T10:35:00.000Z"
}`}
          notes={
            <>
              <strong>Idempotency:</strong> Concurrent calls for the same
              invoice are safe — only one will succeed. If the Campay payout
              fails, the invoice status is restored to <code>paid</code> so you
              can retry safely. This endpoint fires a{" "}
              <code>payment.released</code> webhook event.
            </>
          }
        />

        <Endpoint
          method="POST"
          path="/v1/payments/dispute"
          description="Flag a paid invoice as disputed when the buyer raises a complaint before funds are released. Fonlok freezes the funds, creates a moderated chat thread, and sends chat links to both parties by email. Returns secure chat links for buyer and seller. Only 'paid' API-created invoices can be disputed."
          params={[
            {
              name: "invoice_id",
              type: "string",
              required: true,
              description: "Invoice ID to dispute. Must be in 'paid' status.",
            },
            {
              name: "reason",
              type: "string",
              required: true,
              description:
                "Concise dispute reason visible to the seller and support team. Max 1,000 characters.",
            },
            {
              name: "context",
              type: "string",
              required: false,
              description:
                "Additional supporting detail for the support team only. Not shown directly to the seller. Max 10,000 characters. Include order history, screenshots descriptions, timestamps, etc.",
            },
          ]}
          curlExample={`curl ${BASE}/v1/payments/dispute \\
  -X POST \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "invoice_id": "42-a1b2c3d4e5f6",
    "reason": "Item was not as described. Phone has a cracked screen.",
    "context": "Buyer reported this on 2025-01-15 at 14:30. Photos: ..."
  }'`}
          jsExample={`const res = await fetch('${BASE}/v1/payments/dispute', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer sk_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    invoice_id: '42-a1b2c3d4e5f6',
    reason: 'Item was not as described. Phone has a cracked screen.',
    context: 'Buyer reported this on 2025-01-15 at 14:30. Photos: ...'
  })
});
const dispute = await res.json();`}
          pythonExample={`import requests

res = requests.post('${BASE}/v1/payments/dispute',
    headers={'Authorization': 'Bearer sk_live_...'},
    json={
        'invoice_id': '42-a1b2c3d4e5f6',
        'reason': 'Item was not as described. Phone has a cracked screen.',
        'context': 'Buyer reported this on 2025-01-15 at 14:30. Photos: ...'
    })
dispute = res.json()`}
          responseExample={`{
  "object": "dispute",
  "invoice_id": "42-a1b2c3d4e5f6",
  "status": "disputed",
  "reason": "Item was not as described. Phone has a cracked screen.",
  "message": "Invoice flagged as disputed. Funds are held. Share the chat links below with each party so they can communicate with Fonlok support.",
  "disputed_at": "2025-01-15T10:40:00.000Z",
  "chat_links": {
    "buyer":  "https://fonlok.com/chat/42-a1b2c3d4e5f6?token=abc123def456...&role=buyer",
    "seller": "https://fonlok.com/chat/42-a1b2c3d4e5f6?token=789ghi012jkl...&role=seller"
  }
}`}
          notes={
            <>
              <strong>Chat links are sensitive.</strong> Each link is
              role-scoped — send the <code>buyer</code> link only to the buyer
              and the <code>seller</code> link only to the seller. You can
              retrieve both links again later via{" "}
              <code>GET /v1/invoices/:invoice_id</code>. Contact{" "}
              <a
                href="mailto:support@fonlok.com"
                style={{ color: "#0F1F3D", fontWeight: 600 }}
              >
                support@fonlok.com
              </a>{" "}
              with the invoice ID to initiate resolution.
            </>
          }
        />

        <Endpoint
          method="POST"
          path="/v1/wallet/pay"
          description="Pay an invoice directly from a pre-funded platform wallet — an alternative to the MoMo USSD push. The buyer's wallet balance is debited atomically and the invoice moves to 'paid' status immediately. The buyer receives a confirmation email with a release link. Use for marketplace users who have deposited funds in advance."
          params={[
            {
              name: "invoice_id",
              type: "string",
              required: true,
              description:
                "Invoice ID to fund. Must be in 'pending' status and created via the API.",
            },
            {
              name: "user_ref",
              type: "string",
              required: true,
              description:
                "Your platform's unique reference for the wallet holder (e.g. your internal user ID). Must match a wallet registered for this API key.",
            },
          ]}
          curlExample={`curl ${BASE}/v1/wallet/pay \\
  -X POST \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "invoice_id": "42-a1b2c3d4e5f6",
    "user_ref": "user_1234"
  }'`}
          jsExample={`const res = await fetch('${BASE}/v1/wallet/pay', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer sk_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    invoice_id: '42-a1b2c3d4e5f6',
    user_ref: 'user_1234'
  })
});
const result = await res.json();`}
          pythonExample={`import requests

res = requests.post('${BASE}/v1/wallet/pay',
    headers={'Authorization': 'Bearer sk_live_...'},
    json={
        'invoice_id': '42-a1b2c3d4e5f6',
        'user_ref': 'user_1234'
    })
result = res.json()`}
          responseExample={`{
  "invoice_id": "42-a1b2c3d4e5f6",
  "invoice_name": "iPhone 15 Pro",
  "amount_paid": 850000,
  "new_balance": 1500000,
  "currency": "XAF",
  "status": "funded",
  "release_code": "XKCD4891",
  "message": "Invoice funded from wallet and held in escrow. Buyer will receive a release link by email."
}`}
          notes={
            <>
              <strong>Insufficient funds:</strong> If the wallet balance is
              below the invoice amount, the request returns{" "}
              <code>409 insufficient_funds</code> with{" "}
              <code>current_balance</code> and <code>invoice_amount</code> in
              the error body. The debit is atomic — no partial charges occur.
            </>
          }
        />

        {/* ── WEBHOOKS ──────────────────────────────────────────────────── */}
        <GroupHeader
          title="Wallet management"
          description="Manage pre-funded platform wallets. Wallets are created automatically on the first deposit. Each wallet is identified by a user_ref — your platform's own user ID or reference string."
        />

        <Endpoint
          method="POST"
          path="/v1/wallet/deposit/initiate"
          description="Send a MoMo USSD push to a user's phone to top up their platform wallet. The user is charged amount + ceil(amount × 1.5%); their wallet is credited with the original amount on confirmation. Poll GET /v1/wallet/deposit/:reference/status to confirm."
          params={[
            {
              name: "amount",
              type: "integer",
              required: true,
              description:
                "Amount to credit to the wallet in XAF. Minimum 100 XAF. The user is charged this amount plus a 1.5% fee.",
            },
            {
              name: "phone",
              type: "string",
              required: true,
              description:
                "User's MTN or Orange MoMo number in international format, e.g. 237670000000.",
            },
            {
              name: "user_ref",
              type: "string",
              required: true,
              description:
                "Your platform's unique reference for this user (e.g. your internal user ID). Creates the wallet on first deposit.",
            },
            {
              name: "description",
              type: "string",
              required: false,
              description:
                "Optional description stored on the transaction record.",
            },
          ]}
          curlExample={`curl ${BASE}/v1/wallet/deposit/initiate \\
  -X POST \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "phone": "237670000000",
    "user_ref": "user_1234"
  }'`}
          jsExample={`const res = await fetch('${BASE}/v1/wallet/deposit/initiate', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer sk_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 10000,
    phone: '237670000000',
    user_ref: 'user_1234'
  })
});
const deposit = await res.json();`}
          pythonExample={`import requests

res = requests.post('${BASE}/v1/wallet/deposit/initiate',
    headers={'Authorization': 'Bearer sk_live_...'},
    json={
        'amount': 10000,
        'phone': '237670000000',
        'user_ref': 'user_1234'
    })
deposit = res.json()`}
          responseExample={`HTTP 202 Accepted

{
  "transaction_id": 88,
  "reference": "campay-ref-abc123",
  "user_ref": "user_1234",
  "amount_requested": 10000,
  "amount_charged": 10150,
  "fee": 150,
  "currency": "XAF",
  "status": "pending",
  "message": "Payment prompt sent to user's phone. Poll GET /v1/wallet/deposit/:reference/status to confirm."
}`}
          notes={
            <>
              The wallet is created automatically if it does not yet exist for
              this <code>user_ref</code>. The <code>reference</code> in the
              response is the Campay transaction reference — use it to poll
              status.
            </>
          }
        />

        <Endpoint
          method="GET"
          path="/v1/wallet/deposit/:reference/status"
          description="Poll Campay for the status of a pending deposit. On the first SUCCESSFUL response the wallet is credited atomically. Safe to call multiple times — idempotent."
          curlExample={`curl ${BASE}/v1/wallet/deposit/campay-ref-abc123/status \\
  -H "Authorization: Bearer sk_live_..."`}
          jsExample={`const res = await fetch('${BASE}/v1/wallet/deposit/campay-ref-abc123/status', {
  headers: { Authorization: 'Bearer sk_live_...' }
});
const status = await res.json();`}
          pythonExample={`import requests

res = requests.get('${BASE}/v1/wallet/deposit/campay-ref-abc123/status',
    headers={'Authorization': 'Bearer sk_live_...'})
status = res.json()`}
          responseExample={`// Completed — wallet credited
{
  "reference": "campay-ref-abc123",
  "status": "completed",
  "amount_credited": 10000,
  "transaction_id": 88,
  "user_ref": "user_1234"
}

// Still pending
{
  "reference": "campay-ref-abc123",
  "status": "pending",
  "transaction_id": 88,
  "user_ref": "user_1234"
}

// Failed / declined
{
  "reference": "campay-ref-abc123",
  "status": "failed",
  "transaction_id": 88,
  "user_ref": "user_1234"
}`}
        />

        <Endpoint
          method="GET"
          path="/v1/wallet/balance"
          description="Return the current wallet balance for a user_ref. Returns 0 if no wallet exists yet."
          curlExample={`curl "${BASE}/v1/wallet/balance?user_ref=user_1234" \\
  -H "Authorization: Bearer sk_live_..."`}
          jsExample={`const res = await fetch('${BASE}/v1/wallet/balance?user_ref=user_1234', {
  headers: { Authorization: 'Bearer sk_live_...' }
});
const { balance } = await res.json();`}
          pythonExample={`import requests

res = requests.get('${BASE}/v1/wallet/balance',
    headers={'Authorization': 'Bearer sk_live_...'},
    params={'user_ref': 'user_1234'})
balance = res.json()['balance']`}
          responseExample={`{
  "user_ref": "user_1234",
  "balance": 10000,
  "currency": "XAF"
}`}
          notes={
            <>
              Pass <code>user_ref</code> as a query parameter. If no wallet
              exists for this <code>user_ref</code>, <code>balance</code>{" "}
              returns <code>0</code> rather than a 404.
            </>
          }
        />

        <Endpoint
          method="POST"
          path="/v1/wallet/withdraw"
          description="Withdraw funds from a user's wallet directly to a MoMo number. Fonlok covers Campay's ~1% disbursement fee — no fee is charged to the user. The debit is atomic; the balance is restored if the Campay disbursement fails."
          params={[
            {
              name: "amount",
              type: "integer",
              required: true,
              description: "Amount to withdraw in XAF. Minimum 100 XAF.",
            },
            {
              name: "phone",
              type: "string",
              required: true,
              description:
                "Destination MoMo number in international format, e.g. 237670000000.",
            },
            {
              name: "user_ref",
              type: "string",
              required: true,
              description:
                "Your platform reference for the wallet holder to debit.",
            },
            {
              name: "description",
              type: "string",
              required: false,
              description:
                "Optional description stored on the transaction record.",
            },
          ]}
          curlExample={`curl ${BASE}/v1/wallet/withdraw \\
  -X POST \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "phone": "237670000000",
    "user_ref": "user_1234"
  }'`}
          jsExample={`const res = await fetch('${BASE}/v1/wallet/withdraw', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer sk_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 5000,
    phone: '237670000000',
    user_ref: 'user_1234'
  })
});
const withdrawal = await res.json();`}
          pythonExample={`import requests

res = requests.post('${BASE}/v1/wallet/withdraw',
    headers={'Authorization': 'Bearer sk_live_...'},
    json={
        'amount': 5000,
        'phone': '237670000000',
        'user_ref': 'user_1234'
    })
withdrawal = res.json()`}
          responseExample={`{
  "transaction_id": 91,
  "reference": "campay-wdr-ref-xyz789",
  "user_ref": "user_1234",
  "amount_withdrawn": 5000,
  "amount_sent_to_campay": 5050,
  "campay_fee_covered": 50,
  "new_balance": 5000,
  "currency": "XAF",
  "status": "success"
}`}
          notes={
            <>
              <strong>Insufficient funds</strong> returns{" "}
              <code>409 insufficient_funds</code> with{" "}
              <code>current_balance</code>. The disbursement is synchronous —
              the MoMo transfer is initiated immediately and the response
              includes the Campay reference.
            </>
          }
        />

        {/* ── WEBHOOKS ──────────────────────────────────────────────────── */}
        <GroupHeader
          title="Webhooks"
          description="Register URLs to receive real-time signed notifications for invoice and payment events. Using webhooks is strongly preferred over polling — they fire as soon as an event occurs."
        />

        <Endpoint
          method="POST"
          path="/v1/webhooks/register"
          description="Register a URL to receive Fonlok webhook event payloads. The response contains a signing secret (whsec_...) shown exactly once — store it immediately. You can register up to 5 active endpoints per API key."
          params={[
            {
              name: "url",
              type: "string",
              required: true,
              description:
                "Your webhook endpoint URL. Must be a valid HTTPS URL. Fonlok POSTs signed JSON to this URL for each event.",
            },
            {
              name: "label",
              type: "string",
              required: false,
              description:
                'A human-readable label for this endpoint, max 80 chars. e.g. "Production webhook".',
            },
          ]}
          curlExample={`curl ${BASE}/v1/webhooks/register \\
  -X POST \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yourapp.com/webhooks/fonlok",
    "label": "Production webhook"
  }'`}
          jsExample={`const res = await fetch('${BASE}/v1/webhooks/register', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer sk_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://yourapp.com/webhooks/fonlok',
    label: 'Production webhook'
  })
});
const webhook = await res.json();
// Store webhook.secret immediately — shown only once`}
          pythonExample={`import requests

res = requests.post('${BASE}/v1/webhooks/register',
    headers={'Authorization': 'Bearer sk_live_...'},
    json={
        'url': 'https://yourapp.com/webhooks/fonlok',
        'label': 'Production webhook'
    })
webhook = res.json()
# Store webhook['secret'] immediately — shown only once`}
          responseExample={`HTTP 201 Created

{
  "object": "webhook",
  "id": 12,
  "url": "https://yourapp.com/webhooks/fonlok",
  "label": "Production webhook",
  "secret": "whsec_a1b2c3d4e5f6789012345678901234567890abcdef0123456789",
  "created_at": "2025-01-15T10:30:00.000Z",
  "_note": "Store the secret securely. It will not be shown again."
}`}
          notes={
            <>
              <strong>The secret is shown once only.</strong> Copy it
              immediately and store it in a secure environment variable (e.g.{" "}
              <code>FONLOK_WEBHOOK_SECRET</code>). If lost, deactivate this
              endpoint and register a new one.
            </>
          }
        />

        <Endpoint
          method="GET"
          path="/v1/webhooks"
          description="List all registered webhook endpoints for your API key, including active status and the last time an event was delivered. Secrets are never returned after initial registration."
          curlExample={`curl ${BASE}/v1/webhooks \\
  -H "Authorization: Bearer sk_live_..."`}
          jsExample={`const res = await fetch('${BASE}/v1/webhooks', {
  headers: { Authorization: 'Bearer sk_live_...' }
});
const { data: webhooks } = await res.json();`}
          pythonExample={`import requests

res = requests.get('${BASE}/v1/webhooks',
    headers={'Authorization': 'Bearer sk_live_...'})
webhooks = res.json()['data']`}
          responseExample={`{
  "object": "list",
  "data": [
    {
      "id": 12,
      "url": "https://yourapp.com/webhooks/fonlok",
      "label": "Production webhook",
      "active": true,
      "created_at": "2025-01-15T10:30:00.000Z",
      "last_triggered_at": "2025-01-15T10:35:00.000Z"
    }
  ]
}`}
        />

        <Endpoint
          method="DELETE"
          path="/v1/webhooks/:id"
          description="Deactivate a registered webhook by its numeric ID. The endpoint is marked inactive and will no longer receive deliveries. The ID is returned from GET /v1/webhooks."
          curlExample={`curl ${BASE}/v1/webhooks/12 \\
  -X DELETE \\
  -H "Authorization: Bearer sk_live_..."`}
          jsExample={`const res = await fetch('${BASE}/v1/webhooks/12', {
  method: 'DELETE',
  headers: { Authorization: 'Bearer sk_live_...' }
});
const result = await res.json();`}
          pythonExample={`import requests

res = requests.delete('${BASE}/v1/webhooks/12',
    headers={'Authorization': 'Bearer sk_live_...'})
result = res.json()`}
          responseExample={`{
  "object": "webhook",
  "id": 12,
  "active": false,
  "deleted": true
}`}
        />

        {/* ── WEBHOOK EVENTS ────────────────────────────────────────────── */}
        <GroupHeader
          title="Webhook events"
          description="Fonlok POSTs a signed JSON payload to your registered endpoint each time one of these events occurs. Always verify the X-Fonlok-Signature header before processing. Events: payment.initiated · payment.confirmed · payment.disputed · payment.dispute_resolved · payment.released · payout.completed"
        />

        {/* Signature verification */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "1.375rem 1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.9375rem",
              color: "#0F1F3D",
              marginBottom: "0.5rem",
            }}
          >
            Verifying webhook signatures
          </p>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#475569",
              lineHeight: 1.75,
              marginBottom: "1.25rem",
            }}
          >
            Every event delivery includes an{" "}
            <code
              style={{
                fontFamily: "monospace",
                background: "#F1F5F9",
                padding: "0.1rem 0.4rem",
                borderRadius: "4px",
                fontSize: "0.875em",
              }}
            >
              X-Fonlok-Signature
            </code>{" "}
            header containing an HMAC-SHA256 hex digest of the raw request body,
            signed with your webhook secret. Verify it before trusting any
            payload.
          </p>
          <CodeBlock label="Node.js — Express example">{`import crypto from "crypto";

function verifyFonlokWebhook(rawBody, signatureHeader, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)           // raw Buffer or string — before JSON.parse
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader, "hex"),
    Buffer.from(expected, "hex")
  );
}

app.post(
  "/webhooks/fonlok",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["x-fonlok-signature"];
    if (!verifyFonlokWebhook(req.body, sig, process.env.FONLOK_WEBHOOK_SECRET)) {
      return res.status(400).send("Invalid signature");
    }
    const event = JSON.parse(req.body.toString());
    switch (event.type) {
      case "payment.confirmed":         /* mark order as paid */        break;
      case "payment.disputed":          /* flag order for review */     break;
      case "payment.dispute_resolved":  /* act on event.decision */     break;
      case "payment.released":          /* notify seller */             break;
      case "payout.completed":          /* alternate release path */    break;
    }
    res.sendStatus(200);
  }
);`}</CodeBlock>
        </div>

        {/* Event cards */}
        {(
          [
            {
              type: "payment.initiated",
              desc: "Fired when POST /v1/payments/initiate succeeds. The MoMo prompt has been sent to the buyer but not yet approved.",
              example: `{
  "object": "event",
  "type": "payment.initiated",
  "invoice_id": "42-a1b2c3d4e5f6",
  "reference": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amount": 850000,
  "currency": "XAF",
  "provider": "mtn",
  "phone_number": "237670000000",
  "status": "pending",
  "timestamp": "2025-01-15T10:31:00.000Z"
}`,
            },
            {
              type: "payment.confirmed",
              desc: "Fired when the buyer approves the MoMo prompt and Campay confirms the charge. Funds are now held in escrow and the invoice status is 'paid'.",
              example: `{
  "object": "event",
  "type": "payment.confirmed",
  "invoice_id": "42-a1b2c3d4e5f6",
  "reference": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amount": 850000,
  "currency": "XAF",
  "provider": "mtn",
  "timestamp": "2025-01-15T10:33:00.000Z"
}`,
            },
            {
              type: "payment.disputed",
              desc: "Fired when POST /v1/payments/dispute is called. Funds are frozen pending resolution. Includes chat_links for buyer and seller, and the optional context field if one was supplied.",
              example: `{
  "object": "event",
  "type": "payment.disputed",
  "invoice_id": "42-a1b2c3d4e5f6",
  "amount": 850000,
  "currency": "XAF",
  "reason": "Item was not as described.",
  "context": "Buyer contacted seller on 2025-01-14...",  // present only if supplied
  "timestamp": "2025-01-15T10:40:00.000Z",
  "chat_links": {
    "buyer":  "https://fonlok.com/chat/42-a1b2c3d4e5f6?token=abc123...&role=buyer",
    "seller": "https://fonlok.com/chat/42-a1b2c3d4e5f6?token=def456...&role=seller"
  }
}`,
            },
            {
              type: "payment.dispute_resolved",
              desc: 'Fired by the Fonlok admin when a dispute is closed. The decision field is either "seller" (funds released to seller) or "buyer" (buyer refunded). Only fired for API-created invoices.',
              example: `// Decision: seller wins — funds disbursed to seller
{
  "object": "event",
  "type": "payment.dispute_resolved",
  "invoice_id": "42-a1b2c3d4e5f6",
  "decision": "seller",
  "amount": 850000,
  "amount_disbursed": 833000,
  "currency": "XAF",
  "status": "completed",
  "timestamp": "2025-01-17T09:00:00.000Z"
}

// Decision: buyer wins — refund sent to buyer
{
  "object": "event",
  "type": "payment.dispute_resolved",
  "invoice_id": "42-a1b2c3d4e5f6",
  "decision": "buyer",
  "amount": 850000,
  "amount_disbursed": 833000,
  "currency": "XAF",
  "status": "refunded",
  "timestamp": "2025-01-17T09:00:00.000Z"
}`,
            },
            {
              type: "payment.released",
              desc: "Fired when POST /v1/payments/release succeeds. The invoice is now 'completed' and the seller has received their MoMo payout.",
              example: `{
  "object": "event",
  "type": "payment.released",
  "invoice_id": "42-a1b2c3d4e5f6",
  "invoice_name": "iPhone 15 Pro",
  "buyer_email": "buyer@example.com",
  "seller_phone": "237670000001",
  "seller_email": "jean@example.com",
  "gross_amount": 850000,
  "platform_fee": 17000,
  "seller_receives": 833000,
  "currency": "XAF",
  "timestamp": "2025-01-15T10:35:00.000Z"
}`,
            },
            {
              type: "payout.completed",
              desc: "Fired when the buyer releases funds via the confirmation email link (the non-API release flow). Equivalent to payment.released but triggered by the buyer's manual confirmation rather than a direct API call.",
              example: `{
  "object": "event",
  "type": "payout.completed",
  "invoice_id": "42-a1b2c3d4e5f6",
  "invoice_name": "iPhone 15 Pro",
  "buyer_email": "buyer@example.com",
  "seller_phone": "237670000001",
  "seller_email": "jean@example.com",
  "gross_amount": 850000,
  "platform_fee": 17000,
  "seller_receives": 833000,
  "currency": "XAF",
  "released_at": "2025-01-15T10:35:00.000Z"
}`,
            },
          ] as { type: string; desc: string; example: string }[]
        ).map(({ type, desc, example }) => (
          <div
            key={type}
            style={{
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "1.25rem",
            }}
          >
            <div
              style={{
                padding: "0.875rem 1.5rem",
                borderBottom: "1px solid #E2E8F0",
                background: "#FAFBFC",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <span
                style={{
                  background: LIVE_BG,
                  border: `1px solid ${LIVE_BORDER}`,
                  color: LIVE_GREEN,
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  padding: "0.2rem 0.625rem",
                  borderRadius: "5px",
                }}
              >
                {type}
              </span>
            </div>
            <div style={{ padding: "1.125rem 1.5rem" }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#475569",
                  lineHeight: 1.75,
                  marginBottom: "1rem",
                }}
              >
                {desc}
              </p>
              <CodeBlock label="Payload">{example}</CodeBlock>
            </div>
          </div>
        ))}

        {/* ── Error responses ────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: "3rem",
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <p
            style={{
              fontWeight: 800,
              fontSize: "1rem",
              color: "#0F1F3D",
              marginBottom: "0.625rem",
              letterSpacing: "-0.01em",
            }}
          >
            Error responses
          </p>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#475569",
              lineHeight: 1.75,
              marginBottom: "1.25rem",
            }}
          >
            All errors use a consistent shape. The{" "}
            <code
              style={{
                fontFamily: "monospace",
                background: "#F1F5F9",
                padding: "0.1rem 0.35rem",
                borderRadius: "4px",
                fontSize: "0.875em",
              }}
            >
              error
            </code>{" "}
            field is machine-readable;{" "}
            <code
              style={{
                fontFamily: "monospace",
                background: "#F1F5F9",
                padding: "0.1rem 0.35rem",
                borderRadius: "4px",
                fontSize: "0.875em",
              }}
            >
              message
            </code>{" "}
            is human-readable. Error handling you write against the sandbox
            works identically in production.
          </p>
          <CodeBlock label="JSON">{`// 400  Validation failed
{ "error": "validation_error",        "message": "amount must be at least 500 XAF." }

// 401  Missing or invalid API key
{ "error": "unauthorized",            "message": "Invalid or missing API key." }

// 404  Resource not found
{ "error": "not_found",               "message": "No invoice found with id '42-xyz' on your account." }

// 409  Wrong status for the operation
{ "error": "invalid_invoice_status",  "message": "Cannot release an invoice with status 'pending'. Only 'paid' invoices can be released." }

// 409  Duplicate external reference
{ "error": "duplicate_reference",     "message": "An invoice with reference 'order_789' already exists." }

// 409  Insufficient wallet balance
{ "error": "insufficient_funds",      "message": "Wallet balance (200000 XAF) is less than invoice amount (850000 XAF).",
  "current_balance": 200000, "invoice_amount": 850000 }

// 429  Rate limited
{ "error": "rate_limit_exceeded",     "message": "Too many requests. Please slow down." }

// 500  Unexpected server error
{ "error": "server_error",            "message": "An unexpected error occurred. Please try again." }`}</CodeBlock>
        </div>
      </div>
    </section>
  );
}
