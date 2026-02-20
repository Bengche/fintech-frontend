"use client";

/**
 * Spinner — Fonlok's premium loading indicator system.
 *
 * Three exports:
 *
 *  1. <Spinner />         — inline / button spinner, multiple sizes
 *  2. <PageLoader />      — full-screen takeover while a page initialises
 *  3. <SkeletonBox />     — shimmer placeholder for content areas
 *
 * Design language:
 *  • Dual concentric arcs rotating in opposite directions at different speeds.
 *  • Outer track: Ink Navy at low opacity  (brand structural colour).
 *  • Active arc:  Amber Gold              (brand energy colour).
 *  • No flashing, no bouncing, no rainbow — just controlled, purposeful motion.
 *  • Easing is sinusoidal so acceleration feels physical, not robotic.
 */

import React from "react";

// ─── Shared keyframe block — injected once per render tree ───────────────────
const KEYFRAMES = `
  @keyframes fnlk-spin-cw {
    from { transform: rotate(0deg);    }
    to   { transform: rotate(360deg);  }
  }
  @keyframes fnlk-spin-ccw {
    from { transform: rotate(0deg);    }
    to   { transform: rotate(-360deg); }
  }
  @keyframes fnlk-fade-in {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1);    }
  }
  @keyframes fnlk-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  @keyframes fnlk-pulse-ring {
    0%   { transform: scale(0.9);  opacity: 0.6; }
    50%  { transform: scale(1.05); opacity: 1;   }
    100% { transform: scale(0.9);  opacity: 0.6; }
  }
`;

// ─── Size map ────────────────────────────────────────────────────────────────
const SIZES = {
  xs: { svg: 16, trackW: 1.5, arcW: 1.5, gap: 5 },
  sm: { svg: 24, trackW: 2, arcW: 2, gap: 7 },
  md: { svg: 36, trackW: 2.5, arcW: 2.5, gap: 10 },
  lg: { svg: 52, trackW: 3, arcW: 3, gap: 14 },
  xl: { svg: 72, trackW: 3.5, arcW: 3.5, gap: 18 },
} as const;

type Size = keyof typeof SIZES;
type Variant = "amber" | "white" | "navy";

interface SpinnerProps {
  size?: Size;
  variant?: Variant;
  /** aria label for screen readers */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

// ─── 1. Spinner ──────────────────────────────────────────────────────────────
export function Spinner({
  size = "md",
  variant = "amber",
  label = "Loading…",
  className,
  style,
}: SpinnerProps) {
  const { svg, trackW, arcW, gap } = SIZES[size];
  const cx = svg / 2;
  const cy = svg / 2;

  // Outer ring — sits right at the edge with a little padding
  const rOuter = cx - arcW / 2 - 1;
  // Inner ring — a proportional inset
  const rInner = rOuter - gap;

  // Arc lengths: outer = 270° of the circle, inner = 220°
  const circOuter = 2 * Math.PI * rOuter;
  const circInner = 2 * Math.PI * rInner;
  const dashOuter = (270 / 360) * circOuter;
  const dashInner = (220 / 360) * circInner;

  const arcColour =
    variant === "white"
      ? "#ffffff"
      : variant === "navy"
        ? "#0F1F3D"
        : "#F59E0B"; // amber

  const trackColour =
    variant === "white"
      ? "rgba(255,255,255,0.18)"
      : variant === "navy"
        ? "rgba(15,31,61,0.15)"
        : "rgba(245,158,11,0.15)";

  return (
    <>
      <style>{KEYFRAMES}</style>
      <svg
        width={svg}
        height={svg}
        viewBox={`0 0 ${svg} ${svg}`}
        fill="none"
        aria-label={label}
        role="status"
        className={className}
        style={{ display: "inline-block", flexShrink: 0, ...style }}
      >
        {/* ── Outer track (static) ──────────────────────────────────────── */}
        <circle
          cx={cx}
          cy={cy}
          r={rOuter}
          stroke={trackColour}
          strokeWidth={trackW}
        />

        {/* ── Outer arc (slow clockwise) ────────────────────────────────── */}
        <circle
          cx={cx}
          cy={cy}
          r={rOuter}
          stroke={arcColour}
          strokeWidth={arcW}
          strokeLinecap="round"
          strokeDasharray={`${dashOuter} ${circOuter - dashOuter}`}
          strokeDashoffset={0}
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation:
              "fnlk-spin-cw 1.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite",
          }}
        />

