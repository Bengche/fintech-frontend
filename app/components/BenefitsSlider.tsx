"use client";
import { useState, useRef } from "react";

export interface BenefitItem {
  title: string;
  desc: string;
}

/** SVG icon per benefit card (by index 0-5) */
function CardIcon({ index }: { index: number }) {
  const base = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24" as const,
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (index) {
    case 0: // Buyer protection — shield
      return (
        <svg {...base}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 1: // Seller guarantee — check-circle
      return (
        <svg {...base}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 2: // Dispute resolution — shield with checkmark
      return (
        <svg {...base}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );
    case 3: // Mobile money — smartphone
      return (
        <svg {...base}>
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    case 4: // No hidden charges — dollar sign
      return (
        <svg {...base}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    default: // Fully online — globe
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
}

/** Arrow button used for prev/next navigation */
function ArrowBtn({
  direction,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous benefit" : "Next benefit"}
      style={{
        width: "2.625rem",
        height: "2.625rem",
        borderRadius: "50%",
        border: "1.5px solid",
        borderColor: disabled
          ? "var(--color-border)"
          : "var(--color-accent)",
        backgroundColor: disabled ? "transparent" : "var(--color-accent)",
        color: disabled
          ? "var(--color-text-muted)"
          : "var(--color-primary)",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background-color 0.2s, border-color 0.2s",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {direction === "prev" ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 18 15 12 9 6" />
        )}
      </svg>
    </button>
  );
}

export default function BenefitsSlider({ items }: { items: BenefitItem[] }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const n = items.length;

  const go = (i: number) => setCurrent(Math.max(0, Math.min(n - 1, i)));
  const prev = () => go(current - 1);
  const next = () => go(current + 1);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) next();
    else if (dx > 50) prev();
  };

  return (
    <div style={{ maxWidth: "820px", margin: "0 auto" }}>
      {/* ── Slider viewport ── */}
      <div
        style={{ overflow: "hidden", borderRadius: "var(--radius-lg)" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            display: "flex",
            transform: `translateX(-${current * 100}%)`,
            transition: "transform 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          {items.map((item, i) => (
            <div key={i} style={{ flex: "0 0 100%" }}>
              <div
                style={{
                  backgroundColor: "var(--color-cloud)",
                  border: "1px solid var(--color-border)",
                  borderLeft: "4px solid var(--color-accent)",
                  borderRadius: "var(--radius-lg)",
                  padding: "2.25rem 2.5rem",
                  position: "relative",
                  minHeight: "200px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.125rem",
                }}
              >
                {/* Card counter — top right */}
                <span
                  style={{
                    position: "absolute",
                    top: "1.5rem",
                    right: "2rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--color-text-muted)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}&thinsp;/&thinsp;{String(n).padStart(2, "0")}
                </span>

                {/* Icon badge */}
                <div
                  style={{
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-accent-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-accent-hover)",
                    flexShrink: 0,
                  }}
                >
                  <CardIcon index={i} />
                </div>

                {/* Text */}
                <div>
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      marginBottom: "0.5rem",
                      color: "var(--color-text-heading)",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9875rem",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.8,
                      maxWidth: "600px",
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Controls: prev • dots • next ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          marginTop: "1.75rem",
        }}
      >
        <ArrowBtn direction="prev" onClick={prev} disabled={current === 0} />

        {/* Dots */}
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Go to benefit ${i + 1}`}
              style={{
                width: i === current ? "1.75rem" : "0.5rem",
                height: "0.5rem",
                borderRadius: "999px",
                backgroundColor:
                  i === current
                    ? "var(--color-accent)"
                    : "var(--color-border-strong)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.3s ease, background-color 0.2s",
              }}
            />
          ))}
        </div>

        <ArrowBtn
          direction="next"
          onClick={next}
          disabled={current === n - 1}
        />
      </div>
    </div>
  );
}
