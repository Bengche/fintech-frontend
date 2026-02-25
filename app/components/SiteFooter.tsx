/**
 * SiteFooter â€” the shared footer for all public-facing pages.
 *
 * Shows a "Go to Dashboard" link when the user is logged in,
 * or sign-up/sign-in links when they are not.
 */
"use client";
import Link from "next/link";
import { useAuth } from "@/context/UserContext";
import FonlokLogo from "./FonlokLogo";
import { useTranslations } from "next-intl";

const currentYear = new Date().getFullYear();

export default function SiteFooter() {
  const { user_id } = useAuth();
  const t = useTranslations("SiteFooter");

  return (
    <footer
      style={{
        backgroundColor: "var(--color-primary)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        color: "rgba(255,255,255,0.7)",
        marginTop: "auto",
      }}
    >
      {/* â”€â”€ Main footer grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="page-wrapper lp-footer-grid"
        style={{
          paddingTop: "3.5rem",
          paddingBottom: "3rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "2.5rem",
        }}
      >
        {/* Brand column */}
        <div className="lp-footer-brand" style={{ gridColumn: "span 1" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              marginBottom: "0.875rem",
            }}
            aria-label="Fonlok home"
          >
            <FonlokLogo variant="light" iconSize={30} />
          </Link>
          <p
            style={{
              fontSize: "0.875rem",
              lineHeight: 1.7,
              margin: 0,
              maxWidth: "220px",
            }}
          >
            {t("tagline")}
          </p>
        </div>

        {/* Product links */}
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 1rem",
            }}
          >
            {t("columns.product")}
          </p>
          <FooterLinks
            links={[
              { href: "/how-it-works", label: t("links.howItWorks") },
              { href: "/pricing", label: t("links.pricing") },
              { href: "/faq", label: t("links.faq") },
              ...(user_id
                ? [{ href: "/dashboard", label: t("links.dashboard") }]
                : [{ href: "/register", label: t("links.createAccount") }]),
            ]}
          />
        </div>

        {/* Support links */}
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 1rem",
            }}
          >
            {t("columns.support")}
          </p>
          <FooterLinks
            links={[
              { href: "/contact", label: t("links.contactUs") },
              { href: "/faq", label: t("links.helpCentre") },
              ...(user_id
                ? [{ href: "/settings", label: t("links.accountSettings") }]
                : [{ href: "/login", label: t("links.signIn") }]),
            ]}
          />
        </div>

        {/* Legal links */}
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 1rem",
            }}
          >
            {t("columns.legal")}
          </p>
          <FooterLinks
            links={[
              { href: "/terms", label: t("links.terms") },
              { href: "/privacy", label: t("links.privacy") },
            ]}
          />
        </div>

        {/* Contact info */}
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 1rem",
            }}
          >
            {t("columns.contact")}
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <a
              href="https://wa.me/237654155218"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
              }}
            >
              WhatsApp: +237 654 155 218
            </a>
            <a
              href="mailto:support@fonlok.com"
              style={{
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
              }}
            >
              support@fonlok.com
            </a>
          </div>
        </div>
      </div>

      {/* â”€â”€ Bottom bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="page-wrapper lp-footer-bottom"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          paddingTop: "1.25rem",
          paddingBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.8125rem",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          {t("copyright", { year: currentYear })}
        </p>
        <p>
          {t("builtBy")}{" "}
          <Link
            href="https://brancodex.com/"
            style={{
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
            }}
          >
            BranCodeX
          </Link>
        </p>
        <div style={{ display: "flex", gap: "1.25rem" }}>
          <Link
            href="/terms"
            style={{
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
            }}
          >
            {t("links.termsShort")}
          </Link>
          <Link
            href="/privacy"
            style={{
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
            }}
          >
            {t("links.privacyShort")}
          </Link>
        </div>
      </div>
    </footer>
  );
}

// Small helper to keep link lists DRY
function FooterLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          style={{
            fontSize: "0.875rem",
            color: "rgba(255,255,255,0.7)",
            textDecoration: "none",
          }}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
