/**
 * Landing page — the main marketing page for Fonlok.
 *
 * SEO: This is a server component so metadata is statically embedded in the HTML.
 * The page imports client components (SiteHeader, SiteFooter) for the dynamic nav.
 */
import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
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
      "paiement sécurisé Cameroun",
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
        {/* ── HERO ─────────────────────────────────────────────────── */}
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
            <div className="lp-hero-text" style={{ flex: "1 1 320px", maxWidth: "580px" }}>
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

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <Link
                  href="/register"
                  className="btn-accent"
                  style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}
                >
                  {t("hero.ctaPrimary")}
                </Link>
                <Link
                  href="/how-it-works"
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.8)",
                    padding: "0.75rem 0",
                    textDecoration: "none",
                    borderBottom: "2px solid rgba(255,255,255,0.3)",
                  }}
                >
                  {t("hero.ctaSecondary")}
                </Link>
              </div>

              {/* Trust stats */}
              <div
                className="lp-trust-stats"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "2rem",
                  marginTop: "2.5rem",
                  paddingTop: "2rem",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {[
                  {
                    value: t("hero.stats.free.value"),
                    label: t("hero.stats.free.label"),
                  },
                  {
                    value: t("hero.stats.fee.value"),
                    label: t("hero.stats.fee.label"),
                  },
                  {
                    value: t("hero.stats.momo.value"),
                    label: t("hero.stats.momo.label"),
                  },
                ].map((item) => (
                  <div key={item.value}>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: "#ffffff",
                        margin: "0 0 0.125rem",
                      }}
                    >
                      {item.value}
                    </p>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "rgba(255,255,255,0.5)",
                        margin: 0,
                      }}
                    >
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
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

        {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
        <section
          aria-label="How it works"
          className="lp-section"
          style={{
            backgroundColor: "var(--color-cloud)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper">
            <div className="lp-section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
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

        {/* ── WHY FONLOK ───────────────────────────────────────────── */}
        <section
          aria-label="Benefits"
          className="lp-section"
          style={{
            backgroundColor: "var(--color-white)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper">
            <div className="lp-section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {BENEFITS(t).map((item) => (
                <div
                  key={item.title}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-cloud)",
                  }}
                >
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
          </div>
        </section>

        {/* ── PRICING PREVIEW ──────────────────────────────────────── */}
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
                      ✓
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

        {/* ── REFERRAL PROGRAM ─────────────────────────────────────── */}
        <section
          aria-label="Referral program"
          className="lp-section"
          style={{
            background:
              "linear-gradient(135deg, #0F1F3D 0%, #1a2f4a 60%, #0F1F3D 100%)",
            padding: "5rem 1.5rem",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Decorative amber blobs */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-80px",
              right: "-80px",
              width: "360px",
              height: "360px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: "-60px",
              left: "-60px",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            className="page-wrapper"
            style={{ position: "relative", zIndex: 1 }}
          >
            {/* Badge */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
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
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {t("referral.badge")}
              </span>
            </div>

            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <h2
                style={{
                  fontSize: "clamp(1.625rem, 4vw, 2.375rem)",
                  color: "#ffffff",
                  marginBottom: "1rem",
                  lineHeight: 1.25,
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
                  color: "rgba(255,255,255,0.65)",
                  maxWidth: "520px",
                  margin: "0 auto",
                  lineHeight: 1.75,
                }}
              >
                {t("referral.description")}{" "}
                <strong style={{ color: "rgba(255,255,255,0.88)" }}>
                  {t("referral.descriptionHighlight")}
                </strong>{" "}
                {t("referral.descriptionEnd")}
              </p>
            </div>

            {/* Feature cards */}
            <div
              className="lp-referral-cards"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.25rem",
                maxWidth: "860px",
                margin: "0 auto 3rem",
              }}
            >
              {([0, 1, 2] as const).map((i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "var(--radius-lg)",
                    padding: "1.75rem",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#ffffff",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {t(`referral.cards.${i}.title`)}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      color: "rgba(255,255,255,0.55)",
                      lineHeight: 1.7,
                    }}
                  >
                    {t(`referral.cards.${i}.desc`)}
                  </p>
                </div>
              ))}
            </div>

            {/* Example calculation */}
            <div
              className="lp-referral-box"
              style={{
                backgroundColor: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem 2rem",
                maxWidth: "560px",
                margin: "0 auto 3rem",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: "0.75rem",
                }}
              >
                {t("referral.exampleLabel")}
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "0.9875rem",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {t("referral.example")}{" "}
                <span style={{ color: "#F59E0B", fontWeight: 700 }}>
                  {t("referral.exampleHighlight")}
                </span>{" "}
                {t("referral.exampleEnd")}
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <Link
                href="/register"
                className="btn-accent"
                style={{ fontSize: "1rem", padding: "0.875rem 2.25rem" }}
              >
                {t("referral.cta")}
              </Link>
              <p
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: "0.8125rem",
                  marginTop: "1rem",
                }}
              >
                {t("referral.ctaNote")}
              </p>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────── */}
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

      <SiteFooter />
    </>
  );
}

