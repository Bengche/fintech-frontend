"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/UserContext";
import axios from "axios";
import NotificationBell from "./NotificationBell";
import FonlokLogo from "./FonlokLogo";
import { useNotifications } from "@/hooks/useNotifications";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function Navbar() {
  const { user_id, setUser_id, username, setUsername } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Call useNotifications ONCE here and pass data to both bell instances.
  // Previously NotificationBell called it internally, causing 2 separate
  // polling intervals (desktop bell + mobile bell = 4x in React Strict Mode).
  const notifData = useNotifications();

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
    <nav
      style={{
        backgroundColor: "var(--color-primary)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
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
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/transactions">Transactions</NavLink>
              <NavLink href="/purchases">My Purchases</NavLink>
              <NavLink href="/referral">Referral</NavLink>
              {username && (
                <NavLink href={`/profile/${username}`}>Profile</NavLink>
              )}
              <NavLink href="/settings">Settings</NavLink>
              <NotificationBell
                notifications={notifData.notifications}
                unreadCount={notifData.unreadCount}
                markRead={notifData.markRead}
                markAllRead={notifData.markAllRead}
              />
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
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink href="/login">Sign in</NavLink>
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
                Get started
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
              transform: menuOpen ? "translateY(-7px) rotate(-45deg)" : "none",
            }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            backgroundColor: "var(--color-primary)",
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
                Dashboard
              </MobileNavLink>
              <MobileNavLink
                href="/transactions"
                onClick={() => setMenuOpen(false)}
              >
                Transactions
              </MobileNavLink>
              <MobileNavLink
                href="/purchases"
                onClick={() => setMenuOpen(false)}
              >
                My Purchases
              </MobileNavLink>
              <MobileNavLink
                href="/referral"
                onClick={() => setMenuOpen(false)}
              >
                Referral
              </MobileNavLink>
              {username && (
                <MobileNavLink
                  href={`/profile/${username}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </MobileNavLink>
              )}
              <MobileNavLink
                href="/settings"
                onClick={() => setMenuOpen(false)}
              >
                Settings
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
                Log out
              </button>
            </>
          ) : (
            <>
              <MobileNavLink href="/login" onClick={() => setMenuOpen(false)}>
                Sign in
              </MobileNavLink>
              <MobileNavLink
                href="/register"
                onClick={() => setMenuOpen(false)}
              >
                Get started
              </MobileNavLink>
            </>
          )}
        </div>
      )}
    </nav>
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
