/**
 * /api-reference — Fonlok Production API Reference
 *
 * World-class, comprehensive documentation for the Fonlok Escrow REST API.
 * Covers every endpoint, all request/response schemas, webhook events,
 * signature verification, and error codes.
 */

import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "API Reference — Fonlok Escrow API",
  description:
    "Complete reference for the Fonlok Escrow REST API. Create invoices, collect Mobile Money payments, release funds, handle disputes, and receive real-time webhook events.",
  keywords: [
    "Fonlok API reference",
    "escrow API Cameroon",
    "MoMo payment API",
    "MTN MoMo API Cameroon",
    "Orange Money API Cameroon",
    "marketplace escrow API",
    "webhook payment events",
  ],
  openGraph: {
    title: "Fonlok API Reference",
    description:
      "Full REST API reference for the Fonlok escrow payment gateway. Invoices, payments, fund release, disputes, and webhooks.",
    url: "https://fonlok.com/api-reference",
    siteName: "Fonlok",
    type: "website",
  },
  alternates: { canonical: "https://fonlok.com/api-reference" },
};

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  navy: "#0F1F3D",
  navyLight: "#1a3160",
  amber: "#F59E0B",
  amberDark: "#D97706",
  surface: "#ffffff",
  bg: "#f8fafc",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  code: "#1e293b",
  codeBg: "#0f172a",
  green: "#16a34a",
  red: "#dc2626",
  blue: "#2563eb",
};

const METHOD: Record<string, { bg: string; color: string }> = {
  GET:    { bg: "rgba(22,163,74,0.12)",  color: "#166534" },
  POST:   { bg: "rgba(37,99,235,0.1)",   color: "#1d4ed8" },
  DELETE: { bg: "rgba(220,38,38,0.08)",  color: "#991b1b" },
};

// ── Static content ────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { id: "introduction",  label: "Introduction" },
  { id: "authentication", label: "Authentication" },
  { id: "rate-limits",   label: "Rate limits" },
  { id: "errors",        label: "Errors" },
  {
    id: "invoices", label: "Invoices",
    children: [
      { id: "create-invoice", label: "Create invoice" },
      { id: "get-invoice",    label: "Retrieve invoice" },
    ],
  },
  {
    id: "payments", label: "Payments",
    children: [
      { id: "initiate-payment", label: "Initiate payment" },
      { id: "payment-status",   label: "Payment status" },
      { id: "release-funds",    label: "Release funds" },
      { id: "open-dispute",     label: "Open dispute" },
    ],
  },
  {
    id: "webhooks", label: "Webhooks",
    children: [
      { id: "register-webhook",  label: "Register webhook" },
      { id: "list-webhooks",     label: "List webhooks" },
      { id: "delete-webhook",    label: "Delete webhook" },
      { id: "webhook-events",    label: "Events reference" },
      { id: "verify-signatures", label: "Verify signatures" },
    ],
  },
  { id: "phone-numbers", label: "Phone numbers" },
];

const ERROR_CODES = [
  { code: "missing_api_key",        status: 401, description: "No Authorization header was provided." },
  { code: "invalid_api_key_format", status: 401, description: "The key is not in the expected sk_live_<32hex> format." },
  { code: "invalid_api_key",        status: 401, description: "The key does not match any record on file." },
  { code: "revoked_api_key",        status: 401, description: "The key has been revoked and can no longer be used." },
  { code: "pending_approval",       status: 403, description: "The key exists but has not yet been approved by Fonlok." },
  { code: "validation_error",       status: 422, description: "One or more request fields failed validation. Inspect the errors array." },
  { code: "not_found",              status: 404, description: "The requested resource does not exist on your account." },
  { code: "duplicate_reference",    status: 409, description: "An invoice with the provided external reference already exists." },
  { code: "invalid_invoice_status", status: 409, description: "The operation is not allowed in the invoice's current status." },
  { code: "invoice_not_found",      status: 404, description: "No API-created invoice matched the given id." },
  { code: "payment_gateway_error",  status: 502, description: "Campay is temporarily unreachable. Safe to retry." },
  { code: "webhook_limit_reached",  status: 429, description: "You have reached the 5-webhook limit. Remove one first." },
  { code: "key_limit_reached",      status: 429, description: "You have 5 active live keys. Revoke one to create another." },
  { code: "unsafe_url",             status: 400, description: "The webhook URL resolves to a private or loopback IP." },
  { code: "server_error",           status: 500, description: "An unexpected server error. Contact support if it persists." },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Code({ children, lang = "" }: { children: string; lang?: string }) {
  void lang;
  return (
    <pre
      style={{
        background: C.codeBg,
        color: "#e2e8f0",
        borderRadius: "10px",
        padding: "1.25rem 1.5rem",
        fontSize: "0.82rem",
        lineHeight: 1.75,
        overflowX: "auto",
        margin: "0.75rem 0 1.25rem",
        fontFamily: '"Fira Code", "Cascadia Code", Menlo, Monaco, monospace',
        whiteSpace: "pre",
        border: `1px solid rgba(255,255,255,0.06)`,
      }}
    >
      {children}
    </pre>
  );
}

function Badge({
  method,
  path,
}: {
  method: "GET" | "POST" | "DELETE";
  path: string;
}) {
  const style = METHOD[method];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        margin: "1.5rem 0 0.75rem",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          background: style.bg,
          color: style.color,
          fontWeight: 800,
          fontSize: "0.72rem",
          letterSpacing: "0.06em",
          padding: "0.22rem 0.6rem",
          borderRadius: "5px",
          fontFamily: "monospace",
          flexShrink: 0,
        }}
      >
        {method}
      </span>
      <code
        style={{
          fontFamily: "monospace",
          fontSize: "0.875rem",
          color: C.text,
          fontWeight: 600,
        }}
      >
        {path}
      </code>
    </div>
  );
}

