import type { MetadataRoute } from "next";

/**
 * PWA Web App Manifest
 * Served automatically at /manifest.webmanifest by Next.js.
 * The <link rel="manifest"> tag is injected into every page automatically.
 *
 * Design decisions:
 *  - display: "standalone"    — hides the browser chrome for app-like feel
 *  - start_url: "/"           — auth guard in the app handles redirect to /dashboard
 *  - theme_color: navy        — matches brand; sets status-bar colour on Android
 *  - background_color: navy   — splash screen colour while JS boots
 *  - orientation: "portrait"  — natural orientation for a mobile fintech app
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fonlok — Secure Escrow Payments",
    short_name: "Fonlok",
    description:
      "Hold funds securely until both buyer and seller are satisfied. Pay safely with MTN Mobile Money and Orange Money — no more scams.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0F1F3D",
    theme_color: "#0F1F3D",
    categories: ["finance", "business"],
    lang: "en",
    dir: "ltr",

    icons: [
      // ── Standard (any purpose) ───────────────────────────────────────────
      {
        src: "/icons/icon-72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-167.png",
        sizes: "167x167",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-180.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // ── Maskable (safe-zone padded — used for adaptive icons on Android) ─
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],

    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Go to your Fonlok dashboard",
        url: "/dashboard",
        icons: [
          { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
        ],
      },
      {
        name: "New Invoice",
        short_name: "Invoice",
        description: "Create a new escrow invoice",
        url: "/dashboard",
        icons: [
          { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
        ],
      },
    ],

    // Shown in Chrome's enhanced install dialog on Android
    // screenshots: [], // Add /public/screenshots/*.png if you want
  };
}
