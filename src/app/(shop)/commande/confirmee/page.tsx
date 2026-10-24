import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { getSettings } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice, telHref } from "@/lib/format";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).t.meta.orderReceived };
}

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string; t?: string }>;
}) {
  const { n, t: totalParam } = await searchParams;
  const [settings, user, { t }] = await Promise.all([getSettings(), getCurrentUser(), getT()]);
  const c = t.confirmed;
  const number = n && /^\d+$/.test(n) ? n : null;
  const total = totalParam && !Number.isNaN(Number(totalParam)) ? Number(totalParam) : null;

  return (
    <div className="container-page py-12">
      <div className="card mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-12 text-center sm:px-10">
        <span className="animate-pop flex size-18 items-center justify-center rounded-full bg-accent">
          <Check className="size-9" strokeWidth={2.6} aria-hidden="true" />
        </span>
        <h1 className="heading-display text-4xl sm:text-5xl">{c.title}</h1>
        <p className="text-lg leading-relaxed text-ink-soft">
          {number && <>{c.number} <strong>{number}</strong>. </>}
          {c.callSoon}
        </p>
        {total !== null && (
          <p className="text-lg">
            {c.totalToPay} <strong className="whitespace-nowrap">{formatPrice(total)} {t.common.currency}</strong>
          </p>
        )}
        <p className="text-muted">{c.cash}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-dark h-13 px-6">{c.back}</Link>
          {user ? (
            <Link href="/compte" className="btn-outline h-13 px-6">{c.track}</Link>
          ) : (
            <a href={telHref(settings.phone)} className="btn-outline h-13 px-6">{t.common.question(settings.phone)}</a>
          )}
        </div>
      </div>
    </div>
  );
}
