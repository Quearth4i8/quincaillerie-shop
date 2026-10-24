import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Cairo } from "next/font/google";
import { Toaster } from "sonner";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupNotice } from "@/components/SetupNotice";
import { getT } from "@/i18n/server";
import { dirOf } from "@/i18n/config";
import { I18nProvider } from "@/i18n/I18nProvider";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: { default: t.meta.siteTitle, template: `%s · ${t.meta.titleSuffix}` },
    description: t.meta.description,
  };
}

export const viewport: Viewport = {
  themeColor: "#16181b",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getT();
  return (
    <html lang={locale} dir={dirOf(locale)} className={`${barlow.variable} ${barlowCondensed.variable} ${cairo.variable}`}>
      <body className="min-h-dvh">
        <I18nProvider locale={locale}>
          {isSupabaseConfigured ? children : <SetupNotice />}
          <Toaster position="top-center" richColors closeButton dir={dirOf(locale)} />
        </I18nProvider>
      </body>
    </html>
  );
}
