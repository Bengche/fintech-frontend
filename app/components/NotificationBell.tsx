"use client";

/**
 * NotificationBell.tsx
 *
 * Bell icon + full-screen overlay notification panel.
 * Clicking the bell opens a centered panel with a backdrop.
 * Closed via the X button at top-right, or by clicking the backdrop.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { AppNotification } from "@/hooks/useNotifications";
import { useTranslations } from "next-intl";
import { haptic } from "@/hooks/useHaptic";

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

const EXPAND_THRESHOLD = 90;

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
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Lock body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Collapse expanded notifications when closed
  const closePanel = () => {
    setOpen(false);
    setExpandedIds(new Set());
  };

  const toggleExpand = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRowClick = (n: AppNotification) => {
    if (!n.is_read) markRead(n.id);
  };

  return (
    <>
      <style>{`
        @keyframes notif-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes notif-bg-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .notif-panel-anim {
          animation: notif-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .notif-bg-anim {
          animation: notif-bg-in 0.18s ease forwards;
        }
        .notif-row {
          transition: background 0.13s;
        }
        .notif-row:hover {
          background: #f8fafc !important;
        }
        .notif-row-unread:hover {
          background: #fef3c7 !important;
        }
        .notif-scroll::-webkit-scrollbar { width: 4px; }
        .notif-scroll::-webkit-scrollbar-track { background: transparent; }
        .notif-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      {/* ── Bell button ───────────────────────────────────────────────────── */}
      <button
        onClick={() => { haptic("soft"); setOpen(true); }}
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

      {/* ── Overlay panel — rendered via portal so CSS transform on parent navbar div doesn't trap position:fixed ── */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              zIndex: 99999,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingTop: "72px",
              paddingLeft: "12px",
              paddingRight: "12px",
              paddingBottom: "12px",
              boxSizing: "border-box",
            }}
          >
            {/* Backdrop */}
            <div
              className="notif-bg-anim"
              onClick={closePanel}
              style={
                {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(4,10,25,0.6)",
                } as React.CSSProperties
              }
            />

            {/* Panel */}
            <div
              className="notif-panel-anim"
              style={{
                position: "relative",
                width: "calc(100vw - 24px)",
                maxWidth: "480px",
                height: "auto",
                maxHeight: "calc(100vh - 96px)",
                minHeight: "200px",
                background: "#ffffff",
                borderRadius: "20px",
                boxShadow:
                  "0 32px 80px rgba(0,0,0,0.25), 0 4px 20px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
              }}
            >
              {/* ── Header ──────────────────────────────────────────────────── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 20px",
                  borderBottom: "1px solid #f1f5f9",
                  background: "#fafafa",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background:
                        "linear-gradient(135deg,#0F1F3D 0%,#1e3a6e 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#0F1F3D",
                      }}
                    >
                      {t("title")}
                    </h2>
                    <p
                      style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}
                    >
                      {unreadCount > 0
                        ? `${unreadCount} unread`
                        : "All caught up"}
                    </p>
                  </div>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {unreadCount > 0 && (
                    <button
                      onClick={() => { haptic("medium"); markAllRead(); }}
                      style={{
                        background: "none",
                        border: "1.5px solid #F59E0B",
                        color: "#d97706",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: "5px 10px",
                        borderRadius: "8px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t("markAllRead")}
                    </button>
                  )}
                  <button
                    onClick={closePanel}
                    aria-label="Close notifications"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      border: "1.5px solid #e2e8f0",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                      flexShrink: 0,
                      transition: "background 0.13s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#e2e8f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#f1f5f9";
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* ── Notification list ─────────────────────────────────────── */}
              <div
                className="notif-scroll"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                  minHeight: "80px",
                }}
              >
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "60px 24px",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    <div style={{ fontSize: "44px", marginBottom: "14px" }}>
                      🔔
                    </div>
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontWeight: 600,
                        fontSize: "15px",
                        color: "#64748b",
                      }}
                    >
                      No notifications yet
                    </p>
                    <p style={{ margin: 0, fontSize: "13px" }}>{t("empty")}</p>
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
                        className={`notif-row${n.is_read ? "" : " notif-row-unread"}`}
                        style={{
                          display: "flex",
                          gap: "14px",
                          padding: "16px 20px",
                          cursor: "pointer",
                          background: n.is_read ? "transparent" : "#fffbeb",
                          borderBottom: "1px solid #f1f5f9",
                          alignItems: "flex-start",
                        }}
                      >
                        {/* Icon */}
                        <div
                          style={{
                            flexShrink: 0,
                            width: "44px",
                            height: "44px",
                            borderRadius: "12px",
                            background: cfg.color + "18",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                          }}
                        >
                          {cfg.icon}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: "8px",
                              marginBottom: "5px",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: n.is_read ? 500 : 700,
                                fontSize: "14px",
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
                                marginTop: "2px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {timeAgo(n.created_at, t)}
                            </span>
                          </div>

                          <p
                            style={{
                              margin: 0,
                              fontSize: "13px",
                              color: "#475569",
                              lineHeight: 1.6,
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
                              }}
                            >
                              {isExpanded ? (
                                <>
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
          </div>,
          document.body,
        )}
    </>
  );
}
