import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("HowItWorks.meta");
  return {
    title: t("title"),
    description: t("description"),
    keywords: [
      "how escrow works Cameroon",
      "Fonlok guide",
      "secure payment guide",
      "MTN escrow how to",
      "comment fonctionne Fonlok",
    ],
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: "https://fonlok.com/how-it-works",
      siteName: "Fonlok",
      type: "article",
    },
    alternates: { canonical: "https://fonlok.com/how-it-works" },
  };
}

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to use Fonlok for secure escrow payments in Cameroon",
  description:
    "A five-step guide to creating invoices, paying safely with Mobile Money, and releasing funds using Fonlok escrow.",
  totalTime: "PT5M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Create an invoice",
      text: "Log in to Fonlok, enter the buyer&#39;s email address, the agreed amount in XAF, and a short description of what you are selling. The invoice and a unique payment link are created instantly.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Share the payment link",
      text: "Copy the unique payment link Fonlok generated for your invoice and send it to your buyer by WhatsApp, SMS, or any messaging app. No account needed on their end.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Buyer pays with Mobile Money",
      text: "The buyer opens the link and pays using MTN Mobile Money or Orange Money. The money goes into Fonlok&#39;s secure escrow account — not directly to the seller yet.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Deliver the goods or service",
      text: "Once Fonlok confirms the payment, the seller is notified and delivers whatever was agreed — physical goods, a service, digital files, or anything else.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Confirm delivery and receive payment",
      text: "The buyer marks the order as received. Fonlok immediately releases the money to the seller&#39;s Mobile Money account, minus the 3% service fee.",
    },
  ],
};

export default async function HowItWorksPage() {
  const t = await getTranslations("HowItWorks");
  const STEPS = [
    {
      step: "1",
      who: t("steps.1.who"),
      title: t("steps.1.title"),
      desc: t("steps.1.desc"),
    },
    {
      step: "2",
      who: t("steps.2.who"),
      title: t("steps.2.title"),
      desc: t("steps.2.desc"),
    },
    {
      step: "3",
      who: t("steps.3.who"),
      title: t("steps.3.title"),
      desc: t("steps.3.desc"),
    },
    {
      step: "4",
      who: t("steps.4.who"),
      title: t("steps.4.title"),
      desc: t("steps.4.desc"),
    },
    {
      step: "5",
      who: t("steps.5.who"),
      title: t("steps.5.title"),
      desc: t("steps.5.desc"),
    },
  ];
  const SAFETY_QA = [
    { q: t("edgeCases.items.0.q"), a: t("edgeCases.items.0.a") },
    { q: t("edgeCases.items.1.q"), a: t("edgeCases.items.1.a") },
    { q: t("edgeCases.items.2.q"), a: t("edgeCases.items.2.a") },
    { q: t("edgeCases.items.3.q"), a: t("edgeCases.items.3.a") },
  ];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
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
          <div className="page-wrapper" style={{ maxWidth: "640px" }}>
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
              {t("hero.description")}
            </p>
          </div>
        </section>

        {/* ── FIVE STEPS ──────────────────────────────── */}
        <section
          style={{
            backgroundColor: "var(--color-cloud)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "720px" }}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              {STEPS.map((step, index) => (
                <div
                  key={step.step}
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    alignItems: "flex-start",
                  }}
                >
                  {/* Step number + connector line */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-primary)",
                        color: "var(--color-accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "0.9375rem",
                        flexShrink: 0,
                      }}
                    >
                      {step.step}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        style={{
                          width: "2px",
                          flex: 1,
                          minHeight: "2.5rem",
                          backgroundColor: "var(--color-border)",
                          marginTop: "0.5rem",
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      paddingBottom: index < STEPS.length - 1 ? "1.5rem" : 0,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--color-accent)",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {step.who}
                    </p>
                    <h2
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 700,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {step.title}
                    </h2>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.9375rem",
                        color: "var(--color-text-body)",
                        lineHeight: 1.75,
                      }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SAFETY Q&A ──────────────────────────────── */}
        <section
          style={{
            backgroundColor: "var(--color-white)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "720px" }}>
            <h2
              style={{
                fontSize: "clamp(1.375rem, 3vw, 1.75rem)",
                marginBottom: "2.5rem",
              }}
            >
              {t("edgeCases.heading")}
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.75rem",
              }}
            >
              {SAFETY_QA.map((item) => (
                <div
                  key={item.q}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "var(--color-cloud)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: "0.5rem",
                      color: "var(--color-primary)",
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
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────── */}
        <section
          style={{
            backgroundColor: "var(--color-mist)",
            padding: "5rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "560px" }}>
            <h2
              style={{
                fontSize: "clamp(1.375rem, 3vw, 1.875rem)",
                marginBottom: "1rem",
              }}
            >
              {t("cta.heading")}
            </h2>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--color-text-muted)",
                marginBottom: "2rem",
                lineHeight: 1.75,
              }}
            >
              {t("cta.description")}
            </p>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/register"
                className="btn-primary"
                style={{ fontSize: "1rem" }}
              >
                {t("cta.ctaPrimary")}
              </Link>
              <Link
                href="/faq"
                className="btn-ghost"
                style={{ fontSize: "1rem" }}
              >
                {t("cta.ctaSecondary")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
