"use client";

/**
 * CookieConsent — GDPR/CCPA-style cookie consent banner.
 *
 * • Shown once per browser on first visit (preference stored in localStorage).
 * • Slides up from the bottom of the screen.
 * • Two choices: Accept All  |  Essential Only (reject non-essential).
 * • Fully responsive — compact bar on desktop, full-width card on mobile.
 * • Works on Chrome, Safari, Firefox, Opera, Edge — iOS & Android.
 * • Re-shows if the user clears site data (correct GDPR behaviour).
 *
 * Usage: render once in app/layout.tsx, inside <AuthProvider>.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const STORAGE_KEY = "fonlok_cookie_consent"; // "accepted" | "essential"

// ─── tiny SVG cookie icon ─────────────────────────────────────────────────────
function CookieIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" fill="#F59E0B" opacity="0.18" />
      <circle cx="12" cy="12" r="10" stroke="#F59E0B" strokeWidth="1.5" />
      {/* bite mark */}
      <path
        d="M17.5 7.5 Q19 9 18 11"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* chips */}
      <circle cx="9" cy="9" r="1" fill="#F59E0B" />
      <circle cx="13" cy="8" r="0.8" fill="#F59E0B" />
      <circle cx="8" cy="13" r="0.8" fill="#F59E0B" />
      <circle cx="12" cy="14" r="1" fill="#F59E0B" />
      <circle cx="15" cy="12" r="0.8" fill="#F59E0B" />
      <circle cx="10" cy="11" r="0.6" fill="#F59E0B" />
    </svg>
  );
}

