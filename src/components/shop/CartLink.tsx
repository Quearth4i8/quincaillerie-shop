"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cartCount, useCart, useHydrated } from "@/store/cart";
import { useI18n } from "@/i18n/I18nProvider";

export function CartLink() {
  const { t } = useI18n();
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(items) : 0;

  return (
    <Link href="/panier" className="btn-dark h-12 px-4" aria-label={t.cart.aria(count)}>
      <ShoppingCart className="size-5" aria-hidden="true" />
      <span className="hidden sm:inline">{t.cart.link}</span>
      <span key={count} className="animate-pop flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-sm text-ink">
        {count}
      </span>
    </Link>
  );
}
