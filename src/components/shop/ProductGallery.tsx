"use client";

import { useState } from "react";
import Image from "next/image";
import { ProductImage } from "./ProductImage";
import { cn } from "@/lib/cn";

export function ProductGallery({ images, name, badge }: { images: string[]; name: string; badge: string | null }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-40">
      <div className="card relative overflow-hidden">
        <ProductImage
          src={images[active]}
          alt={name}
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="aspect-square bg-white sm:aspect-[5/4]"
        />
        {badge && (
          <span className="absolute left-4 top-4 rounded-md bg-ink px-2.5 py-1.5 text-sm font-bold text-accent">{badge}</span>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Voir la photo ${i + 1}`}
              aria-pressed={i === active}
              className={cn(
                "relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-white",
                i === active ? "ring-2 ring-ink" : "ring-1 ring-line hover:ring-line-strong",
              )}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