function ParamTable({
  params,
}: {
  params: {
    name: string;
    type: string;
    required?: boolean;
    description: string;
  }[];
}) {
  return (
    <div
      style={{
        overflowX: "auto",
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        marginBottom: "1.5rem",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.84rem",
        }}
      >
        <thead>
          <tr style={{ background: C.bg }}>
            {["Parameter", "Type", "Required", "Description"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "0.625rem 1rem",
                  textAlign: "left",
                  fontWeight: 700,
                  color: C.muted,
                  fontSize: "0.75rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  borderBottom: `1px solid ${C.border}`,
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr
              key={p.name}
              style={{
                borderBottom:
                  i < params.length - 1 ? `1px solid ${C.border}` : "none",
              }}
            >
              <td
                style={{
                  padding: "0.75rem 1rem",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  color: C.navy,
                  whiteSpace: "nowrap",
                }}
              >
                {p.name}
              </td>
              <td
                style={{
                  padding: "0.75rem 1rem",
                  color: C.muted,
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  whiteSpace: "nowrap",
                }}
              >
                {p.type}
              </td>
              <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>
                {p.required ? (
                  <span
                    style={{
                      color: C.red,
                      fontWeight: 700,
                      fontSize: "0.75rem",
                    }}
                  >
                    Required
                  </span>
                ) : (
                  <span style={{ color: C.muted, fontSize: "0.75rem" }}>
                    Optional
                  </span>
                )}
              </td>
              <td
                style={{
                  padding: "0.75rem 1rem",
                  color: C.text,
                  lineHeight: 1.6,
                }}
              >
                {p.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionTitle({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      style={{
        fontSize: "1.375rem",
        fontWeight: 800,
        color: C.navy,
        marginTop: "3rem",
        marginBottom: "0.5rem",
        paddingTop: "1rem",
        scrollMarginTop: "1.5rem",
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </h2>
  );
}

function SubTitle({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h3
      id={id}
      style={{
        fontSize: "1.1rem",
        fontWeight: 700,
        color: C.navy,
        marginTop: "2.5rem",
        marginBottom: "0.25rem",
        scrollMarginTop: "1.5rem",
      }}
    >
      {children}
    </h3>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        color: C.muted,
        lineHeight: 1.75,
        fontSize: "0.9375rem",
        marginBottom: "1rem",
        marginTop: "0.25rem",
      }}
    >
      {children}
    </p>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(245,158,11,0.08)",
        border: `1px solid rgba(245,158,11,0.3)`,
        borderLeft: `3px solid ${C.amber}`,
        borderRadius: "6px",
        padding: "0.75rem 1rem",
        fontSize: "0.85rem",
        color: "#78350f",
        lineHeight: 1.65,
        marginBottom: "1.25rem",
      }}
    >
      {children}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(22,163,74,0.06)",
        border: `1px solid rgba(22,163,74,0.22)`,
        borderLeft: `3px solid ${C.green}`,
        borderRadius: "6px",
        padding: "0.75rem 1rem",
        fontSize: "0.85rem",
        color: "#14532d",
        lineHeight: 1.65,
        marginBottom: "1.25rem",
      }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: `1px solid ${C.border}`,
        margin: "2.5rem 0",
      }}
    />
  );
}

