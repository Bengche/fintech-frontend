import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";

export const metadata: Metadata = {
  title: "How to Avoid Online Scams in Cameroon (2025 Guide) | Fonlok",
  description:
    "Learn the most common online fraud tactics targeting Cameroonians and the concrete steps you can take right now to protect your money.",
  keywords: [
    "online scams Cameroon",
    "how to avoid fraud Cameroon",
    "MoMo scam Cameroon",
    "safe online shopping Cameroon",
    "internet fraud Cameroon",
  ],
  openGraph: {
    title: "How to Avoid Online Scams in Cameroon (2025 Guide)",
    description:
      "Learn the most common online fraud tactics targeting Cameroonians and the concrete steps you can take right now to protect your money.",
    url: "https://fonlok.com/blog/how-to-avoid-online-scams-in-cameroon",
    siteName: "Fonlok",
    type: "article",
  },
  alternates: {
    canonical: "https://fonlok.com/blog/how-to-avoid-online-scams-in-cameroon",
  },
};

export default function Article() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Avoid Online Scams in Cameroon (2025 Guide)",
    datePublished: "2025-01-10",
    dateModified: "2025-01-10",
    author: { "@type": "Organization", name: "Fonlok" },
    publisher: {
      "@type": "Organization",
      name: "Fonlok",
      url: "https://fonlok.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://fonlok.com/blog/how-to-avoid-online-scams-in-cameroon",
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
                backgroundColor: "#fef3c7",
                color: "#92400e",
                marginBottom: "1rem",
              }}
            >
              Safety
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
              How to Avoid Online Scams in Cameroon (2025 Guide)
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.875rem",
              }}
            >
              10 January 2025 &middot; 6 min read
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
              Online fraud is growing fast in Cameroon. Whether you are buying
              second-hand electronics on Facebook, hiring a freelancer on
              WhatsApp, or paying a supplier you found on LinkedIn, the risk of
              being scammed is real — and it is rising every year.
            </p>

            <p>
              This guide covers the most common tactics scammers use and the
              practical steps every Cameroonian buyer and seller can take to
              stay safe.
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
              1. The &quot;Pay First&quot; Trap
            </h2>
            <p>
              The most widespread scam in Cameroon is simple: a seller asks you
              to send mobile money before they deliver the product or service.
              Once they receive the money, they disappear or stop responding.
            </p>
            <p>
              <strong>What to do:</strong> Never send payment to someone you
              have not verified. Use an escrow service like{" "}
              <Link
                href="/"
                style={{ color: "var(--color-primary)", fontWeight: 600 }}
              >
                Fonlok
              </Link>{" "}
              so your money is held safely until you confirm you received what
              you paid for.
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
              2. Fake MoMo Transaction Screenshots
            </h2>
            <p>
              Scammers often send fabricated screenshots of MoMo payment
              confirmations to convince sellers they have been paid. They may
              even use convincing SMS spoofing to fake an MTN or Orange
              notification on your phone.
            </p>
            <p>
              <strong>What to do:</strong> Never release goods or services until
              you see the money in your actual MoMo balance — not just a
              screenshot. Log in to your MoMo app and check your transaction
              history directly.
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
              3. &quot;Overpayment&quot; Scams
            </h2>
            <p>
              A buyer &quot;accidentally&quot; sends you more money than agreed
              and asks you to refund the difference. The original payment later
              turns out to be fraudulent or reversed, and you lose both the
              goods and the refund you sent.
            </p>
            <p>
              <strong>What to do:</strong> Treat any unexpected overpayment as a
              red flag. Decline the transaction entirely and start fresh.
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
              4. Social Engineering via WhatsApp and Facebook
            </h2>
            <p>
              Fraudsters often spend days or weeks building trust before they
              strike. They join groups, post genuine-looking listings, and build
              a fake reputation. When the moment comes, they either disappear
              with your money or send counterfeit goods.
            </p>
            <p>
              <strong>What to do:</strong> Check for consistent posting history,
              profile age, and — most importantly — insist on a secure payment
              method that protects you if something goes wrong.
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
              5. How Escrow Eliminates the Risk
            </h2>
            <p>
              Escrow is a neutral third party that holds a buyer&apos;s payment
              until both sides confirm the transaction is complete. The seller
              knows the money is real and locked in. The buyer knows they get a
              refund if delivery fails. Neither side has to trust a stranger.
            </p>
            <p>
              Fonlok is Cameroon&apos;s dedicated escrow platform, built for MTN
              Mobile Money and Orange Money. Every transaction is protected from
              the moment payment is made until the buyer confirms satisfaction.
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
                Protect your next transaction
              </p>
              <p
                style={{
                  margin: "0 0 1.25rem",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "0.9rem",
                  lineHeight: 1.65,
                }}
              >
                Create a free Fonlok account and send your first secure invoice
                in under two minutes.
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
