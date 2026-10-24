"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircle, Minus, Plus, Search, Trash } from "lucide-react";
import { createStaffOrder } from "@/app/actions/orders";
import { formatPrice } from "@/lib/format";
import type { DeliveryZone } from "@/lib/types";
import { CustomerFields } from "@/components/shop/CustomerFields";

type P = { id: string; name: string; reference: string | null; price: number; stock: number };
type Line = { product: P; quantity: number };

export function StaffOrderForm({ products, zones }: { products: P[]; zones: DeliveryZone[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [governorate, setGovernorate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const results = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(s) || p.reference?.toLowerCase().includes(s))
      .slice(0, 8);
  }, [search, products]);

  const addProduct = (p: P) => {
    setLines((ls) => {
      const existing = ls.find((l) => l.product.id === p.id);
      if (existing) return ls.map((l) => (l.product.id === p.id ? { ...l, quantity: Math.min(l.quantity + 1, p.stock) } : l));
      return [...ls, { product: p, quantity: 1 }];
    });
    setSearch("");
  };
  const setQty = (id: string, q: number) =>
    setLines((ls) =>
      q <= 0 ? ls.filter((l) => l.product.id !== id) : ls.map((l) => (l.product.id === id ? { ...l, quantity: Math.min(q, l.product.stock) } : l)),
    );

  const subtotal = lines.reduce((n, l) => n + Number(l.product.price) * l.quantity, 0);
  const fee = Number(zones.find((z) => z.governorate === governorate)?.fee ?? 0);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lines.length === 0) {
      toast.error("Ajoutez au moins un produit.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.set("items", JSON.stringify(lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity }))));
    startTransition(async () => {
      const res = await createStaffOrder(formData);
      if (res.ok) {
        toast.success(`Commande n° ${res.orderNumber} enregistrée`);
        router.push("/gestion/commandes");
      } else {
        setErrors(res.errors ?? {});
        toast.error(res.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-5">
        <section className="card flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="heading-display text-[26px]">Articles</h2>
          <div className="relative">
            <label htmlFor="psearch" className="sr-only">Rechercher un produit</label>
            <Search className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-muted" aria-hidden="true" />
            <input
              id="psearch"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chercher un produit par nom ou référence…"
              className="input pl-11"
              autoComplete="off"
            />
            {results.length > 0 && (
              <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-80 overflow-auto rounded-xl border border-line bg-white shadow-xl">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={p.stock <= 0}
                      onClick={() => addProduct(p)}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left hover:bg-ground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>
                        <span className="block font-semibold">{p.name}</span>
                        <span className="text-sm text-muted">
                          {p.reference ? `Réf. ${p.reference} · ` : ""}Stock : {p.stock}
                        </span>
                      </span>
                      <span className="whitespace-nowrap font-bold">{formatPrice(p.price)} DT</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {lines.length > 0 ? (
            <ul className="flex flex-col divide-y divide-line">
              {lines.map((l) => (
                <li key={l.product.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="min-w-0 flex-1 font-semibold">{l.product.name}</span>
                  <span className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setQty(l.product.id, l.quantity - 1)} aria-label="Moins" className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line-strong">
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span className="w-8 text-center font-bold">{l.quantity}</span>
                    <button type="button" onClick={() => setQty(l.product.id, l.quantity + 1)} disabled={l.quantity >= l.product.stock} aria-label="Plus" className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line-strong disabled:opacity-40">
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </span>
                  <span className="w-28 text-right font-bold">{formatPrice(Number(l.product.price) * l.quantity)} DT</span>
                  <button type="button" onClick={() => setQty(l.product.id, 0)} aria-label={`Retirer ${l.product.name}`} className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted hover:text-danger">
                    <Trash className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-ground p-4 text-center text-muted">Aucun article. Recherchez un produit ci-dessus.</p>
          )}
        </section>

        <CustomerFields
          zones={zones}
          defaults={{ customer_name: "", phone: "", governorate: "", city: "", address: "" }}
          errors={errors}
          governorate={governorate}
          onGovernorateChange={setGovernorate}
        />
      </div>

      <aside className="card flex flex-col gap-4 p-5 xl:sticky xl:top-6">
        <label className="field-label">
          Canal de la commande
          <select name="source" className="input" defaultValue="phone">
            <option value="phone">Appel téléphonique</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </label>
        <div className="flex flex-col gap-1.5 border-t border-line pt-3">
          <div className="flex justify-between"><span className="text-muted">Sous-total</span><span className="font-semibold">{formatPrice(subtotal)} DT</span></div>
          <div className="flex justify-between"><span className="text-muted">Livraison</span><span className="font-semibold">{governorate ? `${formatPrice(fee)} DT` : "—"}</span></div>
        </div>
        <div className="flex items-baseline justify-between border-t-2 border-ink pt-3">
          <span className="text-lg font-bold">Total</span>
          <span className="heading-display text-4xl">{formatPrice(subtotal + fee)} DT</span>
        </div>
        <button type="submit" disabled={pending} className="btn-accent h-13 text-lg">
          {pending && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
          Enregistrer la commande
        </button>
      </aside>
    </form>
  );
}
