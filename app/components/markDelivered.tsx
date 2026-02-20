"use client";
import { useState } from "react";
import Axios from "axios";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type MarkDeliveredProps = {
  invoice_id: number;
  onDelivered: () => void;
};

export default function MarkDelivered({
  invoice_id,
  onDelivered,
}: MarkDeliveredProps) {
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await Axios.patch(`${API}/invoice/mark-delivered/${invoice_id}`);
      setShowModal(false);
      setSuccessMessage(
        "Invoice marked as delivered. The buyer has been notified.",
      );
      onDelivered();
      setTimeout(() => setSuccessMessage(""), 6000);
    } catch (error: unknown) {
      setShowModal(false);
      const err = error as { response?: { data?: { message?: string } } };
      const msg =
        err.response?.data?.message ||
        "Failed to mark as delivered. Please try again.";
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(""), 6000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast: success */}
      {successMessage && (
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
          {successMessage}
        </div>
      )}

      {/* Toast: error */}
      {errorMessage && (
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
          {errorMessage}
        </div>
      )}

      {/* Trigger button */}
      <button
        className="btn-primary"
        style={{ fontSize: "0.8125rem" }}
        onClick={() => setShowModal(true)}
      >
        Mark as Delivered
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
              maxWidth: "28rem",
              width: "100%",
              boxShadow: "var(--shadow-modal)",
            }}
          >
            <h3
              style={{
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
                margin: "0 0 0.5rem",
              }}
            >
              Confirm Delivery
            </h3>

            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-body)",
                marginBottom: "0.75rem",
              }}
            >
              You are about to mark this invoice as <strong>delivered</strong>.
              Only do this if you have fully completed the job or delivered the
              order.
            </p>

            <div
              className="alert alert-warning"
              style={{ marginBottom: "1rem", fontSize: "0.8125rem" }}
            >
              The buyer will receive an email asking them to confirm receipt
              before funds are released to you.
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                {isSubmitting ? "Confirming\u2026" : "Yes, I Have Delivered"}
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
