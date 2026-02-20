"use client";
import React, { useState } from "react";
import Axios from "axios";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type myEditProps = {
  invoice_number: string;
  onEdit: () => void;
};

export default function EditInvoice({ invoice_number, onEdit }: myEditProps) {
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
    setIsSubmitting(true);
    const newFormData = new FormData();
    newFormData.append("currency", formData.currency || "XAF");
    newFormData.append("amount", formData.amount);
    newFormData.append("invoicename", formData.invoicename);
    try {
      await Axios.patch(`${API}/invoice/edit/${invoice_number}`, newFormData, {
        headers: { "Content-Type": "application/json" },
      });
      setEditSuccess("Invoice updated successfully.");
      setShowEdit(false);
      onEdit();
      setTimeout(() => setEditSuccess(""), 5000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err.response?.data?.message ||
        "Failed to update invoice. Please try again.";
      setEditError(message);
      setTimeout(() => setEditError(""), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        onClick={() => setShowEdit(!showEdit)}
      >
        {showEdit ? "Cancel" : "Edit"}
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
            Edit Invoice
          </h4>
          <form onSubmit={handleEdit}>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div>
                <label
                  className="label"
                  htmlFor={`invoicename-${invoice_number}`}
                >
                  Invoice Name
                </label>
                <input
                  className="input"
                  placeholder="e.g. Logo Design Package"
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
                    Currency
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
                    Amount (FCFA)
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
                {isSubmitting ? "Saving\u2026" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
