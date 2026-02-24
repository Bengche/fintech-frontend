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
 *   - "View full" / "Minimize" inline expand per notification
 *   - Humanized timestamps ("2 minutes ago")
 *   - Colour-coded icons per notification type
 *   - Clicking outside closes the dropdown
 *   - Fully responsive — anchors to screen edge on narrow viewports
 */

import { useEffect, useRef, useState } from "react";
import type { AppNotification } from "@/hooks/useNotifications";
import { useTranslations } from "next-intl";

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
function timeAgo(
  dateStr: string,
  t: (key: string, vals?: Record<string, number>) => string,
): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t("justNow");
  if (mins < 60) return t("minutesAgo", { mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("hoursAgo", { hrs });
  const days = Math.floor(hrs / 24);
  return t("daysAgo", { days });
}

// A notification body is considered "long" if it exceeds this character count —
// below this threshold we skip the expand toggle to keep the UI clean.
const EXPAND_THRESHOLD = 90;

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
  const t = useTranslations("Notifications");
  const [open, setOpen] = useState(false);
  // Set of notification IDs whose body is currently expanded
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
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

  // Collapse all expanded notifications when the dropdown closes
  useEffect(() => {
    if (!open) setExpandedIds(new Set());
  }, [open]);

  const toggleExpand = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // don't also trigger markRead on the row
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleRowClick = (n: AppNotification) => {
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
            position: "fixed",
            top: (() => {
              const el = containerRef.current;
              if (!el) return "60px";
              const rect = el.getBoundingClientRect();
              return `${rect.bottom + 10}px`;
            })(),
            // On narrow screens centre the panel; on wider screens align to bell
            right: (() => {
              if (typeof window === "undefined") return "12px";
              const el = containerRef.current;
              if (!el) return "12px";
              const rect = el.getBoundingClientRect();
              const panelWidth = Math.min(360, window.innerWidth - 24);
              const rightEdge = window.innerWidth - rect.right;
              // Don't let the panel bleed off the left edge
              return `${Math.max(rightEdge, 12)}px`;
            })(),
            width: "min(360px, calc(100vw - 24px))",
            background: "#ffffff",
            borderRadius: "14px",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
            zIndex: 99999,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* ── Panel header ─────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 12px",
              borderBottom: "1px solid #f1f5f9",
              background: "#fafafa",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: "15px",
                color: "#0F1F3D",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {t("title")}
              {unreadCount > 0 && (
                <span
                  style={{
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                    padding: "4px 6px",
                    borderRadius: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("markAllRead")}
                </button>
              )}
              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  fontSize: "18px",
                  lineHeight: 1,
                  padding: "2px 4px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* ── Notification list ─────────────────────────────────────────── */}
          <div
            style={{
              maxHeight: "min(420px, calc(100dvh - 140px))",
              overflowY: "auto",
              overscrollBehavior: "contain",
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: "14px",
                }}
              >
                <div style={{ fontSize: "30px", marginBottom: "10px" }}>🔔</div>
                {t("empty")}
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = typeConfig[n.type] || typeConfig.default;
                const isExpanded = expandedIds.has(n.id);
                const isLong = n.body && n.body.length > EXPAND_THRESHOLD;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleRowClick(n)}
                    style={{
                      display: "flex",
                      gap: "12px",
                      padding: "13px 16px",
                      cursor: "pointer",
                      background: n.is_read ? "transparent" : "#fffbeb",
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.15s",
                      alignItems: "flex-start",
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
                    {/* ── Icon circle ──────────────────────────────────── */}
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

                    {/* ── Body ─────────────────────────────────────────── */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: n.is_read ? 500 : 700,
                            fontSize: "13px",
                            color: "#0F1F3D",
                            lineHeight: 1.35,
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
                            whiteSpace: "nowrap",
                          }}
                        >
                          {timeAgo(n.created_at, t)}
                        </span>
                      </div>

                      {/* Notification body — clamped or full */}
                      <p
                        style={{
                          margin: 0,
                          fontSize: "12.5px",
                          color: "#475569",
                          lineHeight: 1.55,
                          wordBreak: "break-word",
                          ...(isExpanded
                            ? {}
                            : {
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }),
                        }}
                      >
                        {n.body}
                      </p>

                      {/* Expand / Minimize toggle — only shown for long bodies */}
                      {isLong && (
                        <button
                          onClick={(e) => toggleExpand(e, n.id)}
                          style={{
                            marginTop: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "none",
                            border: "none",
                            padding: "3px 0",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: cfg.color,
                            lineHeight: 1,
                          }}
                        >
                          {isExpanded ? (
                            <>
                              {/* Chevron up */}
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="18 15 12 9 6 15" />
                              </svg>
                              Minimize
                            </>
                          ) : (
                            <>
                              {/* Chevron down */}
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                              View full
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* ── Unread dot ───────────────────────────────────── */}
                    {!n.is_read && (
                      <div
                        style={{
                          flexShrink: 0,
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#F59E0B",
                          marginTop: "5px",
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
