"use client";
import React, { useState, useEffect } from "react";
import Axios from "axios";
import InvoiceTemplates from "./InvoiceTemplates";
import { useTranslations } from "next-intl";
import { haptic } from "@/hooks/useHaptic";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
// Must match the backend limit (MAX_PAYMENT_PART_XAF, default 500,000).
const MAX_PAYMENT_PART =
  Number(process.env.NEXT_PUBLIC_MAX_PAYMENT_PART_XAF) || 500000;

export default function CreateInvoice({
  onCreated,
  autoOpen = false,
  hideTrigger = false,
}: { onCreated?: () => void; autoOpen?: boolean; hideTrigger?: boolean } = {}) {
  const t = useTranslations("Invoice");
  const [openModal, setOpenModal] = useState(false);

  // When rendered with autoOpen (e.g. from sidebar / bottom-nav link with
  // ?action=create), open the modal immediately on mount.
  useEffect(() => {
    if (autoOpen) setOpenModal(true);
  }, [autoOpen]);
  const [invoiceSuccess, setInvoiceSuccess] = useState("");
  const [invoiceError, setInvoiceError] = useState("");
  const [saveTemplateSuccess, setSaveTemplateSuccess] = useState("");
  const [formData, setFormData] = useState({
    currency: "XAF",
    amount: "",
    invoicename: "",
    description: "",
    expires_at: "",
  });
  const [templateName, setTemplateName] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [sellerLogo, setSellerLogo] = useState<File | null>(null);
  const [sellerLogoPreview, setSellerLogoPreview] = useState<string>("");
  const [sellerBrandName, setSellerBrandName] = useState("");

  useEffect(() => {
    return () => {
      if (sellerLogoPreview) URL.revokeObjectURL(sellerLogoPreview);
    };
  }, [sellerLogoPreview]);

  // --- Installment payment state ---
  const [paymentType, setPaymentType] = useState<"full" | "installment">(
    "full",
  );
  type Milestone = { label: string; amount: string; deadline: string };
  const [milestones, setMilestones] = useState<Milestone[]>([
    { label: "", amount: "", deadline: "" },
    { label: "", amount: "", deadline: "" },
  ]);

  const addMilestone = () =>
    setMilestones((prev) => [...prev, { label: "", amount: "", deadline: "" }]);

  const removeMilestone = (i: number) =>
    setMilestones((prev) => prev.filter((_, idx) => idx !== i));

  const updateMilestone = (i: number, field: keyof Milestone, value: string) =>
    setMilestones((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)),
    );

  const milestonesTotal = milestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0,
  );
  const invoiceTotal = parseFloat(formData.amount) || 0;
  const milestonesBalanced = Math.abs(milestonesTotal - invoiceTotal) < 0.01;

  const resetForm = () => {
    setFormData({
      currency: "XAF",
      amount: "",
      invoicename: "",
      description: "",
      expires_at: "",
    });
    setPaymentType("full");
    setMilestones([
      { label: "", amount: "", deadline: "" },
      { label: "", amount: "", deadline: "" },
    ]);
    setShowSaveTemplate(false);
    setTemplateName("");
    setSaveTemplateSuccess("");
    setSellerLogo(null);
    setSellerLogoPreview("");
    setSellerBrandName("");
  };

  const closeModal = () => {
    setOpenModal(false);
    setInvoiceError("");
    setSaveTemplateSuccess("");
    setShowSaveTemplate(false);
    setTemplateName("");
    setSellerLogo(null);
    setSellerLogoPreview("");
    setSellerBrandName("");
  };

  const handleLogoChange = (file: File | null) => {
    setSellerLogo(file);
    if (!file) {
      setSellerLogoPreview("");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setSellerLogoPreview(previewUrl);
  };

  const handleCreation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    haptic("medium");
    if (isSubmitting) return;
    setIsSubmitting(true);

    // --- Validate milestones before sending ---
    if (paymentType === "installment") {
      if (!milestonesBalanced) {
        setInvoiceError(
          `Milestone amounts must add up to ${invoiceTotal} XAF. Current total: ${milestonesTotal} XAF.`,
        );
        setTimeout(() => setInvoiceError(""), 7000);
        setIsSubmitting(false);
        return;
      }
      for (const m of milestones) {
        if (!m.label.trim() || !m.amount) {
          setInvoiceError("Each milestone must have a label and an amount.");
          setTimeout(() => setInvoiceError(""), 7000);
          setIsSubmitting(false);
          return;
        }
      }
    }

    try {
      const payload = new FormData();
      payload.append("invoicename", formData.invoicename);
      payload.append("currency", formData.currency || "XAF");
      payload.append("amount", formData.amount);
      payload.append("description", formData.description);
      payload.append("payment_type", paymentType);
      if (formData.expires_at)
        payload.append("expires_at", formData.expires_at);
      if (paymentType === "installment") {
        payload.append("milestones", JSON.stringify(milestones));
      }
      if (sellerLogo) payload.append("seller_logo", sellerLogo);
      if (sellerBrandName.trim())
        payload.append("seller_brand_name", sellerBrandName.trim());

      const response = await Axios.post(`${API}/invoice/create`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      console.log(response.data);
      setInvoiceSuccess(t("create.successToast"));
      resetForm();
      closeModal();
      setTimeout(() => setInvoiceSuccess(""), 7000);
      onCreated?.();
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      console.log(err.message);
      const message =
        err.response?.data?.message ||
        "Failed to create invoice. Please try again.";
      setInvoiceError(message);
      setTimeout(() => setInvoiceError(""), 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Called by InvoiceTemplates when the user picks a template
  const handleLoadTemplate = (template: {
    invoicename: string;
    currency: string;
    amount: string;
    description: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      invoicename: template.invoicename,
      currency: template.currency,
      amount: template.amount,
      description: template.description,
    }));
  };

  // Saves the current form values as a template for reuse later
  const handleSaveTemplate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!templateName.trim() || isSavingTemplate) return;
    setIsSavingTemplate(true);
    try {
      await Axios.post(
        `${API}/templates/save`,
        {
          template_name: templateName,
          invoicename: formData.invoicename,
          currency: formData.currency,
          amount: formData.amount,
          description: formData.description,
        },
        { withCredentials: true },
      );
      setSaveTemplateSuccess("Template saved successfully!");
      setTemplateName("");
      setShowSaveTemplate(false);
      setTimeout(() => setSaveTemplateSuccess(""), 4000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setSaveTemplateSuccess(
        e.response?.data?.message || "Failed to save template.",
      );
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <>
      {/* Trigger button — suppressed when autoOpen or hideTrigger is set */}
      {!autoOpen && !hideTrigger && (
        <button
          className="btn-primary"
          onClick={() => {
            haptic("medium");
            setOpenModal(true);
          }}
          style={{ fontSize: "0.9375rem", padding: "0.625rem 1.5rem" }}
        >
          {t("create.trigger")}
        </button>
      )}

      {/* Toast: success (outside modal so it persists after close) */}
      {invoiceSuccess && (
        <div
          className="alert alert-success"
          style={{
            position: "fixed",
            top: "1.25rem",
            right: "1.25rem",
            zIndex: 9999,
            maxWidth: "360px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
        >
          {invoiceSuccess}
        </div>
      )}

      {/* Modal overlay */}
      {openModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          className="create-invoice-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            zIndex: 1000,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "2rem 1rem 2rem",
            overflowY: "auto",
          }}
        >
          <div
            className="create-invoice-modal"
            style={{
              backgroundColor: "var(--color-white, #fff)",
              borderRadius: "var(--radius-lg, 12px)",
              width: "100%",
              maxWidth: "600px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "var(--color-text-heading)",
                  }}
                >
                  {t("create.modalTitle")}
                </h2>
                <p
                  style={{
                    margin: "0.2rem 0 0",
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {t("create.modalSubtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  fontSize: "1.5rem",
                  lineHeight: 1,
                  padding: "0.25rem",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div
              className="create-invoice-modal-body"
              style={{ padding: "1.5rem" }}
            >
              <form onSubmit={handleCreation} id="create-invoice-form">
                {/* Template picker */}
                <InvoiceTemplates onLoadTemplate={handleLoadTemplate} />

                <div style={{ height: "1rem" }} />

                {/* Invoice name */}
                <div style={{ marginBottom: "1rem" }}>
                  <label className="label" htmlFor="invoicename">
                    {t("create.invoiceName")}
                  </label>
                  <input
                    className="input"
                    placeholder={t("create.invoiceNamePlaceholder")}
                    id="invoicename"
                    name="invoicename"
                    type="text"
                    required
                    onChange={handleChange}
                    value={formData.invoicename}
                  />
                </div>

                {/* Currency + amount */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <label className="label" htmlFor="currency">
                      {t("create.currency")}
                    </label>
                    <select
                      className="input"
                      id="currency"
                      name="currency"
                      required
                      onChange={handleChange}
                      value={formData.currency}
                    >
                      <option>XAF</option>
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="amount">
                      {t("create.amount")}
                    </label>
                    <input
                      className="input"
                      id="amount"
                      name="amount"
                      type="number"
                      placeholder="e.g. 50000"
                      required
                      onChange={handleChange}
                      value={formData.amount}
                    />
                  </div>
                </div>

                {/* Invoices above the mobile money limit are paid in parts */}
                {invoiceTotal > MAX_PAYMENT_PART && (
                  <div
                    style={{
                      marginBottom: "1rem",
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--radius-md)",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      color: "#1e3a8a",
                      fontSize: "0.8125rem",
                      lineHeight: 1.55,
                    }}
                  >
                    {t("create.partPaymentNotice", {
                      limit: MAX_PAYMENT_PART.toLocaleString(),
                      count: Math.ceil(invoiceTotal / MAX_PAYMENT_PART),
                      part: Math.ceil(
                        invoiceTotal /
                          Math.ceil(invoiceTotal / MAX_PAYMENT_PART),
                      ).toLocaleString(),
                    })}
                  </div>
                )}

                {/* Description */}
                <div style={{ marginBottom: "1rem" }}>
                  <label className="label" htmlFor="description">
                    {t("create.description")}
                  </label>
                  <p
                    style={{
                      fontSize: "0.775rem",
                      color: "var(--color-text-muted)",
                      margin: "0 0 0.375rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {t("create.descriptionHint")}
                  </p>
                  <textarea
                    className="input"
                    placeholder={t("create.descriptionPlaceholder")}
                    name="description"
                    id="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    style={{ minHeight: "90px", resize: "vertical" }}
                  />
                </div>

                {/* Optional seller logo */}
                <div
                  style={{
                    marginBottom: "1.25rem",
                    padding: "0.9rem 1rem",
                    border: "1px dashed var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-cloud)",
                  }}
                >
                  <label className="label" htmlFor="seller_logo">
                    {t("create.brandingTitle")}
                  </label>
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--color-text-muted)",
                      margin: "0 0 0.75rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {t("create.brandingHint")}
                  </p>

                  {/* Brand name */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label
                      className="label"
                      htmlFor="seller_brand_name"
                      style={{ fontSize: "0.8rem", marginBottom: "0.3rem" }}
                    >
                      Brand / Business Name{" "}
                      <span
                        style={{
                          fontWeight: 400,
                          color: "var(--color-text-muted)",
                        }}
                      >
                        (optional)
                      </span>
                    </label>
                    <input
                      className="input"
                      id="seller_brand_name"
                      type="text"
                      placeholder="e.g. Acme Supplies"
                      maxLength={80}
                      value={sellerBrandName}
                      onChange={(e) => setSellerBrandName(e.target.value)}
                    />
                  </div>

                  {/* Logo upload */}
                  <label
                    className="label"
                    htmlFor="seller_logo"
                    style={{ fontSize: "0.8rem", marginBottom: "0.3rem" }}
                  >
                    Business Logo{" "}
                    <span
                      style={{
                        fontWeight: 400,
                        color: "var(--color-text-muted)",
                      }}
                    >
                      (optional)
                    </span>
                  </label>
                  <input
                    id="seller_logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) =>
                      handleLogoChange(e.target.files?.[0] || null)
                    }
                    style={{
                      display: "block",
                      width: "100%",
                      marginBottom: "0.625rem",
                    }}
                  />
                  {sellerLogoPreview && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.625rem",
                        background: "var(--color-white)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "999px",
                        padding: "0.3rem 0.7rem 0.3rem 0.35rem",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sellerLogoPreview}
                        alt="Seller logo preview"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "999px",
                          objectFit: "cover",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--color-text-body)",
                        }}
                      >
                        {sellerLogo?.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Expiry date */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label className="label" htmlFor="expires_at">
                    {t("create.expiryDate")}{" "}
                    <span
                      style={{
                        fontWeight: 400,
                        color: "var(--color-text-muted)",
                      }}
                    >
                      ({t("create.expiryOptional")})
                    </span>
                  </label>
                  <p
                    style={{
                      fontSize: "0.775rem",
                      color: "var(--color-text-muted)",
                      margin: "0 0 0.375rem",
                    }}
                  >
                    {t("create.expiryHint")}
                  </p>
                  <input
                    className="input"
                    id="expires_at"
                    name="expires_at"
                    type="datetime-local"
                    onChange={handleChange}
                    value={formData.expires_at}
                  />
                </div>

                {/* Payment type toggle */}
                <div
                  style={{
                    marginBottom: "1.25rem",
                    padding: "1rem",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-cloud)",
                  }}
                >
                  <label
                    className="label"
                    style={{ display: "block", marginBottom: "0.625rem" }}
                  >
                    {t("create.paymentType")}
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {(["full", "installment"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPaymentType(type)}
                        style={{
                          padding: "0.4rem 1rem",
                          borderRadius: "var(--radius-md)",
                          border: `2px solid ${paymentType === type ? "var(--color-primary)" : "var(--color-border)"}`,
                          backgroundColor:
                            paymentType === type
                              ? "var(--color-primary)"
                              : "transparent",
                          color:
                            paymentType === type
                              ? "#fff"
                              : "var(--color-text-body)",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          cursor: "pointer",
                        }}
                      >
                        {type === "full"
                          ? t("create.fullPayment")
                          : t("create.installments")}
                      </button>
                    ))}
                  </div>
                  {paymentType === "installment" && (
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-text-muted)",
                        marginTop: "0.5rem",
                        marginBottom: 0,
                      }}
                    >
                      {t("create.installmentHint")}
                    </p>
                  )}
                </div>

                {/* Milestone builder */}
                {paymentType === "installment" && (
                  <div
                    style={{
                      marginBottom: "1.25rem",
                      padding: "1rem",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-white)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                      }}
                    >
                      <label className="label" style={{ margin: 0 }}>
                        {t("create.milestones")}
                      </label>
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: milestonesBalanced
                            ? "var(--color-success)"
                            : "var(--color-danger)",
                        }}
                      >
                        {invoiceTotal > 0
                          ? `${milestonesTotal.toLocaleString()} / ${invoiceTotal.toLocaleString()} XAF`
                          : t("create.enterAmountFirst")}
                      </span>
                    </div>

                    {milestones.map((m, i) => (
                      <div
                        key={i}
                        className="create-milestone-row"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 110px 130px auto",
                          gap: "0.5rem",
                          alignItems: "center",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <input
                          className="input"
                          placeholder={`Milestone ${i + 1} label`}
                          value={m.label}
                          onChange={(e) =>
                            updateMilestone(i, "label", e.target.value)
                          }
                          required
                          style={{ fontSize: "0.875rem" }}
                        />
                        <input
                          className="input"
                          type="number"
                          placeholder="XAF"
                          value={m.amount}
                          onChange={(e) =>
                            updateMilestone(i, "amount", e.target.value)
                          }
                          required
                          style={{ fontSize: "0.875rem" }}
                        />
                        <input
                          className="input"
                          type="date"
                          title="Deadline (optional)"
                          value={m.deadline}
                          onChange={(e) =>
                            updateMilestone(i, "deadline", e.target.value)
                          }
                          style={{ fontSize: "0.875rem" }}
                        />
                        {milestones.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeMilestone(i)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--color-danger)",
                              cursor: "pointer",
                              fontSize: "1.25rem",
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                            title="Remove milestone"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addMilestone}
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {t("create.addMilestone")}
                    </button>

                    {invoiceTotal > 0 && !milestonesBalanced && (
                      <p
                        style={{
                          margin: "0.5rem 0 0",
                          fontSize: "0.8125rem",
                          color: "var(--color-danger)",
                        }}
                      >
                        Amounts must add up to {invoiceTotal.toLocaleString()}{" "}
                        XAF. Difference:{" "}
                        {Math.abs(
                          invoiceTotal - milestonesTotal,
                        ).toLocaleString()}{" "}
                        XAF.
                      </p>
                    )}
                  </div>
                )}

                {/* Escrow fee notice */}
                <div
                  style={{
                    marginBottom: "1.5rem",
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--color-mist)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ color: "var(--color-text-body)" }}>
                    {t("create.escrowFeeTitle")}
                  </strong>{" "}
                  {t("create.escrowFeeDesc")}
                </div>

                {/* Save as template toggle */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-primary)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    {showSaveTemplate
                      ? t("create.cancelTemplate")
                      : t("create.saveAsTemplate")}
                  </button>

                  {showSaveTemplate && (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.625rem",
                        marginTop: "0.625rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <input
                        className="input"
                        type="text"
                        placeholder={t("create.templateNamePlaceholder")}
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        style={{ flex: 1, minWidth: "200px" }}
                      />
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={handleSaveTemplate}
                        disabled={isSavingTemplate || !templateName.trim()}
                        style={{
                          fontSize: "0.875rem",
                          opacity:
                            isSavingTemplate || !templateName.trim() ? 0.6 : 1,
                          cursor:
                            isSavingTemplate || !templateName.trim()
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {isSavingTemplate
                          ? t("create.saving")
                          : t("create.saveTemplate")}
                      </button>
                    </div>
                  )}

                  {saveTemplateSuccess && (
                    <p
                      style={{
                        marginTop: "0.4rem",
                        fontSize: "0.8125rem",
                        color: "var(--color-success)",
                        fontWeight: 500,
                      }}
                    >
                      {saveTemplateSuccess}
                    </p>
                  )}
                </div>

                {/* Footer actions */}
                {/* Error shown just above the submit button */}
                {invoiceError && (
                  <div
                    className="alert alert-danger"
                    style={{ marginBottom: "1rem" }}
                  >
                    {invoiceError}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    justifyContent: "flex-end",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid var(--color-border)",
                  }}
                >
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={closeModal}
                    style={{ fontSize: "0.9375rem" }}
                  >
                    {t("create.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                    style={{
                      fontSize: "0.9375rem",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      opacity: isSubmitting ? 0.65 : 1,
                    }}
                  >
                    {isSubmitting ? t("create.submitting") : t("create.submit")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
