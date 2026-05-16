"use client";

import { useEffect, useState } from "react";
import Axios from "axios";
import { useTranslations } from "next-intl";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function EmailLanguageForm({
  current,
  onSaved,
}: {
  current: "en" | "fr";
  onSaved: (language: "en" | "fr") => void;
}) {
  const t = useTranslations("Settings");
  const [language, setLanguage] = useState<"en" | "fr">(current);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setLanguage(current);
  }, [current]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await Axios.patch(
        `${API}/user/update-email-language`,
        { preferred_email_language: language },
        { withCredentials: true },
      );
      onSaved(res.data.preferred_email_language);
      setMsg({ type: "success", text: t("emailLanguage.success") });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: e.response?.data?.message || t("emailLanguage.error"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
      <h2
        style={{
          fontSize: "1.0625rem",
          fontWeight: 700,
          color: "var(--color-text-heading)",
          margin: "0 0 0.25rem",
        }}
      >
        {t("emailLanguage.sectionTitle")}
      </h2>
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--color-text-muted)",
          margin: "0 0 1.5rem",
        }}
      >
        {t("emailLanguage.sectionSubtitle")}
      </p>
      {msg && (
        <div
          className={`alert alert-${msg.type === "success" ? "success" : "danger"}`}
          style={{ marginBottom: "1rem" }}
        >
          {msg.text}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1.25rem" }}>
          <label className="label">{t("emailLanguage.label")}</label>
          <select
            className="input"
            value={language}
            onChange={(e) => setLanguage(e.target.value as "en" | "fr")}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t("emailLanguage.saving") : t("emailLanguage.save")}
        </button>
      </form>
    </div>
  );
}
