"use client";
import React, { useState } from "react";
import Axios from "axios";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { haptic } from "@/hooks/useHaptic";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type myEditProps = {
  invoice_number: string;
  onEdit: () => void;
  canEdit?: boolean;
  editBlockReason?: string;
};

export default function EditInvoice({
  invoice_number,
  onEdit,
  canEdit = true,
  editBlockReason,
}: myEditProps) {
  const t = useTranslations("Invoice");
  const [showEdit, setShowEdit] = useState(false);
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    currency: "XAF",
    amount: "",
    invoicename: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    haptic("medium");
    setIsSubmitting(true);
    const newFormData = new FormData();
    newFormData.append("currency", formData.currency || "XAF");
    newFormData.append("amount", formData.amount);
    newFormData.append("invoicename", formData.invoicename);
    try {
      await Axios.patch(`${API}/invoice/edit/${invoice_number}`, newFormData, {
        headers: { "Content-Type": "application/json" },
      });
      setEditSuccess(t("edit.success"));
      setShowEdit(false);
      onEdit();
      setTimeout(() => setEditSuccess(""), 5000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || t("edit.errorDefault");
      setEditError(message);
      setTimeout(() => setEditError(""), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Locked state ── */
  if (!canEdit) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "flex-start",
          gap: "0.375rem",
          padding: "0.375rem 0.625rem",
          borderRadius: "var(--radius-sm)",
          backgroundColor: "var(--color-mist)",
          border: "1px solid var(--color-border)",
          maxWidth: "100%",
        }}
        title={editBlockReason}
      >
        <Lock
          size={13}
          style={{
            color: "var(--color-text-muted)",
            flexShrink: 0,
            marginTop: "0.125rem",
          }}
        />
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontWeight: 600, display: "block" }}>
            {t("edit.locked")}
          </span>
          {editBlockReason && (
            <span style={{ display: "block", marginTop: "0.125rem" }}>
              {editBlockReason}
            </span>
          )}
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Toast: success */}
      {editSuccess && (
        <div
          className="alert alert-success"
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 60,
            maxWidth: "22rem",
            boxShadow: "var(--shadow-raised)",
          }}
        >
          {editSuccess}
        </div>
      )}

      {/* Toast: error */}
      {editError && (
        <div
          className="alert alert-danger"
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 60,
            maxWidth: "22rem",
            boxShadow: "var(--shadow-raised)",
          }}
        >
          {editError}
        </div>
      )}

      {/* Trigger button */}
      <button
        className="btn-ghost"
        style={{ fontSize: "0.8125rem" }}
        onClick={() => { haptic("soft"); setShowEdit(!showEdit); }}
        title={t("edit.eligibleHint")}
      >
        {showEdit ? t("edit.cancel") : t("edit.trigger")}
      </button>

      {/* Edit form */}
      {showEdit && (
        <div className="card" style={{ marginTop: "0.75rem", width: "100%" }}>
          <h4
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
              margin: "0 0 1rem",
            }}
          >
            {t("edit.title")}
          </h4>
          <form onSubmit={handleEdit}>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div>
                <label
                  className="label"
                  htmlFor={`invoicename-${invoice_number}`}
                >
                  {t("edit.invoiceName")}
                </label>
                <input
                  className="input"
                  placeholder={
                    t("edit.invoiceNamePlaceholder") ??
                    "e.g. Logo Design Package"
                  }
                  id={`invoicename-${invoice_number}`}
                  name="invoicename"
                  type="text"
                  onChange={handleChange}
                  value={formData.invoicename}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <label
                    className="label"
                    htmlFor={`currency-${invoice_number}`}
                  >
                    {t("edit.currency")}
                  </label>
                  <select
                    className="input"
                    name="currency"
                    id={`currency-${invoice_number}`}
                    onChange={handleChange}
                    defaultValue="XAF"
                  >
                    <option value="XAF">XAF</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor={`amount-${invoice_number}`}>
                    {t("edit.amount")}
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. 50000"
                    id={`amount-${invoice_number}`}
                    type="number"
                    name="amount"
                    onChange={handleChange}
                    value={formData.amount}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("edit.saving") : t("edit.saveChanges")}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
