"use client";
import { useState, useEffect, useRef } from "react";
import Axios from "axios";
import { Send, Paperclip, X } from "lucide-react";

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomOfChat = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const response = await Axios.get(
        `${API}/chat/messages/${invoice_number}`,
        { withCredentials: true },
      );
      setMessages(response.data.messages);
    } catch {
      console.log("Could not load messages");
    }
  };

  useEffect(() => {
    if (bottomOfChat.current) {
      bottomOfChat.current.scrollIntoView({ behavior: "smooth" });
    }
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
      setErrorMessage("Failed to send message. Please try again.");
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
      setErrorMessage("Failed to upload file. Please try again.");
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="btn-ghost"
        style={{ fontSize: "0.8125rem" }}
      >
        {isChatOpen ? "Close Chat" : "Chat with Buyer"}
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
              Chat &mdash; Invoice #{invoice_number}
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
              padding: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              backgroundColor: "var(--color-cloud)",
            }}
          >
            {messages.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontSize: "0.8125rem",
                  marginTop: "2rem",
                }}
              >
                No messages yet. Start the conversation!
              </p>
            )}

            {messages.map((msg) => {
              const isSeller = msg.sender_type === "seller";
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    maxWidth: "75%",
                    alignSelf: isSeller ? "flex-end" : "flex-start",
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
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.875rem",
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
                      {isSeller
                        ? "You (Seller)"
                        : `Buyer (${msg.sender_email})`}
                    </p>
                    {msg.message && <p style={{ margin: 0 }}>{msg.message}</p>}
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
                        View Uploaded File
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
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                style={{ display: "none" }}
              />
              {selectedFile ? selectedFile.name : "Attach file"}
            </label>
            {selectedFile && (
              <button
                onClick={uploadFile}
                className="btn-primary"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem" }}
              >
                Upload
              </button>
            )}
          </div>

          {/* Message input */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              padding: "0.625rem 0.75rem",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <input
              type="text"
              placeholder="Type a message\u2026"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !isSending && sendMessage()
              }
              className="input"
              style={{ flex: 1, paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
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
              }}
            >
              <Send size={14} />
              {isSending ? "" : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
