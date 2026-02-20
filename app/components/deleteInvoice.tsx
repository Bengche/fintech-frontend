"use client";
import { useState } from "react";
import Axios from "axios";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type myProps = {
  invoice_id: number;
  onDelete: () => void;
};

export default function DeleteInvoice({ invoice_id, onDelete }: myProps) {
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [deleteFailure, setDeleteFailure] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await Axios.delete(`${API}/invoice/delete/${invoice_id}`);
      setDeleteSuccess("Invoice deleted successfully.");
      setShowModal(false);
      onDelete();
      setTimeout(() => setDeleteSuccess(""), 5000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || "Failed to delete invoice.";
      setDeleteFailure(msg);
      setShowModal(false);
      setTimeout(() => setDeleteFailure(""), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Toast: success */}
      {deleteSuccess && (
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
          {deleteSuccess}
        </div>
      )}

      {/* Toast: error */}
      {deleteFailure && (
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
          {deleteFailure}
        </div>
      )}

      {/* Trigger button */}
      <button
        className="btn-ghost"
        style={{
          fontSize: "0.8125rem",
          color: "var(--color-danger)",
          borderColor: "var(--color-danger)",
        }}
        onClick={() => setShowModal(true)}
      >
        Delete
      </button>

      {/* Confirmation modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: "26rem",
              width: "100%",
              boxShadow: "var(--shadow-modal)",
            }}
          >
            <h3
              style={{
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: "var(--color-danger)",
                margin: "0 0 0.5rem",
              }}
            >
              Delete Invoice
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-body)",
                marginBottom: "1.25rem",
              }}
            >
              Are you sure you want to delete this invoice? This action cannot
              be undone.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: "0.625rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--color-danger)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  border: "none",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? "Deleting\u2026" : "Yes, Delete"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="btn-ghost"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
