"use client";

/**
 * MobileBottomNav
 *
 * A fixed bottom navigation bar rendered exclusively on small / mobile screens
 * (hidden on lg+ where the sidebar takes over).
 *
 * Shows four shortcut tabs for authenticated users:
 *   1. Create Invoice  — /dashboard (anchored to invoice creation)
 *   2. Transactions    — /transactions
 *   3. Revenue & Stats — /dashboard (stats tab)
 *   4. Settings        — /settings
 *
 * Design principles:
 *   - Brand-consistent: Ink Navy + Amber Gold accent
 *   - iOS safe-area aware (env(safe-area-inset-bottom))
 *   - Active state uses accent underline pill
 *   - Haptic feedback on tap (if supported)
 *   - Smooth label reveal on active item
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FilePlus,
  ArrowLeftRight,
  BarChart2,
  Settings,
} from "lucide-react";
import { haptic } from "@/hooks/useHaptic";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  matchPaths?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Create",
    href: "/dashboard?action=create",
    icon: <FilePlus size={22} strokeWidth={1.8} />,
    matchPaths: [],
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: <ArrowLeftRight size={22} strokeWidth={1.8} />,
    matchPaths: ["/transactions"],
  },
  {
    label: "Revenue",
    href: "/dashboard?tab=stats",
    icon: <BarChart2 size={22} strokeWidth={1.8} />,
    matchPaths: [],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings size={22} strokeWidth={1.8} />,
    matchPaths: ["/settings"],
  },
];

function isActive(item: NavItem, pathname: string): boolean {
  if (item.matchPaths && item.matchPaths.length > 0) {
    return item.matchPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    );
  }
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes mbn-pip {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }
        .mbn-item-active .mbn-pip {
          animation: mbn-pip 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .mbn-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.18rem;
          flex: 1;
          padding: 0.55rem 0.25rem 0.35rem;
          text-decoration: none;
          position: relative;
          transition: color 0.15s;
          -webkit-tap-highlight-color: transparent;
          outline: none;
          border: none;
          background: transparent;
          cursor: pointer;
          min-width: 0;
        }
        .mbn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.4rem;
          height: 2.4rem;
          border-radius: 0.75rem;
          transition: background 0.18s, transform 0.15s;
          position: relative;
        }
        .mbn-item.mbn-item-active .mbn-icon {
          background: rgba(245, 158, 11, 0.13);
          transform: translateY(-1px);
        }
        .mbn-item:active .mbn-icon {
          transform: scale(0.88) translateY(-1px);
        }
        .mbn-label {
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          line-height: 1;
          transition: color 0.15s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .mbn-pip {
          position: absolute;
          top: -0.6rem;
          left: 50%;
          transform: translateX(-50%) scaleX(0);
          width: 1.5rem;
          height: 0.185rem;
          border-radius: 0 0 3px 3px;
          background: var(--color-accent);
          transform-origin: center;
        }

        /* Visible only below lg (1024px). Using media query here instead of
           Tailwind lg:hidden so inline styles cannot override the rule. */
        .mbn-nav, .mbn-spacer {
          display: none;
        }
        @media (max-width: 1023px) {
          .mbn-nav    { display: flex; }
          .mbn-spacer { display: block; }
        }
      `}</style>

      {/* Bottom bar — hidden on lg+ via .mbn-nav CSS class */}
      <nav
        className="mbn-nav"
        aria-label="Mobile quick navigation"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          background: "rgba(9, 18, 40, 0.97)",
          backdropFilter: "blur(16px) saturate(1.8)",
          WebkitBackdropFilter: "blur(16px) saturate(1.8)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.28)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          alignItems: "stretch",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`mbn-item${active ? " mbn-item-active" : ""}`}
              style={{
                color: active
                  ? "var(--color-accent)"
                  : "rgba(255,255,255,0.45)",
              }}
              onClick={() => haptic("soft")}
            >
              {/* Active pip at the top */}
              <span className="mbn-pip" aria-hidden="true" />

              {/* Icon container */}
              <span className="mbn-icon">{item.icon}</span>

              {/* Label */}
              <span className="mbn-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer so page content is not obscured by the bar */}
      <div
        className="mbn-spacer"
        aria-hidden="true"
        style={{
          height: "calc(3.5rem + env(safe-area-inset-bottom, 0px))",
          flexShrink: 0,
        }}
      />
    </>
  );
}
