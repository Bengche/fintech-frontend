"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/UserContext";
import axios from "axios";
import NotificationBell from "./NotificationBell";
import FonlokLogo from "./FonlokLogo";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslations, useLocale } from "next-intl";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function Navbar() {
  const { user_id, setUser_id, username, setUsername } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = useTranslations("Navbar");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Call useNotifications ONCE here and pass data to both bell instances.
  // Previously NotificationBell called it internally, causing 2 separate
  // polling intervals (desktop bell + mobile bell = 4x in React Strict Mode).
  const locale = useLocale();
  const notifData = useNotifications();

  const switchLocale = () => {
    const other = locale === "en" ? "fr" : "en";
    document.cookie = `NEXT_LOCALE=${other};path=/;max-age=31536000`;
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch {
      /* ignore */
    }
    setUser_id(null);
    setUsername(null);
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <>
      {/* Spacer keeps page content below the fixed bar */}
      <div style={{ height: "62px", flexShrink: 0 }} aria-hidden="true" />

      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transition:
            "background-color 0.38s ease, backdrop-filter 0.38s ease, box-shadow 0.38s ease, border-color 0.38s ease",
          backgroundColor: scrolled
            ? "rgba(10, 23, 50, 0.55)"
            : "var(--color-primary)",
          backdropFilter: "none",
          // @ts-ignore — non-standard but needed for Safari
          WebkitBackdropFilter: "none",
          boxShadow: scrolled
            ? "0 1px 0 rgba(255,255,255,0.07), 0 6px 28px rgba(0,0,0,0.28)"
            : "none",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.11)"
            : "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "62px",
          }}
        >
          {/* Logo — always links to the home page */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
            aria-label="Fonlok home"
          >
            <FonlokLogo variant="light" iconSize={30} />
          </Link>

          {/* Desktop nav links */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
            className="hidden md:flex"
          >
            {user_id ? (
              <>
                <NavLink href="/dashboard">{t("dashboard")}</NavLink>
                <NavLink href="/transactions">{t("transactions")}</NavLink>
                <NavLink href="/purchases">{t("myPurchases")}</NavLink>
                <NavLink href="/referral">{t("referral")}</NavLink>
                <NavLink href="/verify">Verify Receipt</NavLink>
                {username && (
                  <NavLink href={`/profile/${username}`}>
                    {t("profile")}
                  </NavLink>
                )}
                <NavLink href="/settings">{t("settings")}</NavLink>
                <NotificationBell
                  notifications={notifData.notifications}
                  unreadCount={notifData.unreadCount}
                  markRead={notifData.markRead}
                  markAllRead={notifData.markAllRead}
                />
                {/* ── Language switcher ── */}
                <button
                  onClick={switchLocale}
                  aria-label={`Switch language – currently ${locale.toUpperCase()}`}
                  title={
                    locale === "en" ? "Passer en français" : "Switch to English"
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.32rem 0.75rem",
                    borderRadius: "999px",
                    border: "1.5px solid rgba(255,255,255,0.22)",
                    background: "rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    letterSpacing: "0.07em",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.borderColor = "rgba(255,255,255,0.55)";
                    b.style.background = "rgba(255,255,255,0.14)";
                  }}
                  onMouseLeave={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.borderColor = "rgba(255,255,255,0.22)";
                    b.style.background = "rgba(255,255,255,0.07)";
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
                <button
                  onClick={handleLogout}
                  style={{
                    marginLeft: "0.75rem",
                    padding: "0.45rem 1.1rem",
                    borderRadius: "var(--radius-md)",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    background: "transparent",
                    color: "rgba(255,255,255,0.8)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(255,255,255,0.6)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(255,255,255,0.25)";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "rgba(255,255,255,0.8)";
                  }}
                >
                  {t("logOut")}
                </button>
              </>
            ) : (
              <>
                <NavLink href="/verify">Verify Receipt</NavLink>
                <NavLink href="/login">{t("signIn")}</NavLink>
                <Link
                  href="/register"
                  style={{
                    marginLeft: "0.5rem",
                    padding: "0.45rem 1.25rem",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-accent)",
                    color: "var(--color-primary)",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    transition: "background-color 0.15s",
                  }}
                >
                  {t("getStarted")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile: notification bell (only when logged in) */}
          {user_id && (
            <div className="md:hidden">
              <NotificationBell
                notifications={notifData.notifications}
                unreadCount={notifData.unreadCount}
                markRead={notifData.markRead}
                markAllRead={notifData.markAllRead}
              />
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
            }}
            aria-label="Toggle menu"
          >
            <span
              style={{
                display: "block",
                width: "22px",
                height: "2px",
                background: "rgba(255,255,255,0.85)",
                borderRadius: "2px",
                transition: "transform 0.2s",
                transform: menuOpen ? "translateY(7px) rotate(45deg)" : "none",
              }}
            />
            <span
              style={{
                display: "block",
                width: "22px",
                height: "2px",
                background: "rgba(255,255,255,0.85)",
                borderRadius: "2px",
                opacity: menuOpen ? 0 : 1,
                transition: "opacity 0.2s",
              }}
            />
            <span
              style={{
                display: "block",
                width: "22px",
                height: "2px",
                background: "rgba(255,255,255,0.85)",
                borderRadius: "2px",
                transition: "transform 0.2s",
                transform: menuOpen
                  ? "translateY(-7px) rotate(-45deg)"
                  : "none",
              }}
            />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            style={{
              backgroundColor: scrolled
                ? "rgba(10, 23, 50, 0.55)"
                : "var(--color-primary)",
              backdropFilter: "none",
              // @ts-ignore
              WebkitBackdropFilter: "none",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: "1rem 1.25rem 1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
            className="md:hidden"
          >
            {user_id ? (
              <>
                <MobileNavLink
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("dashboard")}
                </MobileNavLink>
                <MobileNavLink
                  href="/transactions"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("transactions")}
                </MobileNavLink>
                <MobileNavLink
                  href="/purchases"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("myPurchases")}
                </MobileNavLink>
                <MobileNavLink
                  href="/referral"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("referral")}
                </MobileNavLink>
                <MobileNavLink
                  href="/verify"
                  onClick={() => setMenuOpen(false)}
                >
                  Verify Receipt
                </MobileNavLink>
                {username && (
                  <MobileNavLink
                    href={`/profile/${username}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("profile")}
                  </MobileNavLink>
                )}
                <MobileNavLink
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("settings")}
                </MobileNavLink>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  style={{
                    textAlign: "left",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.6)",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    cursor: "pointer",
                    marginTop: "0.5rem",
                  }}
                >
                  {t("logOut")}
                </button>
                {/* ── Mobile language switcher ── */}
                <button
                  onClick={() => {
                    switchLocale();
                    setMenuOpen(false);
                  }}
                  aria-label={`Switch language – currently ${locale.toUpperCase()}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1.5px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.85)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                    width: "100%",
                    marginTop: "0.25rem",
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
                  {locale === "en"
                    ? "English → Français"
                    : "Français → English"}
                </button>
              </>
            ) : (
              <>
                <MobileNavLink
                  href="/verify"
                  onClick={() => setMenuOpen(false)}
                >
                  Verify Receipt
                </MobileNavLink>
                <MobileNavLink href="/login" onClick={() => setMenuOpen(false)}>
                  {t("signIn")}
                </MobileNavLink>
                <MobileNavLink
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("getStarted")}
                </MobileNavLink>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "0.4rem 0.85rem",
        borderRadius: "var(--radius-sm)",
        color: "rgba(255,255,255,0.75)",
        fontWeight: 500,
        fontSize: "0.9rem",
        textDecoration: "none",
        transition: "color 0.15s, background-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
          "rgba(255,255,255,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color =
          "rgba(255,255,255,0.75)";
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
          "transparent";
      }}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "block",
        padding: "0.625rem 0.75rem",
        borderRadius: "var(--radius-sm)",
        color: "rgba(255,255,255,0.8)",
        fontWeight: 500,
        fontSize: "0.9375rem",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
