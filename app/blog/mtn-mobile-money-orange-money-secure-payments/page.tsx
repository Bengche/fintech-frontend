import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";

export const metadata: Metadata = {
  title: "Paying with MTN MoMo or Orange Money — How to Stay Safe | Fonlok",
  description:
    "MoMo and Orange Money are convenient but sending money to strangers carries real risk. Here is how to transact safely every time in Cameroon.",
  keywords: [
    "MTN Mobile Money safe payment",
    "Orange Money Cameroon secure",
    "MoMo scam Cameroon",
    "safe MoMo transaction",
    "mobile money fraud Cameroon",
  ],
  openGraph: {
    title: "Paying with MTN MoMo or Orange Money — How to Stay Safe",
    description:
      "MoMo and Orange Money are convenient but sending money to strangers carries real risk. Here is how to transact safely every time in Cameroon.",
    url: "https://fonlok.com/blog/mtn-mobile-money-orange-money-secure-payments",
    siteName: "Fonlok",
    type: "article",
  },
  alternates: {
    canonical:
      "https://fonlok.com/blog/mtn-mobile-money-orange-money-secure-payments",
  },
};

export default function Article() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Paying with MTN MoMo or Orange Money — How to Stay Safe",
    datePublished: "2025-02-03",
    dateModified: "2025-02-03",
    author: { "@type": "Organization", name: "Fonlok" },
    publisher: {
      "@type": "Organization",
      name: "Fonlok",
      url: "https://fonlok.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id":
        "https://fonlok.com/blog/mtn-mobile-money-orange-money-secure-payments",
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
                backgroundColor: "#fff7ed",
                color: "#9a3412",
                marginBottom: "1rem",
              }}
            >
              Mobile Money
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
              Paying with MTN MoMo or Orange Money — How to Stay Safe
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
              3 February 2025 &middot; 5 min read
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
              MTN Mobile Money and Orange Money have transformed how
              Cameroonians pay for things. You no longer need a bank account to
              send or receive money. But the same convenience that makes MoMo
              powerful also makes it a target for fraud.
            </p>
            <p>
              This guide explains the most common MoMo scams and the specific
              steps that keep your money safe every time you transact.
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
              The Core Problem with Direct MoMo Transfers
            </h2>
            <p>
              When you send money to a phone number, it is gone immediately. MTN
              and Orange Money transactions are irreversible once completed.
              There is no &quot;charge-back&quot; mechanism, no buyer
              protection, and no dispute resolution process. If you send to the
              wrong person — or a scammer — recovering your money is extremely
              difficult.
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
              Top MoMo Scams in Cameroon
            </h2>

            <h3
              style={{
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
                marginTop: "1.25rem",
                marginBottom: "0.5rem",
              }}
            >
              The fake &quot;wrong transfer&quot; call
            </h3>
            <p>
              A stranger calls saying they accidentally sent you money and asks
              you to return it. Sometimes they use social engineering to make
              this believable. Before you act: check your actual balance. If no
              money arrived, ignore the request. If it did arrive, call your
              operator before sending anything back.
            </p>

            <h3
              style={{
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
                marginTop: "1.25rem",
                marginBottom: "0.5rem",
              }}
            >
              The &quot;agent&quot; asking for your PIN
            </h3>
            <p>
              No legitimate MTN or Orange Money agent will ever ask for your
              PIN. Anyone who does is attempting fraud. Your PIN should never
              leave your hands — not for any reason.
            </p>

            <h3
              style={{
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
                marginTop: "1.25rem",
                marginBottom: "0.5rem",
              }}
            >
              Fake transaction screenshots
            </h3>
            <p>
              In buyer-seller disputes, scammers routinely fake MoMo
              confirmation screenshots. These can look completely genuine. Never
              accept a screenshot as proof of payment. Always check your own
              transaction history or MoMo balance in real time.
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
              How Escrow Changes the Equation
            </h2>
            <p>
              Instead of sending your MoMo payment directly to a seller, you
              send it to an escrow platform like Fonlok. The money is locked
              until you confirm you received what you paid for. If the seller
              fails to deliver, you get a full refund.
            </p>
            <p>
              The seller benefits too: they see the funds are confirmed and
              locked before they do any work. There is no risk of a fake
              screenshot or a buyer who disappears after delivery.
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
                Protect your MoMo transactions
              </p>
              <p
                style={{
                  margin: "0 0 1.25rem",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "0.9rem",
                  lineHeight: 1.65,
                }}
              >
                Every Fonlok transaction is backed by escrow protection. Start
                for free today.
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
