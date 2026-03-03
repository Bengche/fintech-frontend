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
    } catch (err: any) {
      if (err.response?.status === 404) {
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
        backgroundColor: "var(--color-cloud)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          borderBottom: "1px solid var(--color-border)",
          padding: "0.875rem 1.25rem",
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
            color: "var(--color-text-muted)",
            padding: "0.25rem",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <MessageSquare size={18} color="var(--color-primary)" />
        <div>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "0.9375rem",
              color: "var(--color-text-heading)",
            }}
          >
            Chat with Buyer
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
            }}
          >
            Invoice #{invoice_number}
          </p>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          maxWidth: "680px",
          width: "100%",
          margin: "1.25rem auto",
          padding: "0 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Chat card */}
        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-white)",
            overflow: "hidden",
            boxShadow: "var(--shadow-card)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Messages area */}
          <div
            style={{
              height: "calc(100vh - 320px)",
              minHeight: "280px",
              overflowY: "auto",
              overflowX: "hidden",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.625rem",
              backgroundColor: "var(--color-cloud)",
            }}
          >
            {chatExists === false ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: "0.5rem",
                  color: "var(--color-text-muted)",
                }}
              >
                <MessageSquare size={32} opacity={0.35} />
                <p style={{ margin: 0, fontSize: "0.875rem" }}>
                  Chat opens once the buyer completes payment.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontSize: "0.875rem",
                  marginTop: "3rem",
                }}
              >
                {t("empty")}
              </p>
            ) : null}

            {messages.map((msg) => {
              const isSeller = msg.sender_type === "seller";
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    maxWidth: "72%",
                    minWidth: 0,
                    alignSelf: isSeller ? "flex-end" : "flex-start",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: isSeller
                        ? "var(--color-primary)"
                        : "var(--color-white)",
                      color: isSeller
                        ? "var(--color-white)"
                        : "var(--color-text-body)",
                      border: isSeller
                        ? "none"
                        : "1px solid var(--color-border)",
                      borderRadius: isSeller
                        ? "var(--radius-md) var(--radius-md) 0 var(--radius-md)"
                        : "var(--radius-md) var(--radius-md) var(--radius-md) 0",
                      padding: "0.625rem 0.875rem",
                      fontSize: "0.9rem",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        marginBottom: "0.25rem",
                        opacity: 0.65,
                        fontWeight: 600,
                        margin: "0 0 0.25rem",
                      }}
                    >
                      {isSeller
                        ? t("youSeller")
                        : `Buyer (${msg.sender_email})`}
                    </p>
                    {msg.message && (
                      <p style={{ margin: 0, lineHeight: 1.5, wordBreak: "break-word", overflowWrap: "break-word" }}>
                        {msg.message}
                      </p>
                    )}
                    {msg.file_url && (
                      <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: isSeller ? "#93c5fd" : "var(--color-primary)",
                          fontSize: "0.8125rem",
                          textDecoration: "underline",
                        }}
                      >
                        {t("viewFile")}
                      </a>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--color-text-muted)",
                      marginTop: "0.2rem",
                      textAlign: isSeller ? "right" : "left",
                    }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
            <div ref={bottomOfChat} />
          </div>

          {/* Error */}
          {errorMessage && (
            <div
              className="alert alert-danger"
              style={{ margin: "0", borderRadius: 0, fontSize: "0.8125rem" }}
            >
              {errorMessage}
            </div>
          )}

          {/* Input area — only when chat exists */}
          {chatExists !== false && (
            <>
              {/* File attachment row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.875rem",
                  borderTop: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-mist)",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    cursor: "pointer",
                  }}
                >
                  <Paperclip size={14} />
                  <input
                    type="file"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    style={{ display: "none" }}
                  />
                  {selectedFile ? selectedFile.name : t("attachFile")}
                </label>
                {selectedFile && (
                  <button
                    onClick={uploadFile}
                    className="btn-primary"
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.625rem",
                    }}
                  >
                    {t("upload")}
                  </button>
                )}
              </div>

              {/* Message input row */}
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  padding: "0.75rem 0.875rem 0.4rem",
                }}
              >
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                  <textarea
                    placeholder={t("messagePlaceholder")}
                    value={newMessage}
                    maxLength={1500}
                    rows={2}
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
                      lineHeight: "1.4",
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isSending}
                    className="btn-primary"
                    style={{
                      padding: "0.625rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      flexShrink: 0,
                    }}
                  >
                    <Send size={15} />
                    {isSending ? "" : t("send")}
                  </button>
                </div>
                {/* Character counter */}
                {newMessage.length >= 1500 ? (
                  <p
                    style={{
                      fontSize: "0.6875rem",
                      marginTop: "0.25rem",
                      color: "#dc2626",
                      fontWeight: 600,
                    }}
                  >
                    {t("charLimitReached")}
                  </p>
                ) : (
                  <p
                    style={{
                      fontSize: "0.6875rem",
                      marginTop: "0.25rem",
                      textAlign: "right",
                      color: newMessage.length >= 1200 ? "#d97706" : "var(--color-text-muted)",
                    }}
                  >
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
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-white)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <p
              style={{
                margin: "0 0 0.625rem",
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
              }}
            >
              If there is a problem with this order, you can open a dispute and
              an admin will review the chat.
            </p>
            <DisputeButton
              invoice_number={invoice_number}
              sender_type="seller"
            />
          </div>
        )}
      </div>
    </div>
  );
}
