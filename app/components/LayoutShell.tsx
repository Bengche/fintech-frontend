"use client";

/**
 * LayoutShell — global navigation + footer wrapper.
 *
 * Renders the appropriate navigation chrome for every route:
 *
 *   - Unauthenticated / public pages:  top Navbar + SiteFooter (unchanged)
 *   - Authenticated users (mobile/tablet):
 *       top Navbar (branding + notifications) + fixed bottom MobileBottomNav
 *   - Authenticated users (desktop lg+):
 *       DashboardSidebar (replaces top Navbar entirely) + SiteFooter
 *
 * Pages in EXCLUDED_PREFIXES manage their own chrome and receive nothing.
 * The homepage ("/") uses its own SiteHeader so the top Navbar is suppressed.
 */

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/UserContext";
import Navbar from "./Navbar";
import SiteFooter from "./SiteFooter";
import DashboardSidebar from "./DashboardSidebar";
import MobileBottomNav from "./MobileBottomNav";

// Paths (prefix-matched) that should NOT receive any global chrome.
const EXCLUDED_PREFIXES = ["/admin", "/maintenance", "/offline"];

// Paths that manage their own top nav.
// LayoutShell still adds SiteFooter on these routes.
const CUSTOM_NAV_PATHS = ["/"];

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user_id, authLoading } = useAuth();

  const excluded = EXCLUDED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (excluded) return <>{children}</>;

  const showNavbar = !CUSTOM_NAV_PATHS.includes(pathname);
  const isLoggedIn = !authLoading && !!user_id;

  if (isLoggedIn) {
    return (
      <div style={{ display: "flex", minHeight: "100dvh" }}>
        {/* Desktop sidebar — hidden on mobile via internal CSS */}
        <DashboardSidebar />

        {/* Main content column */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Top navbar — visible only on mobile/tablet (lg: hidden) */}
          <div className="lg:hidden">
            <Navbar />
          </div>

          <main
            style={{
              flex: 1,
              // On mobile/tablet the fixed bottom nav sits ~3.5rem + safe-area tall.
              // Apply clearance globally so no page content is obscured beneath it.
              // On lg+ the bottom nav is hidden so this padding is zero-cost.
              paddingBottom: "calc(3.5rem + env(safe-area-inset-bottom, 0px))",
            }}
            className="lg:pb-0"
          >
            {children}
          </main>

          {/* Footer hidden on lg+ (sidebar already anchors the brand) */}
          <div className="hidden lg:block">
            <SiteFooter />
          </div>
        </div>

        {/* Mobile bottom bar — hidden on lg+ via internal CSS */}
        <MobileBottomNav />
      </div>
    );
  }

  // Unauthenticated layout — unchanged behaviour
  return (
    <>
      {showNavbar && <Navbar />}
      {children}
      <SiteFooter />
    </>
  );
}
