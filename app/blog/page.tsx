import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Blog — Safe Online Payments in Cameroon | Fonlok",
  description:
    "Tips, guides, and insights on secure online payments, escrow, MoMo, and how to protect yourself when buying or selling in Cameroon.",
  keywords: [
    "online payment Cameroon",
    "escrow Cameroon",
    "secure payment MTN MoMo",
    "how to sell safely online Cameroon",
    "avoid scams Cameroon",
  ],
  openGraph: {
    title: "Blog — Safe Online Payments in Cameroon | Fonlok",
    description:
      "Tips, guides, and insights on secure online payments, escrow, MoMo, and how to protect yourself when buying or selling in Cameroon.",
    url: "https://fonlok.com/blog",
    siteName: "Fonlok",
    type: "website",
  },
  alternates: { canonical: "https://fonlok.com/blog" },
};

const ARTICLES = [
  {
    slug: "how-to-avoid-online-scams-in-cameroon",
    title: "How to Avoid Online Scams in Cameroon (2025 Guide)",
    description:
      "Learn the most common online fraud tactics targeting Cameroonians and the steps you can take right now to protect your money.",
    date: "2025-01-10",
    readTime: "6 min read",
    tag: "Safety",
  },
  {
    slug: "how-to-sell-safely-on-facebook-marketplace-cameroon",
    title: "How to Sell Safely on Facebook Marketplace Cameroon",
    description:
      "Facebook Marketplace is huge in Cameroon — but so is payment fraud. Use these steps to protect every sale you make.",
    date: "2025-01-18",
    readTime: "5 min read",
    tag: "Sellers",
  },
  {
    slug: "what-is-escrow",
    title: "What Is Escrow? A Simple Explanation for Cameroon",
    description:
      "Escrow sounds complicated, but the idea is simple. Here's exactly how it works and why it makes buying and selling online much safer.",
    date: "2025-01-25",
    readTime: "4 min read",
    tag: "Education",
  },
  {
    slug: "mtn-mobile-money-orange-money-secure-payments",
    title: "Paying with MTN MoMo or Orange Money — How to Stay Safe",
    description:
      "MoMo and Orange Money are convenient, but sending money to strangers carries real risk. Here's how to transact safely every time.",
    date: "2025-02-03",
    readTime: "5 min read",
    tag: "Mobile Money",
  },
  {
    slug: "how-to-get-paid-online-cameroon",
    title: "How to Get Paid Online in Cameroon Without Getting Scammed",
    description:
      "Freelancers, service providers, and small businesses — here's everything you need to know to receive payments safely in Cameroon.",
    date: "2025-02-12",
    readTime: "7 min read",
    tag: "Freelancers",
  },
];

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  Safety: { bg: "#fef3c7", color: "#92400e" },
  Sellers: { bg: "#eff6ff", color: "#1d4ed8" },
  Education: { bg: "#f0fdf4", color: "#166534" },
  "Mobile Money": { bg: "#fff7ed", color: "#9a3412" },
  Freelancers: { bg: "#fdf4ff", color: "#7e22ce" },
};

export default function BlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Fonlok Blog",
    url: "https://fonlok.com/blog",
    itemListElement: ARTICLES.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://fonlok.com/blog/${a.slug}`,
      name: a.title,
    })),
  };

  return (
    <>
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main>
        {/* Hero */}
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
              Safe Payments in Cameroon
            </h1>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.75,
              }}
            >
              Guides, tips, and insights on buying and selling safely online
              with MTN MoMo and Orange Money.
            </p>
          </div>
        </section>

        {/* Article list */}
        <section
          style={{
            backgroundColor: "var(--color-cloud)",
            padding: "5rem 1.5rem",
          }}
        >
          <div className="page-wrapper" style={{ maxWidth: "780px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {ARTICLES.map((article) => {
                const tagStyle = TAG_COLORS[article.tag] ?? {
                  bg: "#f1f5f9",
                  color: "#475569",
                };
                return (
                  <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="card"
                      style={{
                        padding: "1.5rem",
                        transition: "box-shadow 0.2s, transform 0.15s",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.625rem",
                          marginBottom: "0.75rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.65rem",
                            borderRadius: "999px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            backgroundColor: tagStyle.bg,
                            color: tagStyle.color,
                          }}
                        >
                          {article.tag}
                        </span>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {new Date(article.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}{" "}
                          &middot; {article.readTime}
                        </span>
                      </div>
                      <h2
                        style={{
                          fontSize: "1.1875rem",
                          fontWeight: 700,
                          color: "var(--color-text-heading)",
                          margin: "0 0 0.5rem",
                          lineHeight: 1.35,
                        }}
                      >
                        {article.title}
                      </h2>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.9rem",
                          color: "var(--color-text-muted)",
                          lineHeight: 1.7,
                        }}
                      >
                        {article.description}
                      </p>
                      <p
                        style={{
                          marginTop: "0.875rem",
                          marginBottom: 0,
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "var(--color-primary)",
                        }}
                      >
                        Read article &rarr;
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
