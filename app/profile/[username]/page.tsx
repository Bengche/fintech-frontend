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
  const [verifiedBadges, setVerifiedBadges] = useState<VerifiedBadges>({ id: false, phone: false, email: false });
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
  const [replySubmitting, setReplySubmitting] = useState<Record<number, boolean>>({});
  const [replyFeedback, setReplyFeedback] = useState<Record<number, string>>({});
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
        await navigator.share({ title: `${seller?.name || "Seller"} - Fonlok`, text: t("shareText"), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch { /* cancelled */ }
  };

  const submitDealRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");
    setRequestSuccess("");
    setRequestLoading(true);
    try {
      await Axios.post(
        `${API}/profile/deal-request`,
        { seller_username: username, sender_name: requestName, sender_email: requestEmail, message: requestMessage },
        { withCredentials: true },
      );
      setRequestSuccess(t("dealRequestSuccess"));
      setRequestName("");
      setRequestEmail("");
      setRequestMessage("");
    } catch (err: unknown) {
      setRequestError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t("dealRequestError"),
      );
    } finally {
      setRequestLoading(false);
    }
  };

  const togglePin = async (reviewId: number, currentlyPinned: boolean) => {
    setPinLoading((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await Axios.patch(`${API}/profile/review/${reviewId}/pin`, {}, { withCredentials: true });
      setReviews((prev) =>
        prev.map((r) => r.id === reviewId ? { ...r, pinned: !currentlyPinned } : r)
          .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      );
    } catch { /* silent */ } finally {
      setPinLoading((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const submitReply = async (reviewId: number) => {
    const text = (replyDraft[reviewId] || "").trim();
    if (!text) return;
    setReplySubmitting((prev) => ({ ...prev, [reviewId]: true }));
    setReplyFeedback((prev) => ({ ...prev, [reviewId]: "" }));
    try {
      await Axios.patch(`${API}/profile/review/${reviewId}/reply`, { seller_reply: text }, { withCredentials: true });
      setReviews((prev) =>
        prev.map((r) => r.id === reviewId ? { ...r, seller_reply: text, reply_created_at: new Date().toISOString() } : r),
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
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < Math.round(rating) ? "var(--color-accent)" : "transparent"}
        stroke={i < Math.round(rating) ? "var(--color-accent)" : "var(--color-border-strong)"}
      />
    ));

  const disputeRate = completedCount >= 5 ? Math.round((disputeCount / completedCount) * 100) : null;
  const successRate = completedCount > 0 ? Math.round(((completedCount - disputeCount) / completedCount) * 100) : null;
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, REVIEWS_INITIAL);

  if (loading)
    return (
      <div className="seller-profile-page" style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}>
        <div style={{ textAlign: "center", padding: "5rem 1.25rem", color: "var(--color-text-muted)" }}>{t("loading")}</div>
      </div>
    );

  if (error)
    return (
      <div className="seller-profile-page" style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}>
        <div style={{ maxWidth: "480px", margin: "4rem auto", padding: "1.25rem" }}>
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    );

  if (!seller) return null;

  const isOwnProfile = Boolean(authUsername && authUsername === seller.username);
  const needsKycAction = isOwnProfile && seller.kyc_status !== "approved";
  const kycPanelTitle =
    seller.kyc_status === "pending" ? t("kycPromptPendingTitle")
    : seller.kyc_status === "rejected" ? t("kycPromptRejectedTitle")
    : t("kycPromptTitle");
  const kycPanelBody =
    seller.kyc_status === "pending" ? t("kycPromptPendingBody")
    : seller.kyc_status === "rejected" ? t("kycPromptRejectedBody")
    : t("kycPromptBody");
  const kycButtonLabel =
    seller.kyc_status === "pending" ? t("kycViewStatus")
    : seller.kyc_status === "rejected" ? t("kycResubmit")
    : t("kycGetVerified");
  const kycPanelBackground =
    seller.kyc_status === "pending"
      ? "linear-gradient(135deg, rgba(245,158,11,0.07), rgba(15,31,61,0.04))"
      : seller.kyc_status === "rejected"
        ? "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(15,31,61,0.04))"
        : "linear-gradient(135deg, rgba(15,31,61,0.04), rgba(245,158,11,0.08))";
  const kycPanelBorder =
    seller.kyc_status === "pending"
      ? "1px solid rgba(245,158,11,0.22)"
      : seller.kyc_status === "rejected"
        ? "1px solid rgba(239,68,68,0.2)"
        : "1px solid rgba(15,31,61,0.08)";

  return (
    <div className="seller-profile-page" style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}>
      <div className="seller-profile-shell" style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>

        {/* Escrow education strip â€” guests only */}
        {!authUsername && (
          <div
            style={{
              marginBottom: "1.25rem",
              padding: "1rem 1.125rem",
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, rgba(15,31,61,0.04), rgba(245,158,11,0.06))",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <p style={{ margin: "0 0 0.35rem", fontWeight: 700, fontSize: "0.9rem", color: "var(--color-text-heading)" }}>
              {t("escrowStripTitle")}
            </p>
            <p style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.65, color: "var(--color-text-muted)" }}>
              {t("escrowStripBody")}
            </p>
          </div>
        )}

        {/* Seller hero card */}
        <div className="card seller-hero-card" style={{ marginBottom: "1.5rem" }}>
          <div
            className="seller-hero-top"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: "0.75rem", flexWrap: "wrap" }}
          >
            <p style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 700 }}>
              {t("publicProfile")}
            </p>
            <button className="btn-ghost" onClick={handleShare}>
              <Share2 size={16} />
              {copied ? t("linkCopied") : t("shareProfile")}
            </button>
          </div>

          <div className="seller-identity-row" style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", flexWrap: "wrap" }}>
            {seller.profilepicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={seller.profilepicture.startsWith("http") ? seller.profilepicture : `${API}/uploads/${seller.profilepicture}`}
                alt={seller.name}
                style={{ width: "72px", height: "72px", borderRadius: "9999px", objectFit: "cover", flexShrink: 0, border: "3px solid var(--color-border)" }}
              />
            ) : (
              <div style={{ width: "72px", height: "72px", borderRadius: "9999px", backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", fontWeight: 800, flexShrink: 0 }}>
                {seller.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="seller-identity-main" style={{ flex: 1 }}>
              <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-text-heading)", margin: "0 0 0.2rem" }}>
                {seller.name}
              </h1>
              <p style={{ margin: "0 0 0.125rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                @{seller.username}
              </p>
              {seller.bio && (
                <p style={{ margin: "0.375rem 0 0.375rem", color: "var(--color-text-body)", fontSize: "0.875rem", lineHeight: 1.6, maxWidth: "38rem" }}>
                  {seller.bio}
                </p>
              )}
              {seller.tags && seller.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", margin: "0.375rem 0 0.5rem" }}>
                  {seller.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "var(--color-accent)", fontSize: "0.77rem", fontWeight: 600 }}
                    >
                      <Tag size={11} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {seller.country && (
                <p style={{ margin: "0 0 0.125rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                  {seller.country}
                </p>
              )}
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                {t("memberSince")} {formatDate(seller.createdat)}
              </p>

              {/* Badges row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {/* Main KYC / identity-verification badge */}
                {seller.kyc_status === "approved" ? (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.85rem", borderRadius: "999px", background: "rgba(22,163,74,0.1)", border: "1.5px solid rgba(22,163,74,0.35)", color: "#166534", fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.01em" }}>
                    <BadgeCheck size={15} />
                    {t("verifiedBadge")}
                  </div>
                ) : seller.kyc_status === "pending" ? (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.85rem", borderRadius: "999px", background: "rgba(245,158,11,0.1)", border: "1.5px solid rgba(245,158,11,0.35)", color: "#92400e", fontSize: "0.8rem", fontWeight: 700 }}>
                    <ShieldAlert size={14} />
                    {t("verificationPending")}
                  </div>
                ) : (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.85rem", borderRadius: "999px", background: "rgba(100,116,139,0.08)", border: "1.5px solid rgba(100,116,139,0.25)", color: "#64748b", fontSize: "0.8rem", fontWeight: 700 }}>
                    <ShieldAlert size={14} />
                    {t("notVerifiedBadge")}
                  </div>
                )}
                {/* Sub-badges for individual verifications */}
                {verifiedBadges.id && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.65rem", borderRadius: "999px", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.22)", color: "#15803d", fontSize: "0.75rem", fontWeight: 600 }}>
                    <BadgeCheck size={12} style={{ flexShrink: 0 }} />
                    {t("idVerified")}
                  </div>
                )}
                {verifiedBadges.phone && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.65rem", borderRadius: "999px", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.22)", color: "#15803d", fontSize: "0.75rem", fontWeight: 600 }}>
                    <BadgeCheck size={12} style={{ flexShrink: 0 }} />
                    {t("phoneVerified")}
                  </div>
                )}
                {verifiedBadges.email && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.65rem", borderRadius: "999px", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.22)", color: "#15803d", fontSize: "0.75rem", fontWeight: 600 }}>
                    <BadgeCheck size={12} style={{ flexShrink: 0 }} />
                    {t("emailVerified")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {needsKycAction && (
            <div
              className="seller-kyc-panel"
              style={{ marginTop: "1rem", padding: "1rem 1.05rem", borderRadius: "1rem", background: kycPanelBackground, border: kycPanelBorder, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}
            >
              <div className="seller-kyc-copy" style={{ flex: 1, minWidth: "220px" }}>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-heading)" }}>{kycPanelTitle}</p>
                <p style={{ margin: 0, fontSize: "0.86rem", lineHeight: 1.65, color: "var(--color-text-muted)", maxWidth: "42rem" }}>{kycPanelBody}</p>
              </div>
              <Link href="/kyc" className="btn-primary seller-kyc-btn" style={{ textDecoration: "none", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", width: "min(100%, 220px)" }}>
                <ShieldAlert size={16} />
                {kycButtonLabel}
              </Link>
            </div>
          )}

          {/* Stats row */}
          <div
            className="seller-stats-row"
            style={{ display: "flex", gap: "1.5rem", marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-border)", flexWrap: "wrap" }}
          >
            <StatBox value={completedCount} label={t("dealsClosed")} color="var(--color-success)" />
            <StatBox value={Math.round(totalSecured)} label={t("securedXaf")} suffix=" XAF" color="var(--color-accent)" />
            {successRate !== null && (
              <StatBox value={successRate} label={t("successRate")} suffix="%" color="var(--color-success)" />
            )}
            {disputeRate !== null && (
              <StatBox value={disputeRate} label={t("disputeRate")} suffix="%" color="var(--color-primary)" />
            )}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="card seller-contact-card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-text-heading)", margin: "0 0 0.375rem" }}>
            {t("ctaTitle")}
          </h2>
          <p style={{ color: "var(--color-text-muted)", margin: "0 0 1rem", fontSize: "0.875rem" }}>
            {t("ctaBody")}
          </p>
          <form onSubmit={submitDealRequest} className="seller-contact-form" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input className="input" placeholder={t("yourName")} value={requestName} onChange={(e) => setRequestName(e.target.value)} required maxLength={100} />
            <input className="input" placeholder={t("yourEmail")} value={requestEmail} onChange={(e) => setRequestEmail(e.target.value)} required type="email" />
            <textarea
              className="input"
              placeholder={t("dealMessage")}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              required
              minLength={10}
              maxLength={1000}
              style={{ minHeight: "96px", resize: "vertical" }}
            />
            {requestError && <div className="alert alert-danger">{requestError}</div>}
            {requestSuccess && <div className="alert alert-success">{requestSuccess}</div>}
            <button className="btn-primary" type="submit" disabled={requestLoading}>
              <Send size={16} />
              {requestLoading ? t("sending") : t("sendDealRequest")}
            </button>
          </form>

          {/* Safe to pay indicators */}
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem", marginTop: "1rem", paddingTop: "0.875rem", borderTop: "1px solid var(--color-border)" }}
          >
            {[
              { Icon: Lock, text: t("safeEscrow") },
              { Icon: ShieldCheck, text: t("safeGuarantee") },
              { Icon: Clock, text: t("safeDelivery") },
            ].map(({ Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--color-text-muted)", fontSize: "0.78rem" }}>
                <Icon size={13} strokeWidth={2.2} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews header */}
        <div
          className="seller-reviews-head"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}
        >
          <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-text-heading)", margin: 0 }}>
            {t("reviewsTitle")}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {renderStars(averageRating)}
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-heading)" }}>
              {averageRating || 0}
            </span>
          </div>
        </div>

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>{t("noReviewsFull")}</p>
        ) : (
          <>
            <div className="seller-reviews-list" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {visibleReviews.map((review) => (
                <div key={review.id} className="card seller-review-card" style={{ padding: "1.125rem", position: "relative" }}>
                  {/* Pinned indicator */}
                  {review.pinned && (
                    <div style={{ position: "absolute", top: "0.75rem", right: "0.875rem", display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--color-accent)", fontSize: "0.72rem", fontWeight: 700 }}>
                      <Pin size={12} />
                    </div>
                  )}
                  <div className="seller-review-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.375rem" }}>
                    <p style={{ fontWeight: 700, margin: 0, color: "var(--color-text-heading)" }}>{review.reviewer_name}</p>
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{formatDate(review.created_at)}</span>
                  </div>
                  <div style={{ marginBottom: "0.5rem" }}>{renderStars(review.rating)}</div>
                  {/* Invoice name tag */}
                  {review.show_invoice_name && review.invoice_name && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.5rem", padding: "0.2rem 0.55rem", borderRadius: "999px", background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.15)", color: "var(--color-text-muted)", fontSize: "0.73rem", fontWeight: 600 }}>
                      <Tag size={11} />
                      {t("invoiceTag")}: {review.invoice_name}
                    </div>
                  )}
                  <p style={{ margin: 0, color: "var(--color-text-body)", lineHeight: 1.6 }}>{review.comment}</p>

                  {/* Seller reply */}
                  {review.seller_reply && (
                    <div style={{ marginTop: "0.75rem", padding: "0.75rem 0.875rem", borderRadius: "var(--radius-md)", background: "rgba(15,31,61,0.04)", border: "1px solid rgba(15,31,61,0.07)" }}>
                      <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-muted)" }}>
                        <MessageSquare size={12} style={{ marginRight: "0.3rem", verticalAlign: "middle" }} />
                        {t("sellerReply")}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-body)", lineHeight: 1.6 }}>{review.seller_reply}</p>
                    </div>
                  )}

                  {/* Feedback (reply posted notice) */}
                  {replyFeedback[review.id] && (
                    <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "var(--color-success)" }}>{replyFeedback[review.id]}</p>
                  )}

                  {/* Owner actions */}
                  {isOwnProfile && (
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
                        disabled={pinLoading[review.id]}
                        onClick={() => togglePin(review.id, !!review.pinned)}
                      >
                        <Pin size={13} />
                        {review.pinned ? t("unpinReview") : t("pinReview")}
                      </button>
                      {!review.seller_reply && (
                        <button
                          className="btn-ghost"
                          style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
                          onClick={() => setReplyOpen((prev) => ({ ...prev, [review.id]: !prev[review.id] }))}
                        >
                          <MessageSquare size={13} />
                          {t("replyToReview")}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Reply form */}
                  {isOwnProfile && replyOpen[review.id] && !review.seller_reply && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <textarea
                        className="input"
                        placeholder={t("replyPlaceholder")}
                        value={replyDraft[review.id] || ""}
                        onChange={(e) => setReplyDraft((prev) => ({ ...prev, [review.id]: e.target.value }))}
                        maxLength={800}
                        style={{ minHeight: "80px", resize: "vertical", fontSize: "0.875rem" }}
                      />
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                        <button
                          className="btn-primary"
                          style={{ fontSize: "0.8rem", padding: "0.35rem 0.875rem" }}
                          disabled={replySubmitting[review.id] || !(replyDraft[review.id] || "").trim()}
                          onClick={() => submitReply(review.id)}
                        >
                          {replySubmitting[review.id] ? "..." : t("submitReply")}
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: "0.8rem", padding: "0.35rem 0.875rem" }}
                          onClick={() => setReplyOpen((prev) => ({ ...prev, [review.id]: false }))}
                        >
                          {t("cancelReply")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {reviews.length > REVIEWS_INITIAL && (
              <button
                className="btn-ghost"
                style={{ marginTop: "0.875rem", width: "100%", justifyContent: "center" }}
                onClick={() => setShowAllReviews((v) => !v)}
              >
                {showAllReviews ? (
                  <><ChevronUp size={15} />{t("showLessReviews")}</>
                ) : (
                  <><ChevronDown size={15} />{t("showMoreReviews", { count: String(reviews.length) })}</>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatBox({ value, label, color, suffix = "" }: { value: number; label: string; color: string; suffix?: string }) {
  return (
    <div className="seller-stat-box" style={{ textAlign: "center" }}>
      <p className="seller-stat-value" style={{ fontSize: "1.75rem", fontWeight: 800, color, margin: "0 0 0.2rem" }}>
        {value.toLocaleString()}{suffix}
      </p>
      <p className="seller-stat-label" style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
        {label}
      </p>
    </div>
  );
}
