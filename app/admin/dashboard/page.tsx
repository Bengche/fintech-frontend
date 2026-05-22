"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import axios from "axios";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const ITEMS_PER_PAGE = 10;

// ─── Type Definitions ──────────────────────────────────────────────────────────
// These describe the shape of each data row returned by the backend

interface Stats {
  totalUsers: number;
  totalInvoices: number;
  totalPaymentsCount: number;
  totalAmountProcessed: number;
  totalPayoutsCount: number;
  totalPayoutsAmount: number;
  openDisputes: number;
  resolvedDisputes: number;
  platformRevenue: number;
  totalReferralCommissionsPaid: number;
  activeReferrers: number;
  escrowBalance: number;
  pendingReferralBalance: number;
}

// Represents any primitive value that can appear in a database row.
// Using a union instead of unknown lets TypeScript accept these values as ReactNode.
type RowValue = string | number | boolean | null | undefined;

// State shape used by every paginated section.
// Record<string, RowValue>[] covers any database row without needing exact types per table.
interface SectionState {
  data: Record<string, RowValue>[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  loaded: boolean; // true after the first successful load
  error: string;
}

// Shape for user search results in the direct-message picker
interface UserResult {
  id: number;
  name: string;
  username: string;
  email: string;
}

// Regular function declaration — avoids TSX parser ambiguity with generic arrow functions
function initTab(): SectionState {
  return {
    data: [],
    page: 0,
    hasMore: false,
    loading: false,
    loaded: false,
    error: "",
  };
}

// ─── Formatting Helpers ────────────────────────────────────────────────────────

const fmtXAF = (n: RowValue) =>
  new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const fmtDate = (iso: RowValue) =>
  iso
    ? new Date(String(iso)).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// Status badge colours using design token classes
const statusBadge = (status: RowValue) => {
  const key = String(status ?? "");
  const map: Record<string, string> = {
    paid: "badge badge-success",
    pending: "badge badge-warning",
    failed: "badge badge-danger",
    open: "badge badge-danger",
    resolved_seller: "badge badge-info",
    resolved_buyer: "badge badge-info",
    unpaid: "badge badge-neutral",
    delivered: "badge badge-success",
    expired: "badge badge-neutral",
    completed: "badge badge-success",
    refunded: "badge badge-info",
    refund_pending: "badge badge-warning",
  };
  return map[key] ?? "badge badge-neutral";
};

// ─── Tab Names ─────────────────────────────────────────────────────────────────
type TabKey =
  | "overview"
  | "users"
  | "invoices"
  | "payments"
  | "payouts"
  | "disputes"
  | "referrals"
  | "messages"
  | "stuck"
  | "kyc"
  | "verify"
  | "controls"
  | "suspensions"
  | "audit"
  | "inbox";

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const t = useTranslations("Admin");

  const TABS: { key: TabKey; label: string }[] = [
    { key: "overview", label: t("dashboard.tabOverview") },
    { key: "users", label: t("dashboard.tabUsers") },
    { key: "invoices", label: t("dashboard.tabInvoices") },
    { key: "payments", label: t("dashboard.tabPayments") },
    { key: "payouts", label: t("dashboard.tabPayouts") },
    { key: "stuck", label: t("dashboard.tabStuck") },
    { key: "disputes", label: t("dashboard.tabDisputes") },
    { key: "referrals", label: t("dashboard.tabReferrals") },
    { key: "messages", label: t("dashboard.tabMessages") },
    { key: "kyc", label: "KYC" },
    { key: "verify", label: "Verify Receipt" },
    { key: "controls", label: t("dashboard.tabControls") },
    { key: "suspensions", label: "Suspensions" },
    { key: "audit", label: "Audit Log" },
    { key: "inbox", label: "Inbox" },
  ];

