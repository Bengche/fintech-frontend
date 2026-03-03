"use client";
import { useState, useEffect, useRef } from "react";
import Axios from "axios";
import { Send, Paperclip, X, MessageSquare } from "lucide-react";
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

type ChatWindowProps = {
  invoice_number: string;
};

export default function ChatWindow({ invoice_number }: ChatWindowProps) {
  const t = useTranslations("Chat");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [buyerMsgCount, setBuyerMsgCount] = useState(0);
  const [chatExists, setChatExists] = useState<boolean | null>(null);
  const bottomOfChat = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);

  const fetchMessages = async () => {
    try {
      const response = await Axios.get(
        `${API}/chat/messages/${invoice_number}`,
        { withCredentials: true },
      );
      const msgs: Message[] = response.data.messages ?? [];
      setMessages(msgs);
      setChatExists(true);
      // Count buyer messages so we can show a badge on the button
      setBuyerMsgCount(msgs.filter((m) => m.sender_type === "buyer").length);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setChatExists(false);
      } else {
        console.log("Could not load messages");
      }
    }
  };

  // Fetch message count once on mount so the badge shows without opening the chat
  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only scroll to bottom when the message count actually increases
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      bottomOfChat.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMsgCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (!isChatOpen) return;
    fetchMessages();
    const interval = setInterval(() => fetchMessages(), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatOpen]);

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
    <div>
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={isChatOpen ? "btn-secondary" : "btn-primary"}
        style={{
          fontSize: "0.8125rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
        }}
      >
        <MessageSquare size={14} />
        {isChatOpen ? t("closeBtn") : t("openBtn")}
        {!isChatOpen && buyerMsgCount > 0 && (
          <span
            style={{
              backgroundColor: "#ef4444",
              color: "#fff",
              borderRadius: "999px",
              fontSize: "0.625rem",
              fontWeight: 700,
              padding: "0 0.35rem",
              lineHeight: "1.4",
              minWidth: "1.1rem",
              textAlign: "center",
            }}
          >
            {buyerMsgCount}
          </span>
        )}
      </button>

      {isChatOpen && (
        <div
          style={{
            marginTop: "0.75rem",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-white)",
            overflow: "hidden",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* Chat header */}
          <div
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-white)",
              padding: "0.625rem 0.875rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>
              {t("headerPrefix")}
              {invoice_number}
            </span>
            <button
              onClick={() => setIsChatOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#fff",
                display: "flex",
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages area */}
          <div
            style={{
              height: "16rem",
              overflowY: "auto",
              overflowX: "hidden",
              padding: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              backgroundColor: "var(--color-cloud)",
            }}
          >
            {chatExists === false ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontSize: "0.8125rem",
                  marginTop: "2rem",
                }}
              >
                Chat opens once the buyer completes payment.
              </p>
            ) : messages.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontSize: "0.8125rem",
                  marginTop: "2rem",
                }}
              >
                {t("empty")}
              </p>
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
                    maxWidth: isSystem || isModerator ? "90%" : "75%",
                    minWidth: 0,
                    alignSelf:
                      isSystem || isModerator
                        ? "center"
                        : isSeller
                        ? "flex-end"
                        : "flex-start",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: isSystem
                        ? "#fef3c7"
                        : isModerator
                        ? "#eff6ff"
                        : isSeller
                        ? "var(--color-primary)"
                        : "var(--color-white)",
                      color: isSeller
                        ? "var(--color-white)"
                        : "var(--color-text-body)",
                      border: isSystem
                        ? "1px solid #f59e0b"
                        : isModerator
                        ? "1px solid #93c5fd"
                        : isSeller
                        ? "none"
                        : "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.875rem",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        marginBottom: "0.25rem",
                        opacity: 0.7,
                        fontWeight: 600,
                      }}
                    >
                      {isSystem
                        ? "⚠️ System"
                        : isModerator
                        ? "🛡️ Moderator"
                        : isSeller
                        ? t("youSeller")
                        : `Buyer (${msg.sender_email})`}
                    </p>
                    {msg.message && (
                      <p
                        style={{
                          margin: 0,
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                        }}
                      >
                        {msg.message}
                      </p>
                    )}
                    {msg.file_url && (
                      <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: isSeller
                            ? "var(--color-accent)"
                            : "var(--color-primary)",
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
                      marginTop: "0.125rem",
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
              style={{
                margin: "0 0.75rem",
                borderRadius: 0,
                fontSize: "0.8125rem",
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* File upload + message input — hidden until chat room exists */}
          {chatExists !== false && (
            <>
              {/* File upload area */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  borderTop: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-mist)",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
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
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem" }}
                  >
                    {t("upload")}
                  </button>
                )}
              </div>

              {/* Message input */}
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  padding: "0.625rem 0.75rem 0.375rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "flex-end",
                  }}
                >
                  <textarea
                    placeholder={t("messagePlaceholder")}
                    value={newMessage}
                    maxLength={1500}
                    rows={2}
                    onChange={(e) => setNewMessage(e.target.value)}
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
                      paddingTop: "0.5rem",
                      paddingBottom: "0.5rem",
                      lineHeight: "1.4",
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isSending}
                    className="btn-primary"
                    style={{
                      padding: "0.5rem 0.875rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      flexShrink: 0,
                    }}
                  >
                    <Send size={14} />
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
                      color:
                        newMessage.length >= 1200
                          ? "#d97706"
                          : "var(--color-text-muted)",
                    }}
                  >
                    {newMessage.length} / 1,500
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
