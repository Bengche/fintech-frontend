"use client";

/**
 * LayoutShell — global Navbar + SiteFooter wrapper.
 *
 * Renders the main Navbar above and SiteFooter below {children} on every
 * page EXCEPT those in the exclusion list (admin dashboard, maintenance,
 * offline — pages that manage their own chrome).
 *
 * Added to the root layout so every route inherits it automatically.
 * Per-page <Navbar /> and <SiteFooter /> has been removed from individual
 * pages; this is now the single source of truth.
 */

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import SiteFooter from "./SiteFooter";

// Paths (prefix-matched) that should NOT receive the global Navbar / Footer.
const EXCLUDED_PREFIXES = ["/admin", "/maintenance", "/offline"];

// Paths that manage their own top nav (keep their specialist header component).
// LayoutShell still adds SiteFooter on these routes.
const CUSTOM_NAV_PATHS = ["/"];

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const excluded = EXCLUDED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (excluded) return <>{children}</>;

  const showNavbar = !CUSTOM_NAV_PATHS.includes(pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
      <SiteFooter />
    </>
  );
}
