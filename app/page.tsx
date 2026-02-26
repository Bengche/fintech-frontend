/**
 * Landing page â€” the main marketing page for Fonlok.
 *
 * SEO: This is a server component so metadata is statically embedded in the HTML.
 * The page uses SiteHeader (the public-facing nav) for the landing page chrome.
 * SiteFooter is injected globally by LayoutShell in the root layout.
 */
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "./components/SiteHeader";
import BenefitsSlider from "./components/BenefitsSlider";
import HeroStatsTabs from "./components/HeroStatsTabs";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Landing.meta");
  return {
    title: t("title"),
    description: t("description"),
    keywords: [
      "escrow Cameroon",
      "secure payment Cameroon",
      "MTN Mobile Money escrow",
      "Orange Money escrow",
      "safe online payment Cameroon",
      "Fonlok",
      "paiement sÃ©curisÃ© Cameroun",
    ],
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: "https://fonlok.com",
      siteName: "Fonlok",
      type: "website",
    },
    alternates: { canonical: "https://fonlok.com" },
  };
}

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Fonlok",
  url: "https://fonlok.com",
  logo: "https://fonlok.com/logo.png",
  description:
    "Fonlok is a secure escrow payment platform for Cameroon, supporting MTN Mobile Money and Orange Money.",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: "https://fonlok.com/contact",
    availableLanguage: ["English", "French"],
  },
  areaServed: { "@type": "Country", name: "Cameroon" },
  sameAs: ["https://fonlok.com"],
};

