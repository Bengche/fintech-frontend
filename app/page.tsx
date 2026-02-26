/**
 * Landing page â€” the main marketing page for Fonlok.
 *
 * SEO: This is a server component so metadata is statically embedded in the HTML.
 * The page uses SiteHeader (the public-facing nav) for the landing page chrome.
 * SiteFooter is injected globally by LayoutShell in the root layout.
 */
import type { Metadata } from "next";
import Link from "next/link";
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

            {/* Hero illustration */}
            <div
              aria-hidden="true"
              className="lp-hero-illo"
              style={{
                flex: "0 1 380px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}
            >
              <HeroIllustration />
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
function HeroIllustration() {
  return (
    <svg
      width="340"
      height="490"
      viewBox="0 0 340 490"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Fonlok app on a smartphone"
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="58%" r="52%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c1932" />
          <stop offset="100%" stopColor="#0e2140" />
        </linearGradient>
        <linearGradient id="titanium" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3c3c52" />
          <stop offset="35%" stopColor="#242438" />
          <stop offset="65%" stopColor="#1c1c2e" />
          <stop offset="100%" stopColor="#111120" />
        </linearGradient>
        <linearGradient id="titaniumH" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#48485e" />
          <stop offset="50%" stopColor="#252535" />
          <stop offset="100%" stopColor="#181828" />
        </linearGradient>
        <linearGradient id="screenGlare" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.09)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id="escrowGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#193558" />
          <stop offset="100%" stopColor="#0c2040" />
        </linearGradient>
        <filter id="phoneShadow" x="-18%" y="-7%" width="136%" height="128%">
          <feDropShadow dx="0" dy="26" stdDeviation="34" floodColor="#000" floodOpacity="0.62" />
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000" floodOpacity="0.28" />
        </filter>
        <filter id="cardShadow" x="-15%" y="-15%" width="130%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.28" />
        </filter>
        <filter id="pillShadow" x="-25%" y="-40%" width="150%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#000" floodOpacity="0.48" />
        </filter>
        <clipPath id="screenClip">
          <rect x="91" y="50" width="158" height="374" rx="24" />
        </clipPath>
      </defs>

      {/* ── Ambient glow ── */}
      <ellipse cx="170" cy="295" rx="168" ry="142" fill="url(#bgGlow)" />

      {/* ── Phone body ── */}
      <g filter="url(#phoneShadow)">
        {/* Outer titanium frame */}
        <rect x="78" y="16" width="184" height="458" rx="44" fill="url(#titanium)" />
        {/* Frame border highlight */}
        <rect
          x="78" y="16" width="184" height="458" rx="44"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1.5"
        />
        {/* Left-edge specular highlight */}
        <rect x="78" y="16" width="8" height="458" rx="4"
          fill="url(#titaniumH)"
          opacity="0.6"
        />
        {/* Black glass front face */}
        <rect x="83" y="21" width="174" height="448" rx="40" fill="#080d1c" />
        {/* Screen surface */}
        <rect x="91" y="50" width="158" height="374" rx="24" fill="url(#screenGrad)" />

        {/* ── Side buttons ── */}
        {/* Action button */}
        <rect x="78" y="114" width="4.5" height="20" rx="2.25" fill="#2b2b42" />
        <rect x="79.5" y="115" width="1.5" height="18" rx="0.75" fill="rgba(255,255,255,0.07)" />
        {/* Volume up */}
        <rect x="78" y="144" width="4.5" height="40" rx="2.25" fill="#2b2b42" />
        <rect x="79.5" y="145" width="1.5" height="38" rx="0.75" fill="rgba(255,255,255,0.07)" />
        {/* Volume down */}
        <rect x="78" y="194" width="4.5" height="40" rx="2.25" fill="#2b2b42" />
        <rect x="79.5" y="195" width="1.5" height="38" rx="0.75" fill="rgba(255,255,255,0.07)" />
        {/* Power button */}
        <rect x="257.5" y="156" width="4.5" height="70" rx="2.25" fill="#2b2b42" />
        <rect x="259" y="157" width="1.5" height="68" rx="0.75" fill="rgba(255,255,255,0.07)" />

        {/* ── Bottom edge hardware ── */}
        <circle cx="130" cy="465" r="1.3" fill="#0e0e20" />
        <circle cx="136" cy="465" r="1.3" fill="#0e0e20" />
        <circle cx="142" cy="465" r="1.3" fill="#0e0e20" />
        {/* USB-C port */}
        <rect x="155" y="461" width="30" height="8" rx="4" fill="#0a0a18" />
        <rect x="157.5" y="462.5" width="25" height="5" rx="2.5" fill="#060610" />
        <circle cx="198" cy="465" r="1.3" fill="#0e0e20" />
        <circle cx="204" cy="465" r="1.3" fill="#0e0e20" />
        <circle cx="210" cy="465" r="1.3" fill="#0e0e20" />
      </g>

      {/* ── Screen content ── */}
      <g clipPath="url(#screenClip)">

        {/* Status bar */}
        <rect x="91" y="50" width="158" height="24" fill="#07101e" />
        <text x="102" y="65" fontSize="8" fontWeight="700" fill="rgba(255,255,255,0.88)" fontFamily="system-ui,sans-serif">9:41</text>
        {/* WiFi bars */}
        <rect x="209" y="61" width="3" height="5" rx="1" fill="rgba(255,255,255,0.28)" />
        <rect x="214" y="59" width="3" height="7" rx="1" fill="rgba(255,255,255,0.55)" />
        <rect x="219" y="57" width="3" height="9" rx="1" fill="rgba(255,255,255,0.88)" />
        {/* Battery */}
        <rect x="226" y="58" width="14" height="8" rx="2" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <rect x="240" y="60.5" width="2" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
        <rect x="227.5" y="59.5" width="10" height="5" rx="1" fill="#22c55e" />

        {/* Dynamic Island */}
        <rect x="143" y="55" width="54" height="16" rx="8" fill="#000" />
        {/* Front camera inside island */}
        <circle cx="187" cy="63" r="3.5" fill="#0a0a0a" />
        <circle cx="187" cy="63" r="2" fill="#111" />
        <circle cx="185.8" cy="61.8" r="0.6" fill="rgba(255,255,255,0.14)" />

        {/* App header */}
        <rect x="91" y="74" width="158" height="44" fill="#0b1a30" />
        <rect x="91" y="117" width="158" height="1" fill="rgba(255,255,255,0.05)" />
        {/* Logo mark */}
        <rect x="102" y="83" width="20" height="20" rx="6" fill="#F59E0B" />
        <text x="106.5" y="98" fontSize="13" fontWeight="900" fill="#0F1F3D" fontFamily="system-ui,sans-serif">F</text>
        {/* Wordmark */}
        <text x="127" y="97" fontSize="13" fontWeight="800" fill="#ffffff" fontFamily="system-ui,sans-serif" letterSpacing="-0.3">Fonlok</text>
        {/* Bell */}
        <circle cx="228" cy="92" r="10" fill="rgba(255,255,255,0.05)" />
        <path d="M228 86c-2.8 0-5 2-5 4.5V95l-1.5 1.5h13L233 95v-4.5C233 88 230.8 86 228 86z" fill="rgba(255,255,255,0.82)" />
        <rect x="226.5" y="97" width="3" height="1.8" rx="0.9" fill="rgba(255,255,255,0.82)" />
        <circle cx="233" cy="85.5" r="3" fill="#F59E0B" />
        <text x="233" y="88.5" fontSize="5" fontWeight="800" fill="#0F1F3D" fontFamily="system-ui,sans-serif" textAnchor="middle">1</text>

        {/* Greeting strip */}
        <rect x="91" y="118" width="158" height="30" fill="#0c1d38" />
        <text x="102" y="131" fontSize="6.5" fill="rgba(255,255,255,0.42)" fontFamily="system-ui,sans-serif">Wednesday · Feb 26</text>
        <text x="102" y="143" fontSize="9" fontWeight="700" fill="#ffffff" fontFamily="system-ui,sans-serif">Good morning, Jean 👋</text>

        {/* Escrow balance card */}
        <rect x="99" y="155" width="142" height="66" rx="12" fill="url(#escrowGrad)" filter="url(#cardShadow)" />
        <rect x="99" y="155" width="142" height="66" rx="12" fill="none" stroke="rgba(245,158,11,0.28)" strokeWidth="1" />
        {/* Shield icon */}
        <path d="M113 163l6.5 2.8v7.5c0 4.5-3.2 6.8-6.5 8.2c-3.3-1.4-6.5-3.7-6.5-8.2v-7.5z" fill="rgba(245,158,11,0.16)" />
        <path d="M113 164.5l5 2.2v6c0 3.5-2.5 5.5-5 6.8c-2.5-1.3-5-3.3-5-6.8v-6z" fill="#F59E0B" />
        <path d="M110.5 173l2 2 4-4" stroke="#0f1f3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <text x="126" y="168" fontSize="6" fill="rgba(255,255,255,0.45)" fontFamily="system-ui,sans-serif" letterSpacing="0.6">ESCROW BALANCE</text>
        <text x="126" y="182" fontSize="17" fontWeight="800" fill="#F59E0B" fontFamily="system-ui,sans-serif" letterSpacing="-0.5">245,000 XAF</text>
        <rect x="126" y="187" width="44" height="13" rx="6.5" fill="rgba(34,197,94,0.15)" />
        <text x="148" y="197" fontSize="5.5" fontWeight="700" fill="#22c55e" fontFamily="system-ui,sans-serif" textAnchor="middle">● SECURED</text>
        <text x="236" y="197" fontSize="6" fill="rgba(255,255,255,0.3)" fontFamily="system-ui,sans-serif" textAnchor="end">3 active</text>

        {/* Stats mini-cards */}
        <rect x="99" y="229" width="66" height="36" rx="9" fill="#101e34" />
        <text x="132" y="243" fontSize="6" fill="rgba(255,255,255,0.4)" fontFamily="system-ui,sans-serif" textAnchor="middle">Total Paid</text>
        <text x="132" y="257" fontSize="10" fontWeight="800" fill="#22c55e" fontFamily="system-ui,sans-serif" textAnchor="middle">1.2M</text>
        <rect x="175" y="229" width="66" height="36" rx="9" fill="#101e34" />
        <text x="208" y="243" fontSize="6" fill="rgba(255,255,255,0.4)" fontFamily="system-ui,sans-serif" textAnchor="middle">Active Jobs</text>
        <text x="208" y="257" fontSize="10" fontWeight="800" fill="#F59E0B" fontFamily="system-ui,sans-serif" textAnchor="middle">8</text>

        {/* Section header */}
        <text x="102" y="281" fontSize="7" fontWeight="700" fill="rgba(255,255,255,0.5)" fontFamily="system-ui,sans-serif" letterSpacing="0.5">RECENT INVOICES</text>
        <text x="237" y="281" fontSize="6.5" fill="rgba(245,158,11,0.75)" fontFamily="system-ui,sans-serif" textAnchor="end">See all →</text>

        {/* Invoice row 1 — PAID */}
        <rect x="99" y="287" width="142" height="34" rx="8" fill="#0f1c30" />
        <rect x="99" y="287" width="3.5" height="34" rx="1.75" fill="#22c55e" />
        <circle cx="116" cy="304" r="9" fill="#122040" />
        <text x="116" y="308" fontSize="7.5" fontWeight="700" fill="#60a5fa" fontFamily="system-ui,sans-serif" textAnchor="middle">WD</text>
        <text x="130" y="299" fontSize="7.5" fontWeight="600" fill="#f1f5f9" fontFamily="system-ui,sans-serif">Website Design</text>
        <text x="130" y="311" fontSize="6" fill="rgba(255,255,255,0.32)" fontFamily="system-ui,sans-serif">INV-2025-0041</text>
        <rect x="187" y="294" width="27" height="11" rx="5.5" fill="rgba(34,197,94,0.16)" />
        <text x="200.5" y="303" fontSize="5.5" fontWeight="700" fill="#22c55e" fontFamily="system-ui,sans-serif" textAnchor="middle">PAID</text>
        <text x="236" y="299" fontSize="8" fontWeight="700" fill="#F59E0B" fontFamily="system-ui,sans-serif" textAnchor="end">75,000</text>
        <text x="236" y="311" fontSize="5.5" fill="rgba(255,255,255,0.28)" fontFamily="system-ui,sans-serif" textAnchor="end">XAF</text>

        {/* Invoice row 2 — PENDING */}
        <rect x="99" y="327" width="142" height="34" rx="8" fill="#0f1c30" />
        <rect x="99" y="327" width="3.5" height="34" rx="1.75" fill="#F59E0B" />
        <circle cx="116" cy="344" r="9" fill="#21190a" />
        <text x="116" y="348" fontSize="7.5" fontWeight="700" fill="#F59E0B" fontFamily="system-ui,sans-serif" textAnchor="middle">LP</text>
        <text x="130" y="339" fontSize="7.5" fontWeight="600" fill="#f1f5f9" fontFamily="system-ui,sans-serif">Logo Package</text>
        <text x="130" y="351" fontSize="6" fill="rgba(255,255,255,0.32)" fontFamily="system-ui,sans-serif">INV-2025-0042</text>
        <rect x="179" y="334" width="38" height="11" rx="5.5" fill="rgba(245,158,11,0.16)" />
        <text x="198" y="343" fontSize="5.5" fontWeight="700" fill="#F59E0B" fontFamily="system-ui,sans-serif" textAnchor="middle">PENDING</text>
        <text x="236" y="339" fontSize="8" fontWeight="700" fill="#F59E0B" fontFamily="system-ui,sans-serif" textAnchor="end">35,000</text>
        <text x="236" y="351" fontSize="5.5" fill="rgba(255,255,255,0.28)" fontFamily="system-ui,sans-serif" textAnchor="end">XAF</text>

        {/* Invoice row 3 — IN ESCROW */}
        <rect x="99" y="367" width="142" height="34" rx="8" fill="#0f1c30" />
        <rect x="99" y="367" width="3.5" height="34" rx="1.75" fill="#818cf8" />
        <circle cx="116" cy="384" r="9" fill="#181830" />
        <text x="116" y="388" fontSize="7.5" fontWeight="700" fill="#818cf8" fontFamily="system-ui,sans-serif" textAnchor="middle">SM</text>
        <text x="130" y="379" fontSize="7.5" fontWeight="600" fill="#f1f5f9" fontFamily="system-ui,sans-serif">Social Media</text>
        <text x="130" y="391" fontSize="6" fill="rgba(255,255,255,0.32)" fontFamily="system-ui,sans-serif">INV-2025-0043</text>
        <rect x="178" y="374" width="42" height="11" rx="5.5" fill="rgba(129,140,248,0.16)" />
        <text x="199" y="383" fontSize="5.5" fontWeight="700" fill="#818cf8" fontFamily="system-ui,sans-serif" textAnchor="middle">IN ESCROW</text>
        <text x="236" y="379" fontSize="8" fontWeight="700" fill="#F59E0B" fontFamily="system-ui,sans-serif" textAnchor="end">50,000</text>
        <text x="236" y="391" fontSize="5.5" fill="rgba(255,255,255,0.28)" fontFamily="system-ui,sans-serif" textAnchor="end">XAF</text>

        {/* Bottom navigation */}
        <rect x="91" y="404" width="158" height="42" fill="#070c1a" />
        <rect x="91" y="404" width="158" height="1" fill="rgba(255,255,255,0.07)" />
        {/* Home — active */}
        <rect x="102" y="410" width="30" height="26" rx="7" fill="rgba(245,158,11,0.14)" />
        <path d="M117 413.5l8 7v8h-5.5v-5.5h-5v5.5H109v-8z" fill="#F59E0B" />
        <text x="117" y="436" fontSize="5.5" fontWeight="600" fill="#F59E0B" fontFamily="system-ui,sans-serif" textAnchor="middle">Home</text>
        {/* Invoices */}
        <g opacity="0.4">
          <rect x="149" y="415" width="10" height="14" rx="2" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
          <line x1="151.5" y1="419" x2="156.5" y2="419" stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round" />
          <line x1="151.5" y1="422.5" x2="156.5" y2="422.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round" />
          <line x1="151.5" y1="426" x2="155" y2="426" stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round" />
          <text x="154" y="436" fontSize="5.5" fill="rgba(255,255,255,0.4)" fontFamily="system-ui,sans-serif" textAnchor="middle">Invoice</text>
        </g>
        {/* Chat */}
        <g opacity="0.4">
          <path d="M193 414h13c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2h-7l-4 3v-3c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2z" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
          <text x="200" y="436" fontSize="5.5" fill="rgba(255,255,255,0.4)" fontFamily="system-ui,sans-serif" textAnchor="middle">Chat</text>
        </g>
        {/* Profile */}
        <g opacity="0.4">
          <circle cx="226" cy="419" r="4" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
          <path d="M219 430c0-3.9 3.1-7 7-7s7 3.1 7 7" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round" />
          <text x="226" y="436" fontSize="5.5" fill="rgba(255,255,255,0.4)" fontFamily="system-ui,sans-serif" textAnchor="middle">Me</text>
        </g>
        {/* Home indicator */}
        <rect x="149" y="442" width="42" height="3.5" rx="1.75" fill="rgba(255,255,255,0.11)" />
      </g>

      {/* Screen glass glare */}
      <rect x="91" y="50" width="158" height="374" rx="24" fill="url(#screenGlare)" />

      {/* ── Floating toast — Payment Confirmed ── */}
      <g filter="url(#pillShadow)" transform="translate(-32, 46)">
        <rect x="14" y="198" width="144" height="46" rx="14" fill="#0d1b36" stroke="rgba(245,158,11,0.32)" strokeWidth="1.2" />
        <circle cx="41" cy="221" r="13" fill="rgba(34,197,94,0.10)" />
        <circle cx="41" cy="221" r="9" fill="#22c55e" />
        <path d="M37 221.5l3 3 5.5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <text x="58" y="215" fontSize="8.5" fontWeight="700" fill="#ffffff" fontFamily="system-ui,sans-serif">Payment Confirmed</text>
        <text x="58" y="227" fontSize="7" fill="rgba(255,255,255,0.48)" fontFamily="system-ui,sans-serif">75,000 XAF in escrow</text>
        <rect x="108" y="219" width="36" height="13" rx="4.5" fill="rgba(245,158,11,0.16)" />
        <text x="126" y="229" fontSize="6" fontWeight="700" fill="#F59E0B" fontFamily="system-ui,sans-serif" textAnchor="middle">MTN MoMo</text>
      </g>

      {/* ── Floating badge — Funds Safe ── */}
      <g filter="url(#pillShadow)" transform="translate(161, -12)">
        <rect x="14" y="338" width="118" height="46" rx="14" fill="#0d1e3a" stroke="rgba(245,158,11,0.26)" strokeWidth="1.2" />
        <path d="M33 347l7 3v8c0 5-3.5 7.5-7 9c-3.5-1.5-7-4-7-9v-8z" fill="rgba(245,158,11,0.14)" />
        <path d="M33 348.5l5.5 2.5v6.5c0 4-2.8 6-5.5 7.3c-2.7-1.3-5.5-3.3-5.5-7.3v-6.5z" fill="#F59E0B" />
        <path d="M30.5 357l2 2 4-4" stroke="#0f1f3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <text x="46" y="353" fontSize="8.5" fontWeight="700" fill="#ffffff" fontFamily="system-ui,sans-serif">Funds Safe</text>
        <text x="46" y="365" fontSize="7" fill="rgba(245,158,11,0.82)" fontFamily="system-ui,sans-serif">in Escrow ✓</text>
      </g>

      {/* ── Decorative sparkles ── */}
      <g fill="#F59E0B" opacity="0.52">
        <circle cx="65"  cy="84"  r="2.2" />
        <circle cx="276" cy="148" r="1.6" />
        <circle cx="57"  cy="348" r="1.8" />
        <circle cx="289" cy="396" r="2"   />
        <circle cx="72"  cy="450" r="1.2" />
        <circle cx="272" cy="60"  r="1.2" />
      </g>
      <g stroke="rgba(245,158,11,0.36)" strokeWidth="1.2" strokeLinecap="round">
        <line x1="42"  y1="198" x2="42"  y2="208" /><line x1="37"  y1="203" x2="47"  y2="203" />
        <line x1="300" y1="296" x2="300" y2="306" /><line x1="295" y1="301" x2="305" y2="301" />
      </g>
    </svg>
  );
}

