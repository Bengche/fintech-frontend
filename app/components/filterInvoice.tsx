"use client";
import React, { useState } from "react";
import Axios from "axios";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "next-intl";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

interface FilteredInvoice {
  invoicenumber: string;
  invoicename: string;
  amount: number;
  currency: string;
  status: string;
  [key: string]: unknown;
}

export default function FilterInvoice() {
  const { user_id } = useAuth();
  const t = useTranslations("Invoice");
  const [formData, setFormData] = useState({ amount: 0, currency: "XAF" });
  const [invoices, setInvoices] = useState<FilteredInvoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFilter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await Axios.get(
        `${API}/invoice/filter/${user_id}?amount=${formData.amount}&currency=${formData.currency || "XAF"}`,
      );
      setInvoices(response.data.invoice || []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || t("filter.errorDefault"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      {/* Toggle button */}
      <button
        className="btn-ghost"
        style={{ fontSize: "0.875rem" }}
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? t("filter.hide") : t("filter.show")}
      </button>

      {/* Filter form */}
      {showForm && (
        <div className="card" style={{ marginTop: "0.75rem" }}>
          <h4
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
              margin: "0 0 1rem",
            }}
          >
            {t("filter.title")}
          </h4>

          <form onSubmit={handleFilter}>
            <div
              className="filter-form-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <div>
                <label className="label" htmlFor="filter-amount">
                  {t("filter.amountLabel")}
                </label>
                <input
                  className="input"
                  placeholder="e.g. 50000"
                  id="filter-amount"
                  name="amount"
                  type="number"
                  onChange={handleChange}
                  value={formData.amount}
                />
              </div>
              <div>
                <label className="label" htmlFor="filter-currency">
                  {t("filter.currencyLabel")}
                </label>
                <select
                  className="input"
                  id="filter-currency"
                  name="currency"
                  onChange={handleChange}
                  value={formData.currency}
                >
                  <option value="XAF">XAF</option>
                </select>
              </div>
            </div>

            {error && (
              <div
                className="alert alert-danger"
                style={{ marginBottom: "0.75rem" }}
              >
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t("filter.filtering") : t("filter.applyFilter")}
            </button>
          </form>

          {/* Results */}
          {invoices.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <p
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  marginBottom: "0.5rem",
                }}
              >
                {invoices.length}{" "}
                {t("filter.noResults", { count: invoices.length })}
              </p>
              {invoices.map((inv) => (
                <div
                  key={String(inv.id ?? inv.invoicenumber)}
                  style={{
                    backgroundColor: "var(--color-mist)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.625rem 0.75rem",
                    marginBottom: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.25rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-text-heading)",
                    }}
                  >
                    {inv.invoicename}
                  </span>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {inv.amount} {inv.currency}
                  </span>
                </div>
              ))}
            </div>
          )}

          {invoices.length === 0 && !loading && (
            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
              }}
            >
              {t("filter.noResults")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