  // Auth state: null = checking, true = ok, false = not authed
  const [authed, setAuthed] = useState<boolean | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Each tab has its own state — named explicitly so the code is easy to follow
  const [users, setUsers] = useState<SectionState>(initTab());
  const [invoices, setInvoices] = useState<SectionState>(initTab());
  const [payments, setPayments] = useState<SectionState>(initTab());
  const [payouts, setPayouts] = useState<SectionState>(initTab());
  const [disputes, setDisputes] = useState<SectionState>(initTab());
  const [referrals, setReferrals] = useState<SectionState>(initTab());
  const [broadcasts, setBroadcasts] = useState<SectionState>(initTab());
  const [stuck, setStuck] = useState<SectionState>(initTab());
  const [kyc, setKyc] = useState<SectionState>(initTab());
  const [kycFilter, setKycFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [kycActionLoadingId, setKycActionLoadingId] = useState<number | null>(
    null,
  );
  const [kycNoteById, setKycNoteById] = useState<Record<number, string>>({});

  // Suspension tab state
  const [suspensions, setSuspensions] = useState<SectionState>(initTab());
  const [suspensionFilter, setSuspensionFilter] = useState<
    "all" | "appeal_pending" | "permanent" | "temporary"
  >("all");
  const [suspActionLoadingId, setSuspActionLoadingId] = useState<number | null>(
    null,
  );
  const [suspNoteById, setSuspNoteById] = useState<Record<number, string>>({});

  // Audit Log tab state
  const [auditLog, setAuditLog] = useState<SectionState>(initTab());

  // Inbox (feature requests) tab state
  const [inboxData, setInboxData] = useState<Record<string, RowValue>[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxLoaded, setInboxLoaded] = useState(false);
  const [inboxError, setInboxError] = useState("");
  const [inboxStatusFilter, setInboxStatusFilter] = useState<
    "all" | "new" | "read" | "archived"
  >("new");
  const [inboxUpdatingId, setInboxUpdatingId] = useState<number | null>(null);

  // User profile drilldown state
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [profileData, setProfileData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Analytics (overview tab charts)
  const [analytics, setAnalytics] = useState<{
    revenue: { day: string; total: number }[];
    users: { day: string; count: number }[];
    payments: { day: string; count: number }[];
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // 2FA management (controls tab)
  const [twoFaEnabled, setTwoFaEnabled] = useState<boolean | null>(null);
  const [twoFaSetupData, setTwoFaSetupData] = useState<{
    base32: string;
    otpauthUrl: string;
  } | null>(null);
  const [twoFaOtp, setTwoFaOtp] = useState("");
  const [twoFaMsg, setTwoFaMsg] = useState("");
  const [twoFaErr, setTwoFaErr] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  // Users tab — delete action state
  const [userDeleteLoadingId, setUserDeleteLoadingId] = useState<number | null>(
    null,
  );
  const [userActionMsg, setUserActionMsg] = useState("");
  const [userActionErr, setUserActionErr] = useState("");

  // ── Platform Controls state ───────────────────────────────────────────────
  interface PlatformSettings {
    maintenanceMode: boolean;
    paymentsBlocked: boolean;
    payoutsBlocked: boolean;
  }
  const [platformSettings, setPlatformSettings] =
    useState<PlatformSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // ── Balance adjustment form state ─────────────────────────────────────────
  const [adjustments, setAdjustments] = useState<SectionState>(initTab());
  const [adjUserSearch, setAdjUserSearch] = useState("");
  const [adjUserResults, setAdjUserResults] = useState<UserResult[]>([]);
  const [adjUserSearching, setAdjUserSearching] = useState(false);
  const [adjSelectedUser, setAdjSelectedUser] = useState<UserResult | null>(
    null,
  );
  const [adjAmount, setAdjAmount] = useState("");
  const [adjType, setAdjType] = useState<"credit" | "debit">("credit");
  const [adjReason, setAdjReason] = useState("");
  const [adjSubmitting, setAdjSubmitting] = useState(false);
  const [adjSuccess, setAdjSuccess] = useState("");
  const [adjError, setAdjError] = useState("");
  const adjSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Broadcast compose form state ─────────────────────────────────────────
  const [msgRecipientType, setMsgRecipientType] = useState<"all" | "user">(
    "all",
  );
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgSelectedUser, setMsgSelectedUser] = useState<UserResult | null>(
    null,
  );
  const [msgUserSearch, setMsgUserSearch] = useState("");
  const [msgUserResults, setMsgUserResults] = useState<UserResult[]>([]);
  const [msgUserSearching, setMsgUserSearching] = useState(false);
  const [msgSending, setMsgSending] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState("");
  const [msgError, setMsgError] = useState("");
  const msgSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 1. Verify admin session on mount ────────────────────────────────────────
  useEffect(() => {
    const verify = async () => {
      try {
        await axios.get(`${API_URL}/admin/verify`, { withCredentials: true });
        setAuthed(true);
      } catch {
        setAuthed(false);
        router.push("/admin/login");
      }
    };
    verify();
  }, [router]);

  // ── 2. Load stats once auth is confirmed ────────────────────────────────────
  useEffect(() => {
    if (!authed) return;
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await axios.get(`${API_URL}/admin/stats`, {
          withCredentials: true,
        });
        setStats(res.data);
      } catch {
        // stats are non-critical — dashboard still works without them
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [authed]);

  // ── 3. Generic paginated loader ──────────────────────────────────────────────
  // This one function handles loading for all tabs. "append" = load more (page 2+)
  const loadTab = useCallback(
    async (tab: TabKey, append: boolean, currentPage: number) => {
      // Map each tab key to its setter and endpoint
      type SetFn = React.Dispatch<React.SetStateAction<SectionState>>;
      const config: Record<string, { setter: SetFn; endpoint: string }> = {
        users: { setter: setUsers, endpoint: "users" },
        invoices: { setter: setInvoices, endpoint: "invoices" },
        payments: { setter: setPayments, endpoint: "payments" },
        payouts: { setter: setPayouts, endpoint: "payouts" },
        stuck: { setter: setStuck, endpoint: "invoices/stuck" },
        disputes: { setter: setDisputes, endpoint: "disputes" },
        referrals: { setter: setReferrals, endpoint: "referrals" },
        messages: { setter: setBroadcasts, endpoint: "broadcasts" },
        kyc: { setter: setKyc, endpoint: `kyc?status=${kycFilter}` },
        suspensions: {
          setter: setSuspensions,
          endpoint: `suspensions?filter=${suspensionFilter}`,
        },
        audit: { setter: setAuditLog, endpoint: "audit-log" },
      };

      if (!config[tab]) return;
      const { setter, endpoint } = config[tab];
      const nextPage = append ? currentPage + 1 : 1;

      // No inline type annotation on prev — TypeScript infers it from the useState type
      setter((prev) => ({ ...prev, loading: true, error: "" }));

      try {
        const joiner = endpoint.includes("?") ? "&" : "?";
        const res = await axios.get(
          `${API_URL}/admin/${endpoint}${joiner}page=${nextPage}&limit=${ITEMS_PER_PAGE}`,
          { withCredentials: true },
        );
        setter((prev) => ({
          ...prev,
          data: append ? [...prev.data, ...res.data.data] : res.data.data,
          page: nextPage,
          hasMore: res.data.hasMore,
          loading: false,
          loaded: true,
          error: "",
        }));
      } catch (err: unknown) {
        const msg =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : t("dashboard.loadError");
        setter((prev) => ({ ...prev, loading: false, error: msg }));
      }
    },
    [kycFilter, suspensionFilter, t],
  );

  // ── 4. Load data when switching tabs (only if not already loaded) ────────────
  useEffect(() => {
    if (
      !authed ||
      activeTab === "overview" ||
      activeTab === "kyc" ||
      activeTab === "verify" ||
      activeTab === "controls" ||
      activeTab === "suspensions" ||
      activeTab === "inbox"
    )
      return;
    const tabState = {
      users,
      invoices,
      payments,
      payouts,
      stuck,
      disputes,
      referrals,
      messages: broadcasts,
      kyc,
      audit: auditLog,
    }[activeTab];
    if (!tabState?.loaded) {
      loadTab(activeTab, false, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authed]);

  // Reload KYC list when opening the KYC tab or switching status filter
  useEffect(() => {
    if (!authed || activeTab !== "kyc") return;
    loadTab("kyc", false, 0);
  }, [activeTab, authed, kycFilter, loadTab]);

  // Reload Suspensions list when opening the tab or switching filter
  useEffect(() => {
    if (!authed || activeTab !== "suspensions") return;
    loadTab("suspensions", false, 0);
  }, [activeTab, authed, suspensionFilter, loadTab]);

  // ── 5. Debounced user search for the direct-message picker ────────────────────
  useEffect(() => {
    if (msgRecipientType !== "user" || !msgUserSearch.trim()) {
      setMsgUserResults([]);
      return;
    }
    if (msgSearchTimerRef.current) clearTimeout(msgSearchTimerRef.current);
    msgSearchTimerRef.current = setTimeout(async () => {
      setMsgUserSearching(true);
      try {
        const res = await axios.get(
          `${API_URL}/admin/users/search?q=${encodeURIComponent(msgUserSearch)}`,
          { withCredentials: true },
        );
        setMsgUserResults(res.data.data);
      } catch {
        setMsgUserResults([]);
      } finally {
        setMsgUserSearching(false);
      }
    }, 350);
    return () => {
      if (msgSearchTimerRef.current) clearTimeout(msgSearchTimerRef.current);
    };
  }, [msgUserSearch, msgRecipientType]);

  // ── 6. Send a broadcast or direct message ────────────────────────────────────
  const sendBroadcast = async () => {
    setMsgError("");
    setMsgSuccess("");
    if (!msgSubject.trim()) {
      setMsgError(t("dashboard.subjectRequired"));
      return;
    }
    if (!msgBody.trim()) {
      setMsgError(t("dashboard.bodyRequired"));
      return;
    }
    if (msgRecipientType === "user" && !msgSelectedUser) {
      setMsgError(t("dashboard.recipientRequired"));
      return;
    }
    setMsgSending(true);
    try {
      const payload: {
        recipientType: string;
        subject: string;
        body: string;
        userId?: number;
      } = {
        recipientType: msgRecipientType,
        subject: msgSubject.trim(),
        body: msgBody.trim(),
      };
      if (msgRecipientType === "user" && msgSelectedUser) {
        payload.userId = msgSelectedUser.id;
      }
      const res = await axios.post(`${API_URL}/admin/broadcast`, payload, {
        withCredentials: true,
      });
      setMsgSuccess(res.data.message);
      setMsgSubject("");
      setMsgBody("");
      setMsgSelectedUser(null);
      setMsgUserSearch("");
      setMsgUserResults([]);
      // Reload history
      setBroadcasts(initTab());
      loadTab("messages", false, 0);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : t("dashboard.msgSendError");
      setMsgError(msg);
    } finally {
      setMsgSending(false);
    }
  };

  // ── 7. Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await axios.post(`${API_URL}/admin/logout`, {}, { withCredentials: true });
    router.push("/admin/login");
  };

  // ── 8. Platform Controls ─────────────────────────────────────────────────────
  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/settings`, {
        withCredentials: true,
      });
      setPlatformSettings(res.data);
      if (typeof res.data.twoFaEnabled === "boolean") {
        setTwoFaEnabled(res.data.twoFaEnabled);
      }
    } catch {
      // silently fail — controls will show an error state
    } finally {
      setSettingsLoading(false);
    }
  };

  const toggleSetting = async (key: string, value: boolean) => {
    setSavingKey(key);
    try {
      await axios.post(
        `${API_URL}/admin/settings`,
        { key, value },
        { withCredentials: true },
      );
      setPlatformSettings((prev) =>
        prev
          ? {
              ...prev,
              [key === "maintenance_mode"
                ? "maintenanceMode"
                : key === "payments_blocked"
                  ? "paymentsBlocked"
                  : "payoutsBlocked"]: value,
            }
          : prev,
      );
    } catch (err: unknown) {
      alert(
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to update setting.",
      );
    } finally {
      setSavingKey(null);
    }
  };

  // Load settings + adjustments log when the controls tab is opened
  useEffect(() => {
    if (activeTab !== "controls" || !authed) return;
    if (!platformSettings) loadSettings();
    if (!adjustments.loaded) {
      loadAdjustments(false, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authed]);

  const loadAdjustments = async (append: boolean, currentPage: number) => {
    const nextPage = append ? currentPage + 1 : 1;
    setAdjustments((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const res = await axios.get(
        `${API_URL}/admin/adjustments?page=${nextPage}&limit=20`,
        { withCredentials: true },
      );
      setAdjustments((prev) => ({
        ...prev,
        data: append ? [...prev.data, ...res.data.data] : res.data.data,
        page: nextPage,
        hasMore: res.data.hasMore,
        loading: false,
        loaded: true,
        error: "",
      }));
    } catch {
      setAdjustments((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load adjustment log.",
      }));
    }
  };

  // Debounced user search for the adjustment picker
  useEffect(() => {
    if (!adjUserSearch.trim()) {
      setAdjUserResults([]);
      return;
    }
    if (adjSearchTimerRef.current) clearTimeout(adjSearchTimerRef.current);
    adjSearchTimerRef.current = setTimeout(async () => {
      setAdjUserSearching(true);
      try {
        const res = await axios.get(
          `${API_URL}/admin/users/search?q=${encodeURIComponent(adjUserSearch)}`,
          { withCredentials: true },
        );
        setAdjUserResults(res.data.data);
      } catch {
        setAdjUserResults([]);
      } finally {
        setAdjUserSearching(false);
      }
    }, 350);
    return () => {
      if (adjSearchTimerRef.current) clearTimeout(adjSearchTimerRef.current);
    };
  }, [adjUserSearch]);

  const submitAdjustment = async () => {
    setAdjSuccess("");
    setAdjError("");
    if (!adjSelectedUser) return setAdjError("Please select a user.");
    const amt = parseFloat(adjAmount);
    if (isNaN(amt) || amt <= 0)
      return setAdjError("Enter a valid positive amount.");
    if (!adjReason.trim() || adjReason.trim().length < 5)
      return setAdjError("Reason must be at least 5 characters.");

    setAdjSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL}/admin/adjust-balance`,
        {
          userId: adjSelectedUser.id,
          amount: amt,
          type: adjType,
          reason: adjReason.trim(),
        },
        { withCredentials: true },
      );
      setAdjSuccess(res.data.message);
      setAdjAmount("");
      setAdjReason("");
      setAdjSelectedUser(null);
      setAdjUserSearch("");
      // Reload log
      setAdjustments(initTab());
      loadAdjustments(false, 0);
    } catch (err: unknown) {
      setAdjError(
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to apply adjustment.",
      );
    } finally {
      setAdjSubmitting(false);
    }
  };

  // ── Load inbox (feature requests) ─────────────────────────────────────────
  const loadInbox = useCallback(async (status: string) => {
    setInboxLoading(true);
    setInboxError("");
    try {
      const q = status && status !== "all" ? `status=${status}&` : "";
      const res = await axios.get(
        `${API_URL}/admin/feature-requests?${q}limit=30`,
        {
          withCredentials: true,
        },
      );
      setInboxData(res.data.data);
      setInboxLoaded(true);
    } catch {
      setInboxError("Failed to load inbox.");
    } finally {
      setInboxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authed || activeTab !== "inbox") return;
    loadInbox(inboxStatusFilter);
  }, [activeTab, authed, inboxStatusFilter, loadInbox]);

  // ── Load analytics when overview tab opens ───────────────────────────────
  useEffect(() => {
    if (!authed || activeTab !== "overview" || analytics !== null) return;
    setAnalyticsLoading(true);
    axios
      .get(`${API_URL}/admin/analytics`, { withCredentials: true })
      .then((r) => setAnalytics(r.data))
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
  }, [activeTab, authed, analytics]);

  // ── User profile drilldown ───────────────────────────────────────────────
  useEffect(() => {
    if (!profileUserId) {
      setProfileData(null);
      setProfileError("");
      return;
    }
    setProfileLoading(true);
    setProfileError("");
    axios
      .get(`${API_URL}/admin/users/${profileUserId}/profile`, {
        withCredentials: true,
      })
      .then((r) => setProfileData(r.data))
      .catch(() => setProfileError("Failed to load profile."))
      .finally(() => setProfileLoading(false));
  }, [profileUserId]);

  // ── 2FA action helpers ───────────────────────────────────────────────────
  const handle2FaSetup = async () => {
    setTwoFaLoading(true);
    setTwoFaMsg("");
    setTwoFaErr("");
    try {
      const r = await axios.post(
        `${API_URL}/admin/2fa/setup`,
        {},
        { withCredentials: true },
      );
      setTwoFaSetupData(r.data);
    } catch {
      setTwoFaErr("Failed to start 2FA setup.");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handle2FaVerify = async () => {
    setTwoFaLoading(true);
    setTwoFaMsg("");
    setTwoFaErr("");
    try {
      await axios.post(
        `${API_URL}/admin/2fa/verify`,
        { token: twoFaOtp },
        { withCredentials: true },
      );
      setTwoFaEnabled(true);
      setTwoFaSetupData(null);
      setTwoFaOtp("");
      setTwoFaMsg("2FA enabled successfully.");
    } catch (err: unknown) {
      setTwoFaErr(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "Invalid code.")
          : "Invalid code.",
      );
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handle2FaDisable = async () => {
    if (
      !window.confirm(
        "Disable two-factor authentication? This makes admin login less secure.",
      )
    )
      return;
    setTwoFaLoading(true);
    setTwoFaMsg("");
    setTwoFaErr("");
    try {
      await axios.post(
        `${API_URL}/admin/2fa/disable`,
        {},
        { withCredentials: true },
      );
      setTwoFaEnabled(false);
      setTwoFaSetupData(null);
      setTwoFaMsg("2FA has been disabled.");
    } catch {
      setTwoFaErr("Failed to disable 2FA.");
    } finally {
      setTwoFaLoading(false);
    }
  };

  // ── Showing a loading screen while checking auth ─────────────────────────────
  if (authed === null) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--color-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#94a3b8", fontSize: "0.9375rem" }}>
          {t("dashboard.verifyingSession")}
        </p>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-cloud)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top Navigation Bar ───────────────────────────────────────────────── */}
      <header
        style={{
          backgroundColor: "var(--color-primary)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "0.5rem",
              backgroundColor: "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="#0F1F3D"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h1
              style={{
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.9375rem",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {t("dashboard.headerTitle")}
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.75rem", margin: 0 }}>
              {t("dashboard.headerSubtitle")}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            color: "#94a3b8",
            fontSize: "0.875rem",
            padding: "0.375rem 0.875rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(255,255,255,0.1)",
            backgroundColor: "transparent",
            cursor: "pointer",
          }}
        >
          {t("dashboard.signOut")}
        </button>
      </header>

      {/* ── Tab Navigation ───────────────────────────────────────────────────── */}
      <nav
        style={{
          backgroundColor: "var(--color-white)",
          borderBottom: "1px solid var(--color-border)",
          padding: "0 1.5rem",
          overflowX: "auto",
        }}
      >
        <ul
          style={{
            display: "flex",
            gap: "0.25rem",
            minWidth: "max-content",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {TABS.map((tab) => (
            <li key={tab.key}>
              <button
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "0.875rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  borderBottom:
                    activeTab === tab.key
                      ? "2px solid var(--color-primary)"
                      : "2px solid transparent",
                  color:
                    activeTab === tab.key
                      ? "var(--color-primary)"
                      : "var(--color-text-muted)",
                  background: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Page Content ─────────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          padding: "1.5rem",
          maxWidth: "80rem",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* ────────────────────── OVERVIEW TAB ──────────────────────────────── */}
        {activeTab === "overview" && (
          <>
            <section
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--color-text-heading)",
                  margin: 0,
                }}
              >
                {t("dashboard.overviewTitle")}
              </h2>

              {statsLoading ? (
                <p style={{ color: "var(--color-text-muted)" }}>
                  {t("dashboard.loadingStats")}
                </p>
              ) : stats ? (
                <>
                  {/* First row: activity stats */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(180px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    <StatCard
                      label={t("dashboard.statTotalUsers")}
                      value={stats.totalUsers.toLocaleString()}
                      color="blue"
                      icon="👤"
                    />
                    <StatCard
                      label={t("dashboard.statTotalInvoices")}
                      value={stats.totalInvoices.toLocaleString()}
                      color="indigo"
                      icon="🧾"
                    />
                    <StatCard
                      label={t("dashboard.statPayments")}
                      value={stats.totalPaymentsCount.toLocaleString()}
                      color="teal"
                      icon="💳"
                    />
                    <StatCard
                      label={t("dashboard.statPayouts")}
                      value={stats.totalPayoutsCount.toLocaleString()}
                      color="cyan"
                      icon="📤"
                    />
                  </div>

                  {/* Second row: money stats */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    <StatCard
                      label={t("dashboard.statVolume")}
                      value={fmtXAF(stats.totalAmountProcessed)}
                      color="green"
                      icon="💰"
                      large
                    />
                    <StatCard
                      label={t("dashboard.statRevenue")}
                      value={fmtXAF(stats.platformRevenue)}
                      color="emerald"
                      icon="📈"
                      large
                    />
                    <StatCard
                      label={t("dashboard.statEscrowBalance")}
                      value={fmtXAF(stats.escrowBalance)}
                      color="orange"
                      icon="🔒"
                      large
                    />
                    <StatCard
                      label={t("dashboard.statPendingReferrals")}
                      value={fmtXAF(stats.pendingReferralBalance)}
                      color="violet"
                      icon="⏳"
                      large
                    />
                    <StatCard
                      label={t("dashboard.statReferralsPaid")}
                      value={fmtXAF(stats.totalReferralCommissionsPaid)}
                      color="purple"
                      icon="🤝"
                      large
                    />
                  </div>

                  {/* Third row: disputes & referrers */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(180px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    <StatCard
                      label={t("dashboard.statOpenDisputes")}
                      value={stats.openDisputes.toLocaleString()}
                      color={stats.openDisputes > 0 ? "red" : "gray"}
                      icon="⚠️"
                    />
                    <StatCard
                      label={t("dashboard.statResolvedDisputes")}
                      value={stats.resolvedDisputes.toLocaleString()}
                      color="blue"
                      icon="✅"
                    />
                    <StatCard
                      label={t("dashboard.statReferrers")}
                      value={stats.activeReferrers.toLocaleString()}
                      color="violet"
                      icon="🔗"
                    />
                  </div>
                </>
              ) : (
                <p style={{ color: "var(--color-text-muted)" }}>
                  {t("dashboard.noStats")}
                </p>
              )}
            </section>

            {/* ── Revenue / users / payments sparklines ── */}
            {analyticsLoading && (
              <p
                style={{
                  color: "var(--color-text-muted)",
                  padding: "0 1.5rem",
                }}
              >
                Loading charts…
              </p>
            )}
            {analytics && !analyticsLoading && (
              <section
                style={{
                  padding: "0 1.5rem 1.5rem",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                {[
                  {
                    label: "Revenue (30d)",
                    data: analytics.revenue,
                    key: "total" as const,
                    color: "#16a34a",
                    fmt: (v: number) => `${v.toLocaleString()} XAF`,
                  },
                  {
                    label: "New Users (30d)",
                    data: analytics.users,
                    key: "count" as const,
                    color: "#2563eb",
                    fmt: (v: number) => String(v),
                  },
                  {
                    label: "Payments (30d)",
                    data: analytics.payments,
                    key: "count" as const,
                    color: "#7c3aed",
                    fmt: (v: number) => String(v),
                  },
                ].map(({ label, data, key, color, fmt }) => {
                  const vals = data.map(
                    (d) => Number((d as Record<string, unknown>)[key]) || 0,
                  );
                  const max = Math.max(...vals, 1);
                  const total = vals.reduce((a, b) => a + b, 0);
                  const W = 240,
                    H = 60,
                    P = 4;
                  const pts =
                    vals.length > 1
                      ? vals
                          .map(
                            (v, i) =>
                              `${P + (i / (vals.length - 1)) * (W - P * 2)},${H - P - (v / max) * (H - P * 2)}`,
                          )
                          .join(" ")
                      : "";
                  return (
                    <div
                      key={label}
                      style={{
                        background: "var(--color-surface,#fff)",
                        borderRadius: "12px",
                        padding: "1rem 1.25rem",
                        minWidth: "240px",
                        flex: "1 1 240px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 0.25rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--color-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          margin: "0 0 0.75rem",
                          fontSize: "1.25rem",
                          fontWeight: 800,
                          color,
                        }}
                      >
                        {fmt(total)}
                      </p>
                      {pts && (
                        <svg
                          width={W}
                          height={H}
                          style={{ display: "block", overflow: "visible" }}
                        >
                          <polyline
                            points={pts}
                            fill="none"
                            stroke={color}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <polyline
                            points={`${P},${H} ${pts} ${P + ((vals.length - 1) / (vals.length - 1)) * (W - P * 2)},${H}`}
                            fill={color}
                            fillOpacity={0.08}
                            stroke="none"
                          />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}

        {/* ────────────────────── USERS TAB ─────────────────────────────────── */}
        {activeTab === "users" && (
          <TabSection
            title={t("dashboard.usersTitle")}
            state={users}
            onLoadMore={() => loadTab("users", true, users.page)}
            emptyMessage={t("dashboard.usersEmpty")}
          >
            {userActionMsg && (
              <div
                className="alert alert-success"
                style={{ marginBottom: "0.75rem" }}
              >
                {userActionMsg}
              </div>
            )}
            {userActionErr && (
              <div
                className="alert alert-danger"
                style={{ marginBottom: "0.75rem" }}
              >
                {userActionErr}
              </div>
            )}
            <table
              style={{
                width: "100%",
                fontSize: "0.875rem",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "var(--color-mist)" }}>
                  <Th>{t("dashboard.colName")}</Th>
                  <Th>{t("dashboard.colUsername")}</Th>
                  <Th>{t("dashboard.colEmail")}</Th>
                  <Th>{t("dashboard.colPhone")}</Th>
                  <Th>{t("dashboard.colCountry")}</Th>
                  <Th>{t("dashboard.colInvoiceCount")}</Th>
                  <Th>{t("dashboard.colReferralCode")}</Th>
                  <Th>{t("dashboard.colJoined")}</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {users.data.map((u) => {
                  const uid = Number(u.id);
                  const isDeleting = userDeleteLoadingId === uid;
                  return (
                    <tr
                      key={String(u.id)}
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                    >
                      <Td bold>{u.name}</Td>
                      <Td muted>@{u.username}</Td>
                      <Td>{u.email}</Td>
                      <Td mono>{u.phone}</Td>
                      <Td>{u.country}</Td>
                      <Td>{u.invoice_count}</Td>
                      <Td mono>{u.referral_code ?? "—"}</Td>
                      <Td muted>{fmtDate(u.createdat)}</Td>
                      <Td>
                        <button
                          disabled={isDeleting}
                          onClick={async () => {
                            const confirmed = window.confirm(
                              `Permanently delete account for @${u.username || u.email}?\n\nThis cannot be undone. Their email and phone will be blocked from creating new accounts.`,
                            );
                            if (!confirmed) return;
                            setUserActionMsg("");
                            setUserActionErr("");
                            setUserDeleteLoadingId(uid);
                            try {
                              const r = await axios.delete(
                                `${API_URL}/admin/users/${uid}`,
                                { withCredentials: true },
                              );
                              setUserActionMsg(
                                r.data.message ?? "Account deleted.",
                              );
                              loadTab("users", false, 0);
                            } catch (err: unknown) {
                              setUserActionErr(
                                axios.isAxiosError(err) &&
                                  err.response?.data?.message
                                  ? err.response.data.message
                                  : "Failed to delete account.",
                              );
                            } finally {
                              setUserDeleteLoadingId(null);
                            }
                          }}
                          style={{
                            background: "#991b1b",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "0.3rem 0.7rem",
                            fontWeight: 700,
                            fontSize: "0.76rem",
                            cursor: isDeleting ? "not-allowed" : "pointer",
                            opacity: isDeleting ? 0.6 : 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isDeleting ? "..." : "Delete"}
                        </button>
                        <button
                          onClick={() => setProfileUserId(uid)}
                          style={{
                            background: "#0F1F3D",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "0.3rem 0.7rem",
                            fontWeight: 700,
                            fontSize: "0.76rem",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            marginLeft: "0.375rem",
                          }}
                        >
                          Profile
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TabSection>
        )}

        {/* ────────────────────── INVOICES TAB ──────────────────────────────── */}
        {activeTab === "invoices" && (
          <TabSection
            title={t("dashboard.invoicesTitle")}
            state={invoices}
            onLoadMore={() => loadTab("invoices", true, invoices.page)}
            emptyMessage={t("dashboard.invoicesEmpty")}
          >
            <table
              style={{
                width: "100%",
                fontSize: "0.875rem",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "var(--color-mist)" }}>
                  <Th>{t("dashboard.colInvoiceNum")}</Th>
                  <Th>{t("dashboard.colInvoiceName")}</Th>
                  <Th>{t("dashboard.colSeller")}</Th>
                  <Th>{t("dashboard.colBuyerEmail")}</Th>
                  <Th>{t("dashboard.colAmount")}</Th>
                  <Th>{t("dashboard.colStatus")}</Th>
                  <Th>{t("dashboard.colCreated")}</Th>
                  <Th>{t("dashboard.colExpires")}</Th>
                </tr>
              </thead>
              <tbody>
                {invoices.data.map((inv) => (
                  <tr
                    key={String(inv.invoicenumber)}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <Td mono>{inv.invoicenumber}</Td>
                    <Td bold>{inv.invoicename}</Td>
                    <Td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--color-text-heading)",
                        }}
                      >
                        {inv.seller_name}
                      </span>
                      <span
                        style={{
                          display: "block",
                          color: "var(--color-text-muted)",
                          fontSize: "0.75rem",
                        }}
                      >
                        {inv.seller_email}
                      </span>
                    </Td>
                    <Td>{inv.clientemail}</Td>
                    <Td bold>
                      {Number(inv.amount).toLocaleString()} {inv.currency}
                    </Td>
                    <Td>
                      <span className={statusBadge(inv.status)}>
                        {inv.status}
                      </span>
                    </Td>
                    <Td muted>{fmtDate(inv.createdat)}</Td>
                    <Td muted>
                      {inv.expires_at ? fmtDate(inv.expires_at) : "—"}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabSection>
        )}

        {/* ────────────────────── PAYMENTS TAB ──────────────────────────────── */}
        {activeTab === "payments" && (
          <TabSection
            title={t("dashboard.paymentsTitle")}
            state={payments}
            onLoadMore={() => loadTab("payments", true, payments.page)}
            emptyMessage={t("dashboard.paymentsEmpty")}
          >
            <table
              style={{
                width: "100%",
                fontSize: "0.875rem",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "var(--color-mist)" }}>
                  <Th>{t("dashboard.colInvoiceRef")}</Th>
                  <Th>{t("dashboard.colInvoiceNameRef")}</Th>
                  <Th>{t("dashboard.colSeller")}</Th>
                  <Th>{t("dashboard.colAmount")}</Th>
                  <Th>{t("dashboard.colMethod")}</Th>
                  <Th>{t("dashboard.colStatus")}</Th>
                  <Th>{t("dashboard.colDate")}</Th>
                </tr>
              </thead>
              <tbody>
                {payments.data.map((p) => (
                  <tr
                    key={String(p.id)}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <Td mono>{p.invoicenumber}</Td>
                    <Td>{p.invoicename}</Td>
                    <Td>{p.seller_name}</Td>
                    <Td bold>
                      {Number(p.amount).toLocaleString()} {p.currency}
                    </Td>
                    <Td>{p.provider ?? "Mobile Money"}</Td>
                    <Td>
                      <span className={statusBadge(p.status)}>{p.status}</span>
                    </Td>
                    <Td muted>{fmtDate(p.createdat)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabSection>
        )}

        {/* ────────────────────── PAYOUTS TAB ───────────────────────────────── */}
        {activeTab === "payouts" && (
          <TabSection
            title={t("dashboard.payoutsTitle")}
            state={payouts}
            onLoadMore={() => loadTab("payouts", true, payouts.page)}
            emptyMessage={t("dashboard.payoutsEmpty")}
          >
            <table
              style={{
                width: "100%",
                fontSize: "0.875rem",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "var(--color-mist)" }}>
                  <Th>{t("dashboard.colNum")}</Th>
                  <Th>{t("dashboard.colInvoiceRef")}</Th>
                  <Th>{t("dashboard.colSeller")}</Th>
                  <Th>{t("dashboard.colPhone")}</Th>
                  <Th>{t("dashboard.colAmount")}</Th>
                  <Th>{t("dashboard.colMethod")}</Th>
                  <Th>{t("dashboard.colStatus")}</Th>
                  <Th>{t("dashboard.colDate")}</Th>
                </tr>
              </thead>
              <tbody>
                {payouts.data.map((p) => (
                  <tr
                    key={String(p.id)}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <Td muted>{p.id}</Td>
                    <Td mono>{p.invoice_number ?? "—"}</Td>
                    <Td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--color-text-heading)",
                        }}
                      >
                        {p.seller_name}
                      </span>
                      <span
                        style={{
                          display: "block",
                          color: "var(--color-text-muted)",
                          fontSize: "0.75rem",
                        }}
                      >
                        {p.seller_email}
                      </span>
                    </Td>
                    <Td mono>{p.seller_phone}</Td>
                    <Td bold>{fmtXAF(p.amount)}</Td>
                    <Td>{p.method}</Td>
                    <Td>
                      <span className={statusBadge(p.status)}>{p.status}</span>
                    </Td>
                    <Td muted>{fmtDate(p.createdat)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabSection>
        )}

        {/* ─────────────── PENDING RELEASES (STUCK INVOICES) TAB ────────────── */}
        {activeTab === "stuck" && (
          <TabSection
            title={t("dashboard.stuckTitle")}
            state={stuck}
            onLoadMore={() => loadTab("stuck", true, stuck.page)}
            emptyMessage={t("dashboard.stuckEmpty")}
          >
            <table
              style={{
                width: "100%",
                fontSize: "0.875rem",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "var(--color-mist)" }}>
                  <Th>{t("dashboard.colInvoiceNum")}</Th>
                  <Th>{t("dashboard.colInvoiceName")}</Th>
                  <Th>{t("dashboard.colSeller")}</Th>
                  <Th>{t("dashboard.colBuyerEmail")}</Th>
                  <Th>{t("dashboard.colAmount")}</Th>
                  <Th>{t("dashboard.colStatus")}</Th>
                  <Th>{t("dashboard.colPaidAt")}</Th>
                  <Th>{t("dashboard.colDeliveredAt")}</Th>
                </tr>
              </thead>
              <tbody>
                {stuck.data.map((inv) => (
                  <tr
                    key={String(inv.id)}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <Td mono>{inv.invoicenumber}</Td>
                    <Td>{inv.invoicename}</Td>
                    <Td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--color-text-heading)",
                        }}
                      >
                        {inv.seller_name}
                      </span>
                      <span
                        style={{
                          display: "block",
                          color: "var(--color-text-muted)",
                          fontSize: "0.75rem",
                        }}
                      >
                        {inv.seller_email}
                      </span>
                    </Td>
                    <Td muted>{inv.clientemail}</Td>
                    <Td bold>{fmtXAF(inv.amount)}</Td>
                    <Td>
                      <span className={statusBadge(inv.status)}>
                        {String(inv.status)}
                      </span>
                    </Td>
                    <Td muted>{fmtDate(inv.paid_at)}</Td>
                    <Td muted>
                      {inv.delivered_at ? fmtDate(inv.delivered_at) : "—"}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabSection>
        )}

        {/* ────────────────────── DISPUTES TAB ──────────────────────────────── */}
        {activeTab === "disputes" && (
          <TabSection
            title={t("dashboard.disputesTitle")}
            state={disputes}
            onLoadMore={() => loadTab("disputes", true, disputes.page)}
            emptyMessage={t("dashboard.disputesEmpty")}
          >
            <table
              style={{
                width: "100%",
                fontSize: "0.875rem",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "var(--color-mist)" }}>
                  <Th>{t("dashboard.colInvoiceNum")}</Th>
                  <Th>{t("dashboard.colInvoiceName")}</Th>
                  <Th>{t("dashboard.colSeller")}</Th>
                  <Th>{t("dashboard.colAmount")}</Th>
                  <Th>{t("dashboard.colOpenedBy")}</Th>
                  <Th>{t("dashboard.colReason")}</Th>
                  <Th>{t("dashboard.colStatus")}</Th>
                  <Th>{t("dashboard.colDate")}</Th>
                  <Th>{t("dashboard.colAction")}</Th>
                </tr>
              </thead>
              <tbody>
                {disputes.data.map((d) => (
                  <tr
                    key={String(d.id)}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <Td mono>{d.invoicenumber}</Td>
                    <Td>{d.invoicename}</Td>
                    <Td>{d.seller_name}</Td>
                    <Td bold>
                      {d.amount != null
                        ? Number(d.amount).toLocaleString()
                        : "—"}{" "}
                      {d.currency}
                    </Td>
                    <Td>
                      <span
                        className={
                          d.opened_by === "buyer"
                            ? "badge badge-info"
                            : "badge badge-warning"
                        }
                      >
                        {d.opened_by}
                      </span>
                    </Td>
                    <Td>
                      <span
                        style={{
                          display: "block",
                          maxWidth: "18rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "var(--color-text-body)",
                        }}
                        title={d.reason != null ? String(d.reason) : undefined}
                      >
                        {d.reason}
                      </span>
                    </Td>
                    <Td>
                      <span className={statusBadge(d.status)}>
                        {String(d.status ?? "").replace("_", " ")}
                      </span>
                    </Td>
                    <Td muted>{fmtDate(d.created_at)}</Td>
                    <Td>
                      <a
                        href={`/admin/dispute/${String(d.admin_token ?? "")}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "var(--color-primary)",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          textDecoration: "underline",
                        }}
                      >
                        {t("dashboard.moderate")}
                      </a>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabSection>
        )}

        {/* ────────────────────── MESSAGES TAB ──────────────────────────────── */}
        {activeTab === "messages" && (
          <section
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--color-text-heading)",
                margin: 0,
              }}
            >
              {t("dashboard.msgSendTitle")}
            </h2>

            {/* ─── Compose card ──────────────────────────────────────────────── */}
            <div
              style={{
                backgroundColor: "var(--color-white)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "1.5rem",
                boxShadow: "var(--shadow-card)",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {/* Recipient type */}
              <div>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.625rem",
                  }}
                >
                  {t("dashboard.msgRecipientsLabel")}
                </p>
                <div style={{ display: "flex", gap: "1.25rem" }}>
                  {(["all", "user"] as const).map((type) => (
                    <label
                      key={type}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        fontWeight: msgRecipientType === type ? 600 : 400,
                        color:
                          msgRecipientType === type
                            ? "var(--color-primary)"
                            : "var(--color-text-body)",
                      }}
                    >
                      <input
                        type="radio"
                        name="msgRecipientType"
                        value={type}
                        checked={msgRecipientType === type}
                        onChange={() => {
                          setMsgRecipientType(type);
                          setMsgSelectedUser(null);
                          setMsgUserSearch("");
                          setMsgUserResults([]);
                        }}
                        style={{ accentColor: "var(--color-primary)" }}
                      />
                      {type === "all"
                        ? t("dashboard.msgBroadcastAll")
                        : t("dashboard.msgSendSpecific")}
                    </label>
                  ))}
                </div>
              </div>

              {/* User picker (only for direct message) */}
              {msgRecipientType === "user" && (
                <div style={{ position: "relative" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "0.375rem",
                    }}
                  >
                    {t("dashboard.msgRecipientLabel")}
                  </label>
                  {msgSelectedUser ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "var(--color-mist)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        padding: "0.625rem 0.875rem",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--color-text-heading)",
                            fontSize: "0.875rem",
                          }}
                        >
                          {msgSelectedUser.name}
                        </span>
                        <span
                          style={{
                            color: "var(--color-text-muted)",
                            fontSize: "0.8125rem",
                            marginLeft: "0.5rem",
                          }}
                        >
                          @{msgSelectedUser.username} &middot;{" "}
                          {msgSelectedUser.email}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setMsgSelectedUser(null);
                          setMsgUserSearch("");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--color-text-muted)",
                          fontSize: "1.25rem",
                          lineHeight: 1,
                          padding: "0 0.25rem",
                        }}
                        title={t("dashboard.msgRemove")}
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder={t("dashboard.msgSearchPlaceholder")}
                        value={msgUserSearch}
                        onChange={(e) => setMsgUserSearch(e.target.value)}
                        className="form-input"
                        style={{ width: "100%" }}
                      />
                      {(msgUserResults.length > 0 ||
                        (msgUserSearching && msgUserSearch.trim())) && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 50,
                            backgroundColor: "var(--color-white)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            boxShadow: "var(--shadow-card)",
                            marginTop: "0.25rem",
                            overflow: "hidden",
                          }}
                        >
                          {msgUserSearching && (
                            <p
                              style={{
                                padding: "0.75rem 1rem",
                                color: "var(--color-text-muted)",
                                fontSize: "0.875rem",
                              }}
                            >
                              {t("dashboard.msgSearching")}
                            </p>
                          )}
                          {!msgUserSearching &&
                            msgUserResults.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => {
                                  setMsgSelectedUser(u);
                                  setMsgUserSearch("");
                                  setMsgUserResults([]);
                                }}
                                style={{
                                  display: "block",
                                  width: "100%",
                                  textAlign: "left",
                                  padding: "0.625rem 1rem",
                                  background: "none",
                                  border: "none",
                                  borderBottom: "1px solid var(--color-border)",
                                  cursor: "pointer",
                                  fontSize: "0.875rem",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "var(--color-mist)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor = "")
                                }
                              >
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: "var(--color-text-heading)",
                                  }}
                                >
                                  {u.name}
                                </span>
                                <span
                                  style={{
                                    color: "var(--color-text-muted)",
                                    marginLeft: "0.5rem",
                                  }}
                                >
                                  @{u.username}
                                </span>
                                <span
                                  style={{
                                    display: "block",
                                    color: "var(--color-text-muted)",
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {u.email}
                                </span>
                              </button>
                            ))}
                          {!msgUserSearching &&
                            msgUserResults.length === 0 &&
                            msgUserSearch.trim() && (
                              <p
                                style={{
                                  padding: "0.75rem 1rem",
                                  color: "var(--color-text-muted)",
                                  fontSize: "0.875rem",
                                }}
                              >
                                {t("dashboard.msgNoUsers")}
                              </p>
                            )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Subject */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.375rem",
                  }}
                >
                  {t("dashboard.msgSubjectLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t("dashboard.msgSubjectPlaceholder")}
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  className="form-input"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Body */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.375rem",
                  }}
                >
                  {t("dashboard.msgBodyLabel")}
                </label>
                <textarea
                  rows={7}
                  placeholder={t("dashboard.msgBodyPlaceholder")}
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  className="form-input"
                  style={{
                    width: "100%",
                    resize: "vertical",
                    fontFamily: "inherit",
                    lineHeight: 1.6,
                  }}
                />
              </div>

              {/* Feedback */}
              {msgSuccess && (
                <div
                  className="alert alert-success"
                  style={{ fontSize: "0.875rem" }}
                >
                  {msgSuccess}
                </div>
              )}
              {msgError && (
                <div
                  className="alert alert-danger"
                  style={{ fontSize: "0.875rem" }}
                >
                  {msgError}
                </div>
              )}

              {/* Send button */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={sendBroadcast}
                  disabled={msgSending}
                  className="btn-primary"
                  style={{ minWidth: "11rem", fontSize: "0.9375rem" }}
                >
                  {msgSending
                    ? t("dashboard.msgSendingBtn")
                    : msgRecipientType === "all"
                      ? t("dashboard.msgBroadcastBtn")
                      : t("dashboard.msgDirectBtn")}
                </button>
                {msgRecipientType === "all" && (
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-text-muted)",
                      margin: 0,
                    }}
                  >
                    {t("dashboard.msgBroadcastNote")}
                  </p>
                )}
              </div>
            </div>

            {/* ─── Sent message history ────────────────────────────────────── */}
            <TabSection
              title={t("dashboard.msgHistoryTitle")}
              state={broadcasts}
              onLoadMore={() => loadTab("messages", true, broadcasts.page)}
              emptyMessage={t("dashboard.msgHistoryEmpty")}
            >
              <table
                style={{
                  width: "100%",
                  fontSize: "0.875rem",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "var(--color-mist)" }}>
                    <Th>{t("dashboard.colType")}</Th>
                    <Th>{t("dashboard.colRecipient")}</Th>
                    <Th>{t("dashboard.colSubject")}</Th>
                    <Th>{t("dashboard.colDeliveredTo")}</Th>
                    <Th>{t("dashboard.colSent")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {broadcasts.data.map((b) => (
                    <tr
                      key={String(b.id)}
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                    >
                      <Td>
                        <span
                          className={
                            b.recipient_type === "all"
                              ? "badge badge-info"
                              : "badge badge-neutral"
                          }
                        >
                          {b.recipient_type === "all"
                            ? t("dashboard.typeBroadcast")
                            : t("dashboard.typeDirect")}
                        </span>
                      </Td>
                      <Td>
                        {b.recipient_type === "all" ? (
                          <span
                            style={{
                              color: "var(--color-text-muted)",
                              fontStyle: "italic",
                            }}
                          >
                            {t("dashboard.recipientAllUsers")}
                          </span>
                        ) : (
                          <>
                            <span
                              style={{
                                fontWeight: 600,
                                color: "var(--color-text-heading)",
                              }}
                            >
                              {b.recipient_name ?? "—"}
                            </span>
                            <span
                              style={{
                                display: "block",
                                color: "var(--color-text-muted)",
                                fontSize: "0.75rem",
                              }}
                            >
                              {b.recipient_email}
                            </span>
                          </>
                        )}
                      </Td>
                      <Td bold>{b.subject}</Td>
                      <Td>
                        {b.recipient_type === "all" ? (
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--color-primary)",
                            }}
                          >
                            {t("dashboard.usersCountLabel", {
                              count: Number(b.recipients_count ?? 0),
                            })}
                          </span>
                        ) : (
                          t("dashboard.oneUserLabel")
                        )}
                      </Td>
                      <Td muted>{fmtDate(b.sent_at)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabSection>
          </section>
        )}

        {/* ────────────────────── REFERRALS TAB ─────────────────────────────── */}
        {activeTab === "referrals" && (
          <TabSection
            title={t("dashboard.referralsTitle")}
            state={referrals}
            onLoadMore={() => loadTab("referrals", true, referrals.page)}
            emptyMessage={t("dashboard.referralsEmpty")}
          >
            <table
              style={{
                width: "100%",
                fontSize: "0.875rem",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "var(--color-mist)" }}>
                  <Th>{t("dashboard.colName")}</Th>
                  <Th>{t("dashboard.colUsername")}</Th>
                  <Th>{t("dashboard.colEmail")}</Th>
                  <Th>{t("dashboard.colReferralCode")}</Th>
                  <Th>{t("dashboard.colPeopleReferred")}</Th>
                  <Th>{t("dashboard.colTotalEarned")}</Th>
                  <Th>{t("dashboard.colCurrentBalance")}</Th>
                </tr>
              </thead>
              <tbody>
                {referrals.data.map((r) => (
                  <tr
                    key={String(r.id)}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <Td bold>{r.name}</Td>
                    <Td muted>@{r.username}</Td>
                    <Td>{r.email}</Td>
                    <Td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          backgroundColor: "var(--color-mist)",
                          color: "var(--color-text-heading)",
                          padding: "0.125rem 0.5rem",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.75rem",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {r.referral_code}
                      </span>
                    </Td>
                    <Td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--color-primary)",
                        }}
                      >
                        {r.referred_count}
                      </span>
                      <span
                        style={{
                          color: "var(--color-text-muted)",
                          fontSize: "0.75rem",
                          marginLeft: "0.25rem",
                        }}
                      >
                        {parseInt(String(r.referred_count)) === 1
                          ? t("dashboard.personSingular")
                          : t("dashboard.personPlural")}
                      </span>
                    </Td>
                    <Td bold>{fmtXAF(r.total_earned)}</Td>
                    <Td>
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            Number(r.referral_balance) > 0
                              ? "var(--color-success)"
                              : "var(--color-text-muted)",
                        }}
                      >
                        {fmtXAF(r.referral_balance)}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabSection>
        )}

        {/* ─────────────────────── SUSPENSIONS TAB ──────────────────────── */}
        {activeTab === "suspensions" && (
          <SuspensionsAdminTab
            data={suspensions.data}
            loading={suspensions.loading}
            error={suspensions.error}
            hasMore={suspensions.hasMore}
            filter={suspensionFilter}
            setFilter={setSuspensionFilter}
            onLoadMore={() => loadTab("suspensions", true, suspensions.page)}
            onReload={() => loadTab("suspensions", false, 0)}
            actionLoadingId={suspActionLoadingId}
            setActionLoadingId={setSuspActionLoadingId}
            noteById={suspNoteById}
            setNoteById={setSuspNoteById}
          />
        )}

        {/* ─────────────────────── KYC TAB ─────────────────────────────────── */}
        {activeTab === "kyc" && (
          <KycAdminTab
            data={kyc.data}
            loading={kyc.loading}
            error={kyc.error}
            hasMore={kyc.hasMore}
            filter={kycFilter}
            setFilter={setKycFilter}
            onLoadMore={() => loadTab("kyc", true, kyc.page)}
            onReload={() => loadTab("kyc", false, 0)}
            actionLoadingId={kycActionLoadingId}
            setActionLoadingId={setKycActionLoadingId}
            noteById={kycNoteById}
            setNoteById={setKycNoteById}
          />
        )}

        {/* ─────────────────────── VERIFY RECEIPT TAB ─────────────────────── */}
        {activeTab === "verify" && <AdminVerifyTab />}

        {/* ─────────────────────── CONTROLS TAB ─────────────────────────────── */}
        {activeTab === "controls" && (
          <section
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Responsive helper styles for Controls tab */}
            <style>{`
              .ctrl-card { background: var(--color-surface,#fff); border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
              @media (max-width: 600px) { .ctrl-card { padding: 1rem; } }
              .ctrl-toggle-row { display:flex; align-items:center; justify-content:space-between; gap:0.75rem; padding:1rem 1.25rem; border-radius:8px; flex-wrap:wrap; }
              @media (max-width:480px) { .ctrl-toggle-row { flex-direction:column; align-items:flex-start; } }
              .ctrl-toggle-btn { flex-shrink:0; padding:0.45rem 1rem; border-radius:20px; font-weight:600; font-size:0.82rem; cursor:pointer; border:none; color:#fff; transition:background 0.2s; white-space:nowrap; }
              @media (max-width:480px) { .ctrl-toggle-btn { width:100%; text-align:center; } }
              .ctrl-fields-row { display:flex; gap:0.75rem; margin-bottom:0.75rem; flex-wrap:wrap; }
              .ctrl-field { flex:1 1 160px; min-width:120px; }
              .ctrl-submit-btn { padding:0.65rem 1.5rem; border-radius:8px; font-weight:700; color:#fff; border:none; cursor:pointer; font-size:0.9rem; width:100%; }
              @media (min-width:480px) { .ctrl-submit-btn { width:auto; } }
            `}</style>
            {/* ── Platform Toggles ─── */}
            <div className="ctrl-card">
              <h2
                style={{
                  margin: "0 0 1.25rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                }}
              >
                ⚙️ Platform Toggles
              </h2>
              {settingsLoading || !platformSettings ? (
                <p style={{ color: "var(--color-text-muted)" }}>
                  Loading settings…
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {(
                    [
                      {
                        key: "maintenance_mode",
                        label: "🔧 Maintenance Mode",
                        desc: "Blocks all non-admin traffic with a maintenance page. Admin dashboard stays accessible.",
                        value: platformSettings.maintenanceMode,
                      },
                      {
                        key: "payments_blocked",
                        label: "💳 Block Incoming Payments",
                        desc: "Prevents buyers from initiating new MoMo payment prompts.",
                        value: platformSettings.paymentsBlocked,
                      },
                      {
                        key: "payouts_blocked",
                        label: "📤 Block Outgoing Payouts",
                        desc: "Prevents sellers from releasing escrow funds to their Mobile Money account.",
                        value: platformSettings.payoutsBlocked,
                      },
                    ] as {
                      key: string;
                      label: string;
                      desc: string;
                      value: boolean;
                    }[]
                  ).map(({ key, label, desc, value }) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                        padding: "1rem 1.25rem",
                        borderRadius: "8px",
                        background: value
                          ? "rgba(239,68,68,0.06)"
                          : "var(--color-bg, #f8fafc)",
                        border: `1px solid ${value ? "rgba(239,68,68,0.25)" : "var(--color-border, #e2e8f0)"}`,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                          {label}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-text-muted)",
                            marginTop: "2px",
                          }}
                        >
                          {desc}
                        </div>
                      </div>
                      <button
                        disabled={savingKey === key}
                        onClick={() => toggleSetting(key, !value)}
                        style={{
                          flexShrink: 0,
                          padding: "0.5rem 1.1rem",
                          borderRadius: "20px",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          cursor: savingKey === key ? "not-allowed" : "pointer",
                          border: "none",
                          background: value ? "#ef4444" : "#22c55e",
                          color: "#fff",
                          opacity: savingKey === key ? 0.6 : 1,
                          transition: "background 0.2s",
                        }}
                      >
                        {savingKey === key
                          ? "Saving…"
                          : value
                            ? "ON — Click to Disable"
                            : "OFF — Click to Enable"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Manual Balance Adjustment ─── */}
            <div className="ctrl-card">
              <h2
                style={{
                  margin: "0 0 0.25rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                }}
              >
                🏦 Manual Balance Adjustment
              </h2>
              <p
                style={{
                  margin: "0 0 1.25rem",
                  fontSize: "0.85rem",
                  color: "var(--color-text-muted)",
                }}
              >
                Credit or debit a user&apos;s wallet balance when a MoMo
                transaction fails but the user was charged. A reason note is
                mandatory and permanently logged.
              </p>

              {/* User picker */}
              <div style={{ marginBottom: "0.75rem", position: "relative" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Search User
                </label>
                <input
                  value={adjUserSearch}
                  onChange={(e) => {
                    setAdjUserSearch(e.target.value);
                    setAdjSelectedUser(null);
                  }}
                  placeholder="Name, username or email…"
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border, #e2e8f0)",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                  }}
                />
                {adjUserSearching && (
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    Searching…
                  </p>
                )}
                {adjUserResults.length > 0 && !adjSelectedUser && (
                  <ul
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 50,
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      listStyle: "none",
                      margin: "4px 0 0",
                      padding: "4px 0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    {adjUserResults.map((u) => (
                      <li
                        key={u.id}
                        onClick={() => {
                          setAdjSelectedUser(u);
                          setAdjUserSearch(u.name);
                          setAdjUserResults([]);
                        }}
                        style={{
                          padding: "0.5rem 0.75rem",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                        }}
                      >
                        {u.name}{" "}
                        <span style={{ color: "#94a3b8" }}>
                          @{u.username} · {u.email}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {adjSelectedUser && (
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#22c55e",
                      marginTop: "4px",
                    }}
                  >
                    ✓ Selected: {adjSelectedUser.name} ({adjSelectedUser.email})
                  </p>
                )}
              </div>

              {/* Amount + type */}
              <div className="ctrl-fields-row">
                <div className="ctrl-field">
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                  >
                    Amount (XAF)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border, #e2e8f0)",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div className="ctrl-field">
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                  >
                    Type
                  </label>
                  <select
                    value={adjType}
                    onChange={(e) =>
                      setAdjType(e.target.value as "credit" | "debit")
                    }
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border, #e2e8f0)",
                      fontSize: "0.9rem",
                      background: "#fff",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="credit">✅ Credit (add funds)</option>
                    <option value="debit">❌ Debit (remove funds)</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Reason Note <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. MoMo transaction ref #ABC123 failed but user was charged. Refunding via wallet credit."
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border, #e2e8f0)",
                    fontSize: "0.875rem",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {adjError && (
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#ef4444",
                    marginBottom: "0.75rem",
                  }}
                >
                  {adjError}
                </p>
              )}
              {adjSuccess && (
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#22c55e",
                    marginBottom: "0.75rem",
                  }}
                >
                  ✓ {adjSuccess}
                </p>
              )}

              <button
                disabled={adjSubmitting}
                onClick={submitAdjustment}
                className="ctrl-submit-btn"
                style={{
                  background: adjType === "credit" ? "#22c55e" : "#ef4444",
                  opacity: adjSubmitting ? 0.65 : 1,
                  cursor: adjSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {adjSubmitting
                  ? "Processing…"
                  : adjType === "credit"
                    ? "Apply Credit"
                    : "Apply Debit"}
              </button>
            </div>

            {/* ── Adjustment Audit Log ─── */}
            <div className="ctrl-card">
              <h2
                style={{
                  margin: "0 0 1rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                }}
              >
                📋 Adjustment Audit Log
              </h2>
              {adjustments.loading && !adjustments.loaded ? (
                <p style={{ color: "var(--color-text-muted)" }}>Loading…</p>
              ) : adjustments.data.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)" }}>
                  No adjustments yet.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.875rem",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom:
                            "2px solid var(--color-border, #e2e8f0)",
                        }}
                      >
                        {[
                          "Date",
                          "Admin",
                          "User",
                          "Type",
                          "Amount (XAF)",
                          "Reason",
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "left",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {adjustments.data.map((row) => (
                        <tr
                          key={String(row.id)}
                          style={{
                            borderBottom:
                              "1px solid var(--color-border, #e2e8f0)",
                          }}
                        >
                          <td
                            style={{
                              padding: "0.5rem 0.75rem",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {fmtDate(row.created_at)}
                          </td>
                          <td style={{ padding: "0.5rem 0.75rem" }}>
                            {String(row.admin_email)}
                          </td>
                          <td style={{ padding: "0.5rem 0.75rem" }}>
                            {String(row.user_name)}
                            <br />
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {String(row.user_email)}
                            </span>
                          </td>
                          <td style={{ padding: "0.5rem 0.75rem" }}>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                background:
                                  row.type === "credit"
                                    ? "rgba(34,197,94,0.12)"
                                    : "rgba(239,68,68,0.12)",
                                color:
                                  row.type === "credit" ? "#16a34a" : "#dc2626",
                              }}
                            >
                              {String(row.type).toUpperCase()}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "0.5rem 0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            {Number(row.amount).toLocaleString()}
                          </td>
                          <td
                            style={{
                              padding: "0.5rem 0.75rem",
                              maxWidth: "260px",
                            }}
                          >
                            {String(row.reason)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {adjustments.hasMore && (
                    <button
                      onClick={() => loadAdjustments(true, adjustments.page)}
                      disabled={adjustments.loading}
                      style={{
                        marginTop: "1rem",
                        padding: "0.5rem 1.25rem",
                        borderRadius: "8px",
                        background: "var(--color-primary, #0F1F3D)",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      {adjustments.loading ? "Loading…" : "Load More"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Two-Factor Authentication ─── */}
            <div className="ctrl-card">
              <h2
                style={{
                  margin: "0 0 1.25rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                }}
              >
                Two-Factor Authentication (2FA)
              </h2>
              {twoFaMsg && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #86efac",
                    color: "#166534",
                    borderRadius: "8px",
                    padding: "0.625rem 0.875rem",
                    marginBottom: "0.75rem",
                    fontSize: "0.875rem",
                  }}
                >
                  {twoFaMsg}
                </div>
              )}
              {twoFaErr && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fca5a5",
                    color: "#991b1b",
                    borderRadius: "8px",
                    padding: "0.625rem 0.875rem",
                    marginBottom: "0.75rem",
                    fontSize: "0.875rem",
                  }}
                >
                  {twoFaErr}
                </div>
              )}
              {twoFaEnabled === null ? (
                <p style={{ color: "var(--color-text-muted)" }}>
                  Loading 2FA status…
                </p>
              ) : twoFaEnabled ? (
                <div>
                  <p
                    style={{
                      color: "var(--color-text-body)",
                      marginBottom: "1rem",
                    }}
                  >
                    2FA is <strong style={{ color: "#16a34a" }}>enabled</strong>
                    . Every login requires a valid TOTP code from your
                    authenticator app.
                  </p>
                  <button
                    onClick={handle2FaDisable}
                    disabled={twoFaLoading}
                    style={{
                      padding: "0.5rem 1.25rem",
                      borderRadius: "8px",
                      background: "#991b1b",
                      color: "#fff",
                      border: "none",
                      cursor: twoFaLoading ? "not-allowed" : "pointer",
                      fontWeight: 700,
                      opacity: twoFaLoading ? 0.6 : 1,
                    }}
                  >
                    {twoFaLoading ? "…" : "Disable 2FA"}
                  </button>
                </div>
              ) : twoFaSetupData ? (
                <div>
                  <p
                    style={{
                      color: "var(--color-text-body)",
                      marginBottom: "0.75rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    Scan this QR code with your authenticator app (Google
                    Authenticator, Authy, etc.), then enter the 6-digit code to
                    confirm and enable 2FA.
                  </p>
                  <div style={{ marginBottom: "1rem" }}>
                    <QRCodeSVG value={twoFaSetupData.otpauthUrl} size={180} />
                  </div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                      marginBottom: "0.75rem",
                      fontFamily: "monospace",
                      wordBreak: "break-all",
                    }}
                  >
                    Manual key: {twoFaSetupData.base32}
                  </p>
                  <div
                    style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      value={twoFaOtp}
                      onChange={(e) =>
                        setTwoFaOtp(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      placeholder="6-digit code"
                      maxLength={6}
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        fontSize: "1rem",
                        width: "9rem",
                        letterSpacing: "0.25em",
                      }}
                    />
                    <button
                      onClick={handle2FaVerify}
                      disabled={twoFaLoading || twoFaOtp.length !== 6}
                      style={{
                        padding: "0.5rem 1.25rem",
                        borderRadius: "8px",
                        background: "#0F1F3D",
                        color: "#fff",
                        border: "none",
                        cursor:
                          twoFaOtp.length !== 6 || twoFaLoading
                            ? "not-allowed"
                            : "pointer",
                        fontWeight: 700,
                        opacity:
                          twoFaOtp.length !== 6 || twoFaLoading ? 0.5 : 1,
                      }}
                    >
                      {twoFaLoading ? "Verifying…" : "Enable 2FA"}
                    </button>
                    <button
                      onClick={() => setTwoFaSetupData(null)}
                      style={{
                        padding: "0.5rem 0.875rem",
                        borderRadius: "8px",
                        background: "none",
                        color: "var(--color-text-muted)",
                        border: "1px solid var(--color-border)",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p
                    style={{
                      color: "var(--color-text-body)",
                      marginBottom: "1rem",
                    }}
                  >
                    2FA is{" "}
                    <strong style={{ color: "#dc2626" }}>disabled</strong>.
                    Enable it to require a TOTP code at every login.
                  </p>
                  <button
                    onClick={handle2FaSetup}
                    disabled={twoFaLoading}
                    style={{
                      padding: "0.5rem 1.25rem",
                      borderRadius: "8px",
                      background: "#0F1F3D",
                      color: "#fff",
                      border: "none",
                      cursor: twoFaLoading ? "not-allowed" : "pointer",
                      fontWeight: 700,
                      opacity: twoFaLoading ? 0.6 : 1,
                    }}
                  >
                    {twoFaLoading ? "…" : "Set Up 2FA"}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─────────────────────── AUDIT LOG TAB ──────────────────────────────── */}
        {activeTab === "audit" && (
          <AuditLogTab
            data={auditLog.data}
            loading={auditLog.loading}
            error={auditLog.error}
            hasMore={auditLog.hasMore}
            onLoadMore={() => loadTab("audit", true, auditLog.page)}
            onReload={() => loadTab("audit", false, 0)}
          />
        )}

        {/* ─────────────────────── INBOX TAB ─────────────────────────────────── */}
        {activeTab === "inbox" && (
          <SupportInboxTab
            data={inboxData}
            loading={inboxLoading}
            loaded={inboxLoaded}
            error={inboxError}
            statusFilter={inboxStatusFilter}
            setStatusFilter={setInboxStatusFilter}
            updatingId={inboxUpdatingId}
            onUpdateStatus={async (id, status) => {
              setInboxUpdatingId(id);
              try {
                await axios.patch(
                  `${API_URL}/admin/feature-requests/${id}`,
                  { status },
                  { withCredentials: true },
                );
                loadInbox(inboxStatusFilter);
              } catch {
                /* silent */
              } finally {
                setInboxUpdatingId(null);
              }
            }}
          />
        )}

        {/* ─────────────────────── USER PROFILE MODAL ─────────────────────────── */}
        {profileUserId !== null && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "680px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
                  User Profile
                </h2>
                <button
                  onClick={() => setProfileUserId(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.25rem",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: "1.5rem" }}>
                {profileLoading && (
                  <p style={{ color: "var(--color-text-muted)" }}>Loading…</p>
                )}
                {profileError && (
                  <p style={{ color: "#dc2626" }}>{profileError}</p>
                )}
                {profileData && <UserProfileDrilldown data={profileData} />}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Admin Suspensions Component ─────────────────────────────────────────────
function SuspensionsAdminTab({
  data,
  loading,
  error,
  hasMore,
  filter,
  setFilter,
  onLoadMore,
  onReload,
  actionLoadingId,
  setActionLoadingId,
  noteById,
  setNoteById,
}: {
  data: Record<string, RowValue>[];
  loading: boolean;
  error: string;
  hasMore: boolean;
  filter: "all" | "appeal_pending" | "permanent" | "temporary";
  setFilter: React.Dispatch<
    React.SetStateAction<"all" | "appeal_pending" | "permanent" | "temporary">
  >;
  onLoadMore: () => void;
  onReload: () => void;
  actionLoadingId: number | null;
  setActionLoadingId: React.Dispatch<React.SetStateAction<number | null>>;
  noteById: Record<number, string>;
  setNoteById: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}) {
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");

  const suspensionPill = (row: Record<string, RowValue>) => {
    const isPermanent = !row.suspended_until;
    return (
      <span
        style={{
          background: isPermanent
            ? "rgba(220,38,38,0.08)"
            : "rgba(245,158,11,0.12)",
          border: isPermanent
            ? "1px solid rgba(220,38,38,0.24)"
            : "1px solid rgba(245,158,11,0.32)",
          color: isPermanent ? "#991b1b" : "#92400e",
          borderRadius: "999px",
          padding: "0.2rem 0.65rem",
          fontSize: "0.75rem",
          fontWeight: 800,
        }}
      >
        {isPermanent ? "Permanent" : "Temporary"}
      </span>
    );
  };

  const appealPill = (status: RowValue) => {
    const map: Record<
      string,
      { bg: string; bd: string; cl: string; label: string }
    > = {
      pending: {
        bg: "rgba(245,158,11,0.12)",
        bd: "rgba(245,158,11,0.32)",
        cl: "#92400e",
        label: "Appeal Pending",
      },
      accepted: {
        bg: "rgba(22,163,74,0.1)",
        bd: "rgba(22,163,74,0.3)",
        cl: "#166534",
        label: "Appeal Accepted",
      },
      declined: {
        bg: "rgba(220,38,38,0.08)",
        bd: "rgba(220,38,38,0.24)",
        cl: "#991b1b",
        label: "Appeal Declined",
      },
      none: {
        bg: "rgba(100,116,139,0.08)",
        bd: "rgba(100,116,139,0.2)",
        cl: "#475569",
        label: "No Appeal",
      },
    };
    const s = map[String(status ?? "none")] ?? map.none;
    return (
      <span
        style={{
          background: s.bg,
          border: `1px solid ${s.bd}`,
          color: s.cl,
          borderRadius: "999px",
          padding: "0.2rem 0.65rem",
          fontSize: "0.75rem",
          fontWeight: 800,
        }}
      >
        {s.label}
      </span>
    );
  };

  const doAction = async (
    id: number,
    action: "unsuspend" | "appeal/accept" | "appeal/decline",
  ) => {
    setActionMsg("");
    setActionErr("");
    setActionLoadingId(id);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}/admin/users/${id}/${action}`,
        action === "appeal/decline" ? { note: noteById[id] || "" } : {},
        { withCredentials: true },
      );
      const msgMap: Record<string, string> = {
        unsuspend: "Account reactivated and user notified.",
        "appeal/accept":
          "Appeal accepted, account reinstated and user notified.",
        "appeal/decline": "Appeal declined and user notified.",
      };
      setActionMsg(msgMap[action] ?? "Done.");
      onReload();
    } catch (err: unknown) {
      setActionErr(
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Action failed.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const FILTERS: {
    key: "all" | "appeal_pending" | "permanent" | "temporary";
    label: string;
  }[] = [
    { key: "all", label: "All" },
    { key: "appeal_pending", label: "Pending Appeals" },
    { key: "permanent", label: "Permanent" },
    { key: "temporary", label: "Temporary" },
  ];

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        background: "var(--color-surface,#fff)",
        borderRadius: "12px",
        padding: "1rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>
            Account Suspensions
          </h3>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "0.84rem",
              color: "var(--color-text-muted)",
            }}
          >
            Manage suspended accounts, review appeals, and reinstate users.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                border:
                  filter === f.key
                    ? "1px solid var(--color-primary,#0F1F3D)"
                    : "1px solid var(--color-border,#e2e8f0)",
                background:
                  filter === f.key ? "var(--color-primary,#0F1F3D)" : "#fff",
                color:
                  filter === f.key
                    ? "#fff"
                    : "var(--color-text-heading,#0f172a)",
                borderRadius: "999px",
                padding: "0.35rem 0.75rem",
                fontWeight: 700,
                fontSize: "0.77rem",
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {actionMsg && <div className="alert alert-success">{actionMsg}</div>}
      {actionErr && <div className="alert alert-danger">{actionErr}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {loading && data.length === 0 && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem" }}>
          Loading...
        </p>
      )}

      {!loading && data.length === 0 && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem" }}>
          No suspended accounts found.
        </p>
      )}

      {data.map((row) => {
        const id = Number(row.id);
        const isLoading = actionLoadingId === id;
        const hasPendingAppeal = row.appeal_status === "pending";

        return (
          <div
            key={id}
            style={{
              border: "1px solid var(--color-border,#e2e8f0)",
              borderRadius: "10px",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              background: "#fafafa",
            }}
          >
            {/* User info row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    color: "#0f172a",
                  }}
                >
                  {String(row.name || "—")}
                  {row.username && (
                    <span
                      style={{
                        fontWeight: 500,
                        color: "#64748b",
                        marginLeft: "0.4rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      @{String(row.username)}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "#64748b",
                    marginTop: "2px",
                  }}
                >
                  {String(row.email || "—")}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.4rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {suspensionPill(row)}
                {appealPill(row.appeal_status)}
              </div>
            </div>

            {/* Suspension details */}
            <div
              style={{
                fontSize: "0.83rem",
                color: "#475569",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "0.35rem 1rem",
              }}
            >
              <div>
                <span style={{ fontWeight: 700 }}>Suspended:</span>{" "}
                {row.suspended_at
                  ? new Date(String(row.suspended_at)).toLocaleDateString(
                      "en-GB",
                      { day: "2-digit", month: "short", year: "numeric" },
                    )
                  : "—"}
              </div>
              {row.suspended_until && (
                <div>
                  <span style={{ fontWeight: 700 }}>Until:</span>{" "}
                  {new Date(String(row.suspended_until)).toLocaleDateString(
                    "en-GB",
                    { day: "2-digit", month: "short", year: "numeric" },
                  )}
                </div>
              )}
              {row.suspension_reason && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ fontWeight: 700 }}>Reason:</span>{" "}
                  {String(row.suspension_reason)}
                </div>
              )}
            </div>

            {/* Appeal text if present */}
            {row.appeal_text && (
              <div
                style={{
                  background: "#f1f5f9",
                  borderRadius: "8px",
                  padding: "0.65rem 0.85rem",
                  fontSize: "0.83rem",
                  color: "#334155",
                  lineHeight: 1.6,
                  borderLeft: "3px solid #94a3b8",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: "#64748b",
                    marginBottom: "4px",
                  }}
                >
                  USER APPEAL
                </div>
                {String(row.appeal_text)}
              </div>
            )}

            {/* Admin note input for decline */}
            {hasPendingAppeal && (
              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "#64748b",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Decline note (optional, visible to user)
                </label>
                <input
                  type="text"
                  value={noteById[id] ?? ""}
                  onChange={(e) =>
                    setNoteById((prev) => ({ ...prev, [id]: e.target.value }))
                  }
                  placeholder="Reason for declining the appeal..."
                  style={{
                    width: "100%",
                    padding: "0.4rem 0.65rem",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border,#e2e8f0)",
                    fontSize: "0.83rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                disabled={isLoading}
                onClick={() => doAction(id, "unsuspend")}
                style={{
                  background: "#166534",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.4rem 0.85rem",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? "..." : "Reactivate"}
              </button>
              {hasPendingAppeal && (
                <>
                  <button
                    disabled={isLoading}
                    onClick={() => doAction(id, "appeal/accept")}
                    style={{
                      background: "#0369a1",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.4rem 0.85rem",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  >
                    {isLoading ? "..." : "Accept Appeal"}
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={() => doAction(id, "appeal/decline")}
                    style={{
                      background: "#991b1b",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.4rem 0.85rem",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  >
                    {isLoading ? "..." : "Decline Appeal"}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          style={{
            alignSelf: "center",
            marginTop: "0.5rem",
            padding: "0.5rem 1.5rem",
            background: "var(--color-primary,#0F1F3D)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </section>
  );
}

// ─── Admin KYC Review Component ─────────────────────────────────────────────
function KycAdminTab({
  data,
  loading,
  error,
  hasMore,
  filter,
  setFilter,
  onLoadMore,
  onReload,
  actionLoadingId,
  setActionLoadingId,
  noteById,
  setNoteById,
}: {
  data: Record<string, RowValue>[];
  loading: boolean;
  error: string;
  hasMore: boolean;
  filter: "all" | "pending" | "approved" | "rejected";
  setFilter: React.Dispatch<
    React.SetStateAction<"all" | "pending" | "approved" | "rejected">
  >;
  onLoadMore: () => void;
  onReload: () => void;
  actionLoadingId: number | null;
  setActionLoadingId: React.Dispatch<React.SetStateAction<number | null>>;
  noteById: Record<number, string>;
  setNoteById: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}) {
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");

  const statusPill = (status: string) => {
    const map: Record<
      string,
      { bg: string; bd: string; cl: string; label: string }
    > = {
      pending: {
        bg: "rgba(245,158,11,0.12)",
        bd: "rgba(245,158,11,0.32)",
        cl: "#92400e",
        label: "Pending",
      },
      approved: {
        bg: "rgba(22,163,74,0.1)",
        bd: "rgba(22,163,74,0.3)",
        cl: "#166534",
        label: "Approved",
      },
      rejected: {
        bg: "rgba(220,38,38,0.08)",
        bd: "rgba(220,38,38,0.24)",
        cl: "#991b1b",
        label: "Rejected",
      },
    };
    const s = map[status] || {
      bg: "rgba(100,116,139,0.08)",
      bd: "rgba(100,116,139,0.2)",
      cl: "#475569",
      label: status,
    };
    return (
      <span
        style={{
          background: s.bg,
          border: `1px solid ${s.bd}`,
          color: s.cl,
          borderRadius: "999px",
          padding: "0.2rem 0.65rem",
          fontSize: "0.75rem",
          fontWeight: 800,
        }}
      >
        {s.label}
      </span>
    );
  };

  const review = async (id: number, mode: "approve" | "reject") => {
    setActionMsg("");
    setActionErr("");
    setActionLoadingId(id);
    try {
      await axios.post(
        `${API_URL}/admin/kyc/${id}/${mode}`,
        { note: noteById[id] || "" },
        { withCredentials: true },
      );
      setActionMsg(
        mode === "approve"
          ? "Application approved and user notified."
          : "Application rejected and user notified.",
      );
      onReload();
    } catch (err: unknown) {
      setActionErr(
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Action failed.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        background: "var(--color-surface,#fff)",
        borderRadius: "12px",
        padding: "1rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>
            KYC Verification Queue
          </h3>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "0.84rem",
              color: "var(--color-text-muted)",
            }}
          >
            Review identity submissions, approve verified users, or reject with
            clear reasons.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                border:
                  filter === f
                    ? "1px solid var(--color-primary,#0F1F3D)"
                    : "1px solid var(--color-border,#e2e8f0)",
                background:
                  filter === f ? "var(--color-primary,#0F1F3D)" : "#fff",
                color:
                  filter === f ? "#fff" : "var(--color-text-heading,#0f172a)",
                borderRadius: "999px",
                padding: "0.35rem 0.75rem",
                fontWeight: 700,
                fontSize: "0.77rem",
                cursor: "pointer",
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {actionMsg && <div className="alert alert-success">{actionMsg}</div>}
      {actionErr && <div className="alert alert-danger">{actionErr}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {data.length === 0 && !loading ? (
        <div className="badge badge-neutral" style={{ width: "fit-content" }}>
          No KYC applications found.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {data.map((row) => {
            const id = Number(row.id);
            const status = String(row.status || "");
            return (
              <div
                key={id}
                style={{
                  border: "1px solid var(--color-border,#e2e8f0)",
                  borderRadius: "10px",
                  padding: "0.9rem",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                    marginBottom: "0.65rem",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 800,
                        color: "var(--color-text-heading,#0f172a)",
                      }}
                    >
                      {String(row.full_name || "—")}
                    </p>
                    <p
                      style={{
                        margin: "3px 0 0",
                        fontSize: "0.8rem",
                        color: "var(--color-text-muted,#64748b)",
                      }}
                    >
                      @{String(row.user_username || "")} ·{" "}
                      {String(row.user_email || "")}
                    </p>
                  </div>
                  {statusPill(status)}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "0.45rem 0.75rem",
                    marginBottom: "0.75rem",
                    fontSize: "0.8rem",
                  }}
                >
                  <InfoPair
                    label="Document"
                    value={String(row.document_type || "—")}
                  />
                  <InfoPair
                    label="Doc Number"
                    value={String(row.document_number || "—")}
                  />
                  <InfoPair label="Phone" value={String(row.phone || "—")} />
                  <InfoPair
                    label="Address"
                    value={`${String(row.address || "")} ${String(row.city || "")}, ${String(row.country || "")}`.trim()}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    marginBottom: "0.75rem",
                  }}
                >
                  <a
                    href={String(row.document_front_url || "")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="badge badge-info"
                  >
                    Front / Data Page
                  </a>
                  {row.document_back_url ? (
                    <a
                      href={String(row.document_back_url || "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="badge badge-info"
                    >
                      Back
                    </a>
                  ) : null}
                  <a
                    href={String(row.selfie_url || "")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="badge badge-info"
                  >
                    Selfie
                  </a>
                </div>

                {status === "pending" ? (
                  <>
                    <textarea
                      rows={3}
                      value={noteById[id] || ""}
                      onChange={(e) =>
                        setNoteById((prev) => ({
                          ...prev,
                          [id]: e.target.value,
                        }))
                      }
                      placeholder="Optional review note (required if rejecting for clarity)."
                      style={{
                        width: "100%",
                        border: "1px solid var(--color-border,#e2e8f0)",
                        borderRadius: "8px",
                        padding: "0.6rem 0.7rem",
                        fontSize: "0.82rem",
                        marginBottom: "0.6rem",
                        resize: "vertical",
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => review(id, "approve")}
                        disabled={actionLoadingId === id}
                        className="btn-primary"
                        style={{ minWidth: "130px" }}
                      >
                        {actionLoadingId === id ? "Processing..." : "Approve"}
                      </button>
                      <button
                        onClick={() => review(id, "reject")}
                        disabled={actionLoadingId === id}
                        style={{
                          minWidth: "130px",
                          borderRadius: "8px",
                          border: "1px solid rgba(220,38,38,0.25)",
                          background: "rgba(220,38,38,0.07)",
                          color: "#991b1b",
                          fontWeight: 700,
                          padding: "0.6rem 0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        {actionLoadingId === id ? "Processing..." : "Reject"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "var(--color-text-muted,#64748b)",
                    }}
                  >
                    Reviewed:{" "}
                    {row.reviewed_at
                      ? new Date(String(row.reviewed_at)).toLocaleString(
                          "en-GB",
                        )
                      : "—"}
                    {row.admin_note ? ` · Note: ${String(row.admin_note)}` : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          style={{
            alignSelf: "flex-start",
            padding: "0.5rem 1.2rem",
            borderRadius: "8px",
            border: "1px solid var(--color-border,#e2e8f0)",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.84rem",
          }}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </section>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span
        style={{
          fontSize: "0.73rem",
          color: "var(--color-text-muted,#64748b)",
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <p
        style={{
          margin: "2px 0 0",
          fontSize: "0.82rem",
          color: "var(--color-text-heading,#0f172a)",
          fontWeight: 600,
          lineHeight: 1.45,
        }}
      >
        {value || "—"}
      </p>
    </div>
  );
}

// ─── Admin Verify Receipt Component ──────────────────────────────────────────
function AdminVerifyTab() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    verified: boolean;
    message?: string;
    invoice?: {
      invoice_number: string;
      invoice_name: string;
      amount: number;
      currency: string;
      status: string;
      payment_type: string;
      created_at: string;
      paid_at: string | null;
      description: string;
      seller_name: string;
      seller_username: string;
      seller_country: string;
    };
  } | null>(null);
  const [formError, setFormError] = useState("");

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "—";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setResult(null);
    const num = invoiceNumber.trim();
    const c = code.trim().replace(/\s+/g, "").toUpperCase();
    if (!num || !c) {
      setFormError(
        "Please enter both the invoice number and verification code.",
      );
      return;
    }
    if (c.length !== 16) {
      setFormError("Verification code must be exactly 16 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/invoice/verify`, {
        invoice_number: num,
        code: c,
      });
      setResult(res.data);
    } catch {
      setResult({
        verified: false,
        message: "Server error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ padding: "1.5rem 0" }}>
      <div style={{ maxWidth: 580, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--color-text-heading)",
            marginBottom: "0.5rem",
          }}
        >
          Receipt Verification Tool
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            marginBottom: "1.5rem",
          }}
        >
          Enter the invoice number and verification code from a Fonlok receipt
          to check if it is authentic and unaltered.
        </p>

        {/* Form card */}
        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            padding: "1.5rem",
            marginBottom: "1.25rem",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-text-body)",
                  marginBottom: "0.375rem",
                }}
              >
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-20240001"
                autoComplete="off"
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  fontSize: "0.875rem",
                  background: "var(--color-input-bg, #fff)",
                  color: "var(--color-text-body)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-text-body)",
                  marginBottom: "0.375rem",
                }}
              >
                Verification Code{" "}
                <span
                  style={{
                    fontWeight: 400,
                    color: "var(--color-text-muted)",
                    fontSize: "0.75rem",
                  }}
                >
                  (16 chars, printed on the receipt)
                </span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3D4E5F67890"
                maxLength={20}
                autoComplete="off"
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  letterSpacing: 2,
                  background: "var(--color-input-bg, #fff)",
                  color: "var(--color-text-body)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {formError && (
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "#dc2626",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 6,
                  padding: "0.5rem 0.75rem",
                  marginBottom: "1rem",
                }}
              >
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading
                  ? "#94a3b8"
                  : "var(--color-primary, #0F1F3D)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "0.65rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        </div>

        {/* Result */}
        {result && result.verified && result.invoice && (
          <div
            style={{
              background: "#f0fdf4",
              border: "2px solid #22c55e",
              borderRadius: 10,
              padding: "1.25rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "#22c55e",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#166534",
                    fontSize: "1rem",
                  }}
                >
                  Authentic Fonlok Receipt
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#15803d" }}>
                  This receipt is genuine and unaltered.
                </div>
              </div>
            </div>
            <table
              style={{
                width: "100%",
                fontSize: "0.8125rem",
                borderCollapse: "collapse",
                background: "#fff",
                borderRadius: 6,
                overflow: "hidden",
                border: "1px solid #bbf7d0",
              }}
            >
              <tbody>
                {[
                  ["Invoice No.", result.invoice.invoice_number],
                  ["Name", result.invoice.invoice_name],
                  [
                    "Amount",
                    `${Number(result.invoice.amount).toLocaleString()} ${result.invoice.currency}`,
                  ],
                  ["Status", result.invoice.status.toUpperCase()],
                  [
                    "Payment Type",
                    result.invoice.payment_type === "installment"
                      ? "Installment"
                      : "One-Time",
                  ],
                  [
                    "Seller",
                    `${result.invoice.seller_name} (@${result.invoice.seller_username})`,
                  ],
                  ["Seller Country", result.invoice.seller_country ?? "—"],
                  ["Issued", fmtDate(result.invoice.created_at)],
                  ["Paid", fmtDate(result.invoice.paid_at)],
                  ["Description", result.invoice.description ?? "—"],
                ].map(([lbl, val], i) => (
                  <tr
                    key={lbl}
                    style={{ background: i % 2 === 0 ? "#f0fdf4" : "#fff" }}
                  >
                    <td
                      style={{
                        padding: "0.5rem 0.75rem",
                        fontWeight: 600,
                        color: "#6b7280",
                        width: 130,
                        borderBottom: "1px solid #dcfce7",
                      }}
                    >
                      {lbl}
                    </td>
                    <td
                      style={{
                        padding: "0.5rem 0.75rem",
                        color: "#111827",
                        borderBottom: "1px solid #dcfce7",
                        wordBreak: "break-all",
                      }}
                    >
                      {val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginTop: "0.75rem",
                marginBottom: 0,
              }}
            >
              Verified at {new Date().toUTCString()}
            </p>
          </div>
        )}

        {result && !result.verified && (
          <div
            style={{
              background: "#fff1f2",
              border: "2px solid #f43f5e",
              borderRadius: 10,
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "#f43f5e",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#be123c",
                    fontSize: "1rem",
                  }}
                >
                  Verification Failed
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#9f1239",
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {result.message ??
                    "The code does not match. This receipt may be fraudulent."}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Small reusable components ────────────────────────────────────────────────

// Stat card for the overview tab
function StatCard({
  label,
  value,
  color,
  icon,
  large = false,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
  large?: boolean;
}) {
  const highlight = ["red", "danger"].includes(color);
  const success = ["green", "emerald", "teal"].includes(color);
  const bg = highlight
    ? "var(--color-danger-bg)"
    : success
      ? "var(--color-success-bg)"
      : "var(--color-mist)";
  const border = highlight
    ? "var(--color-danger-border)"
    : success
      ? "var(--color-success-border)"
      : "var(--color-border)";
  const valueColor = highlight
    ? "var(--color-danger)"
    : success
      ? "var(--color-success)"
      : "var(--color-text-heading)";

  return (
    <div
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: "var(--radius-md)",
        padding: "1rem",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.375rem",
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontWeight: 800,
              fontSize: large ? "1.5rem" : "1.25rem",
              color: valueColor,
              margin: 0,
            }}
          >
            {value}
          </p>
        </div>
        <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      </div>
    </div>
  );
}

// Wraps any data tab — shows loading state, error, table, and "Load more" button
function TabSection({
  title,
  state,
  onLoadMore,
  emptyMessage,
  children,
}: {
  title: string;
  state: SectionState;
  onLoadMore: () => void;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("Admin");
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "var(--color-text-heading)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {state.loaded && (
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {t("dashboard.recordsShowing", { count: state.data.length })}
          </p>
        )}
      </div>

      {/* First load spinner */}
      {!state.loaded && state.loading && (
        <p
          style={{
            color: "var(--color-text-muted)",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          {t("dashboard.tabLoading")}
        </p>
      )}

      {/* Error */}
      {state.error && (
        <div className="alert alert-danger" style={{ fontSize: "0.875rem" }}>
          {state.error}
        </div>
      )}

      {/* Empty state */}
      {state.loaded && state.data.length === 0 && !state.error && (
        <div
          style={{
            backgroundColor: "var(--color-white)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "3rem",
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--color-text-muted)" }}>{emptyMessage}</p>
        </div>
      )}

      {/* Table */}
      {state.data.length > 0 && (
        <div
          style={{
            backgroundColor: "var(--color-white)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            overflowX: "auto",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ minWidth: "max-content" }}>{children}</div>
        </div>
      )}

      {/* Load more */}
      {state.hasMore && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "0.5rem",
          }}
        >
          <button
            onClick={onLoadMore}
            disabled={state.loading}
            className="btn-ghost"
            style={{ fontSize: "0.875rem" }}
          >
            {state.loading
              ? t("dashboard.tabLoading")
              : t("dashboard.loadMore")}
          </button>
        </div>
      )}
    </section>
  );
}

// Table header cell
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: "0.75rem 1rem",
        fontSize: "0.6875rem",
        fontWeight: 600,
        color: "var(--color-text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
        textAlign: "left",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {children}
    </th>
  );
}

// Table data cell — supports bold, muted, and mono variants
function Td({
  children,
  bold,
  muted,
  mono,
}: {
  children: React.ReactNode;
  bold?: boolean;
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      style={{
        padding: "0.75rem 1rem",
        whiteSpace: "nowrap",
        fontSize: muted || mono ? "0.8125rem" : "0.875rem",
        fontWeight: bold ? 600 : 400,
        color: bold
          ? "var(--color-text-heading)"
          : muted
            ? "var(--color-text-muted)"
            : mono
              ? "var(--color-text-body)"
              : "var(--color-text-body)",
        fontFamily: mono ? "monospace" : "inherit",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {children}
    </td>
  );
}

// ─── Audit Log Tab Component ──────────────────────────────────────────────────
function AuditLogTab({
  data,
  loading,
  error,
  hasMore,
  onLoadMore,
  onReload,
}: {
  data: Record<string, string | number | boolean | null | undefined>[];
  loading: boolean;
  error: string;
  hasMore: boolean;
  onLoadMore: () => void;
  onReload: () => void;
}) {
  useEffect(() => {
    if (data.length === 0 && !loading) onReload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actionColor = (action: string) => {
    if (action.includes("deleted") || action.includes("suspended"))
      return "#dc2626";
    if (
      action.includes("approved") ||
      action.includes("accepted") ||
      action.includes("unsuspended")
    )
      return "#16a34a";
    if (action.includes("rejected") || action.includes("declined"))
      return "#d97706";
    if (action.includes("2fa")) return "#7c3aed";
    return "#2563eb";
  };

  return (
    <section style={{ padding: "1.5rem" }}>
      <h2
        style={{ margin: "0 0 1.25rem", fontSize: "1.25rem", fontWeight: 800 }}
      >
        Audit Log
      </h2>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {loading && data.length === 0 && (
        <p style={{ color: "var(--color-text-muted)" }}>Loading…</p>
      )}
      {!loading && data.length === 0 && !error && (
        <p style={{ color: "var(--color-text-muted)" }}>No audit events yet.</p>
      )}
      {data.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid var(--color-border,#e2e8f0)",
                }}
              >
                {["Date", "Action", "User ID", "Detail"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.5rem 0.75rem",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      fontWeight: 700,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={String(row.id)}
                  style={{
                    borderBottom: "1px solid var(--color-border,#e2e8f0)",
                  }}
                >
                  <td
                    style={{
                      padding: "0.5rem 0.75rem",
                      whiteSpace: "nowrap",
                      color: "var(--color-text-muted)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {row.created_at
                      ? new Date(String(row.created_at)).toLocaleString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "—"}
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: `${actionColor(String(row.action))}18`,
                        color: actionColor(String(row.action)),
                      }}
                    >
                      {String(row.action).replace(/_/g, " ")}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.5rem 0.75rem",
                      fontFamily: "monospace",
                    }}
                  >
                    {row.target_id != null ? String(row.target_id) : "—"}
                  </td>
                  <td
                    style={{
                      padding: "0.5rem 0.75rem",
                      color: "var(--color-text-body)",
                      maxWidth: "300px",
                    }}
                  >
                    {row.detail ? String(row.detail) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <button
              onClick={onLoadMore}
              disabled={loading}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1.25rem",
                borderRadius: "8px",
                background: "var(--color-primary,#0F1F3D)",
                color: "#fff",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
              }}
            >
              {loading ? "Loading…" : "Load More"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Support Inbox Tab Component ──────────────────────────────────────────────
function SupportInboxTab({
  data,
  loading,
  loaded,
  error,
  statusFilter,
  setStatusFilter,
  updatingId,
  onUpdateStatus,
}: {
  data: Record<string, string | number | boolean | null | undefined>[];
  loading: boolean;
  loaded: boolean;
  error: string;
  statusFilter: "all" | "new" | "read" | "archived";
  setStatusFilter: (s: "all" | "new" | "read" | "archived") => void;
  updatingId: number | null;
  onUpdateStatus: (id: number, status: string) => void;
}) {
  const statusColor = (s: string) =>
    s === "new" ? "#2563eb" : s === "read" ? "#16a34a" : "#94a3b8";

  return (
    <section style={{ padding: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>
          Support Inbox
        </h2>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {(["new", "all", "read", "archived"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "20px",
                border: "1px solid var(--color-border)",
                background: statusFilter === f ? "#0F1F3D" : "transparent",
                color: statusFilter === f ? "#fff" : "var(--color-text-body)",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {loading && !loaded && (
        <p style={{ color: "var(--color-text-muted)" }}>Loading…</p>
      )}
      {loaded && data.length === 0 && (
        <p style={{ color: "var(--color-text-muted)" }}>No requests found.</p>
      )}
      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}
      >
        {data.map((item) => {
          const id = Number(item.id);
          const isUpdating = updatingId === id;
          return (
            <div
              key={id}
              style={{
                background: "var(--color-surface,#fff)",
                borderRadius: "12px",
                padding: "1.25rem 1.5rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                borderLeft: `4px solid ${statusColor(String(item.status))}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                  marginBottom: "0.5rem",
                }}
              >
                <div>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      color: "var(--color-text-heading)",
                    }}
                  >
                    {String(item.title)}
                  </span>
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      background: `${statusColor(String(item.status))}18`,
                      color: statusColor(String(item.status)),
                    }}
                  >
                    {String(item.status).toUpperCase()}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.created_at
                    ? new Date(String(item.created_at)).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )
                    : ""}
                </span>
              </div>
              <p
                style={{
                  margin: "0 0 0.625rem",
                  color: "var(--color-text-body)",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                }}
              >
                {String(item.details)}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {String(item.name || item.username || "Anonymous")}{" "}
                  {item.email ? `— ${String(item.email)}` : ""}
                  {item.locale ? ` · ${String(item.locale)}` : ""}
                </span>
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  {item.status !== "read" && (
                    <button
                      onClick={() => onUpdateStatus(id, "read")}
                      disabled={isUpdating}
                      style={{
                        padding: "0.25rem 0.625rem",
                        borderRadius: "6px",
                        border: "1px solid #86efac",
                        background: "transparent",
                        color: "#16a34a",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: isUpdating ? "not-allowed" : "pointer",
                      }}
                    >
                      Mark Read
                    </button>
                  )}
                  {item.status !== "archived" && (
                    <button
                      onClick={() => onUpdateStatus(id, "archived")}
                      disabled={isUpdating}
                      style={{
                        padding: "0.25rem 0.625rem",
                        borderRadius: "6px",
                        border: "1px solid var(--color-border)",
                        background: "transparent",
                        color: "var(--color-text-muted)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: isUpdating ? "not-allowed" : "pointer",
                      }}
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── User Profile Drilldown Component ────────────────────────────────────────
function UserProfileDrilldown({ data }: { data: Record<string, unknown> }) {
  const user = data.user as Record<string, unknown>;
  const invoices = (data.invoices ?? []) as Record<string, unknown>[];
  const transactions = (data.transactions ?? []) as Record<string, unknown>[];
  const auditHistory = (data.auditHistory ?? []) as Record<string, unknown>[];
  const fmtDate = (v: unknown) =>
    v
      ? new Date(String(v)).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* User info */}
      <div>
        <h3
          style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 800 }}
        >
          Account
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
            fontSize: "0.875rem",
          }}
        >
          {[
            ["Name", user.name],
            ["Username", `@${user.username}`],
            ["Email", user.email],
            ["Phone", user.phone],
            ["KYC", user.kyc_status],
            [
              "Balance",
              `${Number(user.wallet_balance || 0).toLocaleString()} XAF`,
            ],
            ["Joined", fmtDate(user.created_at)],
            [
              "Status",
              user.deleted_at
                ? "Deleted"
                : user.is_suspended
                  ? "Suspended"
                  : "Active",
            ],
          ].map(([k, v]) => (
            <div
              key={String(k)}
              style={{
                borderBottom: "1px solid var(--color-border,#e2e8f0)",
                paddingBottom: "0.375rem",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: "var(--color-text-muted)",
                  fontSize: "0.75rem",
                  display: "block",
                }}
              >
                {String(k ?? "")}
              </span>
              <span style={{ color: "var(--color-text-body)" }}>
                {String(v ?? "—")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent invoices */}
      {invoices.length > 0 && (
        <div>
          <h3
            style={{
              margin: "0 0 0.625rem",
              fontSize: "0.95rem",
              fontWeight: 800,
            }}
          >
            Recent Invoices
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Title", "Amount", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.375rem 0.5rem",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={String(inv.id)}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <td style={{ padding: "0.375rem 0.5rem" }}>
                    {String(inv.title ?? "—")}
                  </td>
                  <td style={{ padding: "0.375rem 0.5rem", fontWeight: 600 }}>
                    {Number(inv.amount || 0).toLocaleString()} XAF
                  </td>
                  <td style={{ padding: "0.375rem 0.5rem" }}>
                    {String(inv.status ?? "—")}
                  </td>
                  <td
                    style={{
                      padding: "0.375rem 0.5rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {fmtDate(inv.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent transactions */}
      {transactions.length > 0 && (
        <div>
          <h3
            style={{
              margin: "0 0 0.625rem",
              fontSize: "0.95rem",
              fontWeight: 800,
            }}
          >
            Recent Transactions
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Amount", "Type", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.375rem 0.5rem",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={String(tx.id)}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <td style={{ padding: "0.375rem 0.5rem", fontWeight: 600 }}>
                    {Number(tx.amount || 0).toLocaleString()} XAF
                  </td>
                  <td style={{ padding: "0.375rem 0.5rem" }}>
                    {String(tx.type ?? "—")}
                  </td>
                  <td style={{ padding: "0.375rem 0.5rem" }}>
                    {String(tx.status ?? "—")}
                  </td>
                  <td
                    style={{
                      padding: "0.375rem 0.5rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {fmtDate(tx.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin audit history */}
      {auditHistory.length > 0 && (
        <div>
          <h3
            style={{
              margin: "0 0 0.625rem",
              fontSize: "0.95rem",
              fontWeight: 800,
            }}
          >
            Admin Actions
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
            }}
          >
            {auditHistory.map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.375rem 0",
                  borderBottom: "1px solid var(--color-border)",
                  fontSize: "0.8rem",
                }}
              >
                <span style={{ fontWeight: 600, color: "#2563eb" }}>
                  {String(e.action ?? "").replace(/_/g, " ")}
                </span>
                {e.detail != null && (
                  <span
                    style={{
                      color: "var(--color-text-muted)",
                      textAlign: "right",
                      maxWidth: "55%",
                    }}
                  >
                    {String(e.detail)}
                  </span>
                )}
                <span
                  style={{
                    color: "var(--color-text-muted)",
                    whiteSpace: "nowrap",
                    marginLeft: "0.5rem",
                  }}
                >
                  {fmtDate(e.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
