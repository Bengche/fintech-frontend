import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/app/components/SiteHeader";
import SiteFooter from "@/app/components/SiteFooter";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Referral Programme — Earn 0.5% on every deal | Fonlok",
    description:
      "Share your unique referral link and earn 0.5% commission on every transaction your referrals complete — automatically, forever, with no expiry.",
    alternates: { canonical: "https://fonlok.com/referral-programme" },
  };
}

export default async function ReferralProgrammePage() {
  const t = await getTranslations("Landing");

  const cards = [
    {
      title: t("referral.cards.0.title"),
      desc: t("referral.cards.0.desc"),
    },
    {
      title: t("referral.cards.1.title"),
      desc: t("referral.cards.1.desc"),
    },
    {
      title: t("referral.cards.2.title"),
      desc: t("referral.cards.2.desc"),
    },
  ];

  return (
    <>
      <SiteHeader />

      <main>
        {/* ── HERO ── */}
        <section
          style={{
            background:
              "linear-gradient(135deg, #0F1F3D 0%, #1a2f4a 60%, #0F1F3D 100%)",
            padding: "5rem 1.5rem",
            textAlign: "center",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Decorative blobs */}
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
                "radial-gradient(circle, rgba(245,158,11,0.13) 0%, transparent 70%)",
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
            style={{ maxWidth: "680px", position: "relative", zIndex: 1 }}
          >
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

            <h1
              style={{
                fontSize: "clamp(1.875rem, 5vw, 3rem)",
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
            </h1>

            <p
              style={{
                fontSize: "1.0625rem",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.8,
                marginBottom: "2.25rem",
                maxWidth: "560px",
                margin: "0 auto 2.25rem",
              }}
            >
              {t("referral.description")}{" "}
              <strong style={{ color: "rgba(255,255,255,0.92)" }}>
                {t("referral.descriptionHighlight")}
              </strong>{" "}
              {t("referral.descriptionEnd")}
            </p>

            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}
            >
              <Link
                href="/register"
                className="btn-accent"
                style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}
              >
                {t("referral.cta")}
              </Link>
              <Link
                href="/login"
                className="btn-outline-white"
                style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}
              >
                Sign in to get your link
              </Link>
            </div>

            <p
              style={{
                color: "rgba(255,255,255,0.32)",
                fontSize: "0.8rem",
                marginTop: "1rem",
              }}
            >
              {t("referral.ctaNote")}
            </p>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section
          style={{
            backgroundColor: "var(--color-cloud)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "820px" }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  marginBottom: "0.75rem",
                }}
              >
                How it works
              </h2>
              <p
                style={{
                  fontSize: "1rem",
                  color: "var(--color-text-muted)",
                  maxWidth: "480px",
                  margin: "0 auto",
                }}
              >
                Three steps to start earning passive income on Fonlok.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {cards.map((card, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "var(--color-white)",
                    border: "1px solid var(--color-border)",
                    borderTop: "3px solid var(--color-accent)",
                    borderRadius: "var(--radius-lg)",
                    padding: "1.75rem",
                  }}
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
                    {i + 1}
                  </span>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.75,
                    }}
                  >
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EXAMPLE CALCULATION ── */}
        <section
          style={{
            backgroundColor: "var(--color-mist)",
            padding: "5rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "600px" }}>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                marginBottom: "0.75rem",
              }}
            >
              {t("referral.exampleLabel")}
            </h2>

            <div
              style={{
                backgroundColor: "var(--color-white)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "2rem 2rem",
                textAlign: "left",
                marginTop: "2rem",
              }}
            >
              <p
                style={{
                  fontSize: "1rem",
                  lineHeight: 1.8,
                  color: "var(--color-text-body)",
                  margin: "0 0 1rem",
                }}
              >
                {t("referral.example")}{" "}
                <strong style={{ color: "var(--color-primary)" }}>
                  {t("referral.exampleHighlight")}
                </strong>{" "}
                {t("referral.exampleEnd")}
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  marginTop: "1.5rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                {[
                  { label: "Your commission rate", value: "0.5%" },
                  { label: "Minimum payout", value: "2,000 XAF" },
                  { label: "Expiry", value: "Never" },
                  { label: "Payout method", value: "Fonlok wallet" },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.9375rem",
                    }}
                  >
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {row.label}
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: "var(--color-primary)",
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "2.5rem" }}>
              <Link
                href="/register"
                className="btn-accent"
                style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}
              >
                {t("referral.cta")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