export default async function LandingPage() {
  const t = await getTranslations("Landing");
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <SiteHeader />

      <main>
        {/* â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section
          aria-label="Hero"
          className="lp-hero"
          style={{
            backgroundColor: "var(--color-primary)",
            padding: "5rem 1.5rem",
          }}
        >
          <div
            className="page-wrapper lp-hero-inner"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "3rem",
              flexWrap: "wrap",
            }}
          >
            {/* Text */}
            <div
              className="lp-hero-text"
              style={{ flex: "1 1 320px", maxWidth: "580px" }}
            >
              <p
                style={{
                  display: "inline-block",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--color-accent)",
                  marginBottom: "1rem",
                }}
              >
                {t("hero.badge")}
              </p>

              <h1
                style={{
                  fontSize: "clamp(2rem, 5vw, 3rem)",
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1.15,
                  marginBottom: "1.25rem",
                }}
              >
                {t("hero.h1Part1")}{" "}
                <span style={{ color: "var(--color-accent)" }}>
                  {t("hero.h1Part2")}
                </span>
              </h1>

              <p
                style={{
                  fontSize: "1.0625rem",
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 1.75,
                  marginBottom: "2rem",
                  maxWidth: "480px",
                }}
              >
                {t("hero.description")}
              </p>

              <div
                className="lp-hero-cta"
                style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}
              >
                <Link
                  href="/register"
                  className="btn-accent"
                  style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}
                >
                  {t("hero.ctaPrimary")}
                </Link>
                <Link
                  href="/how-it-works"
                  className="btn-outline-white"
                  style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}
                >
                  {t("hero.ctaSecondary")}
                </Link>
              </div>

              {/* â”€â”€ Selling-point tabs â”€â”€ */}
              <HeroStatsTabs
                tabs={[
                  {
                    value: t("hero.stats.free.value"),
                    label: t("hero.stats.free.label"),
                    detail: t("hero.stats.free.detail"),
                  },
                  {
                    value: t("hero.stats.fee.value"),
                    label: t("hero.stats.fee.label"),
                    detail: t("hero.stats.fee.detail"),
                  },
                  {
                    value: t("hero.stats.momo.value"),
                    label: t("hero.stats.momo.label"),
                    detail: t("hero.stats.momo.detail"),
                  },
                ]}
              />
            </div>

            {/* Hero image */}
            <div
              className="lp-hero-illo"
              style={{
                flex: "0 1 420px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}
            >
              {/* Soft ambient glow behind image */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: "-10%",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(ellipse at 50% 60%, rgba(245,158,11,0.18) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
              <Image
                src="/fonlok_hero_image.png"
                alt="Fonlok escrow app — secure payments on mobile"
                width={480}
                height={480}
                priority
                sizes="(max-width: 640px) 80vw, (max-width: 1024px) 42vw, 460px"
                style={{
                  width: "100%",
                  height: "auto",
                  maxWidth: "460px",
                  borderRadius: "28px",
                  filter:
                    "drop-shadow(0 32px 56px rgba(0,0,0,0.42)) drop-shadow(0 8px 16px rgba(0,0,0,0.22))",
                  position: "relative",
                  zIndex: 1,
                }}
              />
            </div>
          </div>
        </section>

        {/* â”€â”€ HOW IT WORKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section
          aria-label="How it works"
          className="lp-section"
          style={{
            backgroundColor: "var(--color-cloud)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper">
            <div
              className="lp-section-header"
              style={{ textAlign: "center", marginBottom: "3rem" }}
            >
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  marginBottom: "0.75rem",
                }}
              >
                {t("howItWorks.heading")}
              </h2>
              <p
                style={{
                  fontSize: "1rem",
                  color: "var(--color-text-muted)",
                  maxWidth: "460px",
                  margin: "0 auto",
                }}
              >
                {t("howItWorks.subheading")}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1.5rem",
                maxWidth: "900px",
                margin: "0 auto",
              }}
            >
              {HOW_IT_WORKS_STEPS(t).map((item) => (
                <div
                  key={item.step}
                  className="card"
                  style={{ paddingTop: "1.75rem" }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "2rem",
                      height: "2rem",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-accent)",
                      fontWeight: 800,
                      fontSize: "0.875rem",
                      marginBottom: "1rem",
                    }}
                  >
                    {item.step}
                  </span>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.7,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
              <Link
                href="/how-it-works"
                className="btn-ghost"
                style={{ fontSize: "0.9375rem" }}
              >
                {t("howItWorks.readGuide")}
              </Link>
            </div>
          </div>
        </section>

        {/* â”€â”€ WHY FONLOK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section
          aria-label="Benefits"
          className="lp-section"
          style={{
            backgroundColor: "var(--color-white)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper">
            <div
              className="lp-section-header"
              style={{ textAlign: "center", marginBottom: "3rem" }}
            >
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  marginBottom: "0.75rem",
                }}
              >
                {t("benefits.heading")}
              </h2>
              <p
                style={{
                  fontSize: "1rem",
                  color: "var(--color-text-muted)",
                  maxWidth: "440px",
                  margin: "0 auto",
                }}
              >
                {t("benefits.subheading")}
              </p>
            </div>

            <BenefitsSlider items={BENEFITS(t)} />
          </div>
        </section>

        {/* â”€â”€ PRICING PREVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section
          aria-label="Pricing"
          className="lp-section"
          style={{
            backgroundColor: "var(--color-mist)",
            padding: "5rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "640px" }}>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                marginBottom: "0.75rem",
              }}
            >
              {t("pricing.heading")}
            </h2>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--color-text-muted)",
                marginBottom: "2.5rem",
              }}
            >
              {t("pricing.subheading")}
            </p>

            <div
              className="card"
              style={{
                display: "inline-block",
                textAlign: "left",
                width: "100%",
                maxWidth: "400px",
                padding: "2rem",
              }}
            >
              <p
                style={{
                  fontSize: "3.5rem",
                  fontWeight: 900,
                  color: "var(--color-primary)",
                  margin: "0 0 0.25rem",
                  lineHeight: 1,
                }}
              >
                3%
              </p>
              <p
                style={{
                  fontSize: "1rem",
                  color: "var(--color-text-muted)",
                  marginBottom: "1.5rem",
                }}
              >
                {t("pricing.feeLabel")}
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {[
                  t("pricing.features.freeBuyers"),
                  t("pricing.features.freeAccount"),
                  t("pricing.features.noMonthlyFee"),
                  t("pricing.features.momo"),
                  t("pricing.features.dispute"),
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.625rem",
                      fontSize: "0.9375rem",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--color-success)",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      âœ“
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                }}
              >
                {t("pricing.fullDetails")}
              </Link>
              <p
                style={{
                  margin: "1.25rem 0 0",
                  fontSize: "0.775rem",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.65,
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                {t("pricing.networkNote")}
              </p>
            </div>
          </div>
        </section>

        {/* â”€â”€ REFERRAL PROGRAM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section
          aria-label="Referral program"
          className="lp-section lp-referral-teaser"
          style={{
            background:
              "linear-gradient(135deg, #0F1F3D 0%, #1a2f4a 60%, #0F1F3D 100%)",
            padding: "5rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "640px" }}>
            {/* Badge */}
            <span
              style={{
                display: "inline-block",
                backgroundColor: "rgba(245,158,11,0.15)",
                border: "1px solid rgba(245,158,11,0.4)",
                color: "#F59E0B",
                borderRadius: "999px",
                padding: "0.375rem 1rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                marginBottom: "1.75rem",
              }}
            >
              {t("referral.badge")}
            </span>

            <h2
              style={{
                fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.2,
                marginBottom: "1.25rem",
              }}
            >
              {t("referral.heading")}{" "}
              <span style={{ color: "#F59E0B" }}>
                {t("referral.headingHighlight")}
              </span>
              <br />
              {t("referral.headingEnd")}
            </h2>

            <p
              style={{
                fontSize: "1.0625rem",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.8,
                marginBottom: "2.25rem",
                maxWidth: "520px",
                margin: "0 auto 2.25rem",
              }}
            >
              {t("referral.description")}{" "}
              <strong style={{ color: "rgba(255,255,255,0.9)" }}>
                {t("referral.descriptionHighlight")}
              </strong>{" "}
              {t("referral.descriptionEnd")}
            </p>

            <Link
              href="/referral-programme"
              className="btn-outline-white"
              style={{ fontSize: "0.9375rem", padding: "0.75rem 1.75rem" }}
            >
              {t("referral.learnMore")}
            </Link>
          </div>
        </section>

        {/* â”€â”€ FINAL CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section
          aria-label="Call to action"
          className="lp-section"
          style={{
            backgroundColor: "var(--color-primary)",
            padding: "5rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "580px" }}>
            <h2
              style={{
                fontSize: "clamp(1.625rem, 4vw, 2.25rem)",
                color: "#ffffff",
                marginBottom: "1rem",
              }}
            >
              {t("finalCta.heading")}
            </h2>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "2rem",
                lineHeight: 1.75,
              }}
            >
              {t("finalCta.description")}
            </p>
            <div
              className="lp-cta-buttons"
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/register"
                className="btn-accent"
                style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}
              >
                {t("finalCta.ctaPrimary")}
              </Link>
              <Link
                href="/how-it-works"
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.8)",
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                }}
              >
                {t("finalCta.ctaSecondary")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

// â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const HOW_IT_WORKS_STEPS = (t: (key: string) => string) => [
  {
    step: "1",
    title: t("howItWorks.steps.1.title"),
    desc: t("howItWorks.steps.1.desc"),
  },
  {
    step: "2",
    title: t("howItWorks.steps.2.title"),
    desc: t("howItWorks.steps.2.desc"),
  },
  {
    step: "3",
    title: t("howItWorks.steps.3.title"),
    desc: t("howItWorks.steps.3.desc"),
  },
];

const BENEFITS = (t: (key: string) => string) => [
  {
    title: t("benefits.items.buyerProtection.title"),
    desc: t("benefits.items.buyerProtection.desc"),
  },
  {
    title: t("benefits.items.sellerGuarantee.title"),
    desc: t("benefits.items.sellerGuarantee.desc"),
  },
  {
    title: t("benefits.items.disputeResolution.title"),
    desc: t("benefits.items.disputeResolution.desc"),
  },
  {
    title: t("benefits.items.mobileMoney.title"),
    desc: t("benefits.items.mobileMoney.desc"),
  },
  {
    title: t("benefits.items.noHiddenCharges.title"),
    desc: t("benefits.items.noHiddenCharges.desc"),
  },
  {
    title: t("benefits.items.fullyOnline.title"),
    desc: t("benefits.items.fullyOnline.desc"),
  },
];

// â”€â”€ Hero illustration â€” Premium phone mockup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ── Hero illustration — Premium phone mockup ───────────────────────────────
