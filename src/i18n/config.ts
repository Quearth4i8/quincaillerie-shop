import { dictionaries, GOVERNORATE_AR, type Dict } from "./dictionaries";

export type Locale = "fr" | "ar";

export const LOCALES: Locale[] = ["fr", "ar"];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "lang";

export const isLocale = (v: unknown): v is Locale => v === "fr" || v === "ar";
export const dirOf = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");
export const getDict = (locale: Locale): Dict => dictionaries[locale];

/** Intl locale with Latin digits (Tunisia writes prices and dates with 0-9) */
export const intlLocale = (locale: Locale) => (locale === "ar" ? "ar-TN-u-nu-latn" : "fr-FR");

export function governorateLabel(name: string, locale: Locale) {
  return locale === "ar" ? (GOVERNORATE_AR[name] ?? name) : name;
}

/** Category name in the current language (falls back to French) */
export function categoryName(c: { name: string; name_ar?: string | null }, locale: Locale) {
  return locale === "ar" && c.name_ar ? c.name_ar : c.name;
}

const dateTimeCache = new Map<string, Intl.DateTimeFormat>();
function fmt(locale: Locale, options: Intl.DateTimeFormatOptions) {
  const key = locale + JSON.stringify(options);
  let f = dateTimeCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(intlLocale(locale), { timeZone: "Africa/Tunis", ...options });
    dateTimeCache.set(key, f);
  }
  return f;
}

export const formatDateL = (iso: string, locale: Locale) => fmt(locale, { dateStyle: "medium" }).format(new Date(iso));
export const formatDateTimeL = (iso: string, locale: Locale) =>
  fmt(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
export const formatTimeL = (iso: string, locale: Locale) => fmt(locale, { timeStyle: "short" }).format(new Date(iso));

/**
 * Database functions raise French messages; show them in the visitor's language.
 * Unknown messages are returned as they are.
 */
export function translateDbError(message: string, locale: Locale) {
  if (locale === "fr") return message;
  const e = getDict(locale).errors;
  const stock = message.match(/Stock insuffisant pour « (.+) » \(reste (\d+)\)/);
  if (stock) return e.insufficientStock(stock[1], stock[2]);
  const known: [RegExp, string][] = [
    [/Livraison non disponible/, e.noDelivery],
    [/n.est plus disponible/, e.productUnavailable],
    [/ne peut plus être annulée/, e.cannotCancel],
    [/Le panier est vide/, e.cartEmpty],
    [/Trop d.articles/, e.tooManyItems],
    [/Quantité invalide/, e.invalidQty],
    [/Informations de livraison incomplètes/, e.incompleteInfo],
    [/Trop de messages/, e.tooManyMessages],
    [/Le message est vide/, e.emptyMessage],
    [/Conversation introuvable/, e.conversationNotFound],
    [/Indiquez votre nom/, e.nameRequired],
  ];
  return known.find(([re]) => re.test(message))?.[1] ?? message;
}

export type { Dict };
