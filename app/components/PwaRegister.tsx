"use client";

/**
 * PwaRegister — registers the service worker and handles updates silently.
 *
 * Placed in the root layout so it runs on every page.
 * Returns null — no visible UI.
 *
 * Cross-browser notes:
 *  - iOS Safari 16.4+ supports SW + Web App Manifest → becomes installable
 *  - Older iOS Safari: falls back gracefully (no SW, site behaves as normal)
 *  - Chrome/Edge/Opera/Samsung Browser: full install prompt + offline support
 *  - Firefox: SW support, no native install prompt (but offline still works)
 */

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    // Feature-detect Service Worker support (not available in all environments)
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          // 'all' — SW controls all pages served from this origin
          scope: "/",
          // updateViaCache: 'none' forces the browser to always re-fetch sw.js
          // from the network, bypassing the HTTP cache. This ensures updates
          // are picked up immediately instead of waiting for cache expiry.
          updateViaCache: "none",
        });

        // Periodically check for an updated SW (every 60 minutes)
        setInterval(() => reg.update(), 60 * 60 * 1000);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            // "installed" + there is a controller = new version of the SW is
            // waiting to activate. Reload when the user navigates anyway
            // (skipWaiting + clients.claim in sw.js handles it on next visit).
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // Optionally trigger a UI banner here ("app update available").
              // For now we just let the next page load pick it up.
              console.log(
                "[SW] New version waiting. Will activate on next load.",
              );
            }
          });
        });

        console.log("[SW] Registered, scope:", reg.scope);
      } catch (err) {
        // Registration failures are non-fatal; the app still works online.
        console.warn("[SW] Registration failed:", err);
      }
    };

    // Register after the page has loaded to avoid competing with critical
    // resources (images, fonts, data) during initial page load.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
