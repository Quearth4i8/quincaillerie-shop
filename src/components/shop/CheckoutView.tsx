"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, Minus, Phone, Plus, ShoppingCart, Trash } from "lucide-react";
import { toast } from "sonner";
import { cartCount, cartSubtotal, useCart, useHydrated } from "@/store/cart";
import { formatPrice, telHref } from "@/lib/format";
import type { DeliveryZone } from "@/lib/types";
import { placeOrder } from "@/app/actions/orders";
import { ProductImage } from "./ProductImage";
import { CustomerFields, type CustomerDefaults } from "./CustomerFields";

export function CheckoutView({
  zones,
  phone,
  defaults,
  signedIn,
}: {
  zones: DeliveryZone[];
  phone: string;
  defaults: CustomerDefaults;
  signedIn: boolean;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { items, setQuantity, remove, clear } = useCart();
  const [governorate, setGovernorate] = useState(defaults.governorate);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  if (!hydrated) {
    return (
      <div className="flex justify-center py-24">
        <LoaderCircle className="size-8 animate-spin text-muted" aria-label="Chargement du panier" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card mx-auto flex max-w-xl flex-col items-center gap-4 p-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-ground">
          <ShoppingCart className="size-8" aria-hidden="true" />
        </span>
        <h1 className="heading-display text-4xl">Votre panier est vide</h1>
        <p className="text-muted">Parcourez le catalogue, ou appelez-nous : on prépare la commande pour vous.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/produits" className="btn-accent h-12">Voir le catalogue</Link>
          <a href={telHref(phone)} className="btn-outline h-12">
            <Phone className="size-4" aria-hidden="true" />
            {phone}
          </a>
        </div>
      </div>
    );
  }

  const zone = zones.find((z) => z.governorate === governorate);
  const subtotal = cartSubtotal(items);
  const fee = zone ? Number(zone.fee) : null;
  const total = subtotal + (fee ?? 0);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("items", JSON.stringify(items.map((i) => ({ product_id: i.productId, quantity: i.quantity }))));
    startTransition(async () => {
      const result = await placeOrder(formData);
      if (result.ok) {
        clear();
        router.push(`/commande/confirmee?n=${result.orderNumber}&t=${result.total}`);
      } else {
        setErrors(result.errors ?? {});
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <h1 className="heading-display text-4xl sm:text-5xl">Finaliser la commande</h1>
      <p className="mb-7 mt-2 text-[17px] text-muted">
        Pas de carte bancaire{signedIn ? "" : ", pas besoin de compte"}. Laissez vos coordonnées, on vous appelle pour confirmer.
      </p>

      <div className="flex flex-col-reverse gap-7 lg:flex-row lg:items-start">
        <form onSubmit={onSubmit} className="flex min-w-0 flex-1 flex-col gap-5" noValidate>
          <CustomerFields
            zones={zones}
            defaults={defaults}
            errors={errors}
            governorate={governorate}
            onGovernorateChange={setGovernorate}
          />

          <fieldset className="card flex flex-col gap-3 p-5 sm:p-6">
            <legend className="heading-display px-1.5 text-[26px]">3. Paiement</legend>
            <label className="flex cursor-pointer items-center gap-3.5 rounded-xl border-2 border-ink p-4">
              <input type="radio" name="payment" value="cod" defaultChecked className="size-5 accent-ink" />
              <span className="flex flex-col">
                <span className="text-[17px] font-bold">Paiement à la livraison</span>
                <span className="text-[15px] text-muted">En espèces, à la réception. Vous vérifiez la marchandise avant de payer.</span>
              </span>
            </label>
          </fieldset>

          <button type="submit" disabled={pending} className="btn-accent h-15 text-xl font-extrabold">
            {pending ? (
              <>
                <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                Envoi en cours…
              </>
            ) : (
              <>Confirmer la commande · {formatPrice(total)} DT</>
            )}
          </button>
          <p className="text-center text-[15px] text-muted">
            Vous préférez parler à quelqu’un ?{" "}
            <a href={telHref(phone)} className="font-bold text-ink underline">Appelez le {phone}</a>
          </p>
        </form>

        <aside aria-labelledby="summary" className="card flex flex-col gap-4 p-5 sm:p-6 lg:sticky lg:top-40 lg:w-[380px]">
          <h2 id="summary" className="heading-display text-[26px]">Votre panier ({cartCount(items)})</h2>
          <ul className="flex flex-col gap-4">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center gap-3">
                <Link href={`/produit/${i.slug}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
                  <ProductImage src={i.image} alt="" sizes="64px" className="size-16 rounded-xl" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Link href={`/produit/${i.slug}`} className="line-clamp-2 text-[15px] font-semibold leading-tight hover:underline">
                    {i.name}
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuantity(i.productId, i.quantity - 1)}
                      aria-label={`Retirer un ${i.name}`}
                      className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-line-strong hover:bg-ground"
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-6 text-center font-bold">{i.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(i.productId, i.quantity + 1)}
                      disabled={i.quantity >= i.stock}
                      aria-label={`Ajouter un ${i.name}`}
                      className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-line-strong hover:bg-ground disabled:opacity-40"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(i.productId)}
                      aria-label={`Supprimer ${i.name} du panier`}
                      className="ml-1 flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-ground hover:text-danger"
                    >
                      <Trash className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <span className="whitespace-nowrap font-bold">{formatPrice(i.price * i.quantity)} DT</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 border-t border-line pt-3.5">
            <div className="flex justify-between">
              <span className="text-muted">Sous-total</span>
              <span className="font-semibold">{formatPrice(subtotal)} DT</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted">Livraison</span>
              <span className="text-right font-semibold">
                {fee === null ? "Choisissez le gouvernorat" : `${formatPrice(fee)} DT`}
              </span>
            </div>
          </div>
          <div className="flex items-baseline justify-between border-t-2 border-ink pt-3.5">
            <span className="text-lg font-bold">Total</span>
            <span className="heading-display text-4xl">{formatPrice(total)} DT</span>
          </div>
          <p className="flex items-start gap-3 rounded-xl bg-ground p-3.5 text-[15px] leading-snug">
            <Phone className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            Après votre commande, nous vous appelons pour confirmer le total et le créneau de livraison.
          </p>
        </aside>
      </div>
    </>
  );
}
