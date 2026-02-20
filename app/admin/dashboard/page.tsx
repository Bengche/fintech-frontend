"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

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
  | "stuck";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "invoices", label: "Invoices" },
  { key: "payments", label: "Payments" },
  { key: "payouts", label: "Payouts" },
  { key: "stuck", label: "Pending Releases" },
  { key: "disputes", label: "Disputes" },
  { key: "referrals", label: "Referrals" },
  { key: "messages", label: "Messages" },
];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();

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
      };

      if (!config[tab]) return;
      const { setter, endpoint } = config[tab];
      const nextPage = append ? currentPage + 1 : 1;

      // No inline type annotation on prev — TypeScript infers it from the useState type
      setter((prev) => ({ ...prev, loading: true, error: "" }));

      try {
        const res = await axios.get(
          `${API_URL}/admin/${endpoint}?page=${nextPage}&limit=${ITEMS_PER_PAGE}`,
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
            : "Failed to load data.";
        setter((prev) => ({ ...prev, loading: false, error: msg }));
      }
    },
    [],
  );

  // ── 4. Load data when switching tabs (only if not already loaded) ────────────
  useEffect(() => {
    if (!authed || activeTab === "overview") return;
    const tabState = {
      users,
      invoices,
      payments,
      payouts,
      stuck,
      disputes,
      referrals,
      messages: broadcasts,
    }[activeTab];
    if (!tabState?.loaded) {
      loadTab(activeTab, false, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authed]);

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
      setMsgError("Subject is required.");
      return;
    }
    if (!msgBody.trim()) {
      setMsgError("Message body is required.");
      return;
    }
    if (msgRecipientType === "user" && !msgSelectedUser) {
      setMsgError("Please search for and select a recipient.");
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
          : "Failed to send message. Please try again.";
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
          Verifying session…
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
              Fonlok Admin
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.75rem", margin: 0 }}>
              Platform management
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
          Sign out
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
          {TABS.map((t) => (
            <li key={t.key}>
              <button
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: "0.875rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  borderBottom:
                    activeTab === t.key
                      ? "2px solid var(--color-primary)"
                      : "2px solid transparent",
                  color:
                    activeTab === t.key
                      ? "var(--color-primary)"
                      : "var(--color-text-muted)",
                  background: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}
              >
                {t.label}
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
              Platform Overview
            </h2>

            {statsLoading ? (
              <p style={{ color: "var(--color-text-muted)" }}>Loading stats…</p>
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
                    label="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    color="blue"
                    icon="👤"
                  />
                  <StatCard
                    label="Total Invoices"
                    value={stats.totalInvoices.toLocaleString()}
                    color="indigo"
                    icon="🧾"
                  />
                  <StatCard
                    label="Payments Processed"
                    value={stats.totalPaymentsCount.toLocaleString()}
                    color="teal"
                    icon="💳"
                  />
                  <StatCard
                    label="Payouts Made"
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
                    label="Total Volume Processed"
                    value={fmtXAF(stats.totalAmountProcessed)}
                    color="green"
                    icon="💰"
                    large
                  />
                  <StatCard
                    label="Platform Revenue (2% fees)"
                    value={fmtXAF(stats.platformRevenue)}
                    color="emerald"
                    icon="📈"
                    large
                  />
                  <StatCard
                    label="Referral Commissions Paid"
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
                    label="Open Disputes"
                    value={stats.openDisputes.toLocaleString()}
                    color={stats.openDisputes > 0 ? "red" : "gray"}
                    icon="⚠️"
                  />
                  <StatCard
                    label="Resolved Disputes"
                    value={stats.resolvedDisputes.toLocaleString()}
                    color="blue"
                    icon="✅"
                  />
                  <StatCard
                    label="Active Referrers"
                    value={stats.activeReferrers.toLocaleString()}
                    color="violet"
                    icon="🔗"
                  />
                </div>
              </>
            ) : (
              <p style={{ color: "var(--color-text-muted)" }}>
                Could not load stats.
              </p>
            )}
          </section>
        )}

        {/* ────────────────────── USERS TAB ─────────────────────────────────── */}
        {activeTab === "users" && (
          <TabSection
            title="Registered Users"
            state={users}
            onLoadMore={() => loadTab("users", true, users.page)}
            emptyMessage="No users found."
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
                  <Th>Name</Th>
                  <Th>Username</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>Country</Th>
                  <Th>Invoices</Th>
                  <Th>Referral Code</Th>
                  <Th>Joined</Th>
                </tr>
              </thead>
              <tbody>
                {users.data.map((u) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </TabSection>
        )}

        {/* ────────────────────── INVOICES TAB ──────────────────────────────── */}
        {activeTab === "invoices" && (
          <TabSection
            title="All Invoices"
            state={invoices}
            onLoadMore={() => loadTab("invoices", true, invoices.page)}
            emptyMessage="No invoices found."
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
                  <Th>Invoice #</Th>
                  <Th>Name</Th>
                  <Th>Seller</Th>
                  <Th>Buyer Email</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th>Expires</Th>
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
            title="Buyer Payments"
            state={payments}
            onLoadMore={() => loadTab("payments", true, payments.page)}
            emptyMessage="No payments found."
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
                  <Th>Invoice</Th>
                  <Th>Invoice Name</Th>
                  <Th>Seller</Th>
                  <Th>Amount</Th>
                  <Th>Method</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
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
                    <Td>{p.method ?? "Mobile Money"}</Td>
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
            title="Seller Payouts"
            state={payouts}
            onLoadMore={() => loadTab("payouts", true, payouts.page)}
            emptyMessage="No payouts found."
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
                  <Th>#</Th>
                  <Th>Invoice</Th>
                  <Th>Seller</Th>
                  <Th>Phone</Th>
                  <Th>Amount</Th>
                  <Th>Method</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
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
            title="Pending Releases"
            state={stuck}
            onLoadMore={() => loadTab("stuck", true, stuck.page)}
            emptyMessage="No pending invoices — all funds have been released."
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
                  <Th>Invoice #</Th>
                  <Th>Invoice Name</Th>
                  <Th>Seller</Th>
                  <Th>Buyer Email</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Paid At</Th>
                  <Th>Delivered At</Th>
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
            title="Disputes"
            state={disputes}
            onLoadMore={() => loadTab("disputes", true, disputes.page)}
            emptyMessage="No disputes found."
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
                  <Th>Invoice #</Th>
                  <Th>Invoice Name</Th>
                  <Th>Seller</Th>
                  <Th>Amount</Th>
                  <Th>Opened By</Th>
                  <Th>Reason</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                  <Th>Action</Th>
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
                        Moderate
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
              Send Message
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
                  Recipients
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
                        ? "Broadcast to all users"
                        : "Send to a specific user"}
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
                    Recipient
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
                        title="Remove"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Search by name, username, or email…"
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
                              Searching…
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
                                No users found.
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
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Email subject line…"
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
                  Message
                </label>
                <textarea
                  rows={7}
                  placeholder="Write your message here. Each new line becomes a new paragraph in the email."
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
                    ? "Sending…"
                    : msgRecipientType === "all"
                      ? "📢 Broadcast to all users"
                      : "📩 Send message"}
                </button>
                {msgRecipientType === "all" && (
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-text-muted)",
                      margin: 0,
                    }}
                  >
                    This will send an email to every registered user.
                  </p>
                )}
              </div>
            </div>

            {/* ─── Sent message history ────────────────────────────────────── */}
            <TabSection
              title="Message History"
              state={broadcasts}
              onLoadMore={() => loadTab("messages", true, broadcasts.page)}
              emptyMessage="No messages have been sent yet."
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
                    <Th>Type</Th>
                    <Th>Recipient</Th>
                    <Th>Subject</Th>
                    <Th>Delivered to</Th>
                    <Th>Sent</Th>
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
                          {b.recipient_type === "all" ? "Broadcast" : "Direct"}
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
                            All users
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
                            {b.recipients_count} users
                          </span>
                        ) : (
                          "1 user"
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
            title="Active Referrers"
            state={referrals}
            onLoadMore={() => loadTab("referrals", true, referrals.page)}
            emptyMessage="No users have made referrals yet."
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
                  <Th>Name</Th>
                  <Th>Username</Th>
                  <Th>Email</Th>
                  <Th>Referral Code</Th>
                  <Th>People Referred</Th>
                  <Th>Total Earned</Th>
                  <Th>Current Balance</Th>
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
                          ? "person"
                          : "people"}
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
      </main>
    </div>
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
            Showing {state.data.length} record
            {state.data.length !== 1 ? "s" : ""}
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
          Loading\u2026
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
            {state.loading ? "Loading\u2026" : "Load more"}
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
