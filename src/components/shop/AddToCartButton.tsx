"use client";

import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart, useHydrated } from "@/store/cart";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  product: { id: string; slug: string; name: string; price: number; images: string[]; stock: number };
  quantity?: number;
  className?: string;
  compact?: boolean;
};

export function AddToCartButton({ product, quantity = 1, className, compact }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const add = useCart((s) => s.add);
  const inCart = useCart((s) => s.items.find((i) => i.productId === product.id)?.quantity ?? 0);
  const hydrated = useHydrated();
  const out = product.stock <= 0;
  const maxed = hydrated && inCart >= product.stock;
  const added = hydrated && inCart > 0;

  function onClick() {
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: Number(product.price),
        image: product.images[0] ?? null,
        stock: product.stock,
      },
      quantity,
    );
    toast.success(t.product.addedToast, {
      description: product.name,
      action: { label: t.product.seeCart, onClick: () => router.push("/panier") },
    });
  }

  let label: React.ReactNode;
  if (out) label = t.product.outOfStock;
  else if (maxed) label = t.product.maxed;
  else if (added)
    label = (
      <>
        <Check className="size-4" aria-hidden="true" />
        {compact ? t.product.added(inCart) : t.product.inCart(inCart)}
      </>
    );
  else
    label = (
      <>
        {!compact && <ShoppingCart className="size-4" aria-hidden="true" />}
        {compact ? t.product.add : t.product.addToCart}
      </>
    );

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={out || maxed}
      className={cn(added ? "btn bg-tile text-ink hover:bg-line" : "btn-accent", className)}
    >
      {label}
    </button>
  );
}
