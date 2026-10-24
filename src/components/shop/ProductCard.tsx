"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import type { Product } from "@/lib/types";
import { discountPercent, formatPrice } from "@/lib/format";
import { useI18n } from "@/i18n/I18nProvider";
import { categoryName } from "@/i18n/config";
import { ProductImage } from "./ProductImage";
import { AddToCartButton } from "./AddToCartButton";

export type CardProduct = Pick<Product, "id" | "slug" | "name" | "price" | "old_price" | "stock" | "images" | "badge"> & {
  category?: { name: string; name_ar?: string | null; slug: string } | null;
};

export function ProductCard({ product, phoneHref }: { product: CardProduct; phoneHref: string }) {
  const { t, locale } = useI18n();
  const off = discountPercent(product.price, product.old_price);
  const badge = product.badge ?? (off ? `−${off}%` : null);

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <Link href={`/produit/${product.slug}`} className="relative block" tabIndex={-1} aria-hidden="true">
        <ProductImage src={product.images[0]} alt="" className="aspect-[4/3] transition group-hover:brightness-[0.97]" />
        {badge && (
          <span className="absolute start-3 top-3 rounded-md bg-ink px-2 py-1 text-xs font-bold text-accent">{badge}</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        {product.category && <span className="text-[13px] font-medium text-muted">{categoryName(product.category, locale)}</span>}
        <Link href={`/produit/${product.slug}`} className="line-clamp-2 font-semibold leading-snug hover:underline">
          {product.name}
        </Link>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2.5 pt-1">
          <span className="heading-display whitespace-nowrap text-[24px] sm:text-[28px]">
            {formatPrice(product.price)} <span className="text-lg">{t.common.currency}</span>
          </span>
          {off && (
            <span className="whitespace-nowrap text-sm text-muted line-through">
              {formatPrice(product.old_price)} {t.common.currency}
            </span>
          )}
        </div>
        <span className={product.stock > 0 ? "text-[13px] font-semibold text-ok" : "text-[13px] font-semibold text-danger"}>
          {product.stock > 5 ? t.product.inStock : product.stock > 0 ? t.product.onlyLeft(product.stock) : t.product.outOfStock}
        </span>
        <div className="mt-1 flex gap-2">
          <AddToCartButton product={product} compact className="h-11 flex-1 px-3 text-[15px]" />
          <a
            href={phoneHref}
            aria-label={t.product.orderByPhoneAria(product.name)}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink hover:bg-ground"
          >
            <Phone className="size-[18px]" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