function InlineCode({ children }: { children: string }) {
  return (
    <code
      style={{
        background: "#f1f5f9",
        color: C.navy,
        padding: "0.1rem 0.35rem",
        borderRadius: "4px",
        fontFamily: "monospace",
        fontSize: "0.85em",
        fontWeight: 600,
      }}
    >
      {children}
    </code>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ApiReferencePage() {
  return (
    <>
      <SiteHeader />

      <style>{`
        .api-ref-layout {
          display: flex;
          min-height: calc(100vh - 64px);
          align-items: flex-start;
        }
        .api-ref-sidebar {
          width: 240px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          border-right: 1px solid ${C.border};
          padding: 2rem 0 4rem;
          background: ${C.bg};
        }
        .api-ref-main {
          flex: 1;
          min-width: 0;
          padding: 2rem 2.5rem 6rem;
          max-width: 860px;
        }
        .api-ref-nav-link {
          display: block;
          padding: 0.3rem 1.5rem;
          font-size: 0.84rem;
          color: ${C.muted};
          text-decoration: none;
          transition: color 0.15s;
          font-weight: 500;
        }
        .api-ref-nav-link:hover { color: ${C.navy}; }
        .api-ref-nav-section {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${C.muted};
          padding: 1.25rem 1.5rem 0.25rem;
        }
        .api-ref-nav-child {
          display: block;
          padding: 0.22rem 1.5rem 0.22rem 2.25rem;
          font-size: 0.81rem;
          color: ${C.muted};
          text-decoration: none;
          transition: color 0.15s;
        }
        .api-ref-nav-child:hover { color: ${C.navy}; }
        @media (max-width: 768px) {
          .api-ref-layout { flex-direction: column; }
          .api-ref-sidebar {
            width: 100%;
            height: auto;
            position: static;
            border-right: none;
            border-bottom: 1px solid ${C.border};
            padding: 1rem 0;
            display: flex;
            flex-wrap: wrap;
            gap: 0;
            overflow-x: auto;
          }
          .api-ref-nav-section { display: none; }
          .api-ref-nav-link, .api-ref-nav-child {
            padding: 0.4rem 0.875rem;
            white-space: nowrap;
          }
          .api-ref-main {
            padding: 1.5rem 1rem 4rem;
          }
        }
      `}</style>

      <div className="api-ref-layout">
        {/* ── Left navigation ────────────────────────────────────────────── */}
        <aside className="api-ref-sidebar">
          <div
            style={{
              padding: "0 1.5rem 1rem",
              fontWeight: 800,
              fontSize: "0.875rem",
              color: C.navy,
            }}
          >
            API Reference
          </div>
          {NAV_SECTIONS.map((s) => (
            <div key={s.id}>
              {"children" in s ? (
                <>
                  <div className="api-ref-nav-section">{s.label}</div>
                  <a href={`#${s.id}`} className="api-ref-nav-link">
                    Overview
                  </a>
                  {s.children!.map((c) => (
                    <a key={c.id} href={`#${c.id}`} className="api-ref-nav-child">
                      {c.label}
                    </a>
                  ))}
                </>
              ) : (
                <a href={`#${s.id}`} className="api-ref-nav-link">
                  {s.label}
                </a>
              )}
            </div>
          ))}
        </aside>

        {/* ── Main content ───────────────────────────────────────────────── */}
        <main className="api-ref-main">

          {/* ─── Introduction ──────────────────────────────────────────── */}
          <div style={{ marginBottom: "0.5rem" }}>
            <span
              style={{
                background: "rgba(245,158,11,0.12)",
                color: "#92400e",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "0.2rem 0.6rem",
                borderRadius: "4px",
              }}
            >
              v1 — Production
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
              fontWeight: 800,
              color: C.navy,
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Fonlok API Reference
          </h1>
          <p
            style={{
              fontSize: "1rem",
              color: C.muted,
              lineHeight: 1.75,
              maxWidth: "620px",
              marginBottom: "1.5rem",
            }}
          >
            The Fonlok API lets you embed escrow-protected payments into any
            marketplace or platform. Collect Mobile Money from buyers in
            Cameroon, hold funds securely, then disburse directly to sellers.
            No Fonlok account required on either side.
          </p>

          <div
            style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              padding: "1rem 1.25rem",
              display: "flex",
              gap: "2rem",
              flexWrap: "wrap",
              marginBottom: "2rem",
              fontSize: "0.84rem",
            }}
          >
            <div>
              <div style={{ color: C.muted, fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "4px" }}>
                Base URL
              </div>
              <code style={{ fontFamily: "monospace", color: C.navy, fontWeight: 700 }}>
                https://api.fonlok.com
              </code>
            </div>
            <div>
              <div style={{ color: C.muted, fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "4px" }}>
                Version
              </div>
              <code style={{ fontFamily: "monospace", color: C.navy }}>v1</code>
            </div>
            <div>
              <div style={{ color: C.muted, fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "4px" }}>
                Protocol
              </div>
              <code style={{ fontFamily: "monospace", color: C.navy }}>HTTPS only</code>
            </div>
            <div>
              <div style={{ color: C.muted, fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "4px" }}>
                Currency
              </div>
              <code style={{ fontFamily: "monospace", color: C.navy }}>XAF</code>
            </div>
          </div>

          <SectionTitle id="introduction">Introduction</SectionTitle>
          <Lead>
            All API requests use JSON over HTTPS. Every response is a JSON object
            with an <InlineCode>object</InlineCode> field describing the resource
            type. Errors always include an <InlineCode>error</InlineCode> code
            string and a human-readable <InlineCode>message</InlineCode>.
          </Lead>

          <p style={{ color: C.muted, fontSize: "0.9rem", lineHeight: 1.75, marginBottom: "1rem" }}>
            A typical integration follows this sequence:
          </p>

          {[
            ["1", "Create invoice", "POST /v1/invoices — register a transaction with seller and buyer details."],
            ["2", "Initiate payment", "POST /v1/payments/initiate — send a MoMo prompt to the buyer's phone."],
            ["3", "Wait for confirmation", "Listen for the payment.confirmed webhook event, or poll GET /v1/payments/:ref/status."],
            ["4", "Release funds", "POST /v1/payments/release — Fonlok disburses net amount directly to the seller's MoMo."],
          ].map(([n, title, desc]) => (
            <div
              key={n}
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "0.75rem",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  background: C.navy,
                  color: "#fff",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  marginTop: "2px",
                }}
              >
                {n}
              </span>
              <div>
                <strong style={{ color: C.text, fontSize: "0.875rem" }}>{title}</strong>{" "}
                <span style={{ color: C.muted, fontSize: "0.85rem" }}>{desc}</span>
              </div>
            </div>
          ))}

          <Divider />

          {/* ─── Authentication ───────────────────────────────────────── */}
          <SectionTitle id="authentication">Authentication</SectionTitle>
          <Lead>
            All production API requests must include your live API key as a
            Bearer token in the <InlineCode>Authorization</InlineCode> header.
          </Lead>

          <Code>{`Authorization: Bearer sk_live_a1b2c3d4e5f6...`}</Code>

          <p style={{ color: C.muted, fontSize: "0.9rem", lineHeight: 1.75, marginBottom: "1rem" }}>
            Live keys follow the format{" "}
            <InlineCode>sk_live_</InlineCode> + 32 lowercase hex characters (40
            characters total). Keys are managed in your{" "}
            <a href="/developers" style={{ color: C.blue }}>
              Developer dashboard
            </a>
            .
          </p>

          <Note>
            <strong>Approval required.</strong> New live keys start with status{" "}
            <em>pending</em>. Any request made with a pending key returns{" "}
            <InlineCode>403 pending_approval</InlineCode>. You will be notified
            by email once a Fonlok team member activates your key.
          </Note>

          <p style={{ color: C.muted, fontSize: "0.9rem", lineHeight: 1.75, marginBottom: "1rem" }}>
            To test your integration without real money, use the{" "}
            <a href="/developers" style={{ color: C.blue }}>
              sandbox environment
            </a>{" "}
            with an <InlineCode>sk_test_*</InlineCode> key at{" "}
            <InlineCode>https://api.fonlok.com/sandbox</InlineCode>.
          </p>

          <Code>{`# Verify your key is active
curl https://api.fonlok.com/v1/ping \\
  -H "Authorization: Bearer sk_live_your_key_here"

# Response
{
  "object": "api_status",
  "status": "ok",
  "environment": "production",
  "key_label": "My production key",
  "message": "Fonlok live API is operational.",
  "timestamp": "2026-07-17T10:00:00.000Z"
}`}</Code>

          <Divider />

          {/* ─── Rate limits ──────────────────────────────────────────── */}
          <SectionTitle id="rate-limits">Rate limits</SectionTitle>
          <Lead>
            The production API allows{" "}
            <strong>30 requests per minute</strong> per API key. Exceeding this
            limit returns HTTP <InlineCode>429 Too Many Requests</InlineCode>.
            The sandbox has a separate limit.
          </Lead>

          <Code>{`# 429 response
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please slow down."
}`}</Code>

          <Divider />

          {/* ─── Errors ───────────────────────────────────────────────── */}
          <SectionTitle id="errors">Errors</SectionTitle>
          <Lead>
            All error responses share the same structure. Inspect the{" "}
            <InlineCode>error</InlineCode> field in your code — the{" "}
            <InlineCode>message</InlineCode> is for humans only and may change.
          </Lead>

          <Code>{`# Error response shape
{
  "error": "invalid_invoice_status",
  "message": "Cannot release an invoice with status 'pending'. Only 'paid' invoices can be released.",

  // Validation errors include a detailed array:
  "errors": [
    { "field": "seller_phone", "message": "seller_phone must be a valid Cameroonian MoMo number." }
  ]
}`}</Code>

          <div
            style={{
              overflowX: "auto",
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              marginBottom: "1.5rem",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Error code", "HTTP status", "Meaning"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "0.6rem 1rem",
                        textAlign: "left",
                        fontWeight: 700,
                        color: C.muted,
                        fontSize: "0.72rem",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        borderBottom: `1px solid ${C.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ERROR_CODES.map((e, i) => (
                  <tr
                    key={e.code}
                    style={{
                      borderBottom:
                        i < ERROR_CODES.length - 1 ? `1px solid ${C.border}` : "none",
                    }}
                  >
                    <td style={{ padding: "0.65rem 1rem", fontFamily: "monospace", fontWeight: 600, color: C.navy, whiteSpace: "nowrap" }}>
                      {e.code}
                    </td>
                    <td style={{ padding: "0.65rem 1rem", fontFamily: "monospace", color: e.status >= 500 ? C.red : e.status >= 400 ? "#b45309" : C.green, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {e.status}
                    </td>
                    <td style={{ padding: "0.65rem 1rem", color: C.muted, lineHeight: 1.55 }}>
                      {e.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Divider />

          {/* ─── Invoices ─────────────────────────────────────────────── */}
          <SectionTitle id="invoices">Invoices</SectionTitle>
          <Lead>
            An invoice represents a transaction between a seller and a buyer on
            your platform. Funds move through four status transitions:{" "}
            <InlineCode>pending</InlineCode> →{" "}
            <InlineCode>paid</InlineCode> →{" "}
            <InlineCode>completed</InlineCode> (or{" "}
            <InlineCode>disputed</InlineCode> if a problem arises).
          </Lead>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "1.5rem",
              alignItems: "center",
              fontSize: "0.83rem",
            }}
          >
            {[
              { label: "pending",   color: "#92400e", bg: "rgba(245,158,11,0.1)" },
              { label: "paid",      color: "#1d4ed8", bg: "rgba(37,99,235,0.1)" },
              { label: "completed", color: "#166534", bg: "rgba(22,163,74,0.1)" },
              { label: "disputed",  color: "#991b1b", bg: "rgba(220,38,38,0.08)" },
              { label: "cancelled", color: C.muted,   bg: C.bg },
            ].map(({ label, color, bg }) => (
              <span
                key={label}
                style={{
                  background: bg,
                  color,
                  border: `1px solid currentColor`,
                  opacity: 0.9,
                  borderRadius: "999px",
                  padding: "0.18rem 0.6rem",
                  fontWeight: 700,
                  fontFamily: "monospace",
                  fontSize: "0.78rem",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* POST /v1/invoices */}
          <SubTitle id="create-invoice">Create invoice</SubTitle>
          <Lead>
            Creates an escrow invoice. The seller and buyer do not need Fonlok
            accounts — pass their contact details directly. Fonlok holds funds
            until you call <InlineCode>/v1/payments/release</InlineCode>.
          </Lead>
          <Badge method="POST" path="/v1/invoices" />

          <ParamTable
            params={[
              { name: "title",        type: "string",  required: true,  description: "Name of the item or service being sold. Max 200 characters." },
              { name: "amount",       type: "number",  required: true,  description: "Amount in XAF. Minimum 500." },
              { name: "currency",     type: "string",  required: false, description: 'Currency code. Only "XAF" is supported. Defaults to "XAF".' },
              { name: "seller_name",  type: "string",  required: true,  description: "Full name of the seller. Max 200 characters." },
              { name: "seller_email", type: "string",  required: true,  description: "Seller's email address. Receives payment confirmation." },
              { name: "seller_phone", type: "string",  required: true,  description: "Seller's MoMo number in format 237XXXXXXXXX. Payout is sent here." },
              { name: "buyer_email",  type: "string",  required: false, description: "Buyer's email address. Receives payment receipt." },
              { name: "buyer_phone",  type: "string",  required: false, description: "Buyer's MoMo number (237XXXXXXXXX). Used for payment if not passed in initiate." },
              { name: "description",  type: "string",  required: false, description: "Extended description of the item or service. Max 2000 characters." },
              { name: "reference",    type: "string",  required: false, description: "Your own order or transaction ID. Must be unique per account. Max 200 characters." },
              { name: "expires_at",   type: "ISO 8601 date", required: false, description: "Date after which the invoice can no longer be paid." },
            ]}
          />

          <Code>{`curl -X POST https://api.fonlok.com/v1/invoices \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "title":        "Handmade leather bag",
    "amount":       35000,
    "seller_name":  "Amara Nkeng",
    "seller_email": "amara@example.com",
    "seller_phone": "237670123456",
    "buyer_email":  "buyer@example.com",
    "reference":    "order_8821"
  }'

# Response — 201 Created
{
  "object":             "invoice",
  "id":                 "12-a1b2c3d4e5f6",
  "title":              "Handmade leather bag",
  "description":        null,
  "amount":             35000,
  "currency":           "XAF",
  "seller": {
    "name":  "Amara Nkeng",
    "email": "amara@example.com",
    "phone": "237670123456"
  },
  "buyer_email":        "buyer@example.com",
  "buyer_phone":        null,
  "status":             "pending",
  "payment_url":        "https://fonlok.com/pay/12-a1b2c3d4e5f6",
  "external_reference": "order_8821",
  "expires_at":         null,
  "created_at":         "2026-07-17T10:00:00.000Z"
}`}</Code>

          <Tip>
            Store the returned <InlineCode>id</InlineCode> — you will pass it to
            every subsequent payment and release call.
          </Tip>

          {/* GET /v1/invoices/:id */}
          <SubTitle id="get-invoice">Retrieve invoice</SubTitle>
          <Lead>Fetch the current state of an invoice by its ID.</Lead>
          <Badge method="GET" path="/v1/invoices/:invoice_id" />

          <Code>{`curl https://api.fonlok.com/v1/invoices/12-a1b2c3d4e5f6 \\
  -H "Authorization: Bearer sk_live_..."

# Response
{
  "object":             "invoice",
  "id":                 "12-a1b2c3d4e5f6",
  "title":              "Handmade leather bag",
  "description":        null,
  "amount":             35000,
  "currency":           "XAF",
  "seller": {
    "name":  "Amara Nkeng",
    "email": "amara@example.com",
    "phone": "237670123456"
  },
  "buyer_email":        "buyer@example.com",
  "buyer_phone":        null,
  "status":             "paid",
  "payment_url":        "https://fonlok.com/pay/12-a1b2c3d4e5f6",
  "external_reference": "order_8821",
  "expires_at":         null,
  "created_at":         "2026-07-17T10:00:00.000Z",
  "paid_at":            "2026-07-17T10:05:23.000Z",
  "delivered_at":       null
}`}</Code>

          <Divider />

          {/* ─── Payments ─────────────────────────────────────────────── */}
          <SectionTitle id="payments">Payments</SectionTitle>
          <Lead>
            Payment endpoints control the full lifecycle of a transaction: from
            sending the MoMo prompt to the buyer, through polling status, to
            releasing or disputing funds.
          </Lead>

          {/* POST /v1/payments/initiate */}
          <SubTitle id="initiate-payment">Initiate payment</SubTitle>
          <Lead>
            Sends a real Mobile Money payment prompt to the buyer&apos;s phone
            via Campay. The buyer must approve it on their phone. Once approved,
            the invoice status transitions to <InlineCode>paid</InlineCode> and
            a <InlineCode>payment.confirmed</InlineCode> webhook fires.
          </Lead>
          <Badge method="POST" path="/v1/payments/initiate" />

          <ParamTable
            params={[
              { name: "invoice_id",   type: "string", required: true,  description: "The id returned by POST /v1/invoices." },
              { name: "phone_number", type: "string", required: true,  description: "Buyer's MoMo number (237XXXXXXXXX). Accepts MTN and Orange Money numbers." },
              { name: "buyer_email",  type: "string", required: false, description: "Buyer's email for receipt confirmation. Overrides the invoice's buyer_email." },
            ]}
          />

          <Code>{`curl -X POST https://api.fonlok.com/v1/payments/initiate \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "invoice_id":   "12-a1b2c3d4e5f6",
    "phone_number": "237670123456"
  }'

