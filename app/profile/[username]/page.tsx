"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Axios from "axios";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  Send,
  Share2,
  ShieldAlert,
  Star,
  Pin,
  MessageSquare,
  Lock,
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  Tag,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "@/context/UserContext";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const REVIEWS_INITIAL = 5;

type VerifiedBadges = { id: boolean; phone: boolean; email: boolean };

type Seller = {
  id: number;
  name: string;
  username: string;
  country: string;
  profilepicture: string;
  createdat: string;
  phone?: string;
  kyc_status?: string;
  bio?: string;
  tags?: string[];
};

type Review = {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name: string;
  reviewer_userid?: number;
  pinned?: boolean;
  seller_reply?: string;
  reply_created_at?: string;
  show_invoice_name?: boolean;
  invoice_name?: string;
  invoice_amount?: number;
  invoice_currency?: string;
};

export default function SellerProfilePage() {
  const { username } = useParams<{ username: string }>();
  const t = useTranslations("Profile");
  const { username: authUsername } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [verifiedBadges, setVerifiedBadges] = useState<VerifiedBadges>({
    id: false,
    phone: false,
    email: false,
  });
  const [averageRating, setAverageRating] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalSecured, setTotalSecured] = useState(0);
  const [disputeCount, setDisputeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [requestName, setRequestName] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState("");
  const [requestError, setRequestError] = useState("");

  const [showAllReviews, setShowAllReviews] = useState(false);
  const [replyDraft, setReplyDraft] = useState<Record<number, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<number, boolean>>({});
  const [replySubmitting, setReplySubmitting] = useState<
    Record<number, boolean>
  >({});
  const [replyFeedback, setReplyFeedback] = useState<Record<number, string>>(
    {},
  );
  const [pinLoading, setPinLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await Axios.get(`${API}/profile/${username}`);
        setSeller(response.data.seller);
        setReviews(response.data.reviews);
        setAverageRating(response.data.averageRating);
        setCompletedCount(response.data.completedCount);
        setTotalSecured(response.data.totalSecured || 0);
        setDisputeCount(response.data.disputeCount || 0);
        if (response.data.verifiedBadges) {
          setVerifiedBadges(response.data.verifiedBadges);
        }
      } catch (err: unknown) {
        setError(
          (err as { response?: { status?: number } })?.response?.status === 404
            ? t("notFound")
            : t("loadError"),
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username, t]);

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: `${seller?.name || "Seller"} - Fonlok`,
          text: t("shareText"),
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* cancelled */
    }
  };

  const submitDealRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");
    setRequestSuccess("");
    setRequestLoading(true);
    try {
      await Axios.post(
        `${API}/profile/deal-request`,
        {
          seller_username: username,
          sender_name: requestName,
          sender_email: requestEmail,
          message: requestMessage,
        },
        { withCredentials: true },
      );
      setRequestSuccess(t("dealRequestSuccess"));
      setRequestName("");
      setRequestEmail("");
      setRequestMessage("");
    } catch (err: unknown) {
      setRequestError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("dealRequestError"),
      );
    } finally {
      setRequestLoading(false);
    }
  };

  const togglePin = async (reviewId: number, currentlyPinned: boolean) => {
    setPinLoading((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await Axios.patch(
        `${API}/profile/review/${reviewId}/pin`,
        {},
        { withCredentials: true },
      );
      setReviews((prev) =>
        prev
          .map((r) =>
            r.id === reviewId ? { ...r, pinned: !currentlyPinned } : r,
          )
          .sort(
            (a, b) =>
              (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
              new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
          ),
      );
    } catch {
      /* silent */
    } finally {
      setPinLoading((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const submitReply = async (reviewId: number) => {
    const text = (replyDraft[reviewId] || "").trim();
    if (!text) return;
    setReplySubmitting((prev) => ({ ...prev, [reviewId]: true }));
    setReplyFeedback((prev) => ({ ...prev, [reviewId]: "" }));
    try {
      await Axios.patch(
        `${API}/profile/review/${reviewId}/reply`,
        { seller_reply: text },
        { withCredentials: true },
      );
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                seller_reply: text,
                reply_created_at: new Date().toISOString(),
              }
            : r,
        ),
      );
      setReplyOpen((prev) => ({ ...prev, [reviewId]: false }));
      setReplyFeedback((prev) => ({ ...prev, [reviewId]: t("replySuccess") }));
    } catch {
      setReplyFeedback((prev) => ({ ...prev, [reviewId]: t("replyError") }));
    } finally {
      setReplySubmitting((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const renderStars = (rating: number, size = 13) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-slate-300"
          }
        />
      ))}
    </div>
  );

  const disputeRate =
    completedCount >= 5
      ? Math.round((disputeCount / completedCount) * 100)
      : null;
  const successRate =
    completedCount > 0
      ? Math.round(((completedCount - disputeCount) / completedCount) * 100)
      : null;
  const visibleReviews = showAllReviews
    ? reviews
    : reviews.slice(0, REVIEWS_INITIAL);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#0f1f3d] border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">{t("loading")}</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={22} className="text-red-500" />
          </div>
          <p className="text-slate-700 font-medium">{error}</p>
        </div>
      </div>
    );

  if (!seller) return null;

  const isOwnProfile = Boolean(
    authUsername && authUsername === seller.username,
  );
  const needsKycAction = isOwnProfile && seller.kyc_status !== "approved";

  const kycPanelTitle =
    seller.kyc_status === "pending"
      ? t("kycPromptPendingTitle")
      : seller.kyc_status === "rejected"
        ? t("kycPromptRejectedTitle")
        : t("kycPromptTitle");
  const kycPanelBody =
    seller.kyc_status === "pending"
      ? t("kycPromptPendingBody")
      : seller.kyc_status === "rejected"
        ? t("kycPromptRejectedBody")
        : t("kycPromptBody");
  const kycButtonLabel =
    seller.kyc_status === "pending"
      ? t("kycViewStatus")
      : seller.kyc_status === "rejected"
        ? t("kycResubmit")
        : t("kycGetVerified");
  const kycAccent = seller.kyc_status === "rejected" ? "red" : "amber";

  const avatarSrc = seller.profilepicture
    ? seller.profilepicture.startsWith("http")
      ? seller.profilepicture
      : `${API}/uploads/${seller.profilepicture}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-16 space-y-4">
        {/* -- Guest escrow strip ----------------------------------------- */}
        {!authUsername && (
          <div className="rounded-2xl bg-gradient-to-r from-[#0f1f3d]/5 to-amber-50 border border-amber-200/60 px-4 py-3">
            <p className="text-xs font-bold text-[#0f1f3d] uppercase tracking-wider mb-0.5">
              {t("escrowStripTitle")}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t("escrowStripBody")}
            </p>
          </div>
        )}

        {/* -- Hero card ---------------------------------------------------- */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Navy gradient banner */}
          <div className="h-24 bg-gradient-to-br from-[#0f1f3d] via-[#162d5a] to-[#1e3a7a] relative">
            <button
              onClick={handleShare}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors backdrop-blur-sm border border-white/10"
            >
              {copied ? <CheckCheck size={13} /> : <Share2 size={13} />}
              <span>{copied ? t("linkCopied") : t("shareProfile")}</span>
            </button>
            <span className="absolute top-3 left-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
              {t("publicProfile")}
            </span>
          </div>

          <div className="px-5 pb-5">
            {/* Avatar � overlaps banner */}
            <div className="-mt-10 mb-3">
              <div className="relative inline-block">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc}
                    alt={seller.name}
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0f1f3d] to-[#1e3a7a] ring-4 ring-white shadow-md flex items-center justify-center text-white text-3xl font-extrabold">
                    {seller.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {seller.kyc_status === "approved" && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center">
                    <BadgeCheck size={11} className="text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Name + username */}
            <div className="mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {seller.name}
                </h1>
                {seller.kyc_status === "approved" && (
                  <BadgeCheck size={18} className="text-emerald-500 shrink-0" />
                )}
              </div>
              <p className="text-sm text-slate-400 font-medium">
                @{seller.username}
              </p>
            </div>

            {seller.bio && (
              <p className="text-sm text-slate-600 leading-relaxed mb-3 max-w-lg">
                {seller.bio}
              </p>
            )}

            {seller.tags && seller.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {seller.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-semibold"
                  >
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mb-3 text-xs text-slate-400">
              {seller.country && <span>{seller.country}</span>}
              {seller.country && <span>�</span>}
              <span>
                {t("memberSince")} {formatDate(seller.createdat)}
              </span>
            </div>

            {/* Verification badges */}
            <div className="flex flex-wrap gap-1.5">
              {seller.kyc_status === "approved" ? (
                <ProfileBadge color="green" icon={<BadgeCheck size={11} />}>
                  {t("verifiedBadge")}
                </ProfileBadge>
              ) : seller.kyc_status === "pending" ? (
                <ProfileBadge color="amber" icon={<ShieldAlert size={11} />}>
                  {t("verificationPending")}
                </ProfileBadge>
              ) : (
                <ProfileBadge color="slate" icon={<ShieldAlert size={11} />}>
                  {t("notVerifiedBadge")}
                </ProfileBadge>
              )}
              {verifiedBadges.id && (
                <ProfileBadge color="green" icon={<BadgeCheck size={10} />}>
                  {t("idVerified")}
                </ProfileBadge>
              )}
              {verifiedBadges.phone && (
                <ProfileBadge color="green" icon={<BadgeCheck size={10} />}>
                  {t("phoneVerified")}
                </ProfileBadge>
              )}
              {verifiedBadges.email && (
                <ProfileBadge color="green" icon={<BadgeCheck size={10} />}>
                  {t("emailVerified")}
                </ProfileBadge>
              )}
            </div>
          </div>

          {/* KYC prompt */}
          {needsKycAction && (
            <div
              className={`mx-4 mb-4 rounded-2xl px-4 py-3.5 border flex items-center justify-between gap-3 flex-wrap ${
                kycAccent === "red"
                  ? "bg-red-50 border-red-200/60"
                  : "bg-amber-50 border-amber-200/60"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold mb-0.5 ${kycAccent === "red" ? "text-red-800" : "text-amber-800"}`}
                >
                  {kycPanelTitle}
                </p>
                <p
                  className={`text-xs leading-relaxed ${kycAccent === "red" ? "text-red-600" : "text-amber-700"}`}
                >
                  {kycPanelBody}
                </p>
              </div>
              <Link
                href="/kyc"
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  kycAccent === "red"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                }`}
              >
                <ShieldAlert size={13} />
                {kycButtonLabel}
              </Link>
            </div>
          )}
        </div>

        {/* -- Stats strip --------------------------------------------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            value={completedCount.toLocaleString()}
            label={t("dealsClosed")}
            accent="#10b981"
          />
          <StatCard
            value={Math.round(totalSecured).toLocaleString()}
            label={t("securedXaf")}
            suffix=" XAF"
            accent="#f59e0b"
          />
          {successRate !== null && (
            <StatCard
              value={`${successRate}%`}
              label={t("successRate")}
              accent="#10b981"
            />
          )}
          {disputeRate !== null && (
            <StatCard
              value={`${disputeRate}%`}
              label={t("disputeRate")}
              accent="#0f1f3d"
            />
          )}
        </div>

        {/* -- Contact card -------------------------------------------------- */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight mb-0.5">
            {t("ctaTitle")}
          </h2>
          <p className="text-sm text-slate-400 mb-4">{t("ctaBody")}</p>

          <form onSubmit={submitDealRequest} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10 transition-all"
                placeholder={t("yourName")}
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
                required
                maxLength={100}
              />
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10 transition-all"
                placeholder={t("yourEmail")}
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                required
                type="email"
              />
            </div>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10 transition-all resize-none"
              placeholder={t("dealMessage")}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              required
              minLength={10}
              maxLength={1000}
              rows={3}
            />
            {requestError && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {requestError}
              </p>
            )}
            {requestSuccess && (
              <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 flex items-center gap-1.5">
                <CheckCheck size={13} />
                {requestSuccess}
              </p>
            )}
            <button
              type="submit"
              disabled={requestLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#0f1f3d] hover:bg-[#1a3460] disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
            >
              <Send size={14} />
              {requestLoading ? t("sending") : t("sendDealRequest")}
            </button>
          </form>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-4 border-t border-slate-100">
            {[
              { Icon: Lock, text: t("safeEscrow") },
              { Icon: ShieldCheck, text: t("safeGuarantee") },
              { Icon: Clock, text: t("safeDelivery") },
            ].map(({ Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-1.5 text-slate-400 text-xs"
              >
                <Icon size={12} strokeWidth={2.2} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* -- Reviews ------------------------------------------------------- */}
        <div>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              {t("reviewsTitle")}
            </h2>
            {averageRating > 0 && (
              <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 px-3 py-1.5 shadow-sm">
                {renderStars(averageRating)}
                <span className="text-sm font-bold text-slate-800">
                  {averageRating}
                </span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <Star size={18} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">{t("noReviewsFull")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleReviews.map((review) => (
                <div
                  key={review.id}
                  className={`bg-white rounded-2xl border shadow-sm p-4 transition-shadow hover:shadow-md ${
                    review.pinned ? "border-amber-200/80" : "border-slate-100"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-2.5">
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-500 uppercase">
                      {(review.reviewer_name || "A").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5 mb-1">
                        <span className="text-sm font-bold text-slate-800 truncate max-w-[160px]">
                          {review.reviewer_name}
                        </span>
                        {review.pinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/80 rounded-full px-2 py-0.5">
                            <Pin size={9} />
                            {t("pinned")}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center text-[10px] font-bold rounded-full px-2 py-0.5 ${
                            review.rating >= 4
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : "bg-red-50 text-red-600 border border-red-200/80"
                          }`}
                        >
                          {review.rating >= 4
                            ? t("positiveLabel")
                            : t("negativeLabel")}
                        </span>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400 pt-0.5">
                      {formatDate(review.created_at)}
                    </span>
                  </div>

                  {review.show_invoice_name && review.invoice_name && (
                    <div className="inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-400 font-medium">
                      <Tag size={9} />
                      {t("invoiceTag")}: {review.invoice_name}
                    </div>
                  )}

                  {review.comment && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {review.comment}
                    </p>
                  )}

                  {review.seller_reply && (
                    <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
                      <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                        <MessageSquare size={11} />
                        {t("sellerReply")}
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {review.seller_reply}
                      </p>
                    </div>
                  )}

                  {replyFeedback[review.id] && (
                    <p className="mt-2 text-xs text-emerald-600">
                      {replyFeedback[review.id]}
                    </p>
                  )}

                  {isOwnProfile && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        disabled={pinLoading[review.id]}
                        onClick={() => togglePin(review.id, !!review.pinned)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
                      >
                        <Pin size={11} />
                        {review.pinned ? t("unpinReview") : t("pinReview")}
                      </button>
                      {!review.seller_reply && (
                        <button
                          onClick={() =>
                            setReplyOpen((prev) => ({
                              ...prev,
                              [review.id]: !prev[review.id],
                            }))
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 transition-colors"
                        >
                          <MessageSquare size={11} />
                          {t("replyToReview")}
                        </button>
                      )}
                    </div>
                  )}

                  {isOwnProfile &&
                    replyOpen[review.id] &&
                    !review.seller_reply && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10 transition-all resize-none"
                          placeholder={t("replyPlaceholder")}
                          value={replyDraft[review.id] || ""}
                          onChange={(e) =>
                            setReplyDraft((prev) => ({
                              ...prev,
                              [review.id]: e.target.value,
                            }))
                          }
                          maxLength={800}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={
                              replySubmitting[review.id] ||
                              !(replyDraft[review.id] || "").trim()
                            }
                            onClick={() => submitReply(review.id)}
                            className="inline-flex items-center gap-1 text-xs font-bold bg-[#0f1f3d] hover:bg-[#1a3460] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {replySubmitting[review.id]
                              ? "..."
                              : t("submitReply")}
                          </button>
                          <button
                            onClick={() =>
                              setReplyOpen((prev) => ({
                                ...prev,
                                [review.id]: false,
                              }))
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {t("cancelReply")}
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              ))}

              {reviews.length > REVIEWS_INITIAL && (
                <button
                  onClick={() => setShowAllReviews((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-colors"
                >
                  {showAllReviews ? (
                    <>
                      <ChevronUp size={15} />
                      {t("showLessReviews")}
                    </>
                  ) : (
                    <>
                      <ChevronDown size={15} />
                      {t("showMoreReviews", { count: String(reviews.length) })}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Sub-components -------------------------------------------------------------

function ProfileBadge({
  children,
  color,
  icon,
}: {
  children: React.ReactNode;
  color: "green" | "amber" | "slate";
  icon?: React.ReactNode;
}) {
  const styles = {
    green: "bg-emerald-50 border-emerald-200/80 text-emerald-700",
    amber: "bg-amber-50 border-amber-200/80 text-amber-700",
    slate: "bg-slate-100 border-slate-200 text-slate-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${styles[color]}`}
    >
      {icon}
      {children}
    </span>
  );
}

function StatCard({
  value,
  label,
  suffix = "",
  accent,
}: {
  value: string | number;
  label: string;
  suffix?: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5">
      <p
        className="text-xl font-extrabold tracking-tight leading-none mb-1"
        style={{ color: accent }}
      >
        {value}
        {suffix}
      </p>
      <p className="text-xs text-slate-400 font-medium leading-tight">
        {label}
      </p>
    </div>
  );
}
