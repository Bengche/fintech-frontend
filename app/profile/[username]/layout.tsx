import type { Metadata } from "next";
import type { ReactNode } from "react";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  return {
    title: `${displayName} — Seller Profile | Fonlok`,
    description: `Pay ${displayName} safely on Fonlok. Your funds are held in escrow until delivery is confirmed. Supports MTN Mobile Money and Orange Money.`,
    openGraph: {
      title: `${displayName} on Fonlok — Secure Payments`,
      description: `Pay ${displayName} safely. Fonlok holds your money in escrow until you confirm delivery.`,
      url: `https://fonlok.com/profile/${username}`,
      siteName: "Fonlok",
      type: "profile",
    },
    alternates: { canonical: `https://fonlok.com/profile/${username}` },
  };
}

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
