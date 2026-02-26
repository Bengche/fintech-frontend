import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import FAQAccordion from "./FAQAccordion";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("FAQ.meta");
  return {
    title: t("title"),
    description: t("description"),
    keywords: [
      "Fonlok FAQ",
      "escrow questions Cameroon",
      "how does escrow work",
      "Fonlok questions",
    ],
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: "https://fonlok.com/faq",
      siteName: "Fonlok",
      type: "website",
    },
    alternates: { canonical: "https://fonlok.com/faq" },
  };
}

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
      name: "Who pays the Fonlok fee â€” buyer or seller?",
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

export default async function FAQPage() {
  const t = await getTranslations("FAQ");

  const FAQ_SECTIONS = [
    {
      heading: t("sections.basics.heading"),
      items: [
        {
          q: t("sections.basics.items.0.q"),
          a: t("sections.basics.items.0.a"),
        },
        {
          q: t("sections.basics.items.1.q"),
          a: t("sections.basics.items.1.a"),
        },
        {
          q: t("sections.basics.items.2.q"),
          a: t("sections.basics.items.2.a"),
        },
        {
          q: t("sections.basics.items.3.q"),
          a: t("sections.basics.items.3.a"),
        },
      ],
    },
    {
      heading: t("sections.payments.heading"),
      items: [
        {
          q: t("sections.payments.items.0.q"),
          a: t("sections.payments.items.0.a"),
        },
        {
          q: t("sections.payments.items.1.q"),
          a: t("sections.payments.items.1.a"),
        },
        {
          q: t("sections.payments.items.2.q"),
          a: t("sections.payments.items.2.a"),
        },
        {
          q: t("sections.payments.items.3.q"),
          a: t("sections.payments.items.3.a"),
        },
      ],
    },
    {
      heading: t("sections.disputes.heading"),
      items: [
        {
          q: t("sections.disputes.items.0.q"),
          a: t("sections.disputes.items.0.a"),
        },
        {
          q: t("sections.disputes.items.1.q"),
          a: t("sections.disputes.items.1.a"),
        },
        {
          q: t("sections.disputes.items.2.q"),
          a: t("sections.disputes.items.2.a"),
        },
        {
          q: t("sections.disputes.items.3.q"),
          a: t("sections.disputes.items.3.a"),
        },
      ],
    },
    {
      heading: t("sections.accounts.heading"),
      items: [
        {
          q: t("sections.accounts.items.0.q"),
          a: t("sections.accounts.items.0.a"),
        },
        {
          q: t("sections.accounts.items.1.q"),
          a: t("sections.accounts.items.1.a"),
        },
        {
          q: t("sections.accounts.items.2.q"),
          a: t("sections.accounts.items.2.a"),
        },
      ],
    },
  ];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <SiteHeader />

      <main>
        {/* â”€â”€ PAGE HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
              {t("hero.h1")}
            </h1>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.75,
              }}
            >
              {t("hero.description")}{" "}
              <Link
                href="/contact"
                style={{
                  color: "var(--color-accent)",
                  textDecoration: "underline",
                  fontWeight: 600,
                }}
              >
                {t("hero.contactLink")}
              </Link>
              .
            </p>
          </div>
        </section>

        {/* â”€â”€ FAQ SECTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

        {/* â”€â”€ BOTTOM CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
              {t("bottomCta.heading")}
            </h2>
            <p
              style={{
                fontSize: "1rem",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "2rem",
              }}
            >
              {t("bottomCta.description")}
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
                {t("bottomCta.ctaPrimary")}
              </Link>
              <Link
                href="/register"
                className="btn-ghost"
                style={{
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.3)",
                }}
              >
                {t("bottomCta.ctaSecondary")}
              </Link>
            </div>
          </div>
        </section>
      </main>

    </>
  );
}
