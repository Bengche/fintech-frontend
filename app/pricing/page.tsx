import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Pricing — Fonlok Escrow Fees",
  description:
    "Fonlok charges a simple 3% fee per transaction. No monthly plans, no setup cost, free for buyers. See exactly what you pay.",
  keywords: [
    "Fonlok pricing",
    "escrow fee Cameroon",
    "3% escrow fee",
    "how much does Fonlok cost",
  ],
  openGraph: {
    title: "Pricing — Fonlok Escrow Fees",
    description: "3% per transaction. Free for buyers. No monthly fee.",
    url: "https://fonlok.com/pricing",
    siteName: "Fonlok",
    type: "website",
  },
  alternates: { canonical: "https://fonlok.com/pricing" },
};

export default function PricingPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ── PAGE HEADER ─────────────────────────────── */}
        <section
          style={{
            backgroundColor: "var(--color-primary)",
            padding: "4rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "600px" }}>
            <h1
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: "1rem",
              }}
            >
              Simple, transparent pricing
            </h1>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.75,
              }}
            >
              One fee. No surprises. Pay only when you use it.
            </p>
          </div>
        </section>

        {/* ── MAIN FEE CARD ───────────────────────────── */}
        <section
          style={{
            backgroundColor: "var(--color-cloud)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "2rem",
                alignItems: "flex-start",
                justifyContent: "center",
              }}
            >
              {/* Big fee card */}
              <div
                className="card"
                style={{
                  flex: "0 1 360px",
                  padding: "2.5rem",
                  border: "2px solid var(--color-primary)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-accent)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Seller fee
                </p>
                <p
                  style={{
                    fontSize: "4.5rem",
                    fontWeight: 900,
                    color: "var(--color-primary)",
                    lineHeight: 1,
                    margin: "0 0 0.25rem",
                  }}
                >
                  3%
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-text-muted)",
                    marginBottom: "1rem",
                  }}
                >
                  of each transaction amount — charged to the seller only
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-text-body)",
                    lineHeight: 1.7,
                    marginBottom: "2rem",
                    paddingBottom: "1.25rem",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  That 3% covers everything Fonlok does for you: holding the
                  funds, processing the payout, handling disputes, and sending
                  receipts. Your buyer pays zero Fonlok fees — which makes it
                  easier for you to convince them to use the platform.
                </p>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {WHAT_IS_INCLUDED.map((item) => (
                    <li
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.625rem",
                        fontSize: "0.9375rem",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--color-success)",
                          fontWeight: 700,
                          marginTop: "0.1rem",
                          flexShrink: 0,
                        }}
                      >
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className="btn-primary"
                  style={{ display: "block", textAlign: "center" }}
                >
                  Create a free account
                </Link>
              </div>

              {/* Buyer fee card */}
              <div
                className="card"
                style={{ flex: "0 1 300px", padding: "2.5rem" }}
              >
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-text-muted)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Buyer fee
                </p>
                <p
                  style={{
                    fontSize: "4.5rem",
                    fontWeight: 900,
                    color: "var(--color-primary)",
                    lineHeight: 1,
                    margin: "0 0 0.25rem",
                  }}
                >
                  0%
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-text-muted)",
                    marginBottom: "1rem",
                  }}
                >
                  Fonlok charges buyers nothing
                </p>
                <span
                  className="badge badge-success"
                  style={{
                    display: "inline-block",
                    marginBottom: "1.25rem",
                    fontSize: "0.8125rem",
                  }}
                >
                  Free for buyers
                </span>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--color-text-body)",
                    lineHeight: 1.75,
                    marginBottom: "1rem",
                  }}
                >
                  When you pay through a Fonlok invoice link, you pay exactly
                  the amount shown. Fonlok adds no markup or service charge for
                  buyers.
                </p>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.7,
                    paddingTop: "0.875rem",
                    borderTop: "1px solid var(--color-border)",
                  }}
                >
                  <strong style={{ color: "var(--color-text-heading)" }}>
                    Note:
                  </strong>{" "}
                  Standard Mobile Money network charges (typically 2%) applied
                  by MTN or Orange at the point of payment are set by and paid
                  to the mobile network — not collected by Fonlok.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHAT YOU GET FOR 3% ──────────────────────── */}
        <section
          style={{
            backgroundColor: "var(--color-white)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "780px" }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <h2
                style={{
                  fontSize: "clamp(1.375rem, 3vw, 1.75rem)",
                  marginBottom: "0.75rem",
                }}
              >
                What do sellers get for 3%?
              </h2>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--color-text-muted)",
                  maxWidth: "480px",
                  margin: "0 auto",
                }}
              >
                The fee is not just a charge — it is the entire service. Here is
                exactly what it covers.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {VALUE_ITEMS.map((item) => (
                <div
                  key={item.title}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-cloud)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      marginBottom: "0.4rem",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.7,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EXAMPLE CALCULATIONS ────────────────────── */}
        <section
          style={{
            backgroundColor: "var(--color-mist)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "680px" }}>
            <h2
              style={{
                fontSize: "clamp(1.375rem, 3vw, 1.75rem)",
                marginBottom: "0.75rem",
              }}
            >
              What does 3% look like in practice?
            </h2>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--color-text-muted)",
                marginBottom: "2rem",
              }}
            >
              The seller pays the fee. Buyers always pay exactly what the
              invoice says.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9375rem",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "var(--color-mist)" }}>
                    {["Invoice amount", "Fee (3%)", "Seller receives"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "0.875rem 1rem",
                            textAlign: "left",
                            fontWeight: 700,
                            fontSize: "0.875rem",
                            color: "var(--color-text-heading)",
                            borderBottom: "1px solid var(--color-border)",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {FEE_EXAMPLES.map((row, i) => (
                    <tr
                      key={row.amount}
                      style={{
                        backgroundColor:
                          i % 2 === 0
                            ? "var(--color-white)"
                            : "var(--color-cloud)",
                      }}
                    >
                      <td
                        style={{
                          padding: "0.875rem 1rem",
                          color: "var(--color-text-body)",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        {row.amount}
                      </td>
                      <td
                        style={{
                          padding: "0.875rem 1rem",
                          color: "var(--color-danger)",
                          fontWeight: 600,
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        {row.fee}
                      </td>
                      <td
                        style={{
                          padding: "0.875rem 1rem",
                          color: "var(--color-success)",
                          fontWeight: 600,
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        {row.receives}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── PRICING FAQ ─────────────────────────────── */}
        <section
          style={{
            backgroundColor: "var(--color-mist)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "680px" }}>
            <h2
              style={{
                fontSize: "clamp(1.375rem, 3vw, 1.75rem)",
                marginBottom: "2.5rem",
              }}
            >
              Common questions about fees
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {PRICING_FAQ.map((item) => (
                <div key={item.q}>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: "0.4rem",
                    }}
                  >
                    {item.q}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9375rem",
                      color: "var(--color-text-body)",
                      lineHeight: 1.75,
                    }}
                  >
                    {item.a}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "3rem", textAlign: "center" }}>
              <Link
                href="/faq"
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                }}
              >
                See all frequently asked questions →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

// ── Data ────────────────────────────────────────────────────────

const VALUE_ITEMS = [
  {
    title: "Guaranteed payment before you deliver",
    desc: "The buyer's money is locked in escrow before you lift a finger. You only deliver when the funds are confirmed.",
  },
  {
    title: "Funds held securely",
    desc: "Fonlok holds the money as a neutral party. Neither side can access it until the deal is completed.",
  },
  {
    title: "Automatic payout on confirmation",
    desc: "Once the buyer confirms delivery, Fonlok releases your money immediately. No chasing, no waiting.",
  },
  {
    title: "Payment receipts by email",
    desc: "Both buyer and seller receive email receipts automatically. A clear paper trail for every deal.",
  },
  {
    title: "Dispute resolution included",
    desc: "If something goes wrong, Fonlok investigates and makes a fair decision. You are never left to fight alone.",
  },
  {
    title: "Buyers pay zero Fonlok fees",
    desc: "Your buyers are not charged anything by Fonlok. That removes their hesitation and makes it easier for you to close deals.",
  },
];

const WHAT_IS_INCLUDED = [
  "Invoice creation and management",
  "MTN & Orange Money payments",
  "Escrow fund holding",
  "Payout to seller on confirmation",
  "Dispute resolution",
  "Email notifications",
  "Dashboard access",
  "Free for buyers — always",
];

const FEE_EXAMPLES = [
  { amount: "5,000 XAF", fee: "150 XAF", receives: "4,850 XAF" },
  { amount: "10,000 XAF", fee: "300 XAF", receives: "9,700 XAF" },
  { amount: "25,000 XAF", fee: "750 XAF", receives: "24,250 XAF" },
  { amount: "50,000 XAF", fee: "1,500 XAF", receives: "48,500 XAF" },
  { amount: "100,000 XAF", fee: "3,000 XAF", receives: "97,000 XAF" },
  { amount: "500,000 XAF", fee: "15,000 XAF", receives: "485,000 XAF" },
];

const PRICING_FAQ = [
  {
    q: "What about the Mobile Money network charge buyers see on their phone?",
    a: "When a buyer pays with MTN or Orange Money, the mobile network deducts their own transaction fee (typically around 2%) directly at the point of payment. This is a standard charge applied to all MoMo transactions, not something Fonlok controls or receives. Fonlok collects nothing from buyers.",
  },
  {
    q: "Who pays the 3% fee — buyer or seller?",
    a: "The seller pays the fee. It is deducted from the amount released to the seller when the deal is confirmed. Buyers always pay the exact invoice amount.",
  },
  {
    q: "Are there any monthly or subscription fees?",
    a: "No. You only pay when you use Fonlok. Creating an account, creating invoices, and browsing your dashboard are all completely free.",
  },
  {
    q: "Is there a setup fee?",
    a: "No. Getting started is completely free.",
  },
  {
    q: "What if a deal is cancelled or refunded?",
    a: "If no delivery has taken place and the buyer's funds are refunded, the buyer pays for the 3% service fee.",
  },
];
