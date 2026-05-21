"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Axios from "axios";
import { useTranslations } from "next-intl";
import { useAuth } from "../../../context/UserContext";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type ReviewType = "positive" | "negative" | null;

export default function ReviewPage() {
  const { username, invoice_number } = useParams<{
    username: string;
    invoice_number: string;
  }>();
  const router = useRouter();
  const t = useTranslations("Review");
  const { user_id, authLoading } = useAuth();

  const [reviewType, setReviewType] = useState<ReviewType>(null);
  const [comment, setComment] = useState("");
  const [showInvoiceName, setShowInvoiceName] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [notEligible, setNotEligible] = useState(false);
  const [error, setError] = useState("");

  // Redirect to login if not authenticated once auth check completes
  useEffect(() => {
    if (!authLoading && user_id === null) {
      router.replace(
        `/login?redirect=${encodeURIComponent(`/review/${username}/${invoice_number}`)}`,
      );
    }
  }, [authLoading, user_id, router, username, invoice_number]);

  const handleSubmit = async () => {
    if (!reviewType) {
      setError(t("choiceRequired"));
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await Axios.post(
        `${API}/profile/review`,
        {
          seller_username: username,
          invoice_number,
          rating: reviewType === "positive" ? 5 : 1,
          comment: comment.trim() || undefined,
          show_invoice_name: showInvoiceName,
        },
        { withCredentials: true },
      );
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = e.response?.status;
      if (status === 409) {
        setAlreadyReviewed(true);
      } else if (status === 403) {
        setNotEligible(true);
      } else {
        setError(
          e.response?.data?.message ?? t("loadError"),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — will redirect
  if (!user_id) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/profile/${username}`}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t("backToProfile")}
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{t("pageTitle")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
        </div>

        {/* Invoice + seller info strip */}
        <div className="mb-5 px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
          <span>
            <span className="font-semibold text-slate-800">{t("sellerLabel")}:</span>{" "}
            @{username}
          </span>
          <span className="hidden sm:block text-slate-300">|</span>
          <span>
            <span className="font-semibold text-slate-800">{t("invoiceLabel")}:</span>{" "}
            {invoice_number}
          </span>
        </div>

        {/* Success state */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="font-bold text-green-800 text-lg">{t("success")}</h2>
            <p className="text-sm text-green-700 mt-1">{t("successBody")}</p>
            <Link
              href={`/profile/${username}`}
              className="mt-4 inline-block text-sm font-semibold text-green-700 underline"
            >
              {t("backToProfile")}
            </Link>
          </div>
        )}

        {/* Already reviewed */}
        {!success && alreadyReviewed && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <p className="font-semibold text-amber-800">{t("alreadyReviewed")}</p>
            <Link
              href={`/profile/${username}`}
              className="mt-3 inline-block text-sm font-semibold text-amber-700 underline"
            >
              {t("backToProfile")}
            </Link>
          </div>
        )}

        {/* Not eligible */}
        {!success && !alreadyReviewed && notEligible && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="font-semibold text-red-800">{t("notEligible")}</p>
            <Link
              href={`/profile/${username}`}
              className="mt-3 inline-block text-sm font-semibold text-red-700 underline"
            >
              {t("backToProfile")}
            </Link>
          </div>
        )}

        {/* Review form */}
        {!success && !alreadyReviewed && !notEligible && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Positive / Negative selector */}
            <div className="p-5 border-b border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewType("positive")}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-lg border-2 transition-all ${
                    reviewType === "positive"
                      ? "border-green-500 bg-green-50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-2xl">👍</span>
                  <span
                    className={`font-semibold text-sm ${
                      reviewType === "positive"
                        ? "text-green-700"
                        : "text-slate-700"
                    }`}
                  >
                    {t("positiveChoice")}
                  </span>
                  <span className="text-xs text-slate-400 text-center leading-tight">
                    {t("positiveHint")}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewType("negative")}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-lg border-2 transition-all ${
                    reviewType === "negative"
                      ? "border-red-500 bg-red-50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-2xl">👎</span>
                  <span
                    className={`font-semibold text-sm ${
                      reviewType === "negative"
                        ? "text-red-700"
                        : "text-slate-700"
                    }`}
                  >
                    {t("negativeChoice")}
                  </span>
                  <span className="text-xs text-slate-400 text-center leading-tight">
                    {t("negativeHint")}
                  </span>
                </button>
              </div>
            </div>

            {/* Comment */}
            <div className="p-5 border-b border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t("commentLabel")}
              </label>
              <textarea
                value={comment}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) setComment(e.target.value);
                }}
                placeholder={t("commentPlaceholder")}
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none text-slate-800 placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">
                {t("commentMax", { count: comment.length })}
              </p>
            </div>

            {/* Show invoice name toggle */}
            <div className="p-5 border-b border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showInvoiceName}
                    onChange={(e) => setShowInvoiceName(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-6 rounded-full transition-colors ${
                      showInvoiceName ? "bg-slate-800" : "bg-slate-300"
                    }`}
                  />
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      showInvoiceName ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </div>
                <span className="text-sm text-slate-700">
                  {t("showInvoiceNameLabel")}
                </span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="px-5 py-3 bg-red-50 border-b border-red-100">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <div className="p-5">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-semibold text-sm rounded-lg disabled:opacity-60 transition-colors"
              >
                {submitting ? t("submitting") : t("submit")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
