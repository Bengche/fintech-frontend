"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  id: number;
}

// ── Constants ────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const WELCOME: Message = {
  role: "assistant",
  id: 0,
  content:
    "Hi there! I'm **Kila**, Fonlok's AI assistant 👋\n\nI can explain how our secure escrow service works, help you create your first invoice, or answer any questions. What would you like to know?",
};

const SUGGESTIONS = [
  "How does escrow work?",
  "What are Fonlok's fees?",
  "How do I get started?",
];

// ── Keyframes & global styles ────────────────────────────────────────────────
const STYLES = `
  @keyframes kila-slide-up {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
  }
  @keyframes kila-slide-down {
    from { opacity: 1; transform: translateY(0)   scale(1);    }
    to   { opacity: 0; transform: translateY(20px) scale(0.97); }
  }
  @keyframes kila-pulse {
    0%   { box-shadow: 0 0 0 0   rgba(245,158,11,0.55); }
    70%  { box-shadow: 0 0 0 14px rgba(245,158,11,0);   }
    100% { box-shadow: 0 0 0 0   rgba(245,158,11,0);    }
  }
  @keyframes kila-dot {
    0%, 80%, 100% { transform: scale(0.55); opacity: 0.4; }
    40%           { transform: scale(1);    opacity: 1;   }
  }
  @keyframes kila-badge {
    0%, 100% { transform: scale(1); }
    30%      { transform: scale(1.4); }
  }
  @keyframes kila-proactive {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .kila-msg-text a { color: #F59E0B; text-decoration: underline; }
  .kila-msg-text strong { font-weight: 700; }
  .kila-msg-text p { margin: 0 0 6px; }

  .kila-input:focus { outline: none; }
  .kila-send:hover  { background: #D97706 !important; }
  .kila-send:active { transform: scale(0.94); }
  .kila-chip:hover  { background: #FEF3C7 !important; border-color: #F59E0B !important; color: #92400E !important; }
  .kila-btn-close:hover { background: rgba(255,255,255,0.15) !important; }
  .kila-fab:hover   { transform: scale(1.07); box-shadow: 0 8px 28px rgba(245,158,11,0.5) !important; }
`;

