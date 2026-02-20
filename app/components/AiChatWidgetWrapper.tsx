"use client";

import { usePathname } from "next/navigation";
import AiChatWidget from "./AiChatWidget";

// Pages where the chat widget should be suppressed
const HIDDEN_PREFIXES = [
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export default function AiChatWidgetWrapper() {
  const pathname = usePathname();
  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (hidden) return null;
  return <AiChatWidget />;
}
