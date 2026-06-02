import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";

export const metadata: Metadata = {
  title: "How to Sell Safely on Facebook Marketplace Cameroon | Fonlok",
  description:
    "Facebook Marketplace is huge in Cameroon but so is payment fraud. Use these steps to protect every sale you make.",
  keywords: [
    "Facebook Marketplace Cameroon",
    "sell safely Facebook Cameroon",
    "avoid payment fraud Facebook",
    "secure sale Cameroon",
    "MoMo payment fraud",
  ],
  openGraph: {
    title: "How to Sell Safely on Facebook Marketplace Cameroon",
    description:
      "Facebook Marketplace is huge in Cameroon but so is payment fraud. Use these steps to protect every sale you make.",
    url: "https://fonlok.com/blog/how-to-sell-safely-on-facebook-marketplace-cameroon",
    siteName: "Fonlok",
    type: "article",
  },
  alternates: {
    canonical:
      "https://fonlok.com/blog/how-to-sell-safely-on-facebook-marketplace-cameroon",
  },
};

export default function Article() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Sell Safely on Facebook Marketplace Cameroon",
    datePublished: "2025-01-18",
    dateModified: "2025-01-18",
    author: { "@type": "Organization", name: "Fonlok" },
    publisher: {
      "@type": "Organization",
      name: "Fonlok",
      url: "https://fonlok.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id":
        "https://fonlok.com/blog/how-to-sell-safely-on-facebook-marketplace-cameroon",
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
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                marginBottom: "1rem",
              }}
            >
              Sellers
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
              How to Sell Safely on Facebook Marketplace Cameroon
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
              18 January 2025 &middot; 5 min read
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
              Facebook Marketplace and Facebook groups are the most popular
              places to buy and sell in Cameroon. Millions of transactions happen
              every week — but so do thousands of scams. As a seller, you are
              particularly exposed: you hold the product and the buyer holds the
              money.
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
              The Seller&apos;s Dilemma
            </h2>
            <p>
              Every Facebook sale puts you in an uncomfortable position: do you
              ship first and hope the buyer pays, or demand payment first and
              hope they trust you? Either way, one side carries all the risk.
              This is precisely why so many transactions break down or end in
              loss.
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
              Step 1 — Verify the buyer&apos;s identity
            </h2>
            <p>
              Before you agree to any deal, check the buyer&apos;s Facebook
              profile. Look for: a profile created more than 6 months ago, real
              photos over time, mutual friends or connections, and a history of
              comments in local groups. Newly created accounts with no
              activity are a major red flag.
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
              Step 2 — Insist on a verifiable payment method
            </h2>
            <p>
              Screenshots of MoMo transactions can be faked in seconds. Never
              hand over goods based on a screenshot. The only safe options are:
            </p>
            <ul style={{ paddingLeft: "1.5rem", margin: "0.75rem 0" }}>
              <li>
                Meeting in person and checking your MoMo balance live on your
                phone after the transfer
              </li>
              <li>
                Using a secure escrow service like Fonlok that holds the
                payment in trust until you confirm delivery
              </li>
            </ul>

            <h2
              style={{
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
                marginTop: "2rem",
                marginBottom: "0.75rem",
              }}
            >
              Step 3 — Use a Fonlok invoice link
            </h2>
            <p>
              Instead of sharing your MoMo number directly, create a free Fonlok
              account and send the buyer a payment link. They pay via MoMo or
              Orange Money into a secure escrow account. You only receive the
              money after you mark the order as delivered and the buyer
              confirms. If there is any dispute, Fonlok mediates.
            </p>
            <p>
              This removes the trust problem entirely. The buyer knows they are
              protected. You know the money is already locked in before you
              ship.
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
              Step 4 — Document everything
            </h2>
            <p>
              Keep a record of the agreed price, item description, and any
              messages confirming the deal. If there is a dispute later,
              documentation is your strongest protection.
            </p>

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
                Start selling with confidence
              </p>
              <p
                style={{
                  margin: "0 0 1.25rem",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "0.9rem",
                  lineHeight: 1.65,
                }}
              >
                Create a free Fonlok account, generate a payment link, and share
                it in your next Facebook listing.
              </p>
              <Link
                href="/register"
                className="btn-accent"
                style={{ textDecoration: "none", fontSize: "0.9375rem" }}
              >
                Create a free account
              </Link>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
