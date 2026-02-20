"use client";

/**
 * NotificationBell.tsx
 *
 * A bell icon button with a red unread-count badge and a dropdown list
 * of the user's most recent notifications.
 *
 * Features:
 *   - Unread count badge (disappears when count is 0)
 *   - Click bell to open/close dropdown
 *   - "Mark all read" button
 *   - Individual notification click marks it read
 *   - Humanized timestamps ("2 minutes ago")
 *   - Colour-coded icons per notification type
 *   - Clicking outside closes the dropdown
 */

import { useEffect, useRef, useState } from "react";
import type { AppNotification } from "@/hooks/useNotifications";

// ── Per-type icon + accent colour ─────────────────────────────────────────────
const typeConfig: Record<string, { icon: string; color: string }> = {
  invoice_paid: { icon: "💰", color: "#16a34a" },
  payout_sent: { icon: "🎉", color: "#2563eb" },
  dispute_opened: { icon: "⚠️", color: "#dc2626" },
  milestone_released: { icon: "🏁", color: "#7c3aed" },
  new_message: { icon: "💬", color: "#0891b2" },
  delivered_marked: { icon: "📦", color: "#d97706" },
  referral_earned: { icon: "🤝", color: "#16a34a" },
  default: { icon: "🔔", color: "#6b7280" },
};

// ── Humanize timestamps ────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Props are supplied by the parent (Navbar) which calls useNotifications() once.
// This prevents multiple polling intervals when the bell is rendered in both
// the desktop nav and the mobile header simultaneously.
interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export default function NotificationBell({
  notifications,
  unreadCount,
  markRead,
  markAllRead,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.is_read) markRead(n.id);
  };

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      {/* ── Bell button ───────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        style={{
          position: "relative",
          background: open ? "rgba(245,158,11,0.12)" : "transparent",
          border: "1.5px solid",
          borderColor: open ? "#F59E0B" : "rgba(255,255,255,0.2)",
          borderRadius: "10px",
          padding: "7px 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
          color: "white",
        }}
      >
        {/* Bell SVG */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              background: "#dc2626",
              color: "white",
              fontSize: "10px",
              fontWeight: 700,
              minWidth: "18px",
              height: "18px",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              lineHeight: 1,
              border: "2px solid #0F1F3D",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ──────────────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: "340px",
            maxWidth: "calc(100vw - 24px)",
            background: "#ffffff",
            borderRadius: "14px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
            zIndex: 9999,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 10px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <span
              style={{ fontWeight: 700, fontSize: "15px", color: "#0F1F3D" }}
            >
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: "8px",
                    background: "#dc2626",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: "10px",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#F59E0B",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "2px 4px",
                  borderRadius: "4px",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "36px 20px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: "14px",
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔔</div>
                You&apos;re all caught up!
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = typeConfig[n.type] || typeConfig.default;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      display: "flex",
                      gap: "12px",
                      padding: "12px 16px",
                      cursor: "pointer",
                      background: n.is_read ? "transparent" : "#fffbeb",
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        n.is_read ? "transparent" : "#fffbeb";
                    }}
                  >
                    {/* Icon circle */}
                    <div
                      style={{
                        flexShrink: 0,
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: cfg.color + "18",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        marginTop: "1px",
                      }}
                    >
                      {cfg.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: n.is_read ? 500 : 700,
                            fontSize: "13px",
                            color: "#0F1F3D",
                            lineHeight: 1.3,
                          }}
                        >
                          {n.title}
                        </span>
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: "11px",
                            color: "#94a3b8",
                            marginTop: "1px",
                          }}
                        >
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: "12px",
                          color: "#64748b",
                          lineHeight: 1.45,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {n.body}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!n.is_read && (
                      <div
                        style={{
                          flexShrink: 0,
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#F59E0B",
                          marginTop: "6px",
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
