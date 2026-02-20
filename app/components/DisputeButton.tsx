"use client";
import { useState } from "react";
import Axios from "axios";
import { AlertTriangle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type DisputeButtonProps = {
  invoice_number: string;
  sender_type: "seller" | "buyer";
  buyer_token?: string;
  autoOpen?: boolean;
};

export default function DisputeButton({
  invoice_number,
  sender_type,
  buyer_token,
  autoOpen = false,
}: DisputeButtonProps) {
  const [showModal, setShowModal] = useState(autoOpen);
  const [reason, setReason] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitDispute = async () => {
    if (!reason.trim()) {
      setErrorMessage("Please describe the reason for the dispute.");
      return;
    }
    setIsSubmitting(true);
    try {
      const body: { reason: string; opened_by: string; token?: string } = {
        reason,
        opened_by: sender_type,
      };
      if (sender_type === "buyer" && buyer_token) {
        body.token = buyer_token;
      }
      await Axios.post(`${API}/dispute/open/${invoice_number}`, body);
      setShowModal(false);
      setReason("");
      setSuccessMessage(
        "Dispute submitted. Our admin has been notified and will review your case shortly.",
      );
      setTimeout(() => setSuccessMessage(""), 8000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg =
        err.response?.data?.message ||
        "Failed to open dispute. Please try again.";
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(""), 8000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Toast: success */}
      {successMessage && (
        <div
          className="alert alert-success"
          style={{
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Toast: error (inline, not fixed) */}
      {errorMessage && !showModal && (
        <div
          className="alert alert-danger"
          style={{
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setShowModal(true)}
        className="btn-ghost"
        style={{
          fontSize: "0.8125rem",
          color: "var(--color-danger)",
          borderColor: "var(--color-danger)",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
      >
        <AlertTriangle size={13} />
        Open a Dispute
      </button>

      {/* Dispute modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
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
              maxWidth: "30rem",
              width: "100%",
              boxShadow: "var(--shadow-modal)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                marginBottom: "0.75rem",
              }}
            >
              <AlertTriangle
                size={20}
                style={{ color: "var(--color-danger)", flexShrink: 0 }}
              />
              <h3
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  color: "var(--color-danger)",
                  margin: 0,
                }}
              >
                Open a Dispute
              </h3>
            </div>

            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-body)",
                marginBottom: "1rem",
              }}
            >
              A dispute will notify our admin, who will review the chat history
              and all messages before making a fair decision. Please only open a
              dispute if you have a genuine issue.
            </p>

            <label className="label" htmlFor="dispute-reason">
              Describe your issue{" "}
              <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <textarea
              id="dispute-reason"
              rows={4}
              placeholder="Explain clearly what went wrong. For example: I paid but did not receive the product, or the product was different from described."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input"
              style={{ resize: "vertical", marginBottom: "0.75rem" }}
            />

            <div
              className="alert alert-warning"
              style={{ fontSize: "0.8125rem", marginBottom: "1rem" }}
            >
              <strong>Note:</strong> Our admin will read all chat messages
              between you and the other party before deciding. Make sure your
              communication clearly reflects the situation.
            </div>

            {errorMessage && (
              <div
                className="alert alert-danger"
                style={{ fontSize: "0.8125rem", marginBottom: "0.75rem" }}
              >
                {errorMessage}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={submitDispute}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: "0.625rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--color-danger)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  border: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? "Submitting\u2026" : "Submit Dispute"}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setReason("");
                  setErrorMessage("");
                }}
                className="btn-ghost"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
