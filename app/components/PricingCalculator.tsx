"use client";

import { useState } from "react";

const FEE_RATE = 0.03;
const MIN_AMOUNT = 1000;
const MAX_AMOUNT = 10_000_000;

function formatXaf(n: number): string {
  return n.toLocaleString("fr-CM") + " XAF";
}

export default function PricingCalculator() {
  const [raw, setRaw] = useState("50000");

  const parsed = parseInt(raw.replace(/\D/g, ""), 10);
  const amount = isNaN(parsed) ? 0 : parsed;
  const fee = Math.round(amount * FEE_RATE);
  const payout = amount - fee;
  const valid = amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;

  return (
    <div>
      {/* Input */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label
          htmlFor="calc-amount"
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            marginBottom: "0.5rem",
          }}
        >
          Invoice amount (XAF)
        </label>
        <div
          style={{ display: "flex", alignItems: "stretch", maxWidth: "320px" }}
        >
          <span
            style={{
              padding: "0.625rem 0.875rem",
              backgroundColor: "var(--color-mist)",
              border: "1.5px solid var(--color-border)",
              borderRight: "none",
              borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)",
              fontSize: "0.9375rem",
              color: "var(--color-text-body)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              whiteSpace: "nowrap",
            }}
          >
            XAF
          </span>
          <input
            id="calc-amount"
            className="input"
            type="text"
            inputMode="numeric"
            value={raw}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, "");
              setRaw(cleaned);
            }}
            style={{
              borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
              fontWeight: 700,
              fontSize: "1rem",
            }}
            placeholder="50000"
          />
        </div>
        {amount > 0 && !valid && (
          <p
            style={{
              marginTop: "0.3rem",
              fontSize: "0.8rem",
              color: "var(--color-danger)",
            }}
          >
            {amount < MIN_AMOUNT
              ? `Minimum invoice amount is ${formatXaf(MIN_AMOUNT)}`
              : `Maximum invoice amount is ${formatXaf(MAX_AMOUNT)}`}
          </p>
        )}
      </div>

      {/* Result cards */}
      {valid && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
          }}
        >
          <div
            style={{
              padding: "1.25rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-white)",
            }}
          >
            <p
              style={{
                margin: "0 0 0.4rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--color-text-muted)",
              }}
            >
              Invoice total
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--color-primary)",
              }}
            >
              {formatXaf(amount)}
            </p>
            <p
              style={{
                margin: "0.3rem 0 0",
                fontSize: "0.78rem",
                color: "var(--color-text-muted)",
              }}
            >
              Buyer pays this amount
            </p>
          </div>

          <div
            style={{
              padding: "1.25rem",
              borderRadius: "var(--radius-lg)",
              border: "1.5px solid rgba(239,68,68,0.25)",
              backgroundColor: "#fff5f5",
            }}
          >
            <p
              style={{
                margin: "0 0 0.4rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--color-text-muted)",
              }}
            >
              Fonlok fee (3%)
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--color-danger)",
              }}
            >
              {formatXaf(fee)}
            </p>
            <p
              style={{
                margin: "0.3rem 0 0",
                fontSize: "0.78rem",
                color: "var(--color-text-muted)",
              }}
            >
              Platform &amp; escrow protection
            </p>
          </div>

          <div
            style={{
              padding: "1.25rem",
              borderRadius: "var(--radius-lg)",
              border: "1.5px solid rgba(34,197,94,0.3)",
              backgroundColor: "#f0fdf4",
            }}
          >
            <p
              style={{
                margin: "0 0 0.4rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--color-text-muted)",
              }}
            >
              You receive
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "#16a34a",
              }}
            >
              {formatXaf(payout)}
            </p>
            <p
              style={{
                margin: "0.3rem 0 0",
                fontSize: "0.78rem",
                color: "var(--color-text-muted)",
              }}
            >
              Paid out via MoMo or Orange
            </p>
          </div>
        </div>
      )}

      {/* Quick examples */}
      <div
        style={{
          marginTop: "1.75rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "0.78rem",
            color: "var(--color-text-muted)",
            alignSelf: "center",
            marginRight: "0.25rem",
          }}
        >
          Try:
        </span>
        {[5000, 25000, 50000, 100000, 500000].map((n) => (
          <button
            key={n}
            onClick={() => setRaw(String(n))}
            style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "999px",
              border: "1.5px solid var(--color-border)",
              background:
                amount === n ? "var(--color-primary)" : "var(--color-white)",
              color: amount === n ? "#fff" : "var(--color-text-body)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {(n / 1000).toLocaleString()}k
          </button>
        ))}
      </div>
    </div>
  );
}