        {/* ── Inner track (static) ─────────────────────────────────────── */}
        {rInner > 3 && (
          <circle
            cx={cx}
            cy={cy}
            r={rInner}
            stroke={trackColour}
            strokeWidth={trackW * 0.75}
          />
        )}

        {/* ── Inner arc (faster, counter-clockwise) ────────────────────── */}
        {rInner > 3 && (
          <circle
            cx={cx}
            cy={cy}
            r={rInner}
            stroke={arcColour}
            strokeWidth={arcW * 0.75}
            strokeLinecap="round"
            strokeDasharray={`${dashInner} ${circInner - dashInner}`}
            strokeDashoffset={0}
            style={{
              opacity: 0.55,
              transformOrigin: `${cx}px ${cy}px`,
              animation:
                "fnlk-spin-ccw 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite",
            }}
          />
        )}
      </svg>
    </>
  );
}

// ─── 2. PageLoader ───────────────────────────────────────────────────────────
// Full-screen overlay — use while the page is fetching its initial data.

interface PageLoaderProps {
  /** Short message shown below the spinner, e.g. "Loading invoices…" */
  message?: string;
}

export function PageLoader({ message }: PageLoaderProps) {
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        role="status"
        aria-label={message || "Loading…"}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9990,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          backgroundColor: "var(--color-cloud, #f8fafc)",
          animation: "fnlk-fade-in 0.25s ease forwards",
        }}
      >
        {/* Brand mark — the "F" shield shape */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "14px",
            background: "var(--color-primary, #0F1F3D)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 0 8px rgba(15,31,61,0.07)",
            animation: "fnlk-pulse-ring 2.4s ease-in-out infinite",
            flexShrink: 0,
          }}
        >
          {/* Wordmark "F" in amber */}
          <svg
            width="22"
            height="26"
            viewBox="0 0 22 26"
            fill="none"
            aria-hidden="true"
          >
            <path d="M3 2h16v4H7v5h10v4H7v9H3V2Z" fill="#F59E0B" />
          </svg>
        </div>

        {/* Spinner below the mark */}
        <Spinner size="lg" variant="amber" label={message || "Loading…"} />

        {/* Optional message */}
        {message && (
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--color-text-muted, #64748b)",
              letterSpacing: "0.01em",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </>
  );
}

// ─── 3. SkeletonBox ───────────────────────────────────────────────────────────
// Shimmer placeholder for tables, cards, and text lines.

interface SkeletonBoxProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export function SkeletonBox({
  width = "100%",
  height = "1rem",
  borderRadius = "var(--radius-sm, 6px)",
  style,
  className,
}: SkeletonBoxProps) {
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        aria-hidden="true"
        className={className}
        style={{
          width,
          height,
          borderRadius,
          background:
            "linear-gradient(90deg, var(--color-mist,#f1f5f9) 25%, var(--color-border,#e2e8f0) 50%, var(--color-mist,#f1f5f9) 75%)",
          backgroundSize: "600px 100%",
          animation: "fnlk-shimmer 1.6s ease-in-out infinite",
          ...style,
        }}
      />
    </>
  );
}

// ─── 4. SkeletonCard — convenience composite for loading cards ───────────────
export function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--color-white, #fff)",
        border: "1px solid var(--color-border, #e2e8f0)",
        borderRadius: "var(--radius-lg, 1rem)",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.875rem",
      }}
    >
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <SkeletonBox width={40} height={40} borderRadius="50%" />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
          }}
        >
          <SkeletonBox width="55%" height="0.875rem" />
          <SkeletonBox width="35%" height="0.75rem" />
        </div>
      </div>
      <SkeletonBox width="100%" height="0.875rem" />
      <SkeletonBox width="80%" height="0.875rem" />
      <SkeletonBox width="60%" height="0.875rem" />
    </div>
  );
}

// ─── 5. SkeletonRow — convenience composite for loading table rows ────────────
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "1rem",
        padding: "0.875rem 1rem",
        borderBottom: "1px solid var(--color-border, #e2e8f0)",
        alignItems: "center",
      }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonBox
          key={i}
          width={i === 0 ? "70%" : i === cols - 1 ? "50%" : "85%"}
          height="0.8125rem"
        />
      ))}
    </div>
  );
}

// ─── 6. InlineSpinner — drop-in replacement for button loading text ───────────
// Usage: {loading ? <InlineSpinner /> : "Save changes"}
export function InlineSpinner({ size = "sm" }: { size?: "xs" | "sm" }) {
  return (
    <Spinner
      size={size}
      variant="white"
      label="Processing…"
      style={{ verticalAlign: "middle", marginTop: "-2px" }}
    />
  );
}

export default Spinner;