export type ConsentValue = "accepted" | "essential" | null;

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false); // triggers exit animation
  const [expanded, setExpanded] = useState(false); // "show more" on mobile

  // Read stored preference — runs only on the client after hydration.
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Small delay so the page renders first, then banner slides in.
        const t = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage blocked (private browsing on some browsers) — show banner.
      setTimeout(() => setVisible(true), 800);
    }
  }, []);

  const dismiss = useCallback((value: ConsentValue) => {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      setLeaving(false);
      try {
        if (value) localStorage.setItem(STORAGE_KEY, value);
      } catch {
        // silently ignore if storage is blocked
      }
    }, 350); // matches the CSS exit transition
  }, []);

  // Don't render anything server-side or after a choice has been made.
  if (!mounted || !visible) return null;

  return (
    <>
      {/* ── Keyframes injected once ─────────────────────────────────────── */}
      <style>{`
        @keyframes fonlok-slide-up {
          from { transform: translateY(110%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fonlok-slide-down {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(110%); opacity: 0; }
        }
        /* Pill buttons — hover states via CSS so we don't need onMouseEnter */
        .fonlok-cc-accept:hover  { background: var(--color-accent-hover) !important; }
        .fonlok-cc-decline:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.5) !important;
        }
        .fonlok-cc-reject:hover {
          background: rgba(239,68,68,0.12) !important;
          border-color: rgba(239,68,68,0.7) !important;
        }
        .fonlok-cc-link:hover { color: var(--color-accent) !important; }

        /* Mobile: stack buttons vertically */
        @media (max-width: 540px) {
          .fonlok-cc-actions { flex-direction: column !important; }
          .fonlok-cc-actions button { width: 100% !important; }
          .fonlok-cc-link { margin-right: 0 !important; margin-bottom: 0.25rem; }
        }
      `}</style>

      {/* ── Backdrop (subtle, not full-black) ───────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={() => {
          /* clicking backdrop doesn't dismiss — intentional */
        }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          zIndex: 9998,
          animation: leaving
            ? "fonlok-slide-down 0.35s ease forwards"
            : "fonlok-slide-up 0.45s cubic-bezier(0.16,1,0.3,1) forwards",
          // Only show backdrop on small screens; on desktop it's distracting
          display: "none",
        }}
      />

      {/* ── The banner itself ────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cookie preferences"
        style={{
          position: "fixed",
          bottom: "1.25rem",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(92vw, 780px)",
          zIndex: 9999,
          background: "var(--color-primary)",
          border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: "var(--radius-lg, 1rem)",
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)",
          padding: "1.5rem 1.75rem",
          animation: leaving
            ? "fonlok-slide-down 0.35s ease forwards"
            : "fonlok-slide-up 0.45s cubic-bezier(0.16,1,0.3,1) forwards",
          color: "#fff",
          fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
        }}
      >
        {/* ── Header row ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.875rem",
            marginBottom: "0.875rem",
          }}
        >
          <CookieIcon />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: "1rem",
                lineHeight: 1.35,
                letterSpacing: "-0.01em",
              }}
            >
              We value your privacy
            </p>
            <p
              style={{
                margin: "0.35rem 0 0",
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.72)",
                maxWidth: "56ch",
              }}
            >
              Fonlok uses cookies to keep your session secure, remember
              preferences, and understand how you use the platform so we can
              improve it.{" "}
              {/* "Show more" toggle — only relevant on very small screens */}
              <button
                onClick={() => setExpanded((x) => !x)}
                aria-expanded={expanded}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--color-accent)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  textDecoration: "underline",
                  lineHeight: "inherit",
                }}
              >
                {expanded ? "Show less" : "Learn more"}
              </button>
            </p>
          </div>
        </div>

        {/* ── Expanded detail (collapsible) ──────────────────────────────── */}
        {expanded && (
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "var(--radius-sm, 6px)",
              padding: "1rem 1.125rem",
              marginBottom: "1rem",
              fontSize: "0.8125rem",
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.68)",
            }}
          >
            <p style={{ margin: "0 0 0.5rem", fontWeight: 600, color: "#fff" }}>
              What we use cookies for
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.125rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
              }}
            >
              <li>
                <strong style={{ color: "rgba(255,255,255,0.9)" }}>
                  Essential
                </strong>{" "}
                — required for login, sessions, and security. Always active.
              </li>
              <li>
                <strong style={{ color: "rgba(255,255,255,0.9)" }}>
                  Functional
                </strong>{" "}
                — remember your language and display preferences.
              </li>
              <li>
                <strong style={{ color: "rgba(255,255,255,0.9)" }}>
                  Analytics
                </strong>{" "}
                — anonymised usage data that helps us fix bugs and improve
                features. No personal data is sold.
              </li>
            </ul>
          </div>
        )}

        {/* ── Button row ─────────────────────────────────────────────────── */}
        <div
          className="fonlok-cc-actions"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {/* Privacy policy link */}
          <Link
            href="/privacy"
            className="fonlok-cc-link"
            style={{
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.5)",
              textDecoration: "underline",
              marginRight: "auto",
              transition: "color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            Privacy Policy
          </Link>

          {/* Reject all */}
          <button
            className="fonlok-cc-reject"
            onClick={() => dismiss("essential")}
            style={{
              background: "transparent",
              border: "1.5px solid rgba(239,68,68,0.45)",
              borderRadius: "var(--radius-md, 0.75rem)",
              color: "rgba(252,165,165,0.9)",
              padding: "0.625rem 1.125rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s, border-color 0.15s",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}
          >
            Reject all
          </button>

          {/* Essential Only */}
          <button
            className="fonlok-cc-decline"
            onClick={() => dismiss("essential")}
            style={{
              background: "transparent",
              border: "1.5px solid rgba(255,255,255,0.28)",
              borderRadius: "var(--radius-md, 0.75rem)",
              color: "rgba(255,255,255,0.85)",
              padding: "0.625rem 1.125rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s, border-color 0.15s",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}
          >
            Essential only
          </button>

          {/* Accept All */}
          <button
            className="fonlok-cc-accept"
            onClick={() => dismiss("accepted")}
            style={{
              background: "var(--color-accent)",
              border: "none",
              borderRadius: "var(--radius-md, 0.75rem)",
              color: "var(--color-primary)",
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.15s",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
              boxShadow: "0 2px 12px rgba(245,158,11,0.35)",
            }}
          >
            Accept all
          </button>
        </div>
      </div>
    </>
  );
}
