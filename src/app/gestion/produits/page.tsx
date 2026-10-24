import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/admin/Shell";
import { ProductImage } from "@/components/shop/ProductImage";
import { ActiveToggle } from "./ActiveToggle";

export const metadata: Metadata = { title: "Produits" };

const PER_PAGE = 30;

type Row = {
  id: string; slug: string; name: string; reference: string | null; price: number; stock: number;
  images: string[]; is_active: boolean; is_featured: boolean; category: { name: string } | null;
};

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categorie?: string; stock?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const page = Math.max(1, Number(sp.page) || 1);
  const categories = await getCategories();

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, slug, name, reference, price, stock, images, is_active, is_featured, category:categories(name)", { count: "exact" });
  if (q) {
    const safe = q.replace(/[%,()*\\]/g, " ");
    query = query.or(`name.ilike.%${safe}%,reference.ilike.%${safe}%`);
  }
  if (sp.categorie) query = query.eq("category_id", sp.categorie);
  if (sp.stock === "faible") query = query.lte("stock", 3);
  const from = (page - 1) * PER_PAGE;
  const { data, count } = await query.order("name").range(from, from + PER_PAGE - 1).returns<Row[]>();
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER_PAGE));

  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sp.categorie) params.set("categorie", sp.categorie);
    if (sp.stock) params.set("stock", sp.stock);
    if (n > 1) params.set("page", String(n));
    return `/gestion/produits${params.size ? `?${params}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Produits"
        description={`${count ?? 0} produit(s)`}
        actions={
          <Link href="/gestion/produits/nouveau" className="btn-accent h-11">
            <Plus className="size-4" aria-hidden="true" />
            Nouveau produit
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <label htmlFor="pq" className="sr-only">Rechercher</label>
        <div className="relative min-w-0 flex-1 basis-60">
          <Search className="pointer-events-none absolute left-3.5 top-3 size-5 text-muted" aria-hidden="true" />
          <input id="pq" name="q" defaultValue={q} placeholder="Nom ou référence…" className="input h-11 pl-11" />
        </div>
        <label htmlFor="pcat" className="sr-only">Rayon</label>
        <select id="pcat" name="categorie" defaultValue={sp.categorie ?? ""} className="input h-11 w-auto">
          <option value="">Tous les rayons</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label htmlFor="pstock" className="sr-only">Stock</label>
        <select id="pstock" name="stock" defaultValue={sp.stock ?? ""} className="input h-11 w-auto">
          <option value="">Tout le stock</option>
          <option value="faible">Stock faible (≤ 3)</option>
        </select>
        <button type="submit" className="btn-dark h-11">Filtrer</button>
      </form>

      {data && data.length > 0 ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="bg-ground text-sm text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Produit</th>
                <th scope="col" className="px-4 py-3 font-semibold">Rayon</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Prix (DT)</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Stock</th>
                <th scope="col" className="px-4 py-3 font-semibold">En ligne</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t border-line hover:bg-ground/60">
                  <td className="px-4 py-2.5">
                    <Link href={`/gestion/produits/${p.id}`} className="flex items-center gap-3">
                      <ProductImage src={p.images[0]} alt="" sizes="48px" className="size-12 shrink-0 rounded-lg" />
                      <span>
                        <span className="block font-semibold hover:underline">{p.name}</span>
                        <span className="text-xs text-muted">
                          {p.reference ?? "—"}
                          {p.is_featured && " · mis en avant"}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-sm">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{formatPrice(p.price)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={cn(
                        "badge",
                        p.stock === 0
                          ? "bg-red-100 text-red-900 ring-red-300"
                          : p.stock <= 3
                            ? "bg-amber-100 text-amber-900 ring-amber-300"
                            : "bg-emerald-50 text-emerald-900 ring-emerald-200",
                      )}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <ActiveToggle id={p.id} active={p.is_active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <p className="font-semibold">Aucun produit.</p>
          <Link href="/gestion/produits/nouveau" className="btn-accent h-11">Ajouter un produit</Link>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3">
          {page > 1 && <Link href={pageHref(page - 1)} className="btn-outline h-10 border">Précédent</Link>}
          <span className="text-sm text-muted">Page {page} / {pages}</span>
          {page < pages && <Link href={pageHref(page + 1)} className="btn-outline h-10 border">Suivant</Link>}
        </nav>
      )}
    </>
  );
}
