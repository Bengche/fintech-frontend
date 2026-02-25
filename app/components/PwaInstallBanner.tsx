"use client";

/**
 * PwaInstallBanner
 *
 * Shows a branded "Add to Home Screen" banner when the PWA install criteria
 * are met.  Handles two distinct cases:
 *
 *  1. Android / Chrome / Edge / Samsung Browser / Opera
 *     The browser fires `beforeinstallprompt`.  We intercept it, suppress the
 *     default mini-infobar, and show our own polished banner.  Tapping
 *     "Install" triggers the native prompt.
 *
 *  2. iOS Safari
 *     iOS never fires `beforeinstallprompt`.  We detect the platform and show
 *     a tailored "tap Share → Add to Home Screen" instruction instead.
 *
 * The banner is suppressed when:
 *  - The app is already running in standalone mode (already installed).
 *  - The user dismisses it (stored in sessionStorage so it doesn't re-appear
 *    on every page; clears when the tab is closed — they may want to install
 *    later in the same session).
 */

import { useEffect, useState } from "react";
import Image from "next/image";

type Platform = "android-chrome" | "ios" | null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface BannerState {
  platform: Platform;
  visible: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  iosStep: boolean;
}

const DISMISSED_KEY = "fonlok-pwa-banner-dismissed";

const INIT: BannerState = {
  platform: null,
  visible: false,
  deferredPrompt: null,
  iosStep: false,
};

export default function PwaInstallBanner() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<BannerState>(INIT);
  const { platform, visible, deferredPrompt, iosStep } = state;

  useEffect(() => {
    setMounted(true);

    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    // ── iOS Safari detection ─────────────────────────────────────────────────
    const nav = navigator as Navigator & { standalone?: boolean };
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) && !nav.standalone;
    if (isIos) {
      setState({
        platform: "ios",
        visible: true,
        deferredPrompt: null,
        iosStep: false,
      });
      return;
    }

    // ── Android/Chrome/Edge/Samsung: listen for beforeinstallprompt ─────────
    const handler = (e: Event) => {
      e.preventDefault();
      setState({
        platform: "android-chrome",
        visible: true,
        deferredPrompt: e as BeforeInstallPromptEvent,
        iosStep: false,
      });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setState((s) => ({ ...s, visible: false }));
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setState((s) => ({ ...s, visible: false }));
    }
    setState((s) => ({ ...s, deferredPrompt: null }));
  };

  if (!mounted || !visible || !platform) return null;

  return (
    <div
      role="banner"
      aria-label="Install Fonlok app"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#0F1F3D",
        borderTop: "2px solid #F59E0B",
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.875rem",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
        // safe-area-inset for iOS home-bar
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
        paddingRight: "max(1.25rem, env(safe-area-inset-right))",
      }}
    >
      {/* App icon */}
      <div
        style={{
          flexShrink: 0,
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "#1a3460",
          border: "1.5px solid #F59E0B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Image
          src="/icons/icon-72.png"
          alt="Fonlok"
          width={40}
          height={40}
          style={{ borderRadius: 8 }}
          unoptimized
        />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!iosStep ? (
          <>
            <p
              style={{
                margin: 0,
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.95rem",
                lineHeight: 1.3,
              }}
            >
              Install Fonlok
            </p>
            <p
              style={{
                margin: "0.2rem 0 0",
                color: "#94a3b8",
                fontSize: "0.82rem",
                lineHeight: 1.4,
              }}
            >
              {platform === "ios"
                ? "Add to your Home Screen for the best experience."
                : "Install the app for fast, offline-ready access."}
            </p>
          </>
        ) : (
          // iOS step-by-step guide
          <>
            <p
              style={{
                margin: 0,
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9rem",
              }}
            >
              How to install on iOS
            </p>
            <ol
              style={{
                margin: "0.4rem 0 0",
                paddingLeft: "1.1rem",
                color: "#94a3b8",
                fontSize: "0.82rem",
                lineHeight: 1.7,
              }}
            >
              <li>
                Tap the{" "}
                <span style={{ color: "#F59E0B", fontWeight: 600 }}>Share</span>{" "}
                button{" "}
                <span
                  style={{ fontSize: "1rem" }}
                  role="img"
                  aria-label="share"
                >
                  ⎙
                </span>{" "}
                at the bottom of Safari.
              </li>
              <li>
                Scroll down and tap{" "}
                <span style={{ color: "#F59E0B", fontWeight: 600 }}>
                  Add to Home Screen
                </span>
                .
              </li>
              <li>
                Tap{" "}
                <span style={{ color: "#F59E0B", fontWeight: 600 }}>Add</span> —
                Fonlok will appear on your home screen.
              </li>
            </ol>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          alignItems: "flex-end",
        }}
      >
        {/* Close / dismiss */}
        <button
          onClick={dismiss}
          aria-label="Dismiss install banner"
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            fontSize: "1.2rem",
            cursor: "pointer",
            lineHeight: 1,
            padding: "0 0.2rem",
          }}
        >
          ✕
        </button>

        {/* Android CTA */}
        {platform === "android-chrome" && (
          <button
            onClick={install}
            style={{
              background: "#F59E0B",
              color: "#0F1F3D",
              fontWeight: 700,
              fontSize: "0.85rem",
              padding: "0.45rem 1rem",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Install
          </button>
        )}

        {/* iOS CTA — shows instructions */}
        {platform === "ios" && !iosStep && (
          <button
            onClick={() => setState((s) => ({ ...s, iosStep: true }))}
            style={{
              background: "#F59E0B",
              color: "#0F1F3D",
              fontWeight: 700,
              fontSize: "0.85rem",
              padding: "0.45rem 1rem",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            How?
          </button>
        )}
      </div>
    </div>
  );
}