# Response — 201 Created
{
  "object":       "payment",
  "reference":    "550e8400-e29b-41d4-a716-446655440000",
  "invoice_id":   "12-a1b2c3d4e5f6",
  "amount":       35000,
  "currency":     "XAF",
  "provider":     "MTN",
  "phone_number": "237670123456",
  "status":       "pending",
  "message":      "An MTN Mobile Money prompt has been sent to 237670123456. The buyer must approve it on their phone.",
  "created_at":   "2026-07-17T10:04:00.000Z"
}`}</Code>

          <Note>
            Save the <InlineCode>reference</InlineCode> UUID. You will use it to
            poll the payment status and it appears in the{" "}
            <InlineCode>payment.confirmed</InlineCode> webhook event.
          </Note>

          {/* GET /v1/payments/:reference/status */}
          <SubTitle id="payment-status">Payment status</SubTitle>
          <Lead>
            Poll the status of a payment by its reference. The status field
            reflects the payment&apos;s state: <InlineCode>pending</InlineCode>{" "}
            (awaiting buyer approval), <InlineCode>paid</InlineCode> (buyer
            approved), or <InlineCode>failed</InlineCode> (declined or timed out).
          </Lead>
          <Badge method="GET" path="/v1/payments/:reference/status" />

          <Code>{`curl https://api.fonlok.com/v1/payments/550e8400-e29b-41d4-a716-446655440000/status \\
  -H "Authorization: Bearer sk_live_..."

