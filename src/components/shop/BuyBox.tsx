"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { AddToCartButton } from "./AddToCartButton";

type Props = {
  product: { id: string; slug: string; name: string; price: number; images: string[]; stock: number };
};

export function BuyBox({ product }: Props) {
  const { t } = useI18n();
  const [qty, setQty] = useState(1);
  const max = Math.max(1, product.stock);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div role="group" aria-label={t.product.quantity} className="flex h-14 items-center overflow-hidden rounded-xl border-2 border-ink bg-white">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label={t.product.decrease}
          className="flex h-full w-13 cursor-pointer items-center justify-center hover:bg-ground"
        >
          <Minus className="size-5" aria-hidden="true" />
        </button>
        <span aria-live="polite" className="w-11 text-center text-xl font-bold">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(max, q + 1))}
          aria-label={t.product.increase}
          className="flex h-full w-13 cursor-pointer items-center justify-center hover:bg-ground"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </div>
      <AddToCartButton product={product} quantity={qty} className="h-14 flex-1 basis-56 text-lg" />
    </div>
  );
}
