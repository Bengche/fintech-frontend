"use client";
import { useState, useEffect } from "react";
import Axios from "axios";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "next-intl";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type Seller = {
  id: number;
  name: string;
  username: string;
  country: string;
  profilepicture: string;
  createdat: string;
  phone?: string;
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
  const { user_id } = useAuth();
  const t = useTranslations("Profile");
  const [seller, setSeller] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [completedInvoices, setCompletedInvoices] = useState<
    CompletedInvoice[]
  >([]);
  const [averageRating, setAverageRating] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewInvoiceNumber, setReviewInvoiceNumber] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await Axios.get(`${API}/profile/${username}`);
        setSeller(response.data.seller);
        setReviews(response.data.reviews);
        setCompletedInvoices(response.data.completedInvoices);
        setAverageRating(response.data.averageRating);
        setCompletedCount(response.data.completedCount);
      } catch (err: any) {
        setError(err.response?.status === 404 ? t("notFound") : t("loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const submitReview = async (e: any) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess("");
    try {
      await Axios.post(
        `${API}/profile/review`,
        {
          seller_username: username,
          invoice_number: reviewInvoiceNumber,
          rating: reviewRating,
          comment: reviewComment,
        },
        { withCredentials: true },
      );
      setReviewSuccess(t("reviewSuccess"));
      setShowReviewForm(false);
      const updated = await Axios.get(`${API}/profile/${username}`);
      setReviews(updated.data.reviews);
      setAverageRating(updated.data.averageRating);
    } catch (err: any) {
      setReviewError(err.response?.data?.message || t("reviewError"));
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
      <span
        key={i}
        style={{
          color:
            i < rating ? "var(--color-accent)" : "var(--color-border-strong)",
          fontSize: "1.1rem",
        }}
      >
        ?
      </span>
    ));

  if (loading)
    return (
      <div
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

  const isOwnProfile = !!user_id && user_id === seller.id;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-cloud)" }}>
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "2rem 1.25rem 4rem",
        }}
      >
        {/* Seller info card */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1.25rem",
              flexWrap: "wrap",
            }}
          >
            {seller.profilepicture ? (
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
            <div style={{ flex: 1 }}>
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
              </p>

              {/* MoMo phone number */}
              {(seller.phone || isOwnProfile) && (
                <div style={{ marginTop: "0.625rem" }}>
                  {!editingPhone ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          color: "var(--color-text-body)",
                        }}
                      >
                        {" "}
                        {seller.phone ? (
                          `+${seller.phone}`
                        ) : (
                          <span
                            style={{
                              color: "var(--color-text-muted)",
                              fontStyle: "italic",
                            }}
                          >
                            {t("noMoMo")}
                          </span>
                        )}
                      </p>
                      {isOwnProfile && (
                        <button
                          onClick={() => {
                            setPhoneInput(seller.phone || "");
                            setPhoneError("");
                            setPhoneSuccess("");
                            setEditingPhone(true);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            color: "var(--color-primary)",
                            padding: "0.125rem 0.375rem",
                            borderRadius: "4px",
                            textDecoration: "underline",
                          }}
                        >
                          📝 {t("editPhone")}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {t("phoneLabel")}
                      </label>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            overflow: "hidden",
                            background: "var(--color-white)",
                          }}
                        >
                          <span
                            style={{
                              padding: "0.5rem 0.625rem",
                              background: "var(--color-cloud)",
                              fontSize: "0.875rem",
                              color: "var(--color-text-muted)",
                              borderRight: "1px solid var(--color-border)",
                            }}
                          >
                            +237
                          </span>
                          <input
                            style={{
                              border: "none",
                              outline: "none",
                              padding: "0.5rem 0.625rem",
                              fontSize: "0.875rem",
                              width: "140px",
                            }}
                            type="tel"
                            placeholder="6XXXXXXXX"
                            maxLength={9}
                            value={
                              phoneInput.startsWith("237")
                                ? phoneInput.slice(3)
                                : phoneInput
                            }
                            onChange={(e) =>
                              setPhoneInput(
                                "237" + e.target.value.replace(/\D/g, ""),
                              )
                            }
                          />
                        </div>
                        <button
                          className="btn-primary"
                          disabled={phoneSaving}
                          style={{
                            padding: "0.5rem 0.875rem",
                            fontSize: "0.875rem",
                          }}
                          onClick={async () => {
                            setPhoneError("");
                            setPhoneSuccess("");
                            setPhoneSaving(true);
                            try {
                              const res = await Axios.patch(
                                `${API}/profile/update-phone`,
                                { phone: phoneInput },
                                { withCredentials: true },
                              );
                              setSeller((prev) =>
                                prev
                                  ? { ...prev, phone: res.data.phone }
                                  : prev,
                              );
                              setPhoneSuccess(t("phoneSuccess"));
                              setEditingPhone(false);
                            } catch (err: any) {
                              setPhoneError(
                                err.response?.data?.message || t("phoneError"),
                              );
                            } finally {
                              setPhoneSaving(false);
                            }
                          }}
                        >
                          {phoneSaving ? t("savingPhone") : t("savePhone")}
                        </button>
                        <button
                          onClick={() => {
                            setEditingPhone(false);
                            setPhoneError("");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {t("cancelPhone")}
                        </button>
                      </div>
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-text-muted)",
                          margin: 0,
                        }}
                      >
                        {t("phoneHint")}
                      </p>
                      {phoneError && (
                        <p
                          style={{
                            color: "var(--color-danger)",
                            fontSize: "0.8rem",
                            margin: 0,
                          }}
                        >
                          {phoneError}
                        </p>
                      )}
                    </div>
                  )}
                  {phoneSuccess && (
                    <p
                      style={{
                        color: "var(--color-success)",
                        fontSize: "0.8rem",
                        margin: "0.25rem 0 0",
                      }}
                    >
                      {phoneSuccess}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div
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
              label={t("completedOrders")}
              color="var(--color-success)"
            />
            <StatBox
              value={averageRating}
              label={t("averageRating")}
              color="var(--color-accent)"
            />
            <StatBox
              value={reviews.length}
              label={t("reviewsTitle")}
              color="var(--color-primary)"
            />
          </div>
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
          {user_id && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className={showReviewForm ? "btn-ghost" : "btn-primary"}
              style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
            >
              {showReviewForm ? t("cancelReview") : t("leaveReview")}
            </button>
          )}
        </div>

        {reviewSuccess && (
          <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
            {reviewSuccess}
          </div>
        )}

        {/* Review form */}
        {showReviewForm && (
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h3
              style={{
                margin: "0 0 1rem",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--color-text-heading)",
              }}
            >
              {t("writeReview")}
            </h3>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                margin: "0 0 0.75rem",
                background: "var(--color-cloud)",
                borderLeft: "3px solid var(--color-accent)",
                padding: "0.5rem 0.75rem",
                borderRadius: "0 4px 4px 0",
              }}
            >
              {t("reviewNote")}
            </p>
            <form
              onSubmit={submitReview}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.875rem",
              }}
            >
              <div>
                <label className="label">{t("reviewInvoiceLabel")}</label>
                <input
                  className="input"
                  type="text"
                  placeholder={t("reviewInvoicePlaceholder")}
                  value={reviewInvoiceNumber}
                  onChange={(e) => setReviewInvoiceNumber(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">{t("reviewRatingLabel")}</label>
                <select
                  className="input"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} {r > 1 ? t("stars") : t("star")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t("reviewCommentLabel")}</label>
                <textarea
                  className="input"
                  placeholder={t("reviewCommentPlaceholder")}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                  style={{ resize: "vertical", minHeight: "80px" }}
                />
              </div>
              {reviewError && (
                <div className="alert alert-danger">{reviewError}</div>
              )}
              <button
                type="submit"
                className="btn-accent"
                style={{ alignSelf: "flex-start" }}
              >
                {t("submitReview")}
              </button>
            </form>
          </div>
        )}

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>
            {t("noReviewsFull")}
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.875rem",
            }}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="card"
                style={{ padding: "1.125rem" }}
              >
                <div
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
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <p
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          color,
          margin: "0 0 0.2rem",
        }}
      >
        {value}
      </p>
      <p
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