# Response
{
  "object":         "payment_status",
  "reference":      "550e8400-e29b-41d4-a716-446655440000",
  "invoice_id":     "12-a1b2c3d4e5f6",
  "amount":         35000,
  "currency":       "XAF",
  "provider":       "MTN",
  "status":         "paid",
  "invoice_status": "paid",
  "created_at":     "2026-07-17T10:04:00.000Z"
}`}</Code>

          <Tip>
            Rather than polling, register a webhook endpoint and listen for the{" "}
            <InlineCode>payment.confirmed</InlineCode> event. Webhooks are
            faster and reduce unnecessary API calls.
          </Tip>

          {/* POST /v1/payments/release */}
          <SubTitle id="release-funds">Release funds</SubTitle>
          <Lead>
            Release held funds to the seller after the buyer confirms receipt of
            the goods or service. Fonlok deducts a{" "}
            <strong>2% platform fee</strong>, then disburses the net amount
            directly to the seller&apos;s MoMo number via Campay. Both parties
            receive an email confirmation.
          </Lead>
          <Badge method="POST" path="/v1/payments/release" />

          <ParamTable
            params={[
              { name: "invoice_id", type: "string", required: true, description: "The id of the invoice to release. Must be in paid status." },
            ]}
          />

          <Code>{`curl -X POST https://api.fonlok.com/v1/payments/release \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "invoice_id": "12-a1b2c3d4e5f6" }'

