"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cartCount, useCart, useHydrated } from "@/store/cart";

export function CartLink() {
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(items) : 0;

  return (
    <Link href="/panier" className="btn-dark h-12 px-4" aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}>
      <ShoppingCart className="size-5" aria-hidden="true" />
      <span className="hidden sm:inline">Panier</span>
      <span key={count} className="animate-pop flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-sm text-ink">
        {count}
      </span>
    </Link>
  );
}
