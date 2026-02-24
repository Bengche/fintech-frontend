import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

const LOCALES = ["en", "fr"] as const;
type Locale = (typeof LOCALES)[number];

export default getRequestConfig(async () => {
  // 1. Explicit cookie set by the language switcher ("NEXT_LOCALE")
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value as
    | Locale
    | undefined;
  if (cookieLocale && LOCALES.includes(cookieLocale)) {
    return {
      locale: cookieLocale,
      messages: (await import(`../messages/${cookieLocale}.json`)).default,
    };
  }

  // 2. Browser's Accept-Language header — prefer French if requested
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language") ?? "";
  const locale: Locale = acceptLanguage.toLowerCase().startsWith("fr")
    ? "fr"
    : "en";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
