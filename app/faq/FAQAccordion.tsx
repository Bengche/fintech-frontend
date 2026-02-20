"use client";

import { useState } from "react";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            style={{
              borderRadius: "var(--radius-md)",
              border: `1px solid ${isOpen ? "var(--color-primary)" : "var(--color-border)"}`,
              backgroundColor: "var(--color-white)",
              overflow: "hidden",
              transition: "border-color 0.15s ease",
            }}
          >
            <button
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "1.125rem 1.25rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: isOpen ? 700 : 600,
                  color: isOpen
                    ? "var(--color-primary)"
                    : "var(--color-text-heading)",
                  lineHeight: 1.4,
                  transition: "color 0.15s ease",
                }}
              >
                {item.q}
              </span>
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: "1.25rem",
                  height: "1.25rem",
                  borderRadius: "50%",
                  backgroundColor: isOpen
                    ? "var(--color-primary)"
                    : "var(--color-mist)",
                  color: isOpen ? "#ffffff" : "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  lineHeight: 1,
                  transition: "background-color 0.15s ease, color 0.15s ease",
                }}
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>

            {isOpen && (
              <div style={{ padding: "0 1.25rem 1.25rem" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9375rem",
                    color: "var(--color-text-body)",
                    lineHeight: 1.8,
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "1rem",
                  }}
                >
                  {item.a}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
