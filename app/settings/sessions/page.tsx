"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Axios from "axios";
import Link from "next/link";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "next-intl";
import {
  ShieldCheck,
  Loader2,
  LogOut,
  MonitorSmartphone,
  MapPin,
  Clock3,
  ArrowLeft,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type UserSession = {
  sid: string;
  loginMethod: string;
  browser: string;
  os: string;
  deviceType: string;
  location: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
};

function Feedback({
  msg,
}: {
  msg: { type: "success" | "error"; text: string } | null;
}) {
  if (!msg) return null;
  return (
    <div
      className={`alert ${msg.type === "success" ? "alert-success" : "alert-danger"}`}
      style={{ marginBottom: "1rem" }}
    >
      {msg.text}
    </div>
  );
}

function SessionMeta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="settings-session-meta">
      <p
        style={{
          margin: "0 0 0.2rem",
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          fontSize: "0.76rem",
          fontWeight: 700,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {icon}
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: "0.875rem",
          color: "var(--color-text-heading)",
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default function ActiveSessionsPage() {
  const t = useTranslations("Settings");
  const router = useRouter();
  const { setUser_id, setUsername } = useAuth();

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSid, setCurrentSid] = useState<string | null>(null);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [revokeOthersLoading, setRevokeOthersLoading] = useState(false);
  const [revokeLoadingSid, setRevokeLoadingSid] = useState<string | null>(null);
  const [signOutLoading, setSignOutLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Axios.get(`${API}/user/sessions`, {
        withCredentials: true,
      });
      setSessions(res.data.sessions || []);
      setCurrentSid(res.data.currentSid || null);
      setMsg(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: e.response?.data?.message || t("sessions.loadError"),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div
      className="settings-page"
      style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}
    >
      <div
        className="settings-shell"
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "2rem 1.25rem 4rem",
        }}
      >
        {/* Back link */}
        <Link
          href="/settings"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            textDecoration: "none",
            marginBottom: "1.5rem",
          }}
        >
          <ArrowLeft size={15} />
          {t("sessions.backToSettings")}
        </Link>

        {/* Page heading */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h1
            className="settings-title"
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--color-text-heading)",
              margin: "0 0 0.3rem",
              letterSpacing: "-0.02em",
            }}
          >
            {t("sessions.sectionTitle")}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "0.9rem",
              color: "var(--color-text-muted)",
            }}
          >
            {t("sessions.sectionSubtitle")}
          </p>
        </div>

        <Feedback msg={msg} />

        {/* Summary + Revoke all card */}
        <div
          className="settings-session-summary"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
            padding: "1rem 1.125rem",
            borderRadius: "0.875rem",
            background:
              "linear-gradient(135deg, rgba(15,31,61,0.05), rgba(245,158,11,0.12))",
            border: "1px solid rgba(15,31,61,0.08)",
          }}
        >
          <div
            className="settings-session-summary-body"
            style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}
          >
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "0.8rem",
                background: "rgba(15,31,61,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary)",
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  color: "var(--color-text-heading)",
                  fontSize: "0.95rem",
                }}
              >
                {t("sessions.activeSummary", { count: sessions.length })}
              </p>
              <p
                style={{
                  margin: "0.2rem 0 0",
                  color: "var(--color-text-muted)",
                  fontSize: "0.85rem",
                  lineHeight: 1.55,
                }}
              >
                {currentSid
                  ? t("sessions.secureHint")
                  : t("sessions.reauthHint")}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary settings-session-revoke-all"
            disabled={
              revokeOthersLoading || !currentSid || sessions.length <= 1
            }
            onClick={async () => {
              setRevokeOthersLoading(true);
              setMsg(null);
              try {
                const res = await Axios.post(
                  `${API}/user/sessions/revoke-others`,
                  {},
                  { withCredentials: true },
                );
                setMsg({ type: "success", text: res.data.message });
                await loadSessions();
              } catch (err: unknown) {
                const e = err as {
                  response?: { data?: { message?: string } };
                };
                setMsg({
                  type: "error",
                  text:
                    e.response?.data?.message ||
                    t("sessions.revokeOthersError"),
                });
              } finally {
                setRevokeOthersLoading(false);
              }
            }}
          >
            {revokeOthersLoading
              ? t("sessions.revokeOthersLoading")
              : t("sessions.revokeOthers")}
          </button>
        </div>

        {/* Session list */}
        {loading ? (
          <div
            className="settings-loading-inline"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--color-text-muted)",
              fontSize: "0.875rem",
            }}
          >
            <Loader2
              size={15}
              style={{ animation: "spin 1s linear infinite" }}
            />
            {t("sessions.loading")}
          </div>
        ) : sessions.length === 0 ? (
          <p
            style={{
              margin: 0,
              color: "var(--color-text-muted)",
              fontSize: "0.875rem",
            }}
          >
            {t("sessions.empty")}
          </p>
        ) : (
          <div
            className="settings-session-list"
            style={{ display: "grid", gap: "0.875rem" }}
          >
            {sessions.map((session) => (
              <div
                key={session.sid}
                className={`settings-session-item ${session.isCurrent ? "is-current" : ""}`}
                style={{
                  border: session.isCurrent
                    ? "1.5px solid rgba(15,31,61,0.18)"
                    : "1px solid var(--color-border)",
                  borderRadius: "0.9rem",
                  padding: "1rem 1.05rem",
                  background: session.isCurrent
                    ? "rgba(15,31,61,0.03)"
                    : "var(--color-white)",
                }}
              >
                <div
                  className="settings-session-item-top"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      className="settings-session-head"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.55rem",
                        flexWrap: "wrap",
                        marginBottom: "0.35rem",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          color: "var(--color-text-heading)",
                          fontSize: "0.95rem",
                        }}
                      >
                        {session.browser} on {session.os}
                      </p>
                      {session.isCurrent && (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "0.18rem 0.55rem",
                            borderRadius: "999px",
                            background: "rgba(15,31,61,0.12)",
                            color: "var(--color-primary)",
                          }}
                        >
                          {t("sessions.currentBadge")}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "0.18rem 0.55rem",
                          borderRadius: "999px",
                          background:
                            session.loginMethod === "passkey"
                              ? "rgba(22,163,74,0.12)"
                              : "rgba(245,158,11,0.14)",
                          color:
                            session.loginMethod === "passkey"
                              ? "#166534"
                              : "#92400e",
                        }}
                      >
                        {session.loginMethod === "passkey"
                          ? t("sessions.passkeyBadge")
                          : t("sessions.passwordBadge")}
                      </span>
                    </div>

                    <div
                      className="settings-session-meta-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "0.55rem 0.75rem",
                      }}
                    >
                      <SessionMeta
                        icon={<MonitorSmartphone size={14} />}
                        label={t("sessions.deviceLabel")}
                        value={`${session.deviceType} • ${session.ipAddress}`}
                      />
                      <SessionMeta
                        icon={<MapPin size={14} />}
                        label={t("sessions.locationLabel")}
                        value={session.location}
                      />
                      <SessionMeta
                        icon={<Clock3 size={14} />}
                        label={t("sessions.lastActiveLabel")}
                        value={formatDate(session.lastActiveAt)}
                      />
                      <SessionMeta
                        icon={<LogOut size={14} />}
                        label={t("sessions.signedInLabel")}
                        value={formatDate(session.createdAt)}
                      />
                    </div>
                  </div>

                  {session.isCurrent ? (
                    <button
                      type="button"
                      onClick={async () => {
                        setSignOutLoading(true);
                        setMsg(null);
                        try {
                          await Axios.delete(
                            `${API}/user/sessions/${session.sid}`,
                            { withCredentials: true },
                          );
                          setUser_id(null);
                          setUsername(null);
                          localStorage.removeItem("authToken");
                          router.push("/login");
                        } catch (err: unknown) {
                          const e = err as {
                            response?: { data?: { message?: string } };
                          };
                          setMsg({
                            type: "error",
                            text:
                              e.response?.data?.message ||
                              t("sessions.signOutError"),
                          });
                          setSignOutLoading(false);
                        }
                      }}
                      disabled={signOutLoading}
                      style={{
                        alignSelf: "flex-start",
                        border: "1px solid rgba(220,38,38,0.18)",
                        background: "rgba(220,38,38,0.04)",
                        color: "#b91c1c",
                        borderRadius: "0.7rem",
                        padding: "0.6rem 0.8rem",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        cursor: signOutLoading ? "default" : "pointer",
                        opacity: signOutLoading ? 0.6 : 1,
                      }}
                      className="settings-session-danger-btn"
                    >
                      <LogOut size={14} />
                      {signOutLoading
                        ? t("sessions.signingOut")
                        : t("sessions.signOutDevice")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        setRevokeLoadingSid(session.sid);
                        setMsg(null);
                        try {
                          const res = await Axios.delete(
                            `${API}/user/sessions/${session.sid}`,
                            { withCredentials: true },
                          );
                          setMsg({ type: "success", text: res.data.message });
                          await loadSessions();
                        } catch (err: unknown) {
                          const e = err as {
                            response?: { data?: { message?: string } };
                          };
                          setMsg({
                            type: "error",
                            text:
                              e.response?.data?.message ||
                              t("sessions.revokeError"),
                          });
                        } finally {
                          setRevokeLoadingSid(null);
                        }
                      }}
                      disabled={revokeLoadingSid === session.sid}
                      style={{
                        alignSelf: "flex-start",
                        border: "1px solid rgba(220,38,38,0.18)",
                        background: "rgba(220,38,38,0.04)",
                        color: "#b91c1c",
                        borderRadius: "0.7rem",
                        padding: "0.6rem 0.8rem",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        cursor:
                          revokeLoadingSid === session.sid ? "default" : "pointer",
                        opacity: revokeLoadingSid === session.sid ? 0.6 : 1,
                      }}
                      className="settings-session-danger-btn"
                    >
                      {revokeLoadingSid === session.sid
                        ? t("sessions.revoking")
                        : t("sessions.revoke")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
