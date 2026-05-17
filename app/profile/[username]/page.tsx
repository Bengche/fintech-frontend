"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Axios from "axios";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BadgeCheck, Send, Share2, ShieldAlert, Star } from "lucide-react";
import { useAuth } from "@/context/UserContext";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type Seller = {
  id: number;
  name: string;
  username: string;
  country: string;
  profilepicture: string;
  createdat: string;
  phone?: string;
  kyc_status?: string;
};
type Review = {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name: string;
};
type CompletedInvoice = {
  invoicename: string;
  amount: number;
  currency: string;
  delivered_at: string;
};

export default function SellerProfilePage() {
  const { username } = useParams<{ username: string }>();
  const t = useTranslations("Profile");
  const { username: authUsername } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [completedInvoices, setCompletedInvoices] = useState<
    CompletedInvoice[]
  >([]);
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await Axios.get(`${API}/profile/${username}`);
        setSeller(response.data.seller);
        setReviews(response.data.reviews);
        setCompletedInvoices(response.data.completedInvoices);
        setAverageRating(response.data.averageRating);
        setCompletedCount(response.data.completedCount);
        setTotalSecured(response.data.totalSecured || 0);
        setDisputeCount(response.data.disputeCount || 0);
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
      // user cancelled share or clipboard was denied
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < Math.round(rating) ? "var(--color-accent)" : "transparent"}
        stroke={
          i < Math.round(rating)
            ? "var(--color-accent)"
            : "var(--color-border-strong)"
        }
      />
    ));

  const trustLine = `${completedCount.toLocaleString()} ${t("dealsClosedInline")} · ${Math.round(totalSecured).toLocaleString()} XAF ${t("securedInline")} · ${disputeCount.toLocaleString()} ${t("disputesInline")}`;

  if (loading)
    return (
      <div
        className="seller-profile-page"
        style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "5rem 1.25rem",
            color: "var(--color-text-muted)",
          }}
        >
          {t("loading")}
        </div>
      </div>
    );

  if (error)
    return (
      <div
        className="seller-profile-page"
        style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}
      >
        <div
          style={{ maxWidth: "480px", margin: "4rem auto", padding: "1.25rem" }}
        >
          <div className="alert alert-danger">{error}</div>
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
    <div
      className="seller-profile-page"
      style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}
    >
      <div
        className="seller-profile-shell"
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "2rem 1.25rem 4rem",
        }}
      >
        {/* Seller hero card */}
        <div
          className="card seller-hero-card"
          style={{ marginBottom: "1.5rem" }}
        >
          <div
            className="seller-hero-top"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
                fontWeight: 700,
              }}
            >
              {t("publicProfile")}
            </p>
            <button className="btn-ghost" onClick={handleShare}>
              <Share2 size={16} />
              {copied ? t("linkCopied") : t("shareProfile")}
            </button>
          </div>

          <div
            className="seller-identity-row"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1.25rem",
              flexWrap: "wrap",
            }}
          >
            {seller.profilepicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  seller.profilepicture.startsWith("http")
                    ? seller.profilepicture
                    : `${API}/uploads/${seller.profilepicture}`
                }
                alt={seller.name}
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "9999px",
                  objectFit: "cover",
                  flexShrink: 0,
                  border: "3px solid var(--color-border)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "9999px",
                  backgroundColor: "var(--color-primary-light)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {seller.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="seller-identity-main" style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  color: "var(--color-text-heading)",
                  margin: "0 0 0.2rem",
                }}
              >
                {seller.name}
              </h1>
              <p
                style={{
                  margin: "0 0 0.125rem",
                  color: "var(--color-text-muted)",
                  fontSize: "0.9rem",
                }}
              >
                @{seller.username}
              </p>
              <p
                style={{
                  margin: "0 0 0.5rem",
                  color: "var(--color-text-body)",
                  fontSize: "0.875rem",
                }}
              >
                {trustLine}
              </p>
              {seller.country && (
                <p
                  style={{
                    margin: "0 0 0.125rem",
                    color: "var(--color-text-muted)",
                    fontSize: "0.875rem",
                  }}
                >
                  {seller.country}
                </p>
              )}
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8rem",
                  color: "var(--color-text-muted)",
                }}
              >
                {t("memberSince")} {formatDate(seller.createdat)}
                {/* KYC verification badge */}
                {seller.kyc_status === "approved" ? (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      marginTop: "0.5rem",
                      padding: "0.3rem 0.75rem",
                      borderRadius: "999px",
                      background: "rgba(22,163,74,0.1)",
                      border: "1.5px solid rgba(22,163,74,0.3)",
                      color: "#166534",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                    }}
                  >
                    <BadgeCheck size={14} />
                    {t("verifiedBadge")}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      marginTop: "0.5rem",
                      padding: "0.3rem 0.75rem",
                      borderRadius: "999px",
                      background: "rgba(100,116,139,0.08)",
                      border: "1.5px solid rgba(100,116,139,0.2)",
                      color: "#475569",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                    }}
                  >
                    <ShieldAlert size={13} />
                    {seller.kyc_status === "pending"
                      ? t("verificationPending")
                      : t("notVerifiedBadge")}
                  </div>
                )}
              </p>
            </div>
          </div>

          {needsKycAction && (
            <div
              className="seller-kyc-panel"
              style={{
                marginTop: "1rem",
                padding: "1rem 1.05rem",
                borderRadius: "1rem",
                background: kycPanelBackground,
                border: kycPanelBorder,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div
                className="seller-kyc-copy"
                style={{ flex: 1, minWidth: "220px" }}
              >
                <p
                  style={{
                    margin: "0 0 0.25rem",
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: "var(--color-text-heading)",
                  }}
                >
                  {kycPanelTitle}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.86rem",
                    lineHeight: 1.65,
                    color: "var(--color-text-muted)",
                    maxWidth: "42rem",
                  }}
                >
                  {kycPanelBody}
                </p>
              </div>
              <Link
                href="/kyc"
                className="btn-primary seller-kyc-btn"
                style={{
                  textDecoration: "none",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                  width: "min(100%, 220px)",
                }}
              >
                <ShieldAlert size={16} />
                {kycButtonLabel}
              </Link>
            </div>
          )}

          {/* Stats row */}
          <div
            className="seller-stats-row"
            style={{
              display: "flex",
              gap: "1.5rem",
              marginTop: "1.5rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid var(--color-border)",
              flexWrap: "wrap",
            }}
          >
            <StatBox
              value={completedCount}
              label={t("dealsClosed")}
              color="var(--color-success)"
            />
            <StatBox
              value={Math.round(totalSecured)}
              label={t("securedXaf")}
              suffix=" XAF"
              color="var(--color-accent)"
            />
            <StatBox
              value={disputeCount}
              label={t("disputes")}
              color="var(--color-primary)"
            />
          </div>
        </div>

        {/* Contact CTA */}
        <div
          className="card seller-contact-card"
          style={{ marginBottom: "1.5rem" }}
        >
          <h2
            style={{
              fontSize: "1.0625rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
              margin: "0 0 0.375rem",
            }}
          >
            {t("ctaTitle")}
          </h2>
          <p
            style={{
              color: "var(--color-text-muted)",
              margin: "0 0 1rem",
              fontSize: "0.875rem",
            }}
          >
            {t("ctaBody")}
          </p>
          <form
            onSubmit={submitDealRequest}
            className="seller-contact-form"
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <input
              className="input"
              placeholder={t("yourName")}
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              required
              maxLength={100}
            />
            <input
              className="input"
              placeholder={t("yourEmail")}
              value={requestEmail}
              onChange={(e) => setRequestEmail(e.target.value)}
              required
              type="email"
            />
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
            {requestError && (
              <div className="alert alert-danger">{requestError}</div>
            )}
            {requestSuccess && (
              <div className="alert alert-success">{requestSuccess}</div>
            )}
            <button
              className="btn-primary"
              type="submit"
              disabled={requestLoading}
            >
              <Send size={16} />
              {requestLoading ? t("sending") : t("sendDealRequest")}
            </button>
          </form>
        </div>

        {/* Completed Orders */}
        <h2
          style={{
            fontSize: "1.0625rem",
            fontWeight: 700,
            color: "var(--color-text-heading)",
            margin: "0 0 1rem",
          }}
        >
          {t("completedOrders")}
        </h2>
        {completedInvoices.length === 0 ? (
          <p
            style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}
          >
            {t("noCompleted")}
          </p>
        ) : (
          <div
            className="seller-completed-list"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.625rem",
              marginBottom: "1.75rem",
            }}
          >
            {completedInvoices.map((inv, index) => (
              <div
                key={index}
                className="seller-completed-item"
                style={{
                  padding: "0.875rem 1rem",
                  backgroundColor: "var(--color-white)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <p
                  style={{
                    fontWeight: 600,
                    color: "var(--color-text-heading)",
                    margin: "0 0 0.25rem",
                  }}
                >
                  {inv.invoicename}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {inv.amount.toLocaleString()} {inv.currency} —{" "}
                  {t("deliveredOn")} {formatDate(inv.delivered_at)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Reviews header */}
        <div
          className="seller-reviews-head"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.0625rem",
              fontWeight: 700,
              color: "var(--color-text-heading)",
              margin: 0,
            }}
          >
            {t("reviewsTitle")}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {renderStars(averageRating)}
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
              }}
            >
              {averageRating || 0}
            </span>
          </div>
        </div>

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>
            {t("noReviewsFull")}
          </p>
        ) : (
          <div
            className="seller-reviews-list"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.875rem",
            }}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="card seller-review-card"
                style={{ padding: "1.125rem" }}
              >
                <div
                  className="seller-review-top"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginBottom: "0.375rem",
                  }}
                >
                  <p
                    style={{
                      fontWeight: 700,
                      margin: 0,
                      color: "var(--color-text-heading)",
                    }}
                  >
                    {review.reviewer_name}
                  </p>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {formatDate(review.created_at)}
                  </span>
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  {renderStars(review.rating)}
                </div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-text-body)",
                    lineHeight: 1.6,
                  }}
                >
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({
  value,
  label,
  color,
  suffix = "",
}: {
  value: number;
  label: string;
  color: string;
  suffix?: string;
}) {
  return (
    <div className="seller-stat-box" style={{ textAlign: "center" }}>
      <p
        className="seller-stat-value"
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          color,
          margin: "0 0 0.2rem",
        }}
      >
        {value.toLocaleString()}
        {suffix}
      </p>
      <p
        className="seller-stat-label"
        style={{
          fontSize: "0.8125rem",
          color: "var(--color-text-muted)",
          margin: 0,
        }}
      >
        {label}
      </p>
    </div>
  );
}
