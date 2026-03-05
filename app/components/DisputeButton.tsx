"use client";
import { useEffect, useState } from "react";
import Axios from "axios";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type Milestone = {
  id: number;
  milestone_number: number;
  milestone_label: string;
  amount: number;
  status: string;
};

type DisputeButtonProps = {
  invoice_number: string;
  sender_type: "seller" | "buyer";
  buyer_token?: string;
  autoOpen?: boolean;
  paymentType?: string;
};

export default function DisputeButton({
  invoice_number,
  sender_type,
  buyer_token,
  autoOpen = false,
  paymentType,
}: DisputeButtonProps) {
  const t = useTranslations("Dispute");
  const isMilestone = paymentType === "installment";

  const [showModal, setShowModal] = useState(autoOpen);
  const [modalStep, setModalStep] = useState<"scope" | "milestones" | "reason">(
    isMilestone ? "scope" : "reason",
  );
  const [disputeScope, setDisputeScope] = useState<"full" | "milestone">("full");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<Set<number>>(new Set());
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [reason, setReason] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch milestones when the modal opens on a milestone invoice
  useEffect(() => {
    if (showModal && isMilestone && milestones.length === 0) {
      setLoadingMilestones(true);
      Axios.get(`${API}/invoice/milestones/${invoice_number}`)
        .then((res) => setMilestones(res.data.milestones || res.data || []))
        .catch(() => setErrorMessage("Failed to load milestone data."))
        .finally(() => setLoadingMilestones(false));
    }
  }, [showModal, isMilestone, invoice_number, milestones.length]);

  const unreleasedMilestones = milestones.filter((m) => m.status !== "released");
  const releasedMilestones = milestones.filter((m) => m.status === "released");

  const close = () => {
    setShowModal(false);
    setReason("");
    setErrorMessage("");
    setDisputeScope("full");
    setSelectedMilestoneIds(new Set());
    setModalStep(isMilestone ? "scope" : "reason");
  };

  const handleScopeNext = () => {
    setErrorMessage("");
    if (disputeScope === "full") {
      if (releasedMilestones.length > 0) {
        setErrorMessage(
          `${releasedMilestones.length} milestone(s) have already been paid out. ` +
            "You cannot dispute the full invoice. Please select 'Specific Milestones' and choose only unpaid ones.",
        );
        return;
      }
      setModalStep("reason");
    } else {
      if (unreleasedMilestones.length === 0) {
        setErrorMessage("All milestones have been paid out. Nothing left to dispute.");
        return;
      }
      setModalStep("milestones");
    }
  };

  const toggleMilestone = (id: number) => {
    setSelectedMilestoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMilestonesNext = () => {
    if (selectedMilestoneIds.size === 0) {
      setErrorMessage("Please select at least one milestone to dispute.");
      return;
    }
    setErrorMessage("");
    setModalStep("reason");
  };

  const submitDispute = async () => {
    if (!reason.trim()) {
      setErrorMessage(t("emptyReason"));
      return;
    }
    setIsSubmitting(true);
    try {
      const body: {
        reason: string;
        opened_by: string;
        token?: string;
        dispute_scope?: string;
        milestone_ids?: number[];
      } = { reason, opened_by: sender_type };

      if (sender_type === "buyer" && buyer_token) body.token = buyer_token;
      if (isMilestone) {
        body.dispute_scope = disputeScope;
        if (disputeScope === "milestone") {
          body.milestone_ids = Array.from(selectedMilestoneIds);
        }
      }

      await Axios.post(`${API}/dispute/open/${invoice_number}`, body);
      close();
      setSuccessMessage(t("successMsg"));
      setTimeout(() => setSuccessMessage(""), 8000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || t("errorDefault");
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(""), 8000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step header bar ───────────────────────────────────────────────────────
  const renderStepHeader = (onBack?: () => void) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        marginBottom: "0.75rem",
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.125rem",
            color: "var(--color-text-muted)",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Back"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      <AlertTriangle size={20} style={{ color: "var(--color-danger)", flexShrink: 0 }} />
      <h3
        style={{
          fontSize: "1.0625rem",
          fontWeight: 700,
          color: "var(--color-danger)",
          margin: 0,
        }}
      >
        {t("title")}
      </h3>
    </div>
  );

  // ── Step 1: Scope picker (milestone invoices only) ────────────────────────
  const renderScopeStep = () => (
    <>
      {renderStepHeader()}
      {loadingMilestones ? (
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Loading milestone data…
        </p>
      ) : (
        <>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-body)", marginBottom: "1rem" }}>
            {t("scopeLabel", { defaultMessage: "What is this dispute about?" })}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1rem" }}>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.625rem",
                cursor: "pointer",
                padding: "0.625rem",
                borderRadius: "var(--radius-sm)",
                border: `1.5px solid ${disputeScope === "full" ? "var(--color-primary)" : "var(--color-border)"}`,
                background: disputeScope === "full" ? "var(--color-primary-subtle, #eff6ff)" : "transparent",
              }}
            >
              <input
                type="radio"
                name="dispute-scope"
                value="full"
                checked={disputeScope === "full"}
                onChange={() => setDisputeScope("full")}
                style={{ marginTop: "2px" }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  {t("scopeFull", { defaultMessage: "Full Invoice" })}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  Dispute all remaining unreleased milestones
                </div>
                {releasedMilestones.length > 0 && (
                  <div
                    style={{
                      marginTop: "0.375rem",
                      fontSize: "0.8rem",
                      color: "var(--color-warning, #d97706)",
                      background: "var(--color-warning-subtle, #fffbeb)",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                    }}
                  >
                    ⚠ {releasedMilestones.length} milestone(s) already paid — cannot be included
                  </div>
                )}
              </div>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.625rem",
                cursor: "pointer",
                padding: "0.625rem",
                borderRadius: "var(--radius-sm)",
                border: `1.5px solid ${disputeScope === "milestone" ? "var(--color-primary)" : "var(--color-border)"}`,
                background: disputeScope === "milestone" ? "var(--color-primary-subtle, #eff6ff)" : "transparent",
              }}
            >
              <input
                type="radio"
                name="dispute-scope"
                value="milestone"
                checked={disputeScope === "milestone"}
                onChange={() => setDisputeScope("milestone")}
                style={{ marginTop: "2px" }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  {t("scopeMilestone", { defaultMessage: "Specific Milestones" })}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  Choose only the milestones you want to dispute
                </div>
              </div>
            </label>
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
              onClick={handleScopeNext}
              style={{
                flex: 1,
                padding: "0.625rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-danger)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.875rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Next →
            </button>
            <button onClick={close} className="btn-ghost" style={{ flex: 1 }}>
              {t("cancel")}
            </button>
          </div>
        </>
      )}
    </>
  );

  // ── Step 2: Milestone checkboxes ──────────────────────────────────────────
  const renderMilestonesStep = () => (
    <>
      {renderStepHeader(() => { setModalStep("scope"); setErrorMessage(""); })}

      <p style={{ fontSize: "0.875rem", color: "var(--color-text-body)", marginBottom: "0.75rem" }}>
        {t("milestonesLabel", { defaultMessage: "Select the milestones to dispute:" })}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        {milestones.map((m) => {
          const isReleased = m.status === "released";
          const isSelected = selectedMilestoneIds.has(m.id);
          return (
            <label
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.5rem 0.625rem",
                borderRadius: "var(--radius-sm)",
                border: `1.5px solid ${isSelected && !isReleased ? "var(--color-primary)" : "var(--color-border)"}`,
                background: isReleased
                  ? "var(--color-surface-muted, #f8fafc)"
                  : isSelected
                  ? "var(--color-primary-subtle, #eff6ff)"
                  : "transparent",
                cursor: isReleased ? "not-allowed" : "pointer",
                opacity: isReleased ? 0.6 : 1,
              }}
            >
              <input
                type="checkbox"
                disabled={isReleased}
                checked={isSelected && !isReleased}
                onChange={() => !isReleased && toggleMilestone(m.id)}
              />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                  {m.milestone_label || `Milestone ${m.milestone_number}`}
                </span>
                <span
                  style={{
                    marginLeft: "0.5rem",
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {Number(m.amount).toLocaleString()} XAF
                </span>
              </div>
              {isReleased && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-success, #16a34a)",
                    fontWeight: 600,
                  }}
                >
                  ✓ Paid
                </span>
              )}
            </label>
          );
        })}
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
          onClick={handleMilestonesNext}
          style={{
            flex: 1,
            padding: "0.625rem",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--color-danger)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.875rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Next →
        </button>
        <button onClick={close} className="btn-ghost" style={{ flex: 1 }}>
          {t("cancel")}
        </button>
      </div>
    </>
  );

  // ── Step 3: Reason (and final submit) ─────────────────────────────────────
  const renderReasonStep = () => {
    const onBack = isMilestone
      ? () => { setModalStep(disputeScope === "milestone" ? "milestones" : "scope"); setErrorMessage(""); }
      : undefined;
    return (
      <>
        {renderStepHeader(onBack)}

        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-body)",
            marginBottom: "1rem",
          }}
        >
          {t("body")}
        </p>

        {isMilestone && (
          <div
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
              background: "var(--color-surface-muted, #f8fafc)",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              marginBottom: "0.75rem",
              border: "1px solid var(--color-border)",
            }}
          >
            <strong>Scope:</strong>{" "}
            {disputeScope === "full"
              ? "Full invoice (all unreleased milestones)"
              : `${selectedMilestoneIds.size} specific milestone(s)`}
          </div>
        )}

        <label className="label" htmlFor="dispute-reason">
          {t("issueLabel")}{" "}
          <span style={{ color: "var(--color-danger)" }}>*</span>
        </label>
        <textarea
          id="dispute-reason"
          rows={4}
          placeholder={t("issuePlaceholder")}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input"
          style={{ resize: "vertical", marginBottom: "0.75rem" }}
        />

        <div
          className="alert alert-warning"
          style={{ fontSize: "0.8125rem", marginBottom: "1rem" }}
        >
          <strong>{t("noteTitle")}</strong> {t("noteBody")}
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
            {isSubmitting ? t("submitting") : t("submit")}
          </button>
          <button onClick={close} className="btn-ghost" style={{ flex: 1 }}>
            {t("cancel")}
          </button>
        </div>
      </>
    );
  };

  return (
    <div>
      {/* Toast: success */}
      {successMessage && (
        <div
          className="alert alert-success"
          style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}
        >
          {successMessage}
        </div>
      )}

      {/* Toast: error (shown outside modal) */}
      {errorMessage && !showModal && (
        <div
          className="alert alert-danger"
          style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}
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
        {t("trigger")}
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
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "var(--shadow-modal)",
            }}
          >
            {modalStep === "scope" && renderScopeStep()}
            {modalStep === "milestones" && renderMilestonesStep()}
            {modalStep === "reason" && renderReasonStep()}
          </div>
        </div>
      )}
    </div>
  );
}
