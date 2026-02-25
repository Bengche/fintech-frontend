import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/UserContext";
import CookieConsent from "./components/CookieConsent";
import AiChatWidgetWrapper from "./components/AiChatWidgetWrapper";
import PwaRegister from "./components/PwaRegister";
import PwaInstallBanner from "./components/PwaInstallBanner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

// ── Viewport & theme colour ─────────────────────────────────────────────────
// Exported separately from metadata as required by Next.js 14+.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Never block pinch-zoom (accessibility)
  userScalable: true,
  viewportFit: "cover", // iOS safe-area (notch / dynamic island)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0F1F3D" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1F3D" },
  ],
};

// ── Page metadata ────────────────────────────────────────────────────────────
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

  // ── PWA — icons ────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      // Apple requires a link tag with rel="apple-touch-icon" — Next.js emits these.
      { url: "/apple-touch-icon.png" },
      { url: "/icons/icon-120.png", sizes: "120x120", type: "image/png" },
      { url: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-167.png", sizes: "167x167", type: "image/png" },
      { url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      // Windows pinned-site tile
      { rel: "msapplication-TileImage", url: "/icons/ms-icon-144.png" },
    ],
  },

  // ── PWA — Apple Web App meta tags ─────────────────────────────────────────
  // These cause iOS Safari to treat the installed page as a standalone app.
  appleWebApp: {
    capable: true,
    title: "Fonlok",
    statusBarStyle: "black-translucent", // shows content under the status bar
  },

  // ── PWA — Windows tile colour ─────────────────────────────────────────────
  other: {
    "msapplication-TileColor": "#0F1F3D",
    "msapplication-tap-highlight": "no",
    "mobile-web-app-capable": "yes", // older Android WebView
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>{children}</AuthProvider>
          <CookieConsent />
          <AiChatWidgetWrapper />
        </NextIntlClientProvider>
        {/* Registers /sw.js; returns null — no visible output */}
        <PwaRegister />
        {/* Cross-browser install prompt (Android native + iOS guide) */}
        <PwaInstallBanner />
      </body>
    </html>
  );
}
