"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { Sparkles, Send, X } from "lucide-react";
import { useAuth } from "@/context/UserContext";
import { haptic } from "@/hooks/useHaptic";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type Variant = "nav" | "sidebar" | "mobile";

interface Props {
  variant?: Variant;
}

export default function RequestFeatureButton({ variant = "nav" }: Props) {
  const locale = useLocale();
  const pathname = usePathname();
  const { user_id, username, authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const isSignedIn = !!user_id && !authLoading;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setSent(false);
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (isSignedIn && username && !name) {
      setName(username.replace(/_/g, " "));
    }
  }, [isSignedIn, username, name]);

  useEffect(() => {
    if (variant === "mobile" && open) {
      haptic("soft");
    }
  }, [open, variant]);

  const triggerText = useMemo(
    () => (locale === "fr" ? "Demander une fonctionnalité" : "Request Feature"),
    [locale],
  );

  const submitLabel = locale === "fr" ? "Envoyer la demande" : "Send request";
  const titleLabel = locale === "fr" ? "Titre de la fonctionnalité" : "Feature title";
  const detailsLabel = locale === "fr" ? "Décrivez votre idée" : "Describe your idea";
  const nameLabel = locale === "fr" ? "Votre nom" : "Your name";
  const emailLabel = locale === "fr" ? "Adresse e-mail" : "Email address";
  const helperText = locale === "fr"
    ? "Partagez une idée claire et utile. Nous la transmettrons directement à notre équipe produit."
    : "Share a clear idea that would improve Fonlok. We will forward it directly to our product team.";
  const optionalText = locale === "fr" ? "optionnel si vous êtes connecté" : "optional for signed-in users";
  const emailHint = isSignedIn
    ? (locale === "fr" ? "Laisser vide pour utiliser l'e-mail de votre compte." : "Leave blank to use your account email.")
    : (locale === "fr" ? "Nous avons besoin d'un e-mail pour vous répondre." : "We need an email so we can reply.");

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSent(false);

    const trimmedTitle = title.trim();
    const trimmedDetails = details.trim();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedTitle || !trimmedDetails || (!isSignedIn && !trimmedEmail)) {
      setError(locale === "fr" ? "Veuillez remplir tous les champs requis." : "Please fill in the required fields.");
      setSubmitting(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/admin/feature-request`, {
        name: trimmedName,
        email: trimmedEmail,
        title: trimmedTitle,
        details: trimmedDetails,
        userId: user_id,
        username,
        locale,
        pathname,
      });
      setSent(true);
      setTitle("");
      setDetails("");
      setEmail("");
      if (!isSignedIn) setName("");
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          (locale === "fr"
            ? "Impossible d'envoyer votre demande pour le moment."
            : "We could not send your request right now."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const triggerStyles: CSSProperties =
    variant === "sidebar"
      ? {
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          width: "100%",
          padding: "0.575rem 0.875rem",
          borderRadius: "0.625rem",
          border: "1px solid transparent",
          background: "rgba(245,158,11,0.1)",
          color: "#f59e0b",
          cursor: "pointer",
          fontWeight: 600,
          textAlign: "left",
        }
      : variant === "mobile"
        ? {
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
            width: "100%",
            padding: "0.7rem 0.875rem",
            borderRadius: "10px",
            border: "none",
            background: "none",
            color: "rgba(255,255,255,0.82)",
            cursor: "pointer",
            fontSize: "0.9375rem",
            fontWeight: 500,
            textAlign: "left",
          }
        : {
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.42rem 0.85rem",
            borderRadius: "999px",
            border: "1.5px solid rgba(255,255,255,0.18)",
            background: "linear-gradient(135deg, rgba(245,158,11,0.14), rgba(255,255,255,0.06))",
            color: "rgba(255,255,255,0.92)",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.84rem",
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          };

  const trigger =
    variant === "mobile" ? (
      <>
        <span className="nav-mob-icon" style={{ background: "rgba(245,158,11,0.14)" }}>
          <Sparkles size={15} strokeWidth={2} color="#f59e0b" />
        </span>
        {triggerText}
      </>
    ) : variant === "sidebar" ? (
      <>
        <span className="sidebar-icon" style={{ background: "rgba(245,158,11,0.16)" }}>
          <Sparkles size={17} strokeWidth={1.8} color="#f59e0b" />
        </span>
        <span>{triggerText}</span>
      </>
    ) : (
      <>
        <Sparkles size={15} strokeWidth={2} />
        <span>{triggerText}</span>
      </>
    );

  return (
    <>
      <button
        type="button"
        style={triggerStyles}
        onClick={() => {
          haptic("soft");
          setOpen(true);
        }}
        onMouseEnter={(e) => {
          if (variant === "nav") {
            e.currentTarget.style.borderColor = "rgba(245,158,11,0.38)";
            e.currentTarget.style.background =
              "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(255,255,255,0.09))";
          }
        }}
        onMouseLeave={(e) => {
          if (variant === "nav") {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
            e.currentTarget.style.background =
              "linear-gradient(135deg, rgba(245,158,11,0.14), rgba(255,255,255,0.06))";
          }
        }}
      >
        {trigger}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="feature-request-title"
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 120,
                background: "rgba(4,10,25,0.72)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
              }}
            >
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: "min(96vw, 560px)",
                  borderRadius: "24px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background:
                    "linear-gradient(180deg, rgba(13,30,66,0.98) 0%, rgba(8,18,34,0.98) 100%)",
                  boxShadow:
                    "0 30px 80px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "1.25rem 1.25rem 1rem",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, color: "#f59e0b", fontSize: "0.76rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                      {locale === "fr" ? "Idée produit" : "Product idea"}
                    </p>
                    <h2 id="feature-request-title" style={{ margin: "0.35rem 0 0.4rem", color: "#fff", fontSize: "1.35rem", fontWeight: 800 }}>
                      {triggerText}
                    </h2>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.68)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                      {helperText}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={locale === "fr" ? "Fermer" : "Close"}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "999px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.84)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={submitRequest} style={{ padding: "1.25rem" }}>
                  <div style={{ display: "grid", gap: "0.95rem" }}>
                    <FieldLabel label={nameLabel} optional={isSignedIn && variant !== "mobile" ? optionalText : undefined}>
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder={locale === "fr" ? "Votre nom ou pseudo" : "Your name or username"}
                        style={inputStyle}
                      />
                    </FieldLabel>
                    <FieldLabel label={emailLabel} optional={optionalText} hint={emailHint}>
                      <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        type="email"
                        placeholder={locale === "fr" ? "vous@exemple.com" : "you@example.com"}
                        style={inputStyle}
                      />
                    </FieldLabel>
                    <FieldLabel label={titleLabel}>
                      <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder={locale === "fr" ? "Ex. Relevés PDF améliorés" : "E.g. Better PDF statements"}
                        style={inputStyle}
                      />
                    </FieldLabel>
                    <FieldLabel label={detailsLabel}>
                      <textarea
                        value={details}
                        onChange={(event) => setDetails(event.target.value)}
                        placeholder={locale === "fr" ? "Expliquez l'amélioration, le gain pour les utilisateurs et pourquoi elle est importante." : "Explain the improvement, the benefit to users, and why it matters."}
                        rows={5}
                        style={{ ...inputStyle, resize: "vertical", minHeight: "132px" }}
                      />
                    </FieldLabel>
                  </div>

                  {error && (
                    <div style={{ marginTop: "0.95rem", padding: "0.85rem 1rem", borderRadius: "14px", background: "rgba(220,38,38,0.14)", border: "1px solid rgba(220,38,38,0.24)", color: "#fecaca", fontSize: "0.92rem", lineHeight: 1.5 }}>
                      {error}
                    </div>
                  )}
                  {sent && (
                    <div style={{ marginTop: "0.95rem", padding: "0.85rem 1rem", borderRadius: "14px", background: "rgba(22,163,74,0.14)", border: "1px solid rgba(22,163,74,0.24)", color: "#bbf7d0", fontSize: "0.92rem", lineHeight: 1.5 }}>
                      {locale === "fr" ? "Votre demande a été envoyée à l'équipe Fonlok." : "Your request has been sent to the Fonlok team."}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.2rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      style={{
                        padding: "0.82rem 1rem",
                        borderRadius: "14px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.82)",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {locale === "fr" ? "Annuler" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        padding: "0.82rem 1.15rem",
                        borderRadius: "14px",
                        border: "1px solid rgba(245,158,11,0.42)",
                        background: "linear-gradient(135deg, #f59e0b 0%, #facc15 100%)",
                        color: "#0f1f3d",
                        fontWeight: 800,
                        cursor: submitting ? "wait" : "pointer",
                        boxShadow: "0 12px 28px rgba(245,158,11,0.24)",
                      }}
                    >
                      <Send size={16} strokeWidth={2.2} />
                      {submitting ? (locale === "fr" ? "Envoi…" : "Sending…") : submitLabel}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function FieldLabel({
  label,
  children,
  hint,
  optional,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  optional?: string;
}) {
  return (
    <label style={{ display: "grid", gap: "0.45rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.75rem" }}>
        <span style={{ color: "rgba(255,255,255,0.88)", fontSize: "0.88rem", fontWeight: 700 }}>{label}</span>
        {optional ? <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.74rem" }}>{optional}</span> : null}
      </div>
      {children}
      {hint ? <span style={{ color: "rgba(255,255,255,0.46)", fontSize: "0.78rem", lineHeight: 1.5 }}>{hint}</span> : null}
    </label>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  padding: "0.88rem 0.95rem",
  outline: "none",
  fontSize: "0.95rem",
  boxSizing: "border-box",
};
