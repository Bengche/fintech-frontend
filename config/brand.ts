/**
 * BRAND CONFIGURATION — Single point of truth
 *
 * Every piece of brand identity lives here.
 * To rebrand or update contact details, edit ONLY this file.
 * Import from this file anywhere in the frontend.
 *
 * Usage:
 *   import { BRAND } from "@/config/brand";
 *   <p>Contact us at {BRAND.supportEmail}</p>
 */

const BRAND = {
  // The product name displayed throughout the UI
  name: "Fonlok",

  // Full tagline for hero sections or page descriptions
  tagline: "Secure escrow payments for Cameroon",

  // The root domain (no trailing slash)
  domain: "fonlok.com",

  // Primary website URL
  siteUrl: "https://fonlok.com",

  // Support / contact email
  supportEmail: "support@fonlok.com",

  // WhatsApp and phone support — same number
  supportPhone: "+237654155218",
  whatsappUrl: "https://wa.me/237654155218",

  // Social / contact links (expand as needed)
  contact: {
    email: "support@fonlok.com",
    phone: "+237654155218",
    whatsapp: "https://wa.me/237654155218",
  },

  /**
   * DESIGN TOKENS
   * These mirror globals.css @theme values.
   * Use CSS variables in Tailwind classes where possible.
   * Use these JS values when you need colors in dynamic styles or charts.
   *
   * Primary:  Ink Navy  — trust, authority, security
   * Accent:   Amber Gold — warmth, local, wealth
   *           (sits between MTN yellow and Orange Cameroon orange)
   */
  colors: {
    primary: "#0F1F3D",
    primaryHover: "#1a3460",
    primaryLight: "#e8edf5",

    accent: "#F59E0B",
    accentHover: "#D97706",
    accentLight: "#FEF3C7",

    white: "#FFFFFF",
    cloud: "#F8FAFC",
    mist: "#F1F5F9",

    border: "#E2E8F0",
    borderStrong: "#CBD5E1",

    textHeading: "#0F172A",
    textBody: "#334155",
    textMuted: "#64748B",

    success: "#10B981",
    warning: "#D97706",
    danger: "#EF4444",
    info: "#0EA5E9",
  },
} as const;

export { BRAND };
