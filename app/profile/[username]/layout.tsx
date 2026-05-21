import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const SITE = "https://fonlok.com";

type Props = {
  params: Promise<{ username: string }>;
  children: ReactNode;
};

type ProfileData = {
  seller: {
    name: string;
    username: string;
    profilepicture?: string;
    country?: string;
    bio?: string;
    kyc_status?: string;
  };
  completedCount: number;
  totalSecured: number;
  averageRating: number;
};

async function fetchProfile(username: string): Promise<ProfileData | null> {
  try {
    const res = await fetch(`${API}/profile/${username}`, {
      next: { revalidate: 300 }, // cache 5 min for SSG/ISR
    });
    if (!res.ok) return null;
    return res.json() as Promise<ProfileData>;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await fetchProfile(username);

  const name = data?.seller?.name ?? username;
  const deals = data?.completedCount ?? 0;
  const secured = data?.totalSecured ?? 0;
  const rating = data?.averageRating ?? 0;
  const bio = data?.seller?.bio ?? null;
  const isVerified = data?.seller?.kyc_status === "approved";

  const rawPic = data?.seller?.profilepicture;
  const picture = rawPic
    ? rawPic.startsWith("http")
      ? rawPic
      : `${API}/uploads/${rawPic}`
    : `${SITE}/icons/icon-512.png`;

  const verifiedLabel = isVerified ? " · ID Verified" : "";
  const title = `${name}${verifiedLabel} — Seller on Fonlok`;
  const description = bio
    ? `${bio} · ${deals} deals completed · ${Math.round(secured).toLocaleString()} XAF secured via Fonlok escrow.`
    : `${deals} deals completed · ${Math.round(secured).toLocaleString()} XAF secured with ${rating ? `${rating}/5 rating` : "Fonlok escrow"}. Pay ${name} safely — funds held until delivery confirmed.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE}/seller/${username}`,
      siteName: "Fonlok",
      type: "profile",
      images: [{ url: picture, width: 400, height: 400, alt: name }],
      locale: "en_GB",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [picture],
    },
    alternates: { canonical: `${SITE}/seller/${username}` },
  };
}

export default async function ProfileLayout({ params, children }: Props) {
  const { username } = await params;
  const data = await fetchProfile(username);

  const name = data?.seller?.name ?? username;
  const deals = data?.completedCount ?? 0;
  const rating = data?.averageRating ?? 0;
  const reviewCount = rating > 0 ? 1 : 0; // conservative; used as fallback
  const rawPic = data?.seller?.profilepicture;
  const picture = rawPic
    ? rawPic.startsWith("http")
      ? rawPic
      : `${API}/uploads/${rawPic}`
    : undefined;
  const country = data?.seller?.country ?? "CM";
  const isVerified = data?.seller?.kyc_status === "approved";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: `${SITE}/seller/${username}`,
    image: picture,
    description: data?.seller?.bio ?? undefined,
    address: country
      ? { "@type": "PostalAddress", addressCountry: country }
      : undefined,
    memberOf: {
      "@type": "Organization",
      name: "Fonlok",
      url: SITE,
    },
    ...(isVerified && {
      hasCredential: {
        "@type": "EducationalOccupationalCredential",
        name: "Fonlok ID Verified",
      },
    }),
    ...(rating > 0 &&
      deals > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: String(rating),
          bestRating: "5",
          worstRating: "1",
          reviewCount: String(Math.max(reviewCount, deals)),
        },
      }),
    knowsAbout: data ? undefined : undefined,
  };

  return (
    <>
      <Script
        id="seller-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
