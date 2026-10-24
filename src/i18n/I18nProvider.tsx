"use client";

import { createContext, useContext } from "react";
import { dirOf, getDict, type Locale } from "./config";

const I18nContext = createContext<Locale>("fr");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <I18nContext.Provider value={locale}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const locale = useContext(I18nContext);
  return { locale, t: getDict(locale), dir: dirOf(locale) } as const;
}
