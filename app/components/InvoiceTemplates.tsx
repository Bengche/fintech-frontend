"use client";
import { useState } from "react";
import Axios from "axios";
import { useAuth } from "@/context/UserContext";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type Template = {
  id: number;
  template_name: string;
  invoicename: string;
  currency: string;
  amount: number;
  description: string;
  created_at: string;
};

type Props = {
  onLoadTemplate: (template: {
    invoicename: string;
    currency: string;
    amount: string;
    description: string;
  }) => void;
};

export default function InvoiceTemplates({ onLoadTemplate }: Props) {
  const { user_id } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");

  const fetchTemplates = async () => {
    if (!user_id) return;
    setLoading(true);
    setError("");
    try {
      const response = await Axios.get(`${API}/templates/${user_id}`, {
        withCredentials: true,
      });
      setTemplates(response.data.templates);
    } catch {
      setError("Failed to load templates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !showTemplates;
    setShowTemplates(next);
    if (next) fetchTemplates();
  };

  const handleDelete = async (templateId: number) => {
    try {
      await Axios.delete(`${API}/templates/${templateId}`, {
        withCredentials: true,
      });
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      setDeleteSuccess("Template deleted.");
      setTimeout(() => setDeleteSuccess(""), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to delete template.");
    }
  };

  const handleUse = (t: Template) => {
    onLoadTemplate({
      invoicename: t.invoicename,
      currency: t.currency,
      amount: t.amount?.toString() || "",
      description: t.description,
    });
    setShowTemplates(false);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        className="btn-ghost"
        style={{ fontSize: "0.8125rem" }}
      >
        {showTemplates ? "Hide Templates" : "Use a Saved Template"}
      </button>

      {showTemplates && (
        <div
          style={{
            marginTop: "0.75rem",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            backgroundColor: "var(--color-mist)",
          }}
        >
          <h4
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
              margin: "0 0 0.75rem",
            }}
          >
            Your Saved Templates
          </h4>

          {loading && (
            <p
              style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}
            >
              Loading templates\u2026
            </p>
          )}

          {error && (
            <div
              className="alert alert-danger"
              style={{ fontSize: "0.8125rem", marginBottom: "0.5rem" }}
            >
              {error}
            </div>
          )}

          {deleteSuccess && (
            <div
              className="alert alert-success"
              style={{ fontSize: "0.8125rem", marginBottom: "0.5rem" }}
            >
              {deleteSuccess}
            </div>
          )}

          {!loading && templates.length === 0 && (
            <p
              style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}
            >
              No saved templates yet. After creating an invoice, you can save it
              as a template for future reuse.
            </p>
          )}

          {templates.map((t) => (
            <div
              key={t.id}
              style={{
                backgroundColor: "var(--color-white)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                padding: "0.75rem",
                marginBottom: "0.625rem",
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  color: "var(--color-text-heading)",
                  margin: "0 0 0.125rem",
                }}
              >
                {t.template_name}
              </p>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-body)",
                  margin: "0 0 0.125rem",
                }}
              >
                {t.invoicename} &mdash; {t.amount} {t.currency}
              </p>
              {t.description && (
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    margin: "0 0 0.5rem",
                  }}
                >
                  {t.description}
                </p>
              )}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => handleUse(t)}
                  className="btn-primary"
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem" }}
                >
                  Use Template
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="btn-ghost"
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.25rem 0.75rem",
                    color: "var(--color-danger)",
                    borderColor: "var(--color-danger)",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
