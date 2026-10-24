"use client";

import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart, useHydrated } from "@/store/cart";
import { cn } from "@/lib/cn";

type Props = {
  product: { id: string; slug: string; name: string; price: number; images: string[]; stock: number };
  quantity?: number;
  className?: string;
  compact?: boolean;
};

export function AddToCartButton({ product, quantity = 1, className, compact }: Props) {
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
    toast.success("Ajouté au panier", {
      description: product.name,
      action: { label: "Voir le panier", onClick: () => router.push("/panier") },
    });
  }

  let label: React.ReactNode;
  if (out) label = "Rupture de stock";
  else if (maxed) label = "Stock max. atteint";
  else if (added)
    label = (
      <>
        <Check className="size-4" aria-hidden="true" />
        {compact ? `Ajouté (${inCart})` : `Dans le panier (${inCart}) · +1`}
      </>
    );
  else
    label = (
      <>
        {!compact && <ShoppingCart className="size-4" aria-hidden="true" />}
        {compact ? "Ajouter" : "Ajouter au panier"}
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
