/**
 * /developers — Fonlok Developer Sandbox
 *
 * Public-facing developer portal. Contains:
 *  - Overview of the sandbox environment
 *  - Quick-start guide with authentication and first-call examples
 *  - Interactive API explorer (client component)
 *  - Sandbox API key management (client component, requires auth)
 */

import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";
import SandboxKeyManager from "./_components/SandboxKeyManager";
import SandboxExplorer from "./_components/SandboxExplorer";

export const metadata: Metadata = {
  title: "Developer Sandbox",
  description:
    "Test your Fonlok integration end-to-end in an isolated sandbox environment. No real payments, full API fidelity.",
  keywords: [
    "Fonlok API",
    "developer sandbox",
    "payment API Cameroon",
    "test escrow API",
    "MTN MoMo API sandbox",
  ],
  openGraph: {
    title: "Developer Sandbox — Fonlok",
    description:
      "Integrate Fonlok escrow payments with confidence. Test every flow in our sandbox before going live.",
    url: "https://fonlok.com/developers",
    siteName: "Fonlok",
    type: "website",
  },
  alternates: { canonical: "https://fonlok.com/developers" },
};

// ── Static visual data ────────────────────────────────────────────────────────

const OVERVIEW_CARDS = [
  {
    icon: (
      <svg
        width="22"
        height="22"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Completely isolated",
    body: "Sandbox invoices, payments, and transactions are stored in a dedicated environment, fully separated from Fonlok's live platform. Nothing you do in the sandbox can affect real users or real money.",
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Deterministic test flows",
    body: "Payments stay in a pending state until you explicitly confirm or fail them. This means you can test the happy path (successful payment), the failure path (declined), and edge cases — one at a time, as many times as you need.",
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: "Full API fidelity",
    body: "The sandbox uses exactly the same request and response format as the live Fonlok API. When you are ready to go live, you only need to replace your sandbox key with a live key — your code stays the same.",
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Authenticated with scoped keys",
    body: "Each sandbox key (sk_test_*) is tied to your Fonlok account and can be revoked at any time. The full key is shown once at creation — copy it immediately, as it cannot be retrieved afterwards.",
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    title: "Consistent error responses",
    body: "Validation errors, not-found responses, and other error types use the same structure across all endpoints. Error handling you build during testing will work correctly when you go live.",
  },
];

const QUICK_START_STEPS = [
  {
    n: "01",
    title: "Create a sandbox key",
    body: 'Scroll down to the "API keys" section, sign in if prompted, and click "Generate key". Give it a descriptive label so you can identify it later.',
  },
  {
    n: "02",
    title: "Verify your key",
    body: 'Paste your key into the explorer below and send a GET /sandbox/ping request. If you receive back {"status": "ok"}, your key is working correctly and you are ready to continue.',
  },
  {
    n: "03",
    title: "Create a test invoice",
    body: "Call POST /sandbox/invoices with a title, amount, and seller email. The response includes an invoice_id (it looks like inv_test_abc123) — copy it, you will need it in the next step.",
  },
  {
    n: "04",
    title: "Simulate a payment",
    body: "Call POST /sandbox/payments/initiate, passing the invoice_id from step 3 and a Cameroonian mobile number (format: 237XXXXXXXXX). The response includes a payment reference — a unique ID for this payment attempt.",
  },
  {
    n: "05",
    title: "Confirm or fail the payment",
    body: "Call POST /sandbox/payments/{reference}/confirm to simulate the customer approving the payment, or POST /sandbox/payments/{reference}/fail to simulate a rejection. The invoice status updates automatically to reflect the outcome.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DevelopersPage() {
  return (
    <>
      <SiteHeader />

      <main className="developers-page">
        {/* ── Responsive overrides ─────────────────────────────────────── */}
        <style>{`
          /* Sections contain a page-wrapper that already provides horizontal
             padding. Without this override the two stack and content appears
             pinched into a narrow centre strip on mobile. */
          .dev-section {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .developers-page .page-wrapper {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          @media (max-width: 768px) {
            .dev-section {
              padding-top: 3rem !important;
              padding-bottom: 3rem !important;
            }
            .dev-banner {
              flex-wrap: wrap;
              justify-content: flex-start;
              text-align: left;
            }
            .dev-overview-grid {
              grid-template-columns: 1fr !important;
              gap: 1rem !important;
            }
            .dev-quick-step {
              flex-direction: column;
              gap: 0.875rem !important;
            }
            .dev-faq-item {
              padding: 1rem !important;
            }
          }
          @media (max-width: 480px) {
            .developers-page .page-wrapper {
              padding-left: 0.875rem;
              padding-right: 0.875rem;
            }
          }
        `}</style>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section
          className="dev-section"
          style={{
            background: "var(--color-primary)",
            padding: "5rem 1.5rem 4rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "760px" }}>
            <div style={{ marginBottom: "1.25rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  // background: "rgba(245,158,11,0.15)",
                  // border: "1px solid rgba(245,158,11,0.4)",
                  color: "#FCD34D",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "0.3rem 0.75rem",
                  // borderRadius: "999px",
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="10" opacity="0.25" />
                  <circle cx="12" cy="12" r="5" />
                </svg>
                Sandbox environment
              </span>
            </div>
            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.2,
                marginBottom: "1.25rem",
                letterSpacing: "-0.02em",
              }}
            >
              Build on Fonlok.
              <br />
              <span style={{ color: "var(--color-accent)" }}>
                Test without limits.
              </span>
            </h1>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "rgba(255,255,255,0.72)",
                lineHeight: 1.75,
                maxWidth: "560px",
                marginBottom: "2rem",
              }}
            >
              The Fonlok sandbox gives you a complete, isolated environment to
              test every payment and escrow flow before going live. No real
              money moves. Nothing on Fonlok&apos;s live platform is ever
              affected.
            </p>
            <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
              <a
                href="#explorer"
                className="btn-accent"
                style={{ fontSize: "0.9375rem" }}
              >
                Open API explorer
              </a>
              <a
                href="#keys"
                style={{
                  display: "inline-block",
                  padding: "0.65rem 1.4rem",
                  borderRadius: "8px",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  transition: "border-color 0.15s",
                }}
              >
                Get an API key
              </a>
            </div>
          </div>
        </section>

        {/* ── Sandbox notice banner ─────────────────────────────────────────── */}
        <div
          className="dev-banner"
          style={{
            background: "#FFFBEB",
            borderBottom: "1px solid #FDE68A",
            padding: "0.75rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.625rem",
            fontSize: "0.84375rem",
            color: "#92400E",
            fontWeight: 500,
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.25}
            style={{ flexShrink: 0 }}
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>
            <strong>Sandbox only.</strong> This environment does not process
            real payments. No real MTN or Orange Money transactions will be
            initiated.
          </span>
        </div>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        <section
          className="dev-section"
          style={{
            background: "var(--color-cloud)",
            padding: "5rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div className="page-wrapper">
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 800,
                color: "var(--color-text-heading)",
                marginBottom: "0.75rem",
                letterSpacing: "-0.015em",
              }}
            >
              How the sandbox works
            </h2>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--color-text-muted)",
                marginBottom: "3rem",
                maxWidth: "540px",
                lineHeight: 1.7,
              }}
            >
              Everything you need to know before writing your first API call.
            </p>
            <div
              className="dev-overview-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {OVERVIEW_CARDS.map((card) => (
                <div
                  key={card.title}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: "var(--color-primary-light)",
                      color: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    {card.icon}
                  </div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      color: "var(--color-text-heading)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {card.title}
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.7,
                    }}
                  >
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Authentication ─────────────────────────────────────────────────── */}
        <section
          className="dev-section"
          style={{
            padding: "5rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "780px" }}>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 800,
                color: "var(--color-text-heading)",
                marginBottom: "0.75rem",
                letterSpacing: "-0.015em",
              }}
            >
              Authentication
            </h2>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--color-text-muted)",
                lineHeight: 1.75,
                marginBottom: "2rem",
              }}
            >
              Every sandbox request must include your API key. You pass it as a
              Bearer token in the{" "}
              <code
                style={{
                  fontFamily: "monospace",
                  background: "var(--color-mist)",
                  padding: "0.1rem 0.4rem",
                  borderRadius: "4px",
                  fontSize: "0.875em",
                }}
              >
                Authorization
              </code>{" "}
              HTTP header on every request. This is a standard pattern used by
              most APIs — it tells the server which account the request belongs
              to, without embedding credentials in the URL.
            </p>

            <div
              style={{
                background: "#1E2029",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "0.5rem 1.25rem",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                HTTP header
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: "1.25rem",
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: "0.875rem",
                  color: "#ABB2BF",
                  lineHeight: 1.8,
                  overflowX: "auto",
                  whiteSpace: "pre",
                }}
              >
                <span style={{ color: "#61AFEF" }}>Authorization</span>
                <span style={{ color: "#ABB2BF" }}>: </span>
                <span style={{ color: "#98C379" }}>
                  Bearer sk_test_a1b2c3d4...
                </span>
              </pre>
            </div>

            <div
              style={{
                marginTop: "1.5rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              {[
                {
                  label: "Key format",
                  value: "sk_test_ + 32 hex chars (40 chars total)",
                },
                {
                  label: "Key security",
                  value:
                    "Shown once at creation — cannot be retrieved afterwards",
                },
                {
                  label: "Key scope",
                  value:
                    "Sandbox-only, tied to your account, independently revocable",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "var(--color-mist)",
                    borderRadius: "8px",
                    padding: "1rem 1.25rem",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      marginBottom: "0.375rem",
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-text-body)",
                      fontWeight: 500,
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Quick start ───────────────────────────────────────────────────── */}
        <section
          className="dev-section"
          style={{
            background: "var(--color-cloud)",
            padding: "5rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "780px" }}>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 800,
                color: "var(--color-text-heading)",
                marginBottom: "0.75rem",
                letterSpacing: "-0.015em",
              }}
            >
              Quick start
            </h2>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--color-text-muted)",
                marginBottom: "3rem",
                lineHeight: 1.7,
              }}
            >
              Run a complete payment lifecycle in under five minutes.
            </p>
            <ol
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {QUICK_START_STEPS.map((step) => (
                <li
                  className="dev-quick-step"
                  key={step.n}
                  style={{
                    display: "flex",
                    gap: "1.25rem",
                    alignItems: "flex-start",
                    background: "#fff",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "var(--color-primary)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "0.75rem",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {step.n}
                  </span>
                  <div>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "var(--color-text-heading)",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {step.title}
                    </p>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--color-text-muted)",
                        lineHeight: 1.7,
                      }}
                    >
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── API explorer ─────────────────────────────────────────────────── */}
        <section
          id="explorer"
          className="dev-section"
          style={{ padding: "5rem 1.5rem", scrollMarginTop: "72px" }}
        >
          <div className="page-wrapper">
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "1rem",
                marginBottom: "2.5rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                    fontWeight: 800,
                    color: "var(--color-text-heading)",
                    marginBottom: "0.5rem",
                    letterSpacing: "-0.015em",
                  }}
                >
                  API reference
                </h2>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-text-muted)",
                    maxWidth: "480px",
                    lineHeight: 1.7,
                  }}
                >
                  Select an endpoint, fill in the parameters, and send a live
                  request directly from this page.
                </p>
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.35)",
                  color: "#D97706",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  padding: "0.35rem 0.875rem",
                  borderRadius: "999px",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="currentColor"
                >
                  <circle cx="5" cy="5" r="5" opacity="0.3" />
                  <circle cx="5" cy="5" r="2.5" />
                </svg>
                Sandbox
              </span>
            </div>

            <SandboxExplorer />
          </div>
        </section>

        {/* ── API key management ────────────────────────────────────────────── */}
        <section
          id="keys"
          className="dev-section"
          style={{
            background: "var(--color-cloud)",
            padding: "5rem 1.5rem",
            borderTop: "1px solid var(--color-border)",
            scrollMarginTop: "72px",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "900px" }}>
            <div style={{ marginBottom: "2.5rem" }}>
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 800,
                  color: "var(--color-text-heading)",
                  marginBottom: "0.5rem",
                  letterSpacing: "-0.015em",
                }}
              >
                API keys
              </h2>
              <p
                style={{
                  fontSize: "1rem",
                  color: "var(--color-text-muted)",
                  maxWidth: "540px",
                  lineHeight: 1.7,
                }}
              >
                Sandbox keys are prefixed with{" "}
                <code
                  style={{
                    fontFamily: "monospace",
                    background: "var(--color-mist)",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px",
                    fontSize: "0.875em",
                  }}
                >
                  sk_test_
                </code>{" "}
                and only work in the sandbox environment. They cannot be used to
                access live payments, real payouts, or any user data on
                Fonlok&apos;s live platform.
              </p>
            </div>

            <SandboxKeyManager />
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section
          className="dev-section"
          style={{
            padding: "5rem 1.5rem",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "680px" }}>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 800,
                color: "var(--color-text-heading)",
                marginBottom: "2.5rem",
                letterSpacing: "-0.015em",
              }}
            >
              Common questions
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {[
                {
                  q: "Can sandbox activity affect the live Fonlok platform?",
                  a: "No. The sandbox runs in a completely isolated environment. Anything you do during testing — including errors — has no effect on real Fonlok users, live transactions, or real money.",
                },
                {
                  q: "Can I use a sandbox key to make real payments?",
                  a: "No. Keys prefixed with sk_test_ are only accepted in the sandbox. They are automatically rejected by Fonlok's live platform. Processing real payments requires a separate live API key, available to approved integration partners.",
                },
                {
                  q: "Do sandbox transactions expire or get cleaned up?",
                  a: "Sandbox data is kept for as long as your key remains active. When you revoke a key, all test invoices and transactions associated with it are permanently removed.",
                },
                {
                  q: "Can I test webhooks in the sandbox?",
                  a: "Yes. Use the POST /sandbox/momo/webhook/simulate endpoint to fire a real HTTP POST to any callback URL you provide. This lets you verify that your server handles incoming Fonlok payment notifications correctly before going live.",
                },
                {
                  q: "Can I use the sandbox in my CI/CD pipeline?",
                  a: 'Yes. Create a key labelled for your pipeline (e.g. "GitHub Actions") and store it as a secret in your CI environment. The sandbox is designed to handle automated test suites without issues.',
                },
                {
                  q: "How do I report a bug in the sandbox API?",
                  a: 'Reach us at support@fonlok.com with the subject line "Sandbox API issue". Include the endpoint, your request body, and the response you received.',
                },
              ].map(({ q, a }) => (
                <details
                  className="dev-faq-item"
                  key={q}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    padding: "1.25rem 1.5rem",
                  }}
                >
                  <summary
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      color: "var(--color-text-heading)",
                      cursor: "pointer",
                      userSelect: "none",
                      listStyle: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                    }}
                  >
                    {q}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      style={{ flexShrink: 0 }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </summary>
                  <p
                    style={{
                      marginTop: "0.875rem",
                      fontSize: "0.9rem",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.75,
                    }}
                  >
                    {a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
