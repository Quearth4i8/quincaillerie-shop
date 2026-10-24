import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { getSettings } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice, telHref } from "@/lib/format";

export const metadata: Metadata = { title: "Commande reçue" };

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string; t?: string }>;
}) {
  const { n, t } = await searchParams;
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  const number = n && /^\d+$/.test(n) ? n : null;
  const total = t && !Number.isNaN(Number(t)) ? Number(t) : null;

  return (
    <div className="container-page py-12">
      <div className="card mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-12 text-center sm:px-10">
        <span className="animate-pop flex size-18 items-center justify-center rounded-full bg-accent">
          <Check className="size-9" strokeWidth={2.6} aria-hidden="true" />
        </span>
        <h1 className="heading-display text-4xl sm:text-5xl">Merci, commande reçue !</h1>
        <p className="text-lg leading-relaxed text-ink-soft">
          {number && <>Commande n° <strong>{number}</strong>. </>}
          Nous vous appelons très vite au numéro indiqué pour confirmer le total et l’heure de livraison.
        </p>
        {total !== null && (
          <p className="text-lg">
            Total à payer à la livraison : <strong>{formatPrice(total)} DT</strong>
          </p>
        )}
        <p className="text-muted">Paiement en espèces à la réception du colis.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-dark h-13 px-6">Retour à la boutique</Link>
          {user ? (
            <Link href="/compte" className="btn-outline h-13 px-6">Suivre mes commandes</Link>
          ) : (
            <a href={telHref(settings.phone)} className="btn-outline h-13 px-6">Une question ? {settings.phone}</a>
          )}
        </div>
      </div>
    </div>
  );
}
