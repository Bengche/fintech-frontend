"use client";
import { useState } from "react";

export interface StatTab {
  value: string;
  label: string;
  detail: string;
}

export default function HeroStatsTabs({ tabs }: { tabs: StatTab[] }) {
  const [active, setActive] = useState(0);

  return (
    <div
      style={{
        marginTop: "2.5rem",
        paddingTop: "2rem",
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* ── Tab row ── */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          width: "100%",
        }}
        role="tablist"
        aria-label="Key features"
      >
        {tabs.map((tab, i) => {
          const isActive = i === active;
          return (
            <button
              key={i}
              role="tab"
              aria-selected={isActive}
              aria-controls={`stat-panel-${i}`}
              id={`stat-tab-${i}`}
              onClick={() => setActive(i)}
              style={{
                flex: 1,
                padding: "0.6rem 0.5rem",
                border: "none",
                borderRight:
                  i < tabs.length - 1
                    ? "1px solid rgba(255,255,255,0.12)"
                    : "none",
                cursor: "pointer",
                backgroundColor: isActive
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(255,255,255,0.04)",
                transition: "background-color 0.18s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.2rem",
                position: "relative",
              }}
            >
              {/* Active bottom border bar */}
              {isActive && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    backgroundColor: "var(--color-accent)",
                  }}
                />
              )}
              <span
                style={{
                  fontSize: "clamp(0.7rem, 2.6vw, 0.9375rem)",
                  fontWeight: 800,
                  lineHeight: 1,
                  color: isActive ? "#F59E0B" : "rgba(255,255,255,0.75)",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.value}
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  color: isActive
                    ? "rgba(245,158,11,0.75)"
                    : "rgba(255,255,255,0.38)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Panel ── */}
      {tabs.map((tab, i) => (
        <div
          key={i}
          id={`stat-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`stat-tab-${i}`}
          hidden={i !== active}
          style={{
            marginTop: "0.75rem",
            padding: "0.875rem 1.125rem",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderTop: "2px solid var(--color-accent)",
            borderRadius: "0 0 var(--radius-md) var(--radius-md)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.7,
            }}
          >
            {tab.detail}
          </p>
        </div>
      ))}
    </div>
  );
}
