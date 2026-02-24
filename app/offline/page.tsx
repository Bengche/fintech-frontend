/**
 * /offline — Fallback page served by the service worker when the user
 * navigates to a page that has not been cached and the network is unavailable.
 *
 * Client component so the "Try again" button can call window.location.reload().
 * The SW precaches this route during the install phase.
 */
"use client";

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F1F3D",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "1rem",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: 420,
          width: "100%",
        }}
      >
        {/* Fonlok logo mark */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 18,
            background: "#1a3460",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 2rem",
            border: "2px solid #F59E0B",
          }}
        >
          <span
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: "#F59E0B",
              lineHeight: 1,
            }}
          >
            F
          </span>
        </div>

        {/* Wifi-off icon (inline SVG — no external resources needed offline) */}
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ margin: "0 auto 1.5rem", display: "block" }}
          aria-hidden="true"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <circle cx="12" cy="20" r="1" fill="#F59E0B" stroke="none" />
        </svg>

        <h1
          style={{
            color: "#ffffff",
            fontSize: "1.5rem",
            fontWeight: 700,
            margin: "0 0 0.75rem",
          }}
        >
          You&rsquo;re offline
        </h1>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "1rem",
            lineHeight: 1.6,
            margin: "0 0 2rem",
          }}
        >
          It looks like you lost your internet connection. Your Fonlok data is
          safe&nbsp;— reconnect and we&rsquo;ll sync everything right away.
        </p>

        {/* Retry button — reloads the page */}
        <button
          onClick={() => window.location.reload()}
          style={{
            display: "block",
            width: "100%",
            background: "#F59E0B",
            color: "#0F1F3D",
            fontWeight: 700,
            fontSize: "0.95rem",
            padding: "0.75rem 2rem",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            marginBottom: "1rem",
          }}
        >
          Try again
        </button>

        <p style={{ color: "#64748b", fontSize: "0.8rem", margin: 0 }}>
          Fonlok keeps your money safe whether you&rsquo;re online or not.
        </p>
      </div>
    </div>
  );
}
