"use client";
import React, { useState } from "react";
import Axios from "axios";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "next-intl";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

interface FilteredInvoice {
  invoicenumber: string;
  invoicename: string;
  amount: number;
  currency: string;
  status: string;
  [key: string]: unknown;
}

function getStatusPill(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    paid: "bg-blue-50 text-blue-700 border border-blue-200",
    partially_paid: "bg-sky-50 text-sky-700 border border-sky-200",
    delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    expired: "bg-slate-100 text-slate-500 border border-slate-200",
  };
  return map[status] ?? map.expired;
}

export default function FilterInvoice() {
  const { user_id } = useAuth();
  const t = useTranslations("Invoice");
  const [formData, setFormData] = useState({ amount: "", currency: "XAF" });
  const [invoices, setInvoices] = useState<FilteredInvoice[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFilter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await Axios.get(
        `${API}/invoice/filter/${user_id}?amount=${formData.amount}&currency=${formData.currency || "XAF"}`,
      );
      setInvoices(response.data.invoice || []);
      setSearched(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || t("filter.errorDefault"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-3">
      <div className="space-y-4">
        <form onSubmit={handleFilter} className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[2fr_1fr]">
            <div>
              <label
                className="block text-xs font-semibold text-slate-500 mb-1.5"
                htmlFor="filter-amount"
              >
                {t("filter.amountLabel")}
              </label>
              <input
                id="filter-amount"
                name="amount"
                type="number"
                inputMode="numeric"
                min={0}
                required
                placeholder="e.g. 50000"
                onChange={handleChange}
                value={formData.amount}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10 transition-all"
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold text-slate-500 mb-1.5"
                htmlFor="filter-currency"
              >
                {t("filter.currencyLabel")}
              </label>
              <select
                id="filter-currency"
                name="currency"
                onChange={handleChange}
                value={formData.currency}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10 transition-all"
              >
                <option value="XAF">XAF</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-[#0f1f3d] text-white text-xs font-semibold hover:bg-[#162d5a] transition-colors disabled:opacity-60"
          >
            {loading ? t("filter.filtering") : t("filter.applyFilter")}
          </button>
        </form>

        {invoices.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {invoices.length} result{invoices.length !== 1 ? "s" : ""}
            </p>
            {invoices.map((inv) => (
              <div
                key={String(
                  (inv as { id?: unknown }).id ?? inv.invoicenumber,
                )}
                className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 flex-wrap"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {inv.invoicename}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    #{inv.invoicenumber}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {Number(inv.amount).toLocaleString()}{" "}
                    <span className="text-xs font-medium text-slate-500">
                      {inv.currency}
                    </span>
                  </span>
                  <span
                    className={[
                      "text-[0.63rem] font-semibold px-2 py-0.5 rounded-full",
                      getStatusPill(inv.status),
                    ].join(" ")}
                  >
                    {inv.status.charAt(0).toUpperCase() +
                      inv.status.slice(1).replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {searched && invoices.length === 0 && !loading && (
          <p className="text-xs text-slate-400">{t("filter.noResults")}</p>
        )}
      </div>
    </div>
  );
}
