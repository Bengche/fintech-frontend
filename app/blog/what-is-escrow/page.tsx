import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";

export const metadata: Metadata = {
  title: "What Is Escrow? A Simple Explanation for Cameroon | Fonlok",
  description:
    "Escrow sounds complicated but the idea is simple. Here is exactly how it works and why it makes buying and selling online much safer in Cameroon.",
  keywords: [
    "what is escrow",
    "escrow Cameroon",
    "how does escrow work",
    "secure payment Cameroon",
    "escrow service Africa",
  ],
  openGraph: {
    title: "What Is Escrow? A Simple Explanation for Cameroon",
    description:
      "Escrow sounds complicated but the idea is simple. Here is exactly how it works and why it makes buying and selling online much safer in Cameroon.",
    url: "https://fonlok.com/blog/what-is-escrow",
    siteName: "Fonlok",
    type: "article",
  },
  alternates: { canonical: "https://fonlok.com/blog/what-is-escrow" },
};

export default function Article() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What Is Escrow? A Simple Explanation for Cameroon",
    datePublished: "2025-01-25",
    dateModified: "2025-01-25",
    author: { "@type": "Organization", name: "Fonlok" },
    publisher: {
      "@type": "Organization",
      name: "Fonlok",
      url: "https://fonlok.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://fonlok.com/blog/what-is-escrow",
    },
  };

  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main>
        <section
          style={{
            backgroundColor: "var(--color-primary)",
            padding: "4rem 1.5rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "720px" }}>
            <Link
              href="/blog"
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.875rem",
                textDecoration: "none",
                display: "inline-block",
                marginBottom: "1rem",
              }}
            >
              &larr; All articles
            </Link>
            <span
              style={{
                display: "inline-block",
                padding: "0.2rem 0.65rem",
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: 700,
                backgroundColor: "#f0fdf4",
                color: "#166534",
                marginBottom: "1rem",
              }}
            >
              Education
            </span>
            <h1
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.2,
                marginBottom: "1rem",
              }}
            >
              What Is Escrow? A Simple Explanation for Cameroon
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
              25 January 2025 &middot; 4 min read
            </p>
          </div>
        </section>

        <section
          style={{
            backgroundColor: "var(--color-cloud)",
            padding: "4rem 1.5rem",
          }}
        >
          <article
            className="page-wrapper"
            style={{
              maxWidth: "720px",
              fontSize: "1rem",
              lineHeight: 1.85,
              color: "var(--color-text-body)",
            }}
          >
            <p>
              You want to buy a phone from someone you found online. They want
              you to pay first. You want them to ship first. Neither of you
              trusts the other — and rightly so, you are strangers. This is the
              exact problem escrow solves.
            </p>

            <h2
              style={{
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
                marginTop: "2rem",
                marginBottom: "0.75rem",
              }}
            >
              The Simple Idea
            </h2>
            <p>
              Escrow is a neutral third party — a trusted middleman — that holds
              a buyer&apos;s payment until both sides confirm the transaction is
              complete.
            </p>
            <p>Here is what happens step by step:</p>
            <ol style={{ paddingLeft: "1.5rem", margin: "0.75rem 0" }}>
              <li>
                The buyer sends payment to the escrow service (not the seller).
              </li>
              <li>
                The seller sees the payment is confirmed and ships the product.
              </li>
              <li>The buyer receives the product and confirms delivery.</li>
              <li>The escrow service releases the payment to the seller.</li>
            </ol>
            <p>
              If the product never arrives or does not match what was described,
              the buyer can raise a dispute and receive a refund.
            </p>

            <h2
              style={{
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
                marginTop: "2rem",
                marginBottom: "0.75rem",
              }}
            >
              Why Does This Matter in Cameroon?
            </h2>
            <p>
              In Cameroon, most online transactions still happen through direct
              MoMo or Orange Money transfers to strangers. There is no
              protection for either party if something goes wrong. The buyer has
              no guarantee of delivery. The seller has no guarantee of payment.
            </p>
            <p>
              Escrow changes that completely. Both sides get the protection they
              need, without having to trust each other blindly.
            </p>

            <h2
              style={{
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
                marginTop: "2rem",
                marginBottom: "0.75rem",
              }}
            >
              How Much Does Escrow Cost?
            </h2>
            <p>
              At Fonlok, sellers pay a flat 3% fee on the invoice amount. Buyers
              pay nothing. That means on a 50,000 XAF transaction, the seller
              pays 1,500 XAF and receives 48,500 XAF. The buyer pays exactly
              what was agreed.
            </p>
            <p>
              For context: losing a 50,000 XAF sale to fraud costs 100% of the
              deal. A 3% protection fee is a straightforward trade-off.
            </p>

            <h2
              style={{
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
                marginTop: "2rem",
                marginBottom: "0.75rem",
              }}
            >
              What Does Fonlok Escrow Cover?
            </h2>
            <ul style={{ paddingLeft: "1.5rem", margin: "0.75rem 0" }}>
              <li>Physical goods sold online</li>
              <li>Freelance and service contracts</li>
              <li>Domain names, digital files, and software</li>
              <li>Milestone-based projects (pay in instalments)</li>
              <li>
                Any deal between two parties who need a neutral holding account
              </li>
            </ul>

            <div
              style={{
                marginTop: "2.5rem",
                padding: "1.5rem",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--color-primary)",
                color: "#fff",
              }}
            >
              <p
                style={{
                  margin: "0 0 0.75rem",
                  fontWeight: 700,
                  fontSize: "1.0625rem",
                  color: "var(--color-accent)",
                }}
              >
                Try escrow for your next deal
              </p>
              <p
                style={{
                  margin: "0 0 1.25rem",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "0.9rem",
                  lineHeight: 1.65,
                }}
              >
                Sign up for free and send your first protected invoice in under
                two minutes.
              </p>
              <Link
                href="/register"
                className="btn-accent"
                style={{ textDecoration: "none", fontSize: "0.9375rem" }}
              >
                Get started free
              </Link>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
