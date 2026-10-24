import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Toaster } from "sonner";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupNotice } from "@/components/SetupNotice";
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

export const metadata: Metadata = {
  title: { default: "Quincaillerie en ligne — livraison à domicile", template: "%s · Quincaillerie en ligne" },
  description:
    "Outillage, plomberie, électricité, peinture, visserie. Commandez en ligne ou par téléphone, livraison à domicile partout en Tunisie, paiement à la livraison.",
};

export const viewport: Viewport = {
  themeColor: "#16181b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-dvh">
        {isSupabaseConfigured ? children : <SetupNotice />}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