# Response
{
  "object":          "release",
  "invoice_id":      "12-a1b2c3d4e5f6",
  "status":          "completed",
  "gross_amount":    35000,
  "platform_fee":    700,
  "seller_receives": 34300,
  "currency":        "XAF",
  "seller_phone":    "237670123456",
  "message":         "34300 XAF dispatched to 237670123456 via Mobile Money.",
  "released_at":     "2026-07-17T10:30:00.000Z"
}`}</Code>

          <div
            style={{
              background: "rgba(37,99,235,0.05)",
              border: `1px solid rgba(37,99,235,0.15)`,
              borderRadius: "8px",
              padding: "1rem 1.25rem",
              marginBottom: "1.25rem",
              fontSize: "0.84rem",
            }}
          >
            <strong style={{ color: C.navy }}>Fee calculation</strong>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "0.25rem 1.5rem",
                marginTop: "0.5rem",
                color: C.muted,
              }}
            >
              <span>Gross amount:</span> <span>35,000 XAF</span>
              <span>Platform fee (2%):</span> <span style={{ color: C.red }}>− 700 XAF</span>
              <span style={{ color: C.text, fontWeight: 700, borderTop: `1px solid ${C.border}`, paddingTop: "4px" }}>
                Seller receives:
              </span>
              <span style={{ color: C.green, fontWeight: 700, borderTop: `1px solid ${C.border}`, paddingTop: "4px" }}>
                34,300 XAF
              </span>
            </div>
          </div>

          {/* POST /v1/payments/dispute */}
          <SubTitle id="open-dispute">Open dispute</SubTitle>
          <Lead>
            Flag a paid invoice as disputed when the buyer raises a complaint
            before funds are released. Fonlok holds the payment and your webhook
            receives a <InlineCode>payment.disputed</InlineCode> event. To
            resolve, email{" "}
            <a href="mailto:support@fonlok.com" style={{ color: C.blue }}>
              support@fonlok.com
            </a>{" "}
            with the invoice ID.
          </Lead>
          <Badge method="POST" path="/v1/payments/dispute" />

          <ParamTable
            params={[
              { name: "invoice_id", type: "string", required: true, description: "The id of the invoice to dispute. Must be in paid status." },
              { name: "reason",     type: "string", required: true, description: "Description of the issue raised by the buyer. Max 1000 characters." },
            ]}
          />

          <Code>{`curl -X POST https://api.fonlok.com/v1/payments/dispute \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "invoice_id": "12-a1b2c3d4e5f6",
    "reason":     "Buyer received a damaged item and is requesting a refund."
  }'

# Response
{
  "object":       "dispute",
  "invoice_id":   "12-a1b2c3d4e5f6",
  "status":       "disputed",
  "reason":       "Buyer received a damaged item and is requesting a refund.",
  "message":      "Invoice flagged as disputed. Funds are held. Contact support@fonlok.com with the invoice_id to resolve.",
  "disputed_at":  "2026-07-17T11:00:00.000Z"
}`}</Code>

          <Divider />

          {/* ─── Webhooks ─────────────────────────────────────────────── */}
          <SectionTitle id="webhooks">Webhooks</SectionTitle>
          <Lead>
            Fonlok sends a signed HTTP POST to your registered endpoints
            whenever a significant event occurs. Using webhooks is strongly
            recommended over polling — you get real-time notification within
            seconds of a payment being confirmed.
          </Lead>

          {/* POST /v1/webhooks/register */}
          <SubTitle id="register-webhook">Register webhook</SubTitle>
          <Lead>
            Register a publicly accessible HTTPS URL to receive event
            notifications. The response includes a signing secret — store it
            immediately, it is shown only once. Up to 5 webhooks per account.
          </Lead>
          <Badge method="POST" path="/v1/webhooks/register" />

          <ParamTable
            params={[
              { name: "url",   type: "string", required: true,  description: "Your HTTPS endpoint URL. Private and loopback IPs are rejected." },
              { name: "label", type: "string", required: false, description: "A human-readable label to identify this webhook. Max 80 characters." },
            ]}
          />

          <Code>{`curl -X POST https://api.fonlok.com/v1/webhooks/register \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "url":   "https://njimbong.com/webhooks/fonlok",
    "label": "Production webhook"
  }'

