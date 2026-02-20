import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Log In | Fonlok",
  description:
    "Log in to your Fonlok account to manage invoices, track payments, and access your dashboard.",
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
