import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";

export const metadata: Metadata = {
  title: "How to Get Paid Online in Cameroon Without Getting Scammed | Fonlok",
  description:
    "Freelancers, service providers, and small businesses — here is everything you need to know to receive payments safely in Cameroon.",
  keywords: [
    "how to get paid online Cameroon",
    "receive payment Cameroon freelancer",
    "freelance payment Cameroon",
    "secure invoice Cameroon",
    "get paid safely Cameroon",
  ],
  openGraph: {
    title: "How to Get Paid Online in Cameroon Without Getting Scammed",
    description:
      "Freelancers, service providers, and small businesses — here is everything you need to know to receive payments safely in Cameroon.",
    url: "https://fonlok.com/blog/how-to-get-paid-online-cameroon",
    siteName: "Fonlok",
    type: "article",
  },
  alternates: {
    canonical: "https://fonlok.com/blog/how-to-get-paid-online-cameroon",
  },
};

export default function Article() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "How to Get Paid Online in Cameroon Without Getting Scammed",
    datePublished: "2025-02-12",
    dateModified: "2025-02-12",
    author: { "@type": "Organization", name: "Fonlok" },
    publisher: {
      "@type": "Organization",
      name: "Fonlok",
      url: "https://fonlok.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://fonlok.com/blog/how-to-get-paid-online-cameroon",
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
                backgroundColor: "#fdf4ff",
                color: "#7e22ce",
                marginBottom: "1rem",
              }}
            >
              Freelancers
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
              How to Get Paid Online in Cameroon Without Getting Scammed
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
              12 February 2025 &middot; 7 min read
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
              Getting paid online in Cameroon is harder than it should be. Banks
              are slow and expensive. International platforms like PayPal have
              limited support. And direct MoMo transfers put you at risk of
              fake payment proofs and non-paying clients.
            </p>
            <p>
              This guide covers every option available to Cameroonian freelancers
              and small businesses, and explains why escrow is the safest and
              most professional choice.
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
              Why Direct MoMo Transfers Are Risky for Sellers
            </h2>
            <p>
              Asking a client to send you money via MoMo before you do the work
              immediately creates friction. Legitimate clients do not want to pay
              someone they just met. And if they do pay, you have no way to
              guarantee they will not dispute the transfer later or claim
              non-delivery.
            </p>
            <p>
              On the other side: completing work and then chasing payment is
              equally risky. Clients ghost. Payment promises are broken. You
              have no recourse.
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
              Option 1 — Send a Fonlok Invoice
            </h2>
            <p>
              Create a free account on Fonlok, set your invoice amount and
              description, and share the payment link with your client. They pay
              via MTN MoMo or Orange Money — the funds go into escrow, not
              directly to you.
            </p>
            <p>
              Once you deliver the work and the client confirms it, Fonlok
              releases the full payment to your MoMo account (minus the 3%
              platform fee). Both of you are protected throughout the entire
              process.
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
              Option 2 — Milestone-Based Invoices for Long Projects
            </h2>
            <p>
              For larger projects, Fonlok supports milestone payments. You break
              the project into stages, each with its own payment and deadline.
              The client pays upfront for all milestones, but funds are released
              to you one milestone at a time as you complete each stage.
            </p>
            <p>
              This is ideal for web development, design, construction, or any
              project where the work happens in phases.
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
              How to Look More Professional to Clients
            </h2>
            <p>
              Sending a Fonlok payment link instead of your personal MoMo number
              signals professionalism. Your client sees a structured invoice with
              your business name, the amount, the description, and a secure
              payment form. It removes the awkwardness of asking for money and
              builds trust before the first payment arrives.
            </p>
            <p>
              You can also add your logo and a description of what the payment
              covers — making every invoice a professional document.
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
              What If the Client Disputes the Work?
            </h2>
            <p>
              Fonlok includes a built-in dispute system. If a client refuses to
              release payment after delivery, you can open a dispute. Fonlok
              reviews the evidence from both sides and makes a final decision on
              whether to release or refund the funds.
            </p>
            <p>
              This is far better than the alternative — trying to recover money
              from a non-paying client with no paper trail and no platform
              support.
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
                Get paid safely, starting today
              </p>
              <p
                style={{
                  margin: "0 0 1.25rem",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "0.9rem",
                  lineHeight: 1.65,
                }}
              >
                Create your free Fonlok account and send your first protected
                invoice in under two minutes.
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
