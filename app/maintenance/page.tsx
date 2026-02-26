"use client";

import { useTranslations } from "next-intl";
import FonlokLogo from "../components/FonlokLogo";

export default function MaintenancePage() {
  const t = useTranslations("Maintenance");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--color-bg, #f8fafc)",
        textAlign: "center",
        gap: "1.5rem",
      }}
    >
      <FonlokLogo />

      {/* Wrench / hard-hat illustration */}
      <div style={{ fontSize: "4rem", lineHeight: 1 }}>🔧</div>

      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "var(--color-text, #0F1F3D)",
          margin: 0,
        }}
      >
        {t("title")}
      </h1>

      <p
        style={{
          fontSize: "1rem",
          color: "var(--color-text-muted, #64748b)",
          maxWidth: "480px",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {t("body")}
      </p>

      <p
        style={{
          fontSize: "0.85rem",
          color: "var(--color-text-muted, #94a3b8)",
          margin: 0,
        }}
      >
        {t("sub")}
      </p>

      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: "0.5rem",
          padding: "0.65rem 1.5rem",
          borderRadius: "8px",
          background: "var(--color-primary, #0F1F3D)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "0.9rem",
        }}
      >
        {t("refresh")}
      </button>
    </div>
  );
}
