"use client";
import { useState, useEffect, useRef } from "react";
import Axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Send, Paperclip, ArrowLeft, MessageSquare } from "lucide-react";
import DisputeButton from "../../../components/DisputeButton";
import { useTranslations } from "next-intl";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type Message = {
  id: number;
  sender_type: string;
  sender_email: string;
  message: string | null;
  file_url: string | null;
  created_at: string;
};

export default function SellerChatPage() {
  const { invoice_number } = useParams<{ invoice_number: string }>();
  const router = useRouter();
  const t = useTranslations("Chat");

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatExists, setChatExists] = useState<boolean | null>(null);
  const [invoicePaymentType, setInvoicePaymentType] = useState<
    string | undefined
  >(undefined);
  const bottomOfChat = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);

  const fetchMessages = async () => {
    try {
      const res = await Axios.get(`${API}/chat/messages/${invoice_number}`, {
        withCredentials: true,
      });
      const msgs = res.data.messages ?? [];
      setMessages(msgs);
      setChatExists(true);
    } catch (err: unknown) {
      if (
        (err as { response?: { status?: number } })?.response?.status === 404
      ) {
        setChatExists(false);
      }
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice_number]);

  // Detect milestone invoices to enable the multi-step dispute flow
  useEffect(() => {
    Axios.get(`${API}/invoice/milestones/${invoice_number}`, {
      withCredentials: true,
    })
      .then((res) => {
        const ms = res.data.milestones || res.data || [];
        if (ms.length > 0) setInvoicePaymentType("installment");
      })
      .catch(() => {}); // non-fatal
  }, [invoice_number]);

  // Only scroll to bottom when the message count actually increases
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      bottomOfChat.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMsgCount.current = messages.length;
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsSending(true);
    try {
      await Axios.post(
        `${API}/chat/send/${invoice_number}`,
        { message: newMessage, sender_type: "seller" },
        { withCredentials: true },
      );
      setNewMessage("");
      fetchMessages();
    } catch {
      setErrorMessage(t("errorSend"));
      setTimeout(() => setErrorMessage(""), 4000);
    } finally {
      setIsSending(false);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("sender_type", "seller");
    try {
      await Axios.post(`${API}/chat/upload/${invoice_number}`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSelectedFile(null);
      fetchMessages();
    } catch {
      setErrorMessage(t("errorUpload"));
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            color: "#64748b",
            padding: "0.375rem",
            borderRadius: "0.5rem",
            flexShrink: 0,
          }}
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={20} />
        </button>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "var(--color-primary, #2563eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MessageSquare size={18} color="#fff" />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9375rem", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Chat with Buyer
          </p>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8" }}>
            Invoice #{invoice_number}
          </p>
        </div>
      </div>

      {/* â”€â”€ Body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        style={{
          flex: 1,
          maxWidth: "680px",
          width: "100%",
          margin: "0 auto",
          padding: "1rem 0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          boxSizing: "border-box",
        }}
      >
        {/* Chat card */}
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "1rem",
            backgroundColor: "#fff",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Messages area */}
          <div
            style={{
              maxHeight: "60vh",
              minHeight: "300px",
              overflowY: "auto",
              overflowX: "hidden",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              backgroundColor: "#f8fafc",
            }}
          >
            {chatExists === false ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "0.75rem", padding: "3rem 1rem", color: "#94a3b8", textAlign: "center" }}>
                <MessageSquare size={36} style={{ opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.5 }}>
                  Chat opens once the buyer completes payment.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "0.75rem", padding: "3rem 1rem", color: "#94a3b8", textAlign: "center" }}>
                <MessageSquare size={36} style={{ opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: "0.875rem" }}>{t("empty")}</p>
              </div>
            ) : null}

            {messages.map((msg) => {
              const isSeller = msg.sender_type === "seller";
              const isSystem = msg.sender_type === "system";
              const isModerator = msg.sender_type === "moderator";
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isSystem || isModerator ? "center" : isSeller ? "flex-end" : "flex-start",
                  }}
                >
                  {/* Sender label */}
                  <span style={{ fontSize: "0.6875rem", color: "#94a3b8", fontWeight: 600, marginBottom: "0.25rem", paddingLeft: "0.25rem", paddingRight: "0.25rem" }}>
                    {isSystem ? "âš ï¸ System" : isModerator ? "ðŸ›¡ï¸ Moderator" : isSeller ? t("youSeller") : `Buyer (${msg.sender_email})`}
                  </span>

                  {/* Bubble */}
                  <div
                    style={{
                      maxWidth: "85%",
                      backgroundColor: isSystem ? "#fef3c7" : isModerator ? "#eff6ff" : isSeller ? "var(--color-primary, #2563eb)" : "#f1f5f9",
                      color: isSeller ? "#fff" : "#1e293b",
                      border: isSystem ? "1px solid #f59e0b" : isModerator ? "1px solid #93c5fd" : "none",
                      borderRadius: isSeller ? "18px 18px 4px 18px" : isSystem || isModerator ? "14px" : "18px 18px 18px 4px",
                      padding: "0.625rem 0.875rem",
                      fontSize: "0.9rem",
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {msg.message && <p style={{ margin: 0 }}>{msg.message}</p>}
                    {msg.file_url && (
                      <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: isSeller ? "#bfdbfe" : "#2563eb", fontSize: "0.8125rem", textDecoration: "underline" }}
                      >
                        {t("viewFile")}
                      </a>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span style={{ fontSize: "0.6875rem", color: "#94a3b8", marginTop: "0.2rem", paddingLeft: "0.25rem", paddingRight: "0.25rem" }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
            <div ref={bottomOfChat} />
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div style={{ margin: "0 0.75rem 0.5rem", padding: "0.625rem 0.875rem", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.75rem", fontSize: "0.8125rem", color: "#dc2626", fontWeight: 500 }}>
              {errorMessage}
            </div>
          )}

          {/* Input area â€” only when chat exists */}
          {chatExists !== false && (
            <>
              {/* File attachment row */}
              <div style={{ padding: "0.625rem 0.875rem", borderTop: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    fontSize: "0.8125rem",
                    color: selectedFile ? "#1e293b" : "#94a3b8",
                    cursor: "pointer",
                    padding: "0.375rem 0.625rem",
                    border: "1.5px dashed #e2e8f0",
                    borderRadius: "0.75rem",
                    transition: "border-color 0.15s",
                  }}
                >
                  <Paperclip size={14} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                    {selectedFile ? selectedFile.name : t("attachFile")}
                  </span>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    style={{ display: "none" }}
                  />
                  {selectedFile && (
                    <button
                      onClick={(e) => { e.preventDefault(); uploadFile(); }}
                      className="btn-primary"
                      style={{ fontSize: "0.75rem", padding: "0.2rem 0.625rem", flexShrink: 0 }}
                    >
                      {t("upload")}
                    </button>
                  )}
                </label>
              </div>

              {/* Message input row */}
              <div style={{ borderTop: "1px solid #f1f5f9", padding: "0.75rem 0.875rem 0.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                  <textarea
                    placeholder={t("messagePlaceholder")}
                    value={newMessage}
                    maxLength={1500}
                    rows={3}
                    onChange={(e) => setNewMessage(e.target.value.slice(0, 1500))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!isSending) sendMessage();
                      }
                    }}
                    className="input"
                    style={{
                      flex: 1,
                      resize: "none",
                      paddingTop: "0.625rem",
                      paddingBottom: "0.625rem",
                      lineHeight: "1.5",
                      fontSize: "16px",
                      minHeight: "72px",
                      borderRadius: "0.75rem",
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isSending}
                    className="btn-primary"
                    style={{
                      width: "44px",
                      height: "44px",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      borderRadius: "0.75rem",
                    }}
                    aria-label={t("send")}
                  >
                    <Send size={16} />
                  </button>
                </div>
                {newMessage.length >= 1500 ? (
                  <p style={{ fontSize: "0.6875rem", marginTop: "0.25rem", color: "#dc2626", fontWeight: 600 }}>
                    {t("charLimitReached")}
                  </p>
                ) : (
                  <p style={{ fontSize: "0.6875rem", marginTop: "0.25rem", textAlign: "right", color: newMessage.length >= 1200 ? "#d97706" : "#94a3b8" }}>
                    {newMessage.length} / 1,500
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Dispute section */}
        {chatExists === true && (
          <div
            style={{
              padding: "1rem",
              border: "1px solid #e2e8f0",
              borderRadius: "1rem",
              backgroundColor: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            }}
          >
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", color: "#64748b", lineHeight: 1.5 }}>
              If there is a problem with this order, you can open a dispute and an admin will review the chat.
            </p>
            <DisputeButton
              invoice_number={invoice_number}
              sender_type="seller"
              paymentType={invoicePaymentType}
            />
          </div>
        )}

        {/* Bottom spacer for mobile */}
        <div style={{ height: "1rem" }} />
      </div>
    </div>
  );
}
