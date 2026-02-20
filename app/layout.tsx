import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/UserContext";
import CookieConsent from "./components/CookieConsent";
import AiChatWidgetWrapper from "./components/AiChatWidgetWrapper";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fonlok.com"),
  title: {
    default: "Fonlok — Secure Escrow Payments for Cameroon",
    template: "%s | Fonlok",
  },
  description:
    "Fonlok holds your money until both buyer and seller are satisfied. Pay and get paid safely with MTN Mobile Money and Orange Money. No more scams in Cameroon.",
  keywords: [
    "escrow Cameroon",
    "secure payment Cameroon",
    "Fonlok",
    "MTN Mobile Money escrow",
  ],
  openGraph: {
    siteName: "Fonlok",
    type: "website",
    locale: "en_CM",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fonlok — Secure Escrow Payments for Cameroon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://fonlok.com" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <CookieConsent />
        <AiChatWidgetWrapper />
      </body>
    </html>
  );
}
