/**
 * SiteFooter — the shared footer for all public-facing pages.
 *
 * Shows a "Go to Dashboard" link when the user is logged in,
 * or sign-up/sign-in links when they are not.
 */
"use client";
import Link from "next/link";
import { useAuth } from "@/context/UserContext";
import FonlokLogo from "./FonlokLogo";

const currentYear = new Date().getFullYear();

export default function SiteFooter() {
  const { user_id } = useAuth();

  return (
    <footer
      style={{
        backgroundColor: "var(--color-primary)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        color: "rgba(255,255,255,0.7)",
        marginTop: "auto",
      }}
    >
      {/* ── Main footer grid ─────────────────────────────────────── */}
      <div
        className="page-wrapper"
        style={{
          paddingTop: "3.5rem",
          paddingBottom: "3rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "2.5rem",
        }}
      >
        {/* Brand column */}
        <div style={{ gridColumn: "span 1" }}>
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
            Secure escrow payments for Cameroon. Pay and get paid safely.
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
            Product
          </p>
          <FooterLinks
            links={[
              { href: "/how-it-works", label: "How it works" },
              { href: "/pricing", label: "Pricing" },
              { href: "/faq", label: "FAQ" },
              ...(user_id
                ? [{ href: "/dashboard", label: "Dashboard" }]
                : [{ href: "/register", label: "Create account" }]),
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
            Support
          </p>
          <FooterLinks
            links={[
              { href: "/contact", label: "Contact us" },
              { href: "/faq", label: "Help centre" },
              ...(user_id
                ? [{ href: "/settings", label: "Account settings" }]
                : [{ href: "/login", label: "Sign in" }]),
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
            Legal
          </p>
          <FooterLinks
            links={[
              { href: "/terms", label: "Terms of service" },
              { href: "/privacy", label: "Privacy policy" },
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
            Contact
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

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div
        className="page-wrapper"
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
          © {currentYear} Fonlok. All rights reserved. Made in Cameroon.
        </p>
        <p>
          Built with ❤ by{" "}
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
            Terms
          </Link>
          <Link
            href="/privacy"
            style={{
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
            }}
          >
            Privacy
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