# Response — 201 Created
{
  "object":     "webhook",
  "id":         1,
  "url":        "https://njimbong.com/webhooks/fonlok",
  "label":      "Production webhook",
  "secret":     "whsec_a1b2c3d4e5f6...",
  "created_at": "2026-07-17T10:00:00.000Z",
  "_note":      "Store the secret securely. It will not be shown again."
}`}</Code>

          <Note>
            Save <InlineCode>secret</InlineCode> in your environment variables as{" "}
            <InlineCode>FONLOK_WEBHOOK_SECRET</InlineCode>. You must use it to
            verify the <InlineCode>X-Fonlok-Signature</InlineCode> header on
            every incoming event.
          </Note>

          {/* GET /v1/webhooks */}
          <SubTitle id="list-webhooks">List webhooks</SubTitle>
          <Lead>Returns all active webhook endpoints registered on your account.</Lead>
          <Badge method="GET" path="/v1/webhooks" />

          <Code>{`curl https://api.fonlok.com/v1/webhooks \\
  -H "Authorization: Bearer sk_live_..."

# Response
{
  "object": "list",
  "data": [
    {
      "id":               1,
      "url":              "https://njimbong.com/webhooks/fonlok",
      "label":            "Production webhook",
      "active":           true,
      "created_at":       "2026-07-17T10:00:00.000Z",
      "last_triggered_at": "2026-07-17T11:22:10.000Z"
    }
  ]
}`}</Code>

          {/* DELETE /v1/webhooks/:id */}
          <SubTitle id="delete-webhook">Delete webhook</SubTitle>
          <Lead>
            Deactivates a webhook endpoint. Future events will no longer be sent
            to its URL. The action is immediate and irreversible.
          </Lead>
          <Badge method="DELETE" path="/v1/webhooks/:id" />

          <Code>{`curl -X DELETE https://api.fonlok.com/v1/webhooks/1 \\
  -H "Authorization: Bearer sk_live_..."

# Response
{
  "object":  "webhook",
  "id":      1,
  "active":  false,
  "deleted": true
}`}</Code>

          {/* Webhook events */}
          <SubTitle id="webhook-events">Events reference</SubTitle>
          <Lead>
            Fonlok fires these events to all active webhook endpoints registered
            on the API key owner&apos;s account. Every payload includes an{" "}
            <InlineCode>object: "event"</InlineCode> field, a{" "}
            <InlineCode>type</InlineCode> string, and a{" "}
            <InlineCode>timestamp</InlineCode>.
          </Lead>

          {[
            {
              type: "payment.initiated",
              when: "Fired immediately after a MoMo payment prompt is sent to the buyer.",
              payload: `{
  "object":       "event",
  "type":         "payment.initiated",
  "invoice_id":   "12-a1b2c3d4e5f6",
  "reference":    "550e8400-e29b-41d4-a716-446655440000",
  "amount":       35000,
  "currency":     "XAF",
  "provider":     "MTN",
  "phone_number": "237670123456",
  "status":       "pending",
  "timestamp":    "2026-07-17T10:04:00.000Z"
}`,
            },
            {
              type: "payment.confirmed",
              when: "Fired when the buyer approves the MoMo prompt and the payment is successfully collected by Campay. The invoice status is now paid.",
              payload: `{
  "object":     "event",
  "type":       "payment.confirmed",
  "invoice_id": "12-a1b2c3d4e5f6",
  "reference":  "550e8400-e29b-41d4-a716-446655440000",
  "amount":     35000,
  "currency":   "XAF",
  "provider":   "MTN",
  "status":     "paid",
  "timestamp":  "2026-07-17T10:05:23.000Z"
}`,
            },
            {
              type: "payment.released",
              when: "Fired after a successful POST /v1/payments/release. The seller has been paid out. Invoice status is now completed.",
              payload: `{
  "object":          "event",
  "type":            "payment.released",
  "invoice_id":      "12-a1b2c3d4e5f6",
  "seller_phone":    "237670123456",
  "seller_email":    "amara@example.com",
  "gross_amount":    35000,
  "platform_fee":    700,
  "seller_receives": 34300,
  "currency":        "XAF",
  "timestamp":       "2026-07-17T10:30:00.000Z"
}`,
            },
            {
              type: "payment.disputed",
              when: "Fired after a POST /v1/payments/dispute. Funds are held. Contact support@fonlok.com to resolve.",
              payload: `{
  "object":     "event",
  "type":       "payment.disputed",
  "invoice_id": "12-a1b2c3d4e5f6",
  "amount":     35000,
  "currency":   "XAF",
  "reason":     "Buyer received a damaged item and is requesting a refund.",
  "timestamp":  "2026-07-17T11:00:00.000Z"
}`,
            },
          ].map((ev) => (
            <div
              key={ev.type}
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                marginBottom: "1.25rem",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: C.bg,
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <span
                  style={{
                    background: "rgba(245,158,11,0.12)",
                    color: "#92400e",
                    fontFamily: "monospace",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    padding: "0.18rem 0.55rem",
                    borderRadius: "5px",
                  }}
                >
                  {ev.type}
                </span>
                <span style={{ color: C.muted, fontSize: "0.83rem" }}>
                  {ev.when}
                </span>
              </div>
              <pre
                style={{
                  background: C.codeBg,
                  color: "#e2e8f0",
                  margin: 0,
                  padding: "1.25rem 1.5rem",
                  fontSize: "0.8rem",
                  lineHeight: 1.75,
                  overflowX: "auto",
                  fontFamily: '"Fira Code", monospace',
                }}
              >
                {ev.payload}
              </pre>
            </div>
          ))}

          {/* Signature verification */}
          <SubTitle id="verify-signatures">Verify signatures</SubTitle>
          <Lead>
            Every webhook request Fonlok sends includes an{" "}
            <InlineCode>X-Fonlok-Signature</InlineCode> header. Always verify
            this header before processing the payload — it proves the request
            originated from Fonlok and was not tampered with in transit.
          </Lead>

          <p style={{ color: C.muted, fontSize: "0.88rem", marginBottom: "0.75rem", fontWeight: 700 }}>
            Algorithm
          </p>
          <p style={{ color: C.muted, fontSize: "0.9rem", lineHeight: 1.75, marginBottom: "1rem" }}>
            The signature is <InlineCode>sha256=&lt;HMAC-SHA256(rawBody, webhookSecret)&gt;</InlineCode>.
            Compute it from the <strong>raw request body bytes</strong> — not the
            parsed JSON object — and compare it to the header value using a
            constant-time comparison to prevent timing attacks.
          </p>

          <p style={{ color: C.muted, fontSize: "0.88rem", marginBottom: "0.5rem", fontWeight: 700 }}>
            Node.js
          </p>
          <Code>{`import crypto from "crypto";
