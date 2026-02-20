import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Create a Free Account | Fonlok",
  description:
    "Sign up for Fonlok in under two minutes. Start accepting secure escrow payments using MTN Mobile Money and Orange Money in Cameroon.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://fonlok.com/register" },
  openGraph: {
    title: "Create a Free Account | Fonlok",
    description: "Sign up for Fonlok — free escrow payments for Cameroon.",
    url: "https://fonlok.com/register",
    siteName: "Fonlok",
    type: "website",
  },
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