// ── Simple markdown renderer (bold + line breaks only) ───────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AiChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [proactive, setProactive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [msgId, setMsgId] = useState(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgCounter = useRef(1);

  // ── Check auth (client-side only) ──────────────────────────────────────────
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  // ── Proactive bubble: show after 20s on landing/marketing pages ────────────
  useEffect(() => {
    const marketingPages = [
      "/",
      "/home",
      "/about",
      "/pricing",
      "/how-it-works",
    ];
    if (marketingPages.includes(pathname)) {
      const t = setTimeout(() => {
        if (!open) {
          setProactive(true);
          setPulse(true);
        }
      }, 20000);
      return () => clearTimeout(t);
    }
  }, [pathname, open]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Focus input when panel opens ───────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setUnread(false);
      setProactive(false);
      setPulse(false);
    }
  }, [open]);

  // ── Open/close with animation ──────────────────────────────────────────────
  const openChat = () => {
    setClosing(false);
    setOpen(true);
  };

  const closeChat = () => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 320);
  };

  const nextId = () => {
    msgCounter.current += 1;
    return msgCounter.current;
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = { role: "user", content: trimmed, id: nextId() };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch(`${API}/api/ai-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            context: { page: pathname, isLoggedIn },
          }),
        });

        const data = await res.json();
        const reply =
          data.reply ||
          data.error ||
          "Sorry, something went wrong. Please try again.";

        const aiMsg: Message = {
          role: "assistant",
          content: reply,
          id: nextId(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        if (!open) setUnread(true);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            id: nextId(),
            content:
              "I'm having trouble connecting right now. Please try again in a moment.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, pathname, isLoggedIn, open],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const showSuggestions = messages.length === 1 && !loading;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>

      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      {(open || closing) && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            right: 24,
            width: 380,
            maxHeight: 560,
            background: "#fff",
            borderRadius: 18,
            boxShadow:
              "0 24px 60px rgba(15,31,61,0.18), 0 4px 16px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1100,
            overflow: "hidden",
            animation: closing
              ? "kila-slide-down 0.32s ease forwards"
              : "kila-slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #0F1F3D 0%, #1a3a6b 100%)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 17,
                color: "#fff",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(245,158,11,0.45)",
              }}
            >
              K
            </div>

            {/* Name + status */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#fff",
                  letterSpacing: 0.2,
                }}
              >
                Kila
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 2,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#22C55E",
                    display: "inline-block",
                    boxShadow: "0 0 6px rgba(34,197,94,0.7)",
                  }}
                />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                  Fonlok AI · Online
                </span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={closeChat}
              className="kila-btn-close"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.75)",
                borderRadius: 8,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                transition: "background 0.15s",
                flexShrink: 0,
              }}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 14px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              minHeight: 0,
              background: "#F8FAFC",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                {/* AI avatar chip */}
                {msg.role === "assistant" && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #F59E0B, #D97706)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#fff",
                      flexShrink: 0,
                      marginBottom: 2,
                    }}
                  >
                    K
                  </div>
                )}

                {/* Bubble */}
                <div
                  className="kila-msg-text"
                  style={{
                    maxWidth: "78%",
                    padding: "10px 13px",
                    borderRadius:
                      msg.role === "user"
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                    background: msg.role === "user" ? "#F59E0B" : "#fff",
                    color: msg.role === "user" ? "#fff" : "#1e293b",
                    fontSize: 14,
                    lineHeight: 1.55,
                    boxShadow:
                      msg.role === "user"
                        ? "0 2px 8px rgba(245,158,11,0.3)"
                        : "0 2px 8px rgba(0,0,0,0.07)",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(msg.content),
                  }}
                />
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #F59E0B, #D97706)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  K
                </div>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "12px 14px",
                    display: "flex",
                    gap: 5,
                    alignItems: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#0F1F3D",
                        display: "inline-block",
                        animation: `kila-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestion chips (shown only before first user message) */}
          {showSuggestions && (
            <div
              style={{
                padding: "6px 14px 0",
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                background: "#F8FAFC",
              }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="kila-chip"
                  onClick={() => sendMessage(s)}
                  style={{
                    background: "#FFFBEB",
                    border: "1px solid #FDE68A",
                    borderRadius: 20,
                    padding: "5px 11px",
                    fontSize: 12,
                    color: "#B45309",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontWeight: 500,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div
            style={{
              borderTop: "1px solid #E2E8F0",
              padding: "10px 12px",
              display: "flex",
              gap: 8,
              alignItems: "center",
              background: "#fff",
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              className="kila-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Ask me anything…"
              style={{
                flex: 1,
                border: "1.5px solid #E2E8F0",
                borderRadius: 24,
                padding: "9px 14px",
                fontSize: 14,
                color: "#1e293b",
                background: "#F8FAFC",
                transition: "border-color 0.15s",
                minWidth: 0,
              }}
              maxLength={500}
            />
            <button
              className="kila-send"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: input.trim() && !loading ? "#F59E0B" : "#E2E8F0",
                border: "none",
                cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13"
                  stroke={input.trim() && !loading ? "#fff" : "#94A3B8"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 2L15 22L11 13L2 9L22 2Z"
                  stroke={input.trim() && !loading ? "#fff" : "#94A3B8"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Powered-by footer */}
          <div
            style={{
              textAlign: "center",
              padding: "5px 0 8px",
              fontSize: 11,
              color: "#94A3B8",
              background: "#fff",
              flexShrink: 0,
            }}
          >
            Powered by Gemini AI · Fonlok
          </div>
        </div>
      )}

      {/* ── Proactive bubble ───────────────────────────────────────────────── */}
      {proactive && !open && (
        <div
          style={{
            position: "fixed",
            bottom: 112,
            right: 90,
            background: "#fff",
            borderRadius: 12,
            padding: "10px 14px",
            boxShadow: "0 8px 24px rgba(15,31,61,0.15)",
            fontSize: 13,
            color: "#0F1F3D",
            fontWeight: 500,
            zIndex: 1099,
            animation: "kila-proactive 0.4s ease",
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: 230,
          }}
        >
          <span>👋 Have questions about Fonlok?</span>
          <button
            onClick={() => setProactive(false)}
            style={{
              background: "none",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              fontSize: 14,
              padding: 0,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
          {/* Speech bubble tail */}
          <div
            style={{
              position: "absolute",
              bottom: 14,
              right: -7,
              width: 14,
              height: 14,
              background: "#fff",
              transform: "rotate(45deg)",
              boxShadow: "2px -2px 4px rgba(0,0,0,0.06)",
            }}
          />
        </div>
      )}

      {/* ── Floating action button ─────────────────────────────────────────── */}
      <button
        className="kila-fab"
        onClick={open ? closeChat : openChat}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 20px rgba(245,158,11,0.45)",
          zIndex: 1100,
          transition: "all 0.2s ease",
          animation: pulse ? "kila-pulse 1.8s ease-out infinite" : "none",
        }}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        {open ? (
          // X icon when open
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          // Chat sparkle icon when closed
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              fill="rgba(255,255,255,0.9)"
            />
            <circle cx="9" cy="10" r="1.2" fill="#F59E0B" />
            <circle cx="12" cy="10" r="1.2" fill="#F59E0B" />
            <circle cx="15" cy="10" r="1.2" fill="#F59E0B" />
          </svg>
        )}

        {/* Unread badge */}
        {unread && !open && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#EF4444",
              border: "2px solid #fff",
              animation: "kila-badge 0.6s ease",
            }}
          />
        )}
      </button>
    </>
  );
}
