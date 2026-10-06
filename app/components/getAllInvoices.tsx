"use client";
import Axios from "axios";
import { useAuth } from "@/context/UserContext";
import { QRCodeSVG } from "qrcode.react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
import { useState, useEffect, useCallback } from "react";
import DeleteInvoice from "../components/deleteInvoice";
import EditInvoice from "./editInvoice";
import MarkDelivered from "./markDelivered";
import DisputeButton from "./DisputeButton";
import Link from "next/link";
import {
  MessageSquare,
  Copy,
  Check,
  QrCode,
  ChevronDown,
  FileText,
  Search,
  ExternalLink,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { haptic } from "@/hooks/useHaptic";
Axios.defaults.withCredentials = true;

interface Invoice {
  id: number;
  invoicenumber: string;
  invoicename: string;
  amount: number;
  currency: string;
  status: string;
  buyeremail: string;
  paymentlink: string;
  invoicelink: string;
  createdat: string;
  expires_at?: string | null;
  payment_type?: string;
  [key: string]: unknown;
}

type GetAllProps = {
  link: string;
  hideHeader?: boolean;
  onRegisterRefresh?: (fn: () => void) => void;
};

const STATUS_TABS = ["all", "pending", "paid", "delivered", "expired"] as const;

function getStatusConfig(status: string): {
  pill: string;
  dotBg: string;
  iconBg: string;
  label: string;
} {
  const map: Record<
    string,
    { pill: string; dotBg: string; iconBg: string; label: string }
  > = {
    pending: {
      pill: "bg-amber-50 text-amber-700 border border-amber-200",
      dotBg: "bg-amber-400",
      iconBg: "bg-amber-50",
      label: "Pending",
    },
    paid: {
      pill: "bg-blue-50 text-blue-700 border border-blue-200",
      dotBg: "bg-blue-500",
      iconBg: "bg-blue-50",
      label: "Paid",
    },
    partially_paid: {
      pill: "bg-sky-50 text-sky-700 border border-sky-200",
      dotBg: "bg-sky-500",
      iconBg: "bg-sky-50",
      label: "Partially paid",
    },
    delivered: {
      pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      dotBg: "bg-emerald-500",
      iconBg: "bg-emerald-50",
      label: "Delivered",
    },
    completed: {
      pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      dotBg: "bg-emerald-500",
      iconBg: "bg-emerald-50",
      label: "Completed",
    },
    expired: {
      pill: "bg-slate-100 text-slate-500 border border-slate-200",
      dotBg: "bg-slate-400",
      iconBg: "bg-slate-100",
      label: "Expired",
    },
    disputed: {
      pill: "bg-rose-50 text-rose-700 border border-rose-200",
      dotBg: "bg-rose-500",
      iconBg: "bg-rose-50",
      label: "Disputed",
    },
  };
  return map[status] ?? map.expired;
}

function canDeleteInvoice(invoice: Invoice): boolean {
  return invoice.status === "pending" || invoice.status === "expired";
}

export default function GetAllInvoices({
  hideHeader = false,
  onRegisterRefresh,
}: GetAllProps) {
  const t = useTranslations("Invoice");

  function getDeleteBlockReason(invoice: Invoice): string | undefined {
    if (invoice.status === "paid" || invoice.status === "partially_paid")
      return t("delete.reasonPaid");
    if (invoice.status === "delivered") return t("delete.reasonDelivered");
    if (invoice.status === "completed") return t("delete.reasonCompleted");
    return undefined;
  }

  function getEditBlockReason(invoice: Invoice): string | undefined {
    if (invoice.status === "paid" || invoice.status === "partially_paid")
      return t("edit.reasonPaid");
    if (invoice.status === "delivered") return t("edit.reasonDelivered");
    if (invoice.status === "completed") return t("edit.reasonCompleted");
    return undefined;
  }

  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showQRId, setShowQRId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [visible, setVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user_id } = useAuth();

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const getAllInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = `${API}/invoice/all/${user_id}`;
      const response = await Axios.get(endpoint);
      const data = response.data.invoices;
      setInvoices(data && data.length > 0 ? data : null);
    } catch {
      setInvoices(null);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [user_id]);

  useEffect(() => {
    if (onRegisterRefresh) onRegisterRefresh(getAllInvoices);
  }, [onRegisterRefresh, getAllInvoices]);

  useEffect(() => {
    if (user_id) getAllInvoices();
  }, [user_id, getAllInvoices]);

  const handleCopy = async (id: number, copyLink: string) => {
    haptic("soft");
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(copyLink);
      } else {
        const ta = document.createElement("textarea");
        ta.value = copyLink;
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err: unknown) {
      console.log(err instanceof Error ? err.message : err);
    }
  };

  const filtered = invoices
    ? invoices.filter((inv) => {
        const matchesStatus =
          statusFilter === "all" || inv.status === statusFilter;
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          inv.invoicename.toLowerCase().includes(q) ||
          inv.invoicenumber.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      })
    : [];

  return (
    <div>
      {!hideHeader && (
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <h2 className="text-lg font-bold text-slate-900 m-0">
            {t("list.title")}
          </h2>
          <div className="flex gap-2 flex-wrap">
            <button
              className="btn-primary"
              onClick={() => {
                haptic("soft");
                getAllInvoices();
              }}
              disabled={loading}
            >
              {loading ? t("list.loading") : t("list.refresh")}
            </button>
            {invoices && (
              <button
                className="btn-ghost text-sm"
                onClick={() => setVisible((v) => !v)}
              >
                {visible ? "Hide" : "Show"}
              </button>
            )}
          </div>
        </div>
      )}

      {invoices && invoices.length > 0 && visible && (
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by name or invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10 transition-all"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    haptic("soft");
                    setStatusFilter(tab);
                  }}
                  className={[
                    "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border",
                    isActive
                      ? "bg-[#0f1f3d] text-white border-[#0f1f3d] shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700",
                  ].join(" ")}
                >
                  {tab === "all"
                    ? t("list.statusAll")
                    : t(
                        `list.status${tab.charAt(0).toUpperCase()}${tab.slice(1)}` as Parameters<
                          typeof t
                        >[0],
                      )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!loaded && (
        <div className="space-y-2.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[68px] rounded-2xl border border-slate-100 bg-white shadow-sm animate-pulse"
            />
          ))}
        </div>
      )}

      {invoices === null && loaded && !loading && visible && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <FileText size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">
            {t("list.empty")}
          </p>
          <p className="text-xs text-slate-400 text-center max-w-xs">
            Create your first invoice to start receiving secure payments.
          </p>
        </div>
      )}

      {filtered.length === 0 && invoices !== null && !loading && visible && (
        <div className="flex flex-col items-center py-10 text-slate-400">
          <Search size={20} className="mb-2 text-slate-300" />
          <p className="text-sm">{t("list.noMatch")}</p>
        </div>
      )}

      {visible && (
        <div className="space-y-2.5">
          {filtered.map((invoice) => {
            const isExpanded = expandedIds.has(invoice.id);
            const invoiceUrl = `${FRONTEND_URL}/pay/${invoice.invoicenumber}`;
            const sc = getStatusConfig(invoice.status);
            const createdStr = new Date(invoice.createdat).toLocaleDateString(
              "en-GB",
              { day: "2-digit", month: "short", year: "numeric" },
            );
            const expiresStr = invoice.expires_at
              ? new Date(invoice.expires_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : null;
            const isMilestone = invoice.payment_type === "installment";
            const hasActions =
              invoice.status === "paid" ||
              invoice.status === "delivered" ||
              invoice.status === "completed";

            return (
              <div
                key={invoice.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md"
              >
                {/* Collapsed summary row */}
                <button
                  onClick={() => {
                    haptic("soft");
                    toggleExpand(invoice.id);
                  }}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center gap-3 sm:gap-4 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-slate-50/60"
                >
                  {/* Status icon */}
                  <span
                    className={[
                      "shrink-0 w-9 h-9 rounded-xl hidden sm:flex items-center justify-center",
                      sc.iconBg,
                    ].join(" ")}
                  >
                    <span
                      className={["w-2.5 h-2.5 rounded-full", sc.dotBg].join(
                        " ",
                      )}
                    />
                  </span>

                  {/* Name + ref */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
                      {invoice.invoicename}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono">
                        #{invoice.invoicenumber}
                      </span>
                      <span className="text-slate-200">·</span>
                      <span>{createdStr}</span>
                      {expiresStr && (
                        <>
                          <span className="text-slate-200">·</span>
                          <span>Expires {expiresStr}</span>
                        </>
                      )}
                      {isMilestone && (
                        <>
                          <span className="text-slate-200">·</span>
                          <span className="text-[0.63rem] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Milestone
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Amount + badge + chevron */}
                  <div className="shrink-0 flex items-center gap-2 sm:gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 leading-tight tabular-nums">
                        {Number(invoice.amount).toLocaleString()}{" "}
                        <span className="text-[11px] font-medium text-slate-500">
                          {invoice.currency}
                        </span>
                      </p>
                      <span
                        className={[
                          "inline-block mt-1 text-[0.63rem] font-semibold px-2 py-0.5 rounded-full",
                          sc.pill,
                        ].join(" ")}
                      >
                        {sc.label}
                      </span>
                    </div>
                    <span
                      className={[
                        "text-slate-400 transition-transform duration-200",
                        isExpanded ? "rotate-180" : "",
                      ].join(" ")}
                    >
                      <ChevronDown size={16} strokeWidth={2} />
                    </span>
                  </div>
                </button>

                {/* Expanded details panel */}
                {isExpanded && (
                  <div className="px-4 pt-4 pb-5 space-y-4 border-t border-slate-100">
                    {/* Payment link */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Payment Link
                      </p>
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex-wrap">
                        <span className="flex-1 text-[11px] text-slate-500 font-mono break-all min-w-0">
                          {invoiceUrl}
                        </span>
                        <button
                          onClick={() => handleCopy(invoice.id, invoiceUrl)}
                          className={[
                            "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                            copiedId === invoice.id
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300",
                          ].join(" ")}
                        >
                          {copiedId === invoice.id ? (
                            <>
                              <Check size={12} /> {t("list.copied")}
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> {t("list.copyLink")}
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Share */}
                    <div className="flex gap-2 flex-wrap items-center">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Pay me for "${invoice.invoicename}" on Fonlok 👉 ${invoiceUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white no-underline hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: "#25D366" }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="13"
                          height="13"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        {t("list.whatsapp")}
                      </a>
                      <button
                        onClick={() =>
                          setShowQRId(
                            showQRId === invoice.id ? null : invoice.id,
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <QrCode size={13} />
                        {showQRId === invoice.id
                          ? t("list.hideQR")
                          : t("list.showQR")}
                      </button>
                      <Link
                        href={`/pay/${invoice.invoicenumber}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors no-underline"
                      >
                        <ExternalLink size={13} />
                        View invoice
                      </Link>
                    </div>

                    {/* QR Code */}
                    {showQRId === invoice.id && (
                      <div className="flex flex-col items-center gap-3 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <QRCodeSVG value={invoiceUrl} size={130} />
                        </div>
                        <p className="text-xs text-slate-400 text-center max-w-[200px]">
                          {t("list.qrHint")}
                        </p>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-slate-100" />

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap items-center">
                      <EditInvoice
                        invoice_number={invoice.invoicenumber}
                        onEdit={getAllInvoices}
                        canEdit={canDeleteInvoice(invoice)}
                        editBlockReason={getEditBlockReason(invoice)}
                      />
                      <DeleteInvoice
                        invoice_id={invoice.id}
                        onDelete={getAllInvoices}
                        canDelete={canDeleteInvoice(invoice)}
                        deleteBlockReason={getDeleteBlockReason(invoice)}
                      />
                      {invoice.status === "paid" && !isMilestone && (
                        <MarkDelivered
                          invoice_id={invoice.id}
                          onDelivered={getAllInvoices}
                        />
                      )}
                    </div>

                    {/* Milestone strip */}
                    {invoice.status === "paid" && isMilestone && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                        <p className="text-sm font-bold text-amber-800 mb-1">
                          {t("list.milestoneActionTitle")}
                        </p>
                        <p className="text-xs text-amber-700 leading-relaxed mb-3">
                          {t("list.milestoneActionBody")}
                        </p>
                        <Link
                          href={`/invoice/${invoice.invoicenumber}#milestones`}
                          className="inline-block px-4 py-2 rounded-xl bg-amber-500 text-xs font-bold no-underline hover:bg-amber-600 transition-colors"
                          style={{ color: "#ffffff" }}
                        >
                          {t("list.manageMilestones")}
                        </Link>
                      </div>
                    )}

                    {/* Chat & Dispute */}
                    {hasActions && (
                      <div className="flex gap-2 flex-wrap pt-1 border-t border-slate-100">
                        <Link
                          href={`/dashboard/chat/${invoice.invoicenumber}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f1f3d] text-xs font-semibold no-underline hover:bg-[#162d5a] transition-colors"
                          style={{ color: "#ffffff" }}
                        >
                          <MessageSquare size={13} />
                          Chat with Buyer
                        </Link>
                        <DisputeButton
                          invoice_number={invoice.invoicenumber}
                          sender_type="seller"
                          paymentType={invoice.payment_type}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