// ── Data ────────────────────────────────────────────────────────

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

// ── Hero illustration — Premium phone mockup ─────────────────
function HeroIllustration() {
  return (
    <svg
      width="340"
      height="480"
      viewBox="0 0 340 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Fonlok dashboard displayed on a smartphone"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Ambient glow behind phone */}
        <radialGradient id="glow" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        {/* Screen gradient */}
        <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F1F3D" />
          <stop offset="100%" stopColor="#162847" />
        </linearGradient>
        {/* Glass glare */}
        <linearGradient id="glare" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Card shadow */}
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="6"
            floodColor="#000"
            floodOpacity="0.35"
          />
        </filter>
        {/* Phone outer shadow */}
        <filter id="phoneShadow" x="-15%" y="-8%" width="130%" height="125%">
          <feDropShadow
            dx="0"
            dy="20"
            stdDeviation="28"
            floodColor="#000"
            floodOpacity="0.55"
          />
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="8"
            floodColor="#000"
            floodOpacity="0.3"
          />
        </filter>
        {/* Floating pill shadow */}
        <filter id="pillShadow" x="-30%" y="-50%" width="160%" height="200%">
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="10"
            floodColor="#000"
            floodOpacity="0.4"
          />
        </filter>
        {/* Green dot glow */}
        <radialGradient id="greenGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <clipPath id="screenClip">
          <rect x="88" y="54" width="164" height="354" rx="6" />
        </clipPath>
      </defs>

      {/* ── Ambient glow ── */}
      <ellipse cx="170" cy="280" rx="170" ry="130" fill="url(#glow)" />

      {/* ── Phone body ── */}
      <g filter="url(#phoneShadow)">
        {/* Outer shell — titanium-dark */}
        <rect x="82" y="24" width="176" height="422" rx="36" fill="#1a1a2e" />
        {/* Inner bezel inset */}
        <rect x="86" y="28" width="168" height="414" rx="33" fill="#0d0d1a" />
        {/* Antenna line left */}
        <rect x="82" y="120" width="3" height="60" rx="1.5" fill="#2a2a3e" />
        {/* Antenna line right */}
        <rect x="255" y="160" width="3" height="80" rx="1.5" fill="#2a2a3e" />
        {/* Volume up */}
        <rect x="82" y="150" width="3" height="32" rx="1.5" fill="#333350" />
        {/* Volume down */}
        <rect x="82" y="192" width="3" height="32" rx="1.5" fill="#333350" />
        {/* Power button */}
        <rect x="255" y="170" width="3" height="48" rx="1.5" fill="#333350" />
      </g>

      {/* ── Screen ── */}
      <rect
        x="88"
        y="54"
        width="164"
        height="354"
        rx="6"
        fill="url(#screenGrad)"
      />

      {/* ── Status bar ── */}
      <g clipPath="url(#screenClip)">
        <rect x="88" y="54" width="164" height="22" fill="#0a1628" />
        {/* Time */}
        <text
          x="100"
          y="68"
          fontSize="8"
          fontWeight="700"
          fill="rgba(255,255,255,0.9)"
          fontFamily="system-ui,sans-serif"
        >
          9:41
        </text>
        {/* Signal dots */}
        <circle cx="220" cy="65" r="2" fill="rgba(255,255,255,0.8)" />
        <circle cx="226" cy="65" r="2" fill="rgba(255,255,255,0.8)" />
        <circle cx="232" cy="65" r="2" fill="rgba(255,255,255,0.5)" />
        {/* Battery */}
        <rect
          x="237"
          y="61"
          width="12"
          height="7"
          rx="1.5"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="0.8"
        />
        <rect
          x="249"
          y="63"
          width="1.5"
          height="3"
          rx="0.75"
          fill="rgba(255,255,255,0.5)"
        />
        <rect x="238" y="62" width="9" height="5" rx="0.8" fill="#22c55e" />

        {/* ── Punch-hole camera ── */}
        <circle cx="170" cy="68" r="4.5" fill="#080f1e" />
        <circle cx="170" cy="68" r="3" fill="#0d141f" />
        <circle cx="171.5" cy="66.5" r="0.8" fill="rgba(255,255,255,0.15)" />

        {/* ── App header bar ── */}
        <rect x="88" y="76" width="164" height="38" fill="#0F1F3D" />
        {/* Fonlok wordmark */}
        <text
          x="104"
          y="100"
          fontSize="13"
          fontWeight="800"
          fill="#F59E0B"
          fontFamily="system-ui,sans-serif"
          letterSpacing="-0.3"
        >
          Fonlok
        </text>
        {/* Notification bell icon */}
        <circle cx="232" cy="95" r="8" fill="rgba(255,255,255,0.07)" />
        <path
          d="M232 90 C229.5 90 227.5 91.8 227.5 94 L227.5 97.5 L226 99 L238 99 L236.5 97.5 L236.5 94 C236.5 91.8 234.5 90 232 90Z"
          fill="rgba(255,255,255,0.85)"
        />
        <rect
          x="230.5"
          y="99"
          width="3"
          height="1.5"
          rx="0.75"
          fill="rgba(255,255,255,0.85)"
        />
        {/* Green notification dot */}
        <circle cx="236" cy="89" r="2.5" fill="#22c55e" />

        {/* ── Dashboard greeting ── */}
        <rect x="88" y="114" width="164" height="28" fill="#142036" />
        <text
          x="104"
          y="126"
          fontSize="7"
          fill="rgba(255,255,255,0.5)"
          fontFamily="system-ui,sans-serif"
        >
          Good morning
        </text>
        <text
          x="104"
          y="136"
          fontSize="8.5"
          fontWeight="700"
          fill="#ffffff"
          fontFamily="system-ui,sans-serif"
        >
          Jean-Paul 👋
        </text>

        {/* ── Revenue card ── */}
        <rect
          x="96"
          y="146"
          width="148"
          height="52"
          rx="8"
          fill="#1e3a5f"
          filter="url(#cardShadow)"
        />
        <rect
          x="96"
          y="146"
          width="148"
          height="52"
          rx="8"
          fill="none"
          stroke="rgba(245,158,11,0.25)"
          strokeWidth="1"
        />
        <text
          x="108"
          y="160"
          fontSize="6.5"
          fill="rgba(255,255,255,0.5)"
          fontFamily="system-ui,sans-serif"
          letterSpacing="0.5"
        >
          TOTAL EARNINGS
        </text>
        <text
          x="108"
          y="175"
          fontSize="15"
          fontWeight="800"
          fill="#F59E0B"
          fontFamily="system-ui,sans-serif"
        >
          245,000 XAF
        </text>
        <text
          x="108"
          y="188"
          fontSize="6"
          fill="rgba(255,255,255,0.4)"
          fontFamily="system-ui,sans-serif"
        >
          +12% this month
        </text>
        {/* Up arrow */}
        <path
          d="M215 183 L218 179 L221 183"
          stroke="#22c55e"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <line
          x1="218"
          y1="179"
          x2="218"
          y2="188"
          stroke="#22c55e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* ── Section label ── */}
        <text
          x="104"
          y="213"
          fontSize="7"
          fontWeight="700"
          fill="rgba(255,255,255,0.6)"
          fontFamily="system-ui,sans-serif"
          letterSpacing="0.4"
        >
          RECENT INVOICES
        </text>

        {/* ── Invoice row 1 — PAID ── */}
        <rect x="96" y="218" width="148" height="38" rx="7" fill="#1a2f4a" />
        <rect x="96" y="218" width="4" height="38" rx="2" fill="#22c55e" />
        <text
          x="108"
          y="232"
          fontSize="7.5"
          fontWeight="600"
          fill="#ffffff"
          fontFamily="system-ui,sans-serif"
        >
          Website Design
        </text>
        <text
          x="108"
          y="244"
          fontSize="6.5"
          fill="rgba(255,255,255,0.4)"
          fontFamily="system-ui,sans-serif"
        >
          INV-2024-0041
        </text>
        <text
          x="210"
          y="232"
          fontSize="8"
          fontWeight="700"
          fill="#F59E0B"
          fontFamily="system-ui,sans-serif"
          textAnchor="end"
        >
          75,000
        </text>
        {/* Paid badge */}
        <rect
          x="200"
          y="238"
          width="27"
          height="10"
          rx="5"
          fill="rgba(34,197,94,0.18)"
        />
        <text
          x="213.5"
          y="246"
          fontSize="5.5"
          fontWeight="700"
          fill="#22c55e"
          fontFamily="system-ui,sans-serif"
          textAnchor="middle"
        >
          PAID
        </text>

        {/* ── Invoice row 2 — PENDING ── */}
        <rect x="96" y="260" width="148" height="38" rx="7" fill="#1a2f4a" />
        <rect x="96" y="260" width="4" height="38" rx="2" fill="#F59E0B" />
        <text
          x="108"
          y="274"
          fontSize="7.5"
          fontWeight="600"
          fill="#ffffff"
          fontFamily="system-ui,sans-serif"
        >
          Logo Package
        </text>
        <text
          x="108"
          y="286"
          fontSize="6.5"
          fill="rgba(255,255,255,0.4)"
          fontFamily="system-ui,sans-serif"
        >
          INV-2024-0042
        </text>
        <text
          x="210"
          y="274"
          fontSize="8"
          fontWeight="700"
          fill="#F59E0B"
          fontFamily="system-ui,sans-serif"
          textAnchor="end"
        >
          35,000
        </text>
        {/* Pending badge */}
        <rect
          x="193"
          y="280"
          width="34"
          height="10"
          rx="5"
          fill="rgba(245,158,11,0.18)"
        />
        <text
          x="210"
          y="288"
          fontSize="5.5"
          fontWeight="700"
          fill="#F59E0B"
          fontFamily="system-ui,sans-serif"
          textAnchor="middle"
        >
          PENDING
        </text>

        {/* ── Invoice row 3 — DELIVERED ── */}
        <rect x="96" y="302" width="148" height="38" rx="7" fill="#1a2f4a" />
        <rect x="96" y="302" width="4" height="38" rx="2" fill="#60a5fa" />
        <text
          x="108"
          y="316"
          fontSize="7.5"
          fontWeight="600"
          fill="#ffffff"
          fontFamily="system-ui,sans-serif"
        >
          Social Media Pack
        </text>
        <text
          x="108"
          y="328"
          fontSize="6.5"
          fill="rgba(255,255,255,0.4)"
          fontFamily="system-ui,sans-serif"
        >
          INV-2024-0043
        </text>
        <text
          x="210"
          y="316"
          fontSize="8"
          fontWeight="700"
          fill="#F59E0B"
          fontFamily="system-ui,sans-serif"
          textAnchor="end"
        >
          50,000
        </text>
        {/* Delivered badge */}
        <rect
          x="190"
          y="322"
          width="37"
          height="10"
          rx="5"
          fill="rgba(96,165,250,0.18)"
        />
        <text
          x="208.5"
          y="330"
          fontSize="5.5"
          fontWeight="700"
          fill="#60a5fa"
          fontFamily="system-ui,sans-serif"
          textAnchor="middle"
        >
          DELIVERED
        </text>

        {/* ── Bottom nav bar ── */}
        <rect x="88" y="380" width="164" height="28" fill="#0a1628" />
        {/* Home icon */}
        <path
          d="M116 398 L120 393 L124 398 L124 404 L118.5 404 L118.5 401 L121.5 401 L121.5 404 L116 404 Z"
          fill="rgba(255,255,255,0.8)"
        />
        {/* Invoices icon */}
        <rect
          x="156"
          y="393"
          width="8"
          height="10"
          rx="1"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1"
        />
        <line
          x1="158"
          y1="396"
          x2="162"
          y2="396"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="158"
          y1="399"
          x2="162"
          y2="399"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        {/* Settings icon */}
        <circle
          cx="210"
          cy="398"
          r="4"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1"
        />
        <circle cx="210" cy="398" r="1.5" fill="rgba(255,255,255,0.4)" />
        {/* Home indicator */}
        <rect
          x="150"
          y="406"
          width="40"
          height="3"
          rx="1.5"
          fill="rgba(255,255,255,0.15)"
        />
      </g>

      {/* ── Glass glare overlay ── */}
      <rect x="88" y="54" width="164" height="354" rx="6" fill="url(#glare)" />

      {/* ── Camera module (rear, top-right) ── */}
      <rect x="228" y="32" width="22" height="16" rx="4" fill="#111" />
      <circle
        cx="234"
        cy="40"
        r="4.5"
        fill="#0d0d0d"
        stroke="#222"
        strokeWidth="0.8"
      />
      <circle cx="234" cy="40" r="3" fill="#1a1a1a" />
      <circle cx="232.5" cy="38.5" r="0.8" fill="rgba(255,255,255,0.25)" />
      <circle
        cx="244"
        cy="40"
        r="3"
        fill="#1a1a1a"
        stroke="#222"
        strokeWidth="0.8"
      />
      <circle cx="243" cy="39" r="0.7" fill="rgba(255,255,255,0.2)" />
      <circle
        cx="234"
        cy="45.5"
        r="1.2"
        fill="#1a1a1a"
        stroke="#222"
        strokeWidth="0.5"
      />

      {/* ── Floating pill — payment confirmed ── */}
      <g filter="url(#pillShadow)" transform="translate(-22, 60)">
        <rect
          x="14"
          y="200"
          width="130"
          height="38"
          rx="19"
          fill="#0F1F3D"
          stroke="rgba(245,158,11,0.4)"
          strokeWidth="1.5"
        />
        {/* Green check circle */}
        <circle cx="37" cy="219" r="11" fill="rgba(34,197,94,0.15)" />
        <circle cx="37" cy="219" r="7" fill="#22c55e" />
        <path
          d="M33.5 219 L36 221.5 L40.5 216"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <text
          x="52"
          y="215"
          fontSize="8"
          fontWeight="700"
          fill="#ffffff"
          fontFamily="system-ui,sans-serif"
        >
          Payment Confirmed
        </text>
        <text
          x="52"
          y="226"
          fontSize="7"
          fill="rgba(255,255,255,0.5)"
          fontFamily="system-ui,sans-serif"
        >
          75,000 XAF secured
        </text>
      </g>

      {/* ── Floating pill — escrow badge ── */}
      <g filter="url(#pillShadow)" transform="translate(148, -18)">
        <rect
          x="14"
          y="320"
          width="110"
          height="36"
          rx="18"
          fill="#1a2f4a"
          stroke="rgba(245,158,11,0.3)"
          strokeWidth="1.2"
        />
        {/* Shield icon */}
        <path
          d="M32 331 L38 334 L38 341 C38 345 35.5 347.5 32 349 C28.5 347.5 26 345 26 341 L26 334 Z"
          fill="#F59E0B"
        />
        <path
          d="M29.5 341 L31.5 343 L34.5 339"
          stroke="#0F1F3D"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <text
          x="44"
          y="336"
          fontSize="7.5"
          fontWeight="700"
          fill="#ffffff"
          fontFamily="system-ui,sans-serif"
        >
          Funds in
        </text>
        <text
          x="44"
          y="347"
          fontSize="7.5"
          fontWeight="700"
          fill="#F59E0B"
          fontFamily="system-ui,sans-serif"
        >
          Escrow
        </text>
      </g>

      {/* ── Subtle star sparkles ── */}
      <g fill="#F59E0B" opacity="0.6">
        <circle cx="72" cy="90" r="2" />
        <circle cx="270" cy="140" r="1.5" />
        <circle cx="60" cy="340" r="1.5" />
        <circle cx="285" cy="380" r="2" />
        <circle cx="78" cy="430" r="1" />
        <circle cx="262" cy="60" r="1" />
      </g>
      {/* Star cross shapes */}
      <g stroke="rgba(245,158,11,0.4)" strokeWidth="1" strokeLinecap="round">
        <line x1="40" y1="200" x2="40" y2="208" />
        <line x1="36" y1="204" x2="44" y2="204" />
        <line x1="295" y1="290" x2="295" y2="298" />
        <line x1="291" y1="294" x2="299" y2="294" />
      </g>
    </svg>
  );
}
