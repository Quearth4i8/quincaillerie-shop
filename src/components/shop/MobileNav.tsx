"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LayoutGrid, Phone, ShoppingCart, User } from "lucide-react";
import { cartCount, useCart, useHydrated } from "@/store/cart";
import { cn } from "@/lib/cn";

export function MobileNav({ phoneHref }: { phoneHref: string }) {
  const pathname = usePathname();
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(items) : 0;

  const linkClass = (active: boolean) =>
    cn("flex flex-col items-center gap-0.5 py-1.5 text-xs", active ? "font-bold text-ink" : "font-semibold text-muted");

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white px-1 pt-1 pb-2 md:hidden"
    >
      <Link href="/" className={linkClass(pathname === "/")} aria-current={pathname === "/" ? "page" : undefined}>
        <House className="size-6" aria-hidden="true" />
        Accueil
      </Link>
      <Link href="/produits" className={linkClass(pathname.startsWith("/produit"))}>
        <LayoutGrid className="size-6" aria-hidden="true" />
        Rayons
      </Link>
      <a href={phoneHref} className="flex flex-col items-center gap-0.5 py-1.5 text-xs font-bold text-ink">
        <span className="flex h-7 w-10 items-center justify-center rounded-full bg-accent">
          <Phone className="size-[18px]" aria-hidden="true" />
        </span>
        Appeler
      </a>
      <Link href="/panier" className={linkClass(pathname === "/panier")}>
        <span className="relative">
          <ShoppingCart className="size-6" aria-hidden="true" />
          {count > 0 && (
            <span className="absolute -right-2.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] text-accent">
              {count}
            </span>
          )}
        </span>
        Panier
      </Link>
      <Link href="/compte" className={linkClass(pathname.startsWith("/compte"))}>
        <User className="size-6" aria-hidden="true" />
        Compte
      </Link>
    </nav>
  );
}
