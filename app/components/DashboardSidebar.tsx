"use client";

/**
 * DashboardSidebar
 *
 * A fixed left-hand sidebar rendered exclusively on large screens (lg+).
 * Hidden on mobile / tablet where MobileBottomNav is used instead.
 *
 * Layout contract:
 *   - Width: 240px (collapsed: 64px future enhancement — currently always expanded)
 *   - The main content area (children of the page) must carry
 *     `lg:pl-60` (or equivalent) to clear the sidebar.
 *
 * Nav items (authenticated):
 *   - Dashboard          /dashboard
 *   - Create Invoice     /dashboard  (same page, first tab)
 *   - Transactions       /transactions
 *   - My Purchases       /purchases
 *   - Revenue & Stats    /dashboard?tab=stats
 *   - Referral           /referral
 *   - Verify Receipt     /verify
 *   - Profile            /seller/[username]
 *   - Settings           /settings
 *
 * Design principles:
 *   - Brand-consistent: Ink Navy background, Amber Gold active accent
 *   - Subtle outer glow separators
 *   - Active item: amber left border + tinted background
 *   - Hover: gentle tint transition
 *   - Groups separated by faint dividers
 *   - Logout at the bottom
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus,
  ArrowLeftRight,
  ShoppingBag,
  BarChart2,
  Gift,
  BadgeCheck,
  User,
  Settings,
  LogOut,
  Globe,
} from "lucide-react";
import FonlokLogo from "./FonlokLogo";
import NotificationBell from "./NotificationBell";
import RequestFeatureButton from "./RequestFeatureButton";
import { useAuth } from "@/context/UserContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslations, useLocale } from "next-intl";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  matchPaths?: string[];
  exact?: boolean;
}

const PRIMARY_ITEMS: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={17} strokeWidth={1.8} />,
    matchPaths: ["/dashboard"],
    exact: true,
  },
  {
    label: "Create Invoice",
    href: "/dashboard?action=create",
    icon: <FilePlus size={17} strokeWidth={1.8} />,
    matchPaths: [],
    exact: false,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: <ArrowLeftRight size={17} strokeWidth={1.8} />,
    matchPaths: ["/transactions"],
  },
  {
    label: "My Purchases",
    href: "/purchases",
    icon: <ShoppingBag size={17} strokeWidth={1.8} />,
    matchPaths: ["/purchases"],
  },
  {
    label: "Revenue & Stats",
    href: "/dashboard?tab=stats",
    icon: <BarChart2 size={17} strokeWidth={1.8} />,
    matchPaths: [],
  },
];

const SECONDARY_ITEMS: SidebarItem[] = [
  {
    label: "Referral",
    href: "/referral",
    icon: <Gift size={17} strokeWidth={1.8} />,
    matchPaths: ["/referral"],
  },
  {
    label: "Verify Receipt",
    href: "/verify",
    icon: <BadgeCheck size={17} strokeWidth={1.8} />,
    matchPaths: ["/verify"],
  },
];

function isItemActive(item: SidebarItem, pathname: string): boolean {
  if (item.matchPaths && item.matchPaths.length > 0) {
    return item.exact
      ? item.matchPaths.some((p) => pathname === p)
      : item.matchPaths.some(
          (p) => pathname === p || pathname.startsWith(p + "/"),
        );
  }
  return false;
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user_id, setUser_id, username, setUsername } = useAuth();
  const notifData = useNotifications();
  const t = useTranslations("Navbar");
  const locale = useLocale();

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

  // Only show sidebar for authenticated users on large screens
  if (!user_id) return null;

  return (
    <>
      <style>{`
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.575rem 0.875rem;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(255,255,255,0.58);
          text-decoration: none;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          cursor: pointer;
          border: 1px solid transparent;
          position: relative;
          white-space: nowrap;
          background: transparent;
          width: 100%;
          text-align: left;
          letter-spacing: 0.01em;
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }
        .sidebar-item:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.88);
          border-color: rgba(255,255,255,0.06);
        }
        .sidebar-item.sidebar-item--active {
          background: rgba(245,158,11,0.1);
          color: #f59e0b;
          border-color: rgba(245,158,11,0.18);
          font-weight: 600;
        }
        .sidebar-item--active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 0.2rem;
          height: 55%;
          border-radius: 0 3px 3px 0;
          background: var(--color-accent);
        }
        .sidebar-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 0.5rem;
          flex-shrink: 0;
          transition: background 0.15s;
          background: rgba(255,255,255,0.06);
        }
        .sidebar-item--active .sidebar-icon {
          background: rgba(245,158,11,0.18);
        }
        .sidebar-item:hover .sidebar-icon {
          background: rgba(255,255,255,0.1);
        }
        .sidebar-item--active:hover .sidebar-icon {
          background: rgba(245,158,11,0.25);
        }
        .sidebar-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 0.5rem 0;
        }
        .sidebar-section-label {
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.22);
          padding: 0 0.875rem;
          margin: 0.75rem 0 0.375rem;
        }
      `}</style>

      {/* Sidebar panel — only visible on lg+ */}
      <aside
        className="hidden lg:flex"
        aria-label="Dashboard navigation"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "240px",
          zIndex: 40,
          flexDirection: "column",
          background: "linear-gradient(180deg,#0d1e42 0%,#091526 100%)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "2px 0 24px rgba(0,0,0,0.22)",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Logo + notification row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.125rem 1rem",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}
        >
          <Link
            href="/dashboard"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Fonlok home"
          >
            <FonlokLogo variant="light" iconSize={28} />
          </Link>
          <NotificationBell
            notifications={notifData.notifications}
            unreadCount={notifData.unreadCount}
            markRead={notifData.markRead}
            markAllRead={notifData.markAllRead}
          />
        </div>

        {/* User identity chip */}
        {username && (
          <Link
            href={`/seller/${username}`}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                margin: "0.875rem 0.875rem 0.25rem",
                padding: "0.625rem 0.75rem",
                borderRadius: "0.75rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.07)",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "rgba(255,255,255,0.09)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "rgba(255,255,255,0.05)";
              }}
            >
              <div
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
                  color: "#0f1f3d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.875rem",
                  flexShrink: 0,
                  letterSpacing: 0,
                }}
              >
                {username.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    color: "#fff",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {username}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.6875rem",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  View profile
                </p>
              </div>
              <User
                size={14}
                color="rgba(255,255,255,0.25)"
                strokeWidth={1.8}
                style={{ flexShrink: 0 }}
              />
            </div>
          </Link>
        )}

        {/* Primary navigation */}
        <nav style={{ flex: 1, padding: "0.5rem 0.75rem 0" }}>
          <p className="sidebar-section-label">Navigation</p>

          {PRIMARY_ITEMS.map((item) => {
            const active = isItemActive(item, pathname);
            return (
              <Link
                key={item.label + item.href}
                href={item.href}
                className={`sidebar-item${active ? " sidebar-item--active" : ""}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          <div className="sidebar-divider" />
          <p className="sidebar-section-label">Tools</p>

          {SECONDARY_ITEMS.map((item) => {
            const active = isItemActive(item, pathname);
            return (
              <Link
                key={item.label + item.href}
                href={item.href}
                className={`sidebar-item${active ? " sidebar-item--active" : ""}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          <RequestFeatureButton variant="sidebar" />

          <div className="sidebar-divider" />
          <p className="sidebar-section-label">Account</p>

          <Link
            href="/settings"
            className={`sidebar-item${pathname.startsWith("/settings") ? " sidebar-item--active" : ""}`}
          >
            <span className="sidebar-icon">
              <Settings size={17} strokeWidth={1.8} />
            </span>
            {t("settings")}
          </Link>
        </nav>

        {/* Bottom actions */}
        <div
          style={{
            padding: "0.5rem 0.75rem",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}
        >
          {/* Language toggle */}
          <button
            className="sidebar-item"
            onClick={switchLocale}
            aria-label={`Switch language — currently ${locale.toUpperCase()}`}
            style={{ marginBottom: "0.125rem" }}
          >
            <span className="sidebar-icon">
              <Globe
                size={17}
                strokeWidth={1.8}
                color="rgba(255,255,255,0.6)"
              />
            </span>
            {locale === "en" ? "English / Français" : "Français / English"}
          </button>

          {/* Logout */}
          <button
            className="sidebar-item"
            onClick={handleLogout}
            style={{ color: "rgba(255,110,110,0.8)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(255,100,100,0.95)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,80,80,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(255,110,110,0.8)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <span
              className="sidebar-icon"
              style={{ background: "rgba(255,80,80,0.1)" }}
            >
              <LogOut
                size={17}
                strokeWidth={1.8}
                color="rgba(255,110,110,0.85)"
              />
            </span>
            {t("logOut")}
          </button>

          <p
            style={{
              margin: "0.625rem 0 0",
              fontSize: "0.625rem",
              color: "rgba(255,255,255,0.18)",
              textAlign: "center",
              letterSpacing: "0.04em",
            }}
          >
            &copy; {new Date().getFullYear()} Fonlok
          </p>
        </div>
      </aside>

      {/* Left offset spacer so main content does not overlap sidebar */}
      <div
        className="hidden lg:block"
        aria-hidden="true"
        style={{ width: "240px", flexShrink: 0 }}
      />
    </>
  );
}
