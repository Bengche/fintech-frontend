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

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const { user_id, setUser_id, setUsername } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

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
          aria-label="Fonlok home"
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

        {/* Desktop auth buttons — hidden on mobile */}
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
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="btn-ghost"
                style={{ fontSize: "0.875rem", padding: "0.45rem 1.1rem" }}
              >
                Log out
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
                Sign in
              </Link>
              <Link
                href="/register"
                className="btn-accent"
                style={{ fontSize: "0.875rem", padding: "0.5rem 1.25rem" }}
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger button — visible on mobile only */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
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
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-ghost"
                  style={{ width: "100%" }}
                >
                  Log out
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
                  Get started — it&apos;s free
                </Link>
                <Link
                  href="/login"
                  className="btn-ghost"
                  onClick={() => setMobileOpen(false)}
                  style={{ textAlign: "center" }}
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
