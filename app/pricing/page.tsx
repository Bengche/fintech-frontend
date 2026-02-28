import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import SiteHeader from "../components/SiteHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pricing.meta");
  return {
    title: t("title"),
    description: t("description"),
    keywords: [
      "Fonlok pricing",
      "escrow fee Cameroon",
      "3% escrow fee",
      "how much does Fonlok cost",
    ],
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: "https://fonlok.com/pricing",
      siteName: "Fonlok",
      type: "website",
    },
    alternates: { canonical: "https://fonlok.com/pricing" },
  };
}

const FEE_EXAMPLES = [
  { amount: "5,000 XAF", fee: "150 XAF", receives: "4,850 XAF" },
  { amount: "10,000 XAF", fee: "300 XAF", receives: "9,700 XAF" },
  { amount: "25,000 XAF", fee: "750 XAF", receives: "24,250 XAF" },
  { amount: "50,000 XAF", fee: "1,500 XAF", receives: "48,500 XAF" },
  { amount: "100,000 XAF", fee: "3,000 XAF", receives: "97,000 XAF" },
  { amount: "500,000 XAF", fee: "15,000 XAF", receives: "485,000 XAF" },
];

export default async function PricingPage() {
  const t = await getTranslations("Pricing");
  return (
    <>
      <SiteHeader />

      <main>
        {/* Ã¢â€â‚¬Ã¢â€â‚¬ PAGE HEADER Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <section
          style={{
            backgroundColor: "var(--color-primary)",
            padding: "4rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "600px" }}>
            <h1
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: "1rem",
              }}
            >
              {t("hero.h1")}
            </h1>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.75,
              }}
            >
              {t("hero.description")}
            </p>
          </div>
        </section>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ MAIN FEE CARD Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <section
          style={{
            backgroundColor: "var(--color-cloud)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "2rem",
                alignItems: "flex-start",
                justifyContent: "center",
              }}
            >
              {/* Big fee card */}
              <div
                className="card"
                style={{
                  flex: "0 1 360px",
                  padding: "2.5rem",
                  border: "2px solid var(--color-primary)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-accent)",
                    marginBottom: "0.75rem",
                  }}
                >
                  {t("cards.seller.who")}
                </p>
                <p
                  style={{
                    fontSize: "4.5rem",
                    fontWeight: 900,
                    color: "var(--color-primary)",
                    lineHeight: 1,
                    margin: "0 0 0.25rem",
                  }}
                >
                  3%
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-text-muted)",
                    marginBottom: "1rem",
                  }}
                >
                  {t("seller.feeLabel")}
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-text-body)",
                    lineHeight: 1.7,
                    marginBottom: "2rem",
                    paddingBottom: "1.25rem",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  {t("seller.body")}
                </p>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {([0, 1, 2, 3, 4, 5, 6, 7] as const).map((i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.625rem",
                        fontSize: "0.9375rem",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--color-success)",
                          fontWeight: 700,
                          marginTop: "0.1rem",
                          flexShrink: 0,
                        }}
                      >
                        ✓
                      </span>
                      {t(`seller.included.${i}`)}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className="btn-primary"
                  style={{ display: "block", textAlign: "center" }}
                >
                  {t("seller.cta")}
                </Link>
              </div>

              {/* Buyer fee card */}
              <div
                className="card"
                style={{ flex: "0 1 300px", padding: "2.5rem" }}
              >
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-text-muted)",
                    marginBottom: "0.75rem",
                  }}
                >
                  {t("cards.buyer.who")}
                </p>
                <p
                  style={{
                    fontSize: "4.5rem",
                    fontWeight: 900,
                    color: "var(--color-primary)",
                    lineHeight: 1,
                    margin: "0 0 0.25rem",
                  }}
                >
                  0%
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-text-muted)",
                    marginBottom: "1rem",
                  }}
                >
                  {t("buyer.feeLabel")}
                </p>
                <span
                  className="badge badge-success"
                  style={{
                    display: "inline-block",
                    marginBottom: "1.25rem",
                    fontSize: "0.8125rem",
                  }}
                >
                  {t("buyer.badge")}
                </span>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--color-text-body)",
                    lineHeight: 1.75,
                    marginBottom: "1rem",
                  }}
                >
                  {t("buyer.body")}
                </p>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.7,
                    paddingTop: "0.875rem",
                    borderTop: "1px solid var(--color-border)",
                  }}
                >
                  <strong style={{ color: "var(--color-text-heading)" }}>
                    {t("buyer.note")}:
                  </strong>{" "}
                  {t("buyer.noteBody")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ WHAT YOU GET FOR 3% Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <section
          style={{
            backgroundColor: "var(--color-white)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "780px" }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <h2
                style={{
                  fontSize: "clamp(1.375rem, 3vw, 1.75rem)",
                  marginBottom: "0.75rem",
                }}
              >
                {t("valueSection.heading")}
              </h2>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--color-text-muted)",
                  maxWidth: "480px",
                  margin: "0 auto",
                }}
              >
                {t("valueSection.description")}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {([0, 1, 2, 3, 4, 5] as const).map((i) => (
                <div
                  key={i}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-cloud)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      marginBottom: "0.4rem",
                    }}
                  >
                    {t(`valueSection.items.${i}.title`)}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.7,
                    }}
                  >
                    {t(`valueSection.items.${i}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ EXAMPLE CALCULATIONS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <section
          style={{
            backgroundColor: "var(--color-mist)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "680px" }}>
            <h2
              style={{
                fontSize: "clamp(1.375rem, 3vw, 1.75rem)",
                marginBottom: "0.75rem",
              }}
            >
              {t("examples.heading")}
            </h2>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--color-text-muted)",
                marginBottom: "2rem",
              }}
            >
              {t("examples.description")}
            </p>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9375rem",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "var(--color-mist)" }}>
                    {([0, 1, 2] as const).map((i) => (
                      <th
                        key={i}
                        style={{
                          padding: "0.875rem 1rem",
                          textAlign: "left",
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          color: "var(--color-text-heading)",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        {t(`examples.col${i}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEE_EXAMPLES.map((row, i) => (
                    <tr
                      key={row.amount}
                      style={{
                        backgroundColor:
                          i % 2 === 0
                            ? "var(--color-white)"
                            : "var(--color-cloud)",
                      }}
                    >
                      <td
                        style={{
                          padding: "0.875rem 1rem",
                          color: "var(--color-text-body)",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        {row.amount}
                      </td>
                      <td
                        style={{
                          padding: "0.875rem 1rem",
                          color: "var(--color-danger)",
                          fontWeight: 600,
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        {row.fee}
                      </td>
                      <td
                        style={{
                          padding: "0.875rem 1rem",
                          color: "var(--color-success)",
                          fontWeight: 600,
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        {row.receives}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ PRICING FAQ Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <section
          style={{
            backgroundColor: "var(--color-mist)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "680px" }}>
            <h2
              style={{
                fontSize: "clamp(1.375rem, 3vw, 1.75rem)",
                marginBottom: "2.5rem",
              }}
            >
              {t("faq.heading")}
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {([0, 1, 2, 3, 4] as const).map((i) => (
                <div key={i}>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: "0.4rem",
                    }}
                  >
                    {t(`faq.items.${i}.q`)}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9375rem",
                      color: "var(--color-text-body)",
                      lineHeight: 1.75,
                    }}
                  >
                    {t(`faq.items.${i}.a`)}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "3rem", textAlign: "center" }}>
              <Link
                href="/faq"
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                }}
              >
                {t("faq.allFaq")}
              </Link>
            </div>
          </div>
        </section>
      </main>

    </>
  );
}
