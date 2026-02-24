/**
 * SiteHeader — the main navigation bar for all public-facing pages.
 *
 * It adapts based on auth state:
 *  - Logged out → shows "Sign in" and "Get started" links
 *  - Logged in  → shows "Dashboard" and "Log out" links
 *
 * Used on: landing, how-it-works, pricing, faq, settings, terms, privacy, contact
 * NOT used on: /dashboard, /transactions (those use the dashboard Navbar)
 */
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/UserContext";
import FonlokLogo from "./FonlokLogo";
import axios from "axios";
import { useTranslations, useLocale } from "next-intl";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function SiteHeader() {
  const t = useTranslations("SiteHeader");
  const locale = useLocale();
  const { user_id, setUser_id, setUsername } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_LINKS = [
    { href: "/how-it-works", label: t("nav.howItWorks") },
    { href: "/pricing", label: t("nav.pricing") },
    { href: "/faq", label: t("nav.faq") },
    { href: "/contact", label: t("nav.contact") },
  ];

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch {
      /* ignore network errors on logout */
    }
    setUser_id(null);
    setUsername(null);
    setMobileOpen(false);
    localStorage.removeItem("token");
    router.push("/");
  };

  // Switch language: set a cookie and reload so the server picks up the new locale
  const switchLocale = () => {
    const otherLocale = locale === "en" ? "fr" : "en";
    document.cookie = `NEXT_LOCALE=${otherLocale};path=/;max-age=31536000`;
    window.location.reload();
  };

  return (
    <header
      style={{
        backgroundColor: "var(--color-white)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* ── Main bar ─────────────────────────────────────────────── */}
      <div
        className="page-wrapper"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
          }}
          aria-label={t("logoAlt")}
        >
          <FonlokLogo variant="dark" iconSize={32} />
        </Link>

        {/* Desktop nav links — hidden on mobile */}
        <nav
          aria-label="Site navigation"
          className="hidden md:flex"
          style={{ gap: "2rem", alignItems: "center" }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "var(--color-text-body)",
                textDecoration: "none",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth buttons + language switcher — hidden on mobile */}
        <div
          className="hidden md:flex"
          style={{ alignItems: "center", gap: "0.75rem" }}
        >
          {user_id ? (
            <>
              <Link
                href="/dashboard"
                className="btn-primary"
                style={{ fontSize: "0.875rem", padding: "0.45rem 1.1rem" }}
              >
                {t("auth.dashboard")}
              </Link>
              <button
                onClick={handleLogout}
                className="btn-ghost"
                style={{ fontSize: "0.875rem", padding: "0.45rem 1.1rem" }}
              >
                {t("auth.logOut")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-text-body)",
                  textDecoration: "none",
                }}
              >
                {t("auth.signIn")}
              </Link>
              <Link
                href="/register"
                className="btn-accent"
                style={{ fontSize: "0.875rem", padding: "0.5rem 1.25rem" }}
              >
                {t("auth.getStarted")}
              </Link>
            </>
          )}
          {/* Language toggle */}
          <button
            onClick={switchLocale}
            aria-label={`Switch language – currently ${locale.toUpperCase()}`}
            title={locale === "en" ? "Passer en français" : "Switch to English"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.35rem 0.8rem",
              borderRadius: "999px",
              border: "1.5px solid var(--color-border)",
              background: "#f5f5f7",
              color: "var(--color-text-body)",
              fontWeight: 700,
              fontSize: "0.78rem",
              letterSpacing: "0.07em",
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.borderColor = "var(--color-primary)";
              b.style.background = "#ebebef";
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.borderColor = "var(--color-border)";
              b.style.background = "#f5f5f7";
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {locale === "en" ? "Français" : "English"}
          </button>
        </div>

        {/* Mobile hamburger button — visible on mobile only */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? t("mobile.closeMenu") : t("mobile.openMenu")}
          aria-expanded={mobileOpen}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            width: "28px",
          }}
        >
          <span
            style={{
              height: "2px",
              backgroundColor: "var(--color-text-heading)",
              borderRadius: "2px",
              display: "block",
              transition: "transform 0.2s",
              transform: mobileOpen ? "translateY(7px) rotate(45deg)" : "none",
            }}
          />
          <span
            style={{
              height: "2px",
              backgroundColor: "var(--color-text-heading)",
              borderRadius: "2px",
              display: "block",
              opacity: mobileOpen ? 0 : 1,
              transition: "opacity 0.2s",
            }}
          />
          <span
            style={{
              height: "2px",
              backgroundColor: "var(--color-text-heading)",
              borderRadius: "2px",
              display: "block",
              transition: "transform 0.2s",
              transform: mobileOpen
                ? "translateY(-7px) rotate(-45deg)"
                : "none",
            }}
          />
        </button>
      </div>

      {/* ── Mobile dropdown menu ──────────────────────────────────── */}
      {mobileOpen && (
        <div
          style={{
            backgroundColor: "var(--color-white)",
            borderTop: "1px solid var(--color-border)",
            padding: "1rem 1.5rem 1.5rem",
          }}
        >
          <nav
            aria-label="Mobile navigation"
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: "1.25rem",
            }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: "var(--color-text-body)",
                  padding: "0.75rem 0",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {user_id ? (
              <>
                <Link
                  href="/dashboard"
                  className="btn-primary"
                  onClick={() => setMobileOpen(false)}
                  style={{ textAlign: "center" }}
                >
                  {t("auth.dashboard")}
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-ghost"
                  style={{ width: "100%" }}
                >
                  {t("auth.logOut")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="btn-accent"
                  onClick={() => setMobileOpen(false)}
                  style={{ textAlign: "center" }}
                >
                  {t("auth.getStartedFree")}
                </Link>
                <Link
                  href="/login"
                  className="btn-ghost"
                  onClick={() => setMobileOpen(false)}
                  style={{ textAlign: "center" }}
                >
                  {t("auth.signIn")}
                </Link>
              </>
            )}
            {/* Mobile language toggle */}
            <button
              onClick={() => {
                switchLocale();
                setMobileOpen(false);
              }}
              aria-label={`Switch language – currently ${locale.toUpperCase()}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.6rem",
                borderRadius: "999px",
                border: "1.5px solid var(--color-border)",
                background: "#f5f5f7",
                color: "var(--color-text-body)",
                fontWeight: 700,
                fontSize: "0.9rem",
                letterSpacing: "0.06em",
                cursor: "pointer",
                width: "100%",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {locale === "en" ? "English → Français" : "Français → English"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
