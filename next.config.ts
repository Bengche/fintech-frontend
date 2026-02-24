import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  async headers() {
    return [
      // ── Service Worker ───────────────────────────────────────────────────────
      // sw.js must NOT be cached by the HTTP cache so the browser always
      // checks for a new version. Service-Worker-Allowed: "/" lets a SW
      // served from /sw.js control pages at any path (not just /).
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },

      // ── Web App Manifest ────────────────────────────────────────────────────
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },

      // ── Icons ───────────────────────────────────────────────────────────────
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, immutable" },
        ],
      },

      // ── Apple Touch Icon / favicon ──────────────────────────────────────────
      {
        source: "/(apple-touch-icon|favicon)(.+)?",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, immutable" },
        ],
      },

      // ── Security headers for all page responses ─────────────────────────────
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
