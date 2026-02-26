"use client";
import { useState } from "react";
import Axios from "axios";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { haptic } from "@/hooks/useHaptic";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type myProps = {
  invoice_id: number;
  onDelete: () => void;
  canDelete?: boolean;
  deleteBlockReason?: string;
};

export default function DeleteInvoice({
  invoice_id,
  onDelete,
  canDelete = true,
  deleteBlockReason,
}: myProps) {
  const t = useTranslations("Invoice");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [deleteFailure, setDeleteFailure] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    haptic("heavy");
    setIsDeleting(true);
    try {
      await Axios.delete(`${API}/invoice/delete/${invoice_id}`);
      setDeleteSuccess(t("delete.success"));
      setShowModal(false);
      onDelete();
      setTimeout(() => setDeleteSuccess(""), 5000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || t("delete.errorDefault");
      setDeleteFailure(msg);
      setShowModal(false);
      setTimeout(() => setDeleteFailure(""), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── Locked state ── */
  if (!canDelete) {
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
        title={deleteBlockReason}
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
            {t("delete.locked")}
          </span>
          {deleteBlockReason && (
            <span style={{ display: "block", marginTop: "0.125rem" }}>
              {deleteBlockReason}
            </span>
          )}
        </span>
      </div>
    );
  }

  /* ── Normal (deletable) state ── */
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
        onClick={() => {
          haptic("soft");
          setShowModal(true);
        }}
        title={t("delete.eligibleHint")}
      >
        {t("delete.trigger")}
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
              {t("delete.title")}
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-body)",
                marginBottom: "1.25rem",
              }}
            >
              {t("delete.confirm")}
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
                {isDeleting ? t("delete.deleting") : t("delete.confirmBtn")}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="btn-ghost"
                style={{ flex: 1 }}
              >
                {t("delete.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
