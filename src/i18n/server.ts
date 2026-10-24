import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, getDict, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/** The visitor's language: their choice (cookie), else Arabic if the browser asks for it. */
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^\s*ar\b/i.test(accept) ? "ar" : DEFAULT_LOCALE;
});

export async function getT() {
  const locale = await getLocale();
  return { locale, t: getDict(locale) };
}
