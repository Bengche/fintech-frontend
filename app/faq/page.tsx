import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import FAQAccordion from "./FAQAccordion";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions | Fonlok",
  description:
    "Answers to common questions about Fonlok — how escrow works, fees, payments, disputes, security, and more.",
  keywords: [
    "Fonlok FAQ",
    "escrow questions Cameroon",
    "how does escrow work",
    "Fonlok questions",
  ],
  openGraph: {
    title: "FAQ — Frequently Asked Questions | Fonlok",
    description: "Everything you need to know about using Fonlok safely.",
    url: "https://fonlok.com/faq",
    siteName: "Fonlok",
    type: "website",
  },
  alternates: { canonical: "https://fonlok.com/faq" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is escrow?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Escrow is a system where a trusted third party holds money until both sides of a deal are satisfied. The buyer pays in, and the money is only released to the seller once the buyer confirms they received what they paid for.",
      },
    },
    {
      "@type": "Question",
      name: "How does Fonlok work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The seller creates an invoice on Fonlok and shares a payment link with the buyer. The buyer pays using Mobile Money. Fonlok holds the funds. Once the buyer confirms delivery, Fonlok pays the seller. If there&#39;s a problem, Fonlok investigates.",
      },
    },
    {
      "@type": "Question",
      name: "Who pays the Fonlok fee — buyer or seller?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The seller pays a 3% fee on each transaction. Buyers pay the exact invoice amount with no additional charges from Fonlok.",
      },
    },
    {
      "@type": "Question",
      name: "Are there monthly fees or subscription plans?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Fonlok is completely free to sign up for and free to use. The only cost is the 3% fee when a transaction is completed.",
      },
    },
    {
      "@type": "Question",
      name: "What if there is a dispute?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Either party can open a dispute from their Fonlok dashboard. Fonlok freezes the funds and requests evidence from both sides. The team reviews everything and decides whether to release or refund the money.",
      },
    },
    {
      "@type": "Question",
      name: "Which payment methods are accepted?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Buyers can pay with MTN Mobile Money and Orange Money. Credit/debit cards are not currently supported.",
      },
    },
    {
      "@type": "Question",
      name: "Is creating an account free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Creating an account on Fonlok is free and takes less than two minutes.",
      },
    },
    {
      "@type": "Question",
      name: "Is Fonlok secure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All transactions are encrypted and funds held in escrow are ring-fenced. Fonlok uses secure payment processors and never stores sensitive payment credentials on its servers.",
      },
    },
  ],
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
              Frequently asked questions
            </h1>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.75,
              }}
            >
              Have a question not listed here?{" "}
              <Link
                href="/contact"
                style={{
                  color: "var(--color-accent)",
                  textDecoration: "underline",
                  fontWeight: 600,
                }}
              >
                Contact us
              </Link>
              .
            </p>
          </div>
        </section>

        {/* ── FAQ SECTIONS ────────────────────────────── */}
        <section
          style={{
            backgroundColor: "var(--color-cloud)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "720px" }}>
            {FAQ_SECTIONS.map((section) => (
              <div key={section.heading} style={{ marginBottom: "4rem" }}>
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                    marginBottom: "1.25rem",
                    paddingBottom: "0.625rem",
                    borderBottom: "2px solid var(--color-accent)",
                    display: "inline-block",
                  }}
                >
                  {section.heading}
                </h2>
                <FAQAccordion items={section.items} />
              </div>
            ))}
          </div>
        </section>

        {/* ── BOTTOM CTA ──────────────────────────────── */}
        <section
          style={{
            backgroundColor: "var(--color-primary)",
            padding: "4rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "520px" }}>
            <h2
              style={{
                fontSize: "clamp(1.375rem, 3vw, 1.75rem)",
                color: "#ffffff",
                marginBottom: "1rem",
              }}
            >
              Still have questions?
            </h2>
            <p
              style={{
                fontSize: "1rem",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "2rem",
              }}
            >
              Our team is available to help.
            </p>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link href="/contact" className="btn-accent">
                Get in touch
              </Link>
              <Link
                href="/register"
                className="btn-ghost"
                style={{
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.3)",
                }}
              >
                Create a free account
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

const FAQ_SECTIONS = [
  {
    heading: "The basics",
    items: [
      {
        q: "What is escrow?",
        a: "Escrow is a system where a trusted third party holds money until both sides of a deal are satisfied. The buyer pays in, and the money is only released to the seller once the buyer confirms they received what they paid for.",
      },
      {
        q: "How does Fonlok work?",
        a: "The seller creates an invoice on Fonlok and shares a payment link with the buyer. The buyer pays using Mobile Money. Fonlok holds the funds. Once the buyer confirms delivery, Fonlok pays the seller. If there's a problem, Fonlok investigates.",
      },
      {
        q: "Is Fonlok a bank?",
        a: "No. Fonlok is an escrow platform — we hold funds temporarily as a neutral party during a transaction. We are not a bank and do not offer interest or savings products.",
      },
      {
        q: "Can I use Fonlok from my phone?",
        a: "Yes. Fonlok works on any device with a web browser — smartphones, tablets, and computers.",
      },
    ],
  },
  {
    heading: "Payments & fees",
    items: [
      {
        q: "Which payment methods are accepted?",
        a: "Buyers can pay with MTN Mobile Money and Orange Money. Credit/debit cards are not currently supported.",
      },
      {
        q: "Who pays the Fonlok fee — buyer or seller?",
        a: "The seller pays a 3% fee on each transaction. Buyers pay the exact invoice amount with no additional charges from Fonlok.",
      },
      {
        q: "Are there monthly fees or subscription plans?",
        a: "No. Fonlok is completely free to sign up for and free to use. The only cost is the 3% fee when a transaction is completed.",
      },
      {
        q: "How long does it take to receive my money after delivery is confirmed?",
        a: "Fonlok initiates the payout immediately after the buyer confirms delivery. Depending on your mobile network, funds typically arrive within a few minutes to a few hours.",
      },
    ],
  },
  {
    heading: "Disputes & safety",
    items: [
      {
        q: "What if the buyer does not confirm delivery?",
        a: "If the buyer does not respond within the expected window, Fonlok will contact both parties to resolve the situation. We review all available evidence before making a final decision.",
      },
      {
        q: "What happens if there is a dispute?",
        a: "Either party can open a dispute from their Fonlok dashboard. We freeze the funds and request evidence from both sides — photos, messages, delivery confirmations, etc. Our team reviews everything and decides whether to release or refund the money.",
      },
      {
        q: "What if the seller does not deliver?",
        a: "The buyer can open a dispute. If the seller cannot prove delivery, Fonlok refunds the buyer in full.",
      },
      {
        q: "Is Fonlok secure?",
        a: "Yes. All transactions are encrypted and funds held in escrow are ring-fenced. We use secure payment processors and never store sensitive payment credentials on our servers.",
      },
    ],
  },
  {
    heading: "Accounts",
    items: [
      {
        q: "Is creating an account free?",
        a: "Yes. Creating an account on Fonlok is free and takes less than two minutes.",
      },
      {
        q: "Do I need an account to pay as a buyer?",
        a: "You can make a payment via the invoice link without an account. However, creating a free account gives you access to payment history, dispute management, and order tracking.",
      },
      {
        q: "How do I change my password or phone number?",
        a: "Log in to your account and go to Settings. From there you can update your phone number and change your password.",
      },
    ],
  },
];