import express from "express";

const app = express();

// ⚠️  MUST use raw body — not express.json() parsed output.
app.post(
  "/webhooks/fonlok",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature  = req.headers["x-fonlok-signature"];
    const secret     = process.env.FONLOK_WEBHOOK_SECRET;
    const rawBody    = req.body; // Buffer

    const expected = "sha256=" +
      crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

    // ✅  Constant-time comparison prevents timing attacks.
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );

    if (!isValid) {
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(rawBody.toString());

    switch (event.type) {
      case "payment.confirmed":
        // Buyer has paid — fulfil the order.
        console.log("Payment confirmed for invoice:", event.invoice_id);
        break;
      case "payment.released":
        // Seller has been paid out.
        console.log("Funds released:", event.seller_receives, "XAF");
        break;
      case "payment.disputed":
        // Flag the order for review.
        console.log("Dispute opened:", event.reason);
        break;
    }

    res.status(200).json({ received: true });
  },
);`}</Code>

          <p style={{ color: C.muted, fontSize: "0.88rem", marginBottom: "0.5rem", fontWeight: 700 }}>
            Python
          </p>
          <Code>{`import hmac, hashlib, os
from flask import Flask, request, abort

app = Flask(__name__)

@app.route("/webhooks/fonlok", methods=["POST"])
def fonlok_webhook():
    signature = request.headers.get("X-Fonlok-Signature", "")
    secret    = os.environ["FONLOK_WEBHOOK_SECRET"].encode()
    raw_body  = request.get_data()  # raw bytes

    expected = "sha256=" + hmac.new(secret, raw_body, hashlib.sha256).hexdigest()

    # ✅  Constant-time comparison
    if not hmac.compare_digest(signature, expected):
        abort(400, "Invalid signature")

    event = request.get_json()

    if event["type"] == "payment.confirmed":
        print("Invoice paid:", event["invoice_id"])
    elif event["type"] == "payment.released":
        print("Seller received:", event["seller_receives"], "XAF")

    return {"received": True}, 200`}</Code>

          <Divider />

          {/* ─── Phone numbers ────────────────────────────────────────── */}
          <SectionTitle id="phone-numbers">Phone number format</SectionTitle>
          <Lead>
            All phone numbers must be Cameroonian Mobile Money numbers in the
            format <InlineCode>237XXXXXXXXX</InlineCode> — the country code{" "}
            <strong>237</strong> followed by 9 digits. No spaces, dashes, or{" "}
            <InlineCode>+</InlineCode> prefix.
          </Lead>

          <div
            style={{
              overflowX: "auto",
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              marginBottom: "1.5rem",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Provider", "Prefix after 237", "Example"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "0.6rem 1rem",
                        textAlign: "left",
                        fontWeight: 700,
                        color: C.muted,
                        fontSize: "0.72rem",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["MTN MoMo",     "67x, 68x, 65x (0–4), 69x (9x)",  "237670123456"],
                  ["Orange Money", "69x (non-9x), 65x (5–9), 69x", "237690123456"],
                ].map(([provider, prefix, example], i) => (
                  <tr
                    key={provider}
                    style={{ borderBottom: i === 0 ? `1px solid ${C.border}` : "none" }}
                  >
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: C.text }}>{provider}</td>
                    <td style={{ padding: "0.75rem 1rem", color: C.muted, fontFamily: "monospace" }}>{prefix}</td>
                    <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", color: C.navy }}>{example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Code>{`# Valid numbers
"237670123456"    // MTN
"237690456789"    // Orange Money

# Invalid — will fail validation
"+237670123456"   // no + prefix
"237 670 123 456" // no spaces
"670123456"       // no country code`}</Code>

          <Divider />

          {/* ─── Footer note ──────────────────────────────────────────── */}
          <div
            style={{
              background: C.navy,
              borderRadius: "12px",
              padding: "2rem 2rem",
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.75,
              fontSize: "0.9rem",
              marginTop: "2rem",
            }}
          >
            <p style={{ margin: "0 0 0.5rem", fontWeight: 800, color: "#fff", fontSize: "1rem" }}>
              Need help with your integration?
            </p>
            <p style={{ margin: 0 }}>
              Email us at{" "}
              <a href="mailto:support@fonlok.com" style={{ color: C.amber }}>
                support@fonlok.com
              </a>{" "}
              and include your account email, the invoice ID, and the error
              response you received.{" "}
              <a href="/developers" style={{ color: C.amber }}>
                Visit the developer portal
              </a>{" "}
              to manage your API keys and test in the sandbox.
            </p>
          </div>

        </main>
      </div>
    </>
  );
}
