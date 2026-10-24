import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getSettings, PRODUCT_CARD_FIELDS } from "@/lib/data";
import { telHref } from "@/lib/format";
import { PAGE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { ProductCard, type CardProduct } from "@/components/shop/ProductCard";
import { SortSelect } from "@/components/shop/SortSelect";
import { getT } from "@/i18n/server";
import { categoryName } from "@/i18n/config";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const q = one(sp.q);
  const { t } = await getT();
  return { title: q ? t.meta.search(q) : t.meta.catalogue };
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 80);
  const catSlug = one(sp.categorie);
  const sort = one(sp.tri) || "populaire";
  const min = Number(one(sp.min)) || undefined;
  const max = Number(one(sp.max)) || undefined;
  const inStock = one(sp.stock) === "1";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const [settings, categories, { t, locale }] = await Promise.all([getSettings(), getCategories(), getT()]);
  const c = t.catalog;
  const category = categories.find((c) => c.slug === catSlug);

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_CARD_FIELDS, { count: "exact" })
    .eq("is_active", true);

  if (category) query = query.eq("category_id", category.id);
  if (q) {
    // Strip characters that have meaning in PostgREST filter syntax
    const safe = q.replace(/[%,()*\\]/g, " ");
    query = query.or(`name.ilike.%${safe}%,reference.ilike.%${safe}%,description.ilike.%${safe}%`);
  }
  if (min !== undefined) query = query.gte("price", min);
  if (max !== undefined) query = query.lte("price", max);
  if (inStock) query = query.gt("stock", 0);

  if (sort === "prix-asc") query = query.order("price", { ascending: true });
  else if (sort === "prix-desc") query = query.order("price", { ascending: false });
  else if (sort === "nouveau") query = query.order("created_at", { ascending: false });
  else query = query.order("is_featured", { ascending: false }).order("name");

  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await query.range(from, from + PAGE_SIZE - 1).returns<CardProduct[]>();
  const products = data ?? [];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const title = q ? c.resultsFor(q) : category ? categoryName(category, locale) : c.allProducts;

  const hrefWith = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      q: q || undefined,
      categorie: catSlug || undefined,
      tri: sort !== "populaire" ? sort : undefined,
      min: min?.toString(),
      max: max?.toString(),
      stock: inStock ? "1" : undefined,
      ...patch,
    };
    Object.entries(base).forEach(([k, v]) => v && params.set(k, v));
    const s = params.toString();
    return `/produits${s ? `?${s}` : ""}`;
  };

  return (
    <div className="container-page py-6">
      <nav aria-label={t.common.breadcrumb} className="flex flex-wrap gap-2 text-sm text-muted">
        <Link href="/" className="hover:underline">{t.common.home}</Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-ink">{category ? categoryName(category, locale) : t.common.catalogue}</span>
      </nav>

      <div className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="heading-display text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-1.5 text-muted">{c.count(total)}</p>
        </div>
        <SortSelect value={sort} />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside aria-label={c.filters} className="card flex flex-col gap-6 p-5 lg:sticky lg:top-40 lg:w-64 lg:shrink-0">
          <div>
            <h2 className="mb-2.5 text-[17px] font-bold">{c.departments}</h2>
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
              <li>
                <Link
                  href={hrefWith({ categorie: undefined, page: undefined })}
                  className={cn("block rounded-lg px-3 py-2", !category ? "bg-ink font-bold text-white" : "bg-ground hover:bg-line lg:bg-transparent")}
                >
                  {c.allDepartments}
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={hrefWith({ categorie: cat.slug, page: undefined })}
                    aria-current={cat.id === category?.id ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-3 py-2",
                      cat.id === category?.id ? "bg-ink font-bold text-white" : "bg-ground hover:bg-line lg:bg-transparent",
                    )}
                  >
                    {categoryName(cat, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <form action="/produits" className="flex flex-col gap-4">
            {q && <input type="hidden" name="q" value={q} />}
            {catSlug && <input type="hidden" name="categorie" value={catSlug} />}
            {sort !== "populaire" && <input type="hidden" name="tri" value={sort} />}
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[17px] font-bold">{c.price}</legend>
              <div className="flex items-center gap-2">
                <label htmlFor="min" className="sr-only">{c.minLabel}</label>
                <input id="min" name="min" type="number" min={0} step="any" defaultValue={min} placeholder={c.min} className="input h-11" />
                <span aria-hidden="true">–</span>
                <label htmlFor="max" className="sr-only">{c.maxLabel}</label>
                <input id="max" name="max" type="number" min={0} step="any" defaultValue={max} placeholder={c.max} className="input h-11" />
              </div>
            </fieldset>
            <label className="flex min-h-8 items-center gap-2.5 font-semibold">
              <input type="checkbox" name="stock" value="1" defaultChecked={inStock} className="size-5 accent-ink" />
              {c.inStockOnly}
            </label>
            <button type="submit" className="btn-dark h-11">{c.apply}</button>
          </form>

          <div className="flex flex-col gap-2.5 rounded-xl bg-ground p-4">
            <span className="font-bold">{c.adviceTitle}</span>
            <span className="text-sm leading-snug text-muted">{c.adviceText}</span>
            <a href={telHref(settings.phone)} className="btn-accent h-11">{t.common.callNumber(settings.phone)}</a>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} phoneHref={telHref(settings.phone)} />
              ))}
            </div>
          ) : (
            <div className="card flex flex-col items-center gap-3 p-10 text-center">
              <p className="text-lg font-semibold">{c.noResults}</p>
              <p className="text-muted">{c.noResultsHint}</p>
              <a href={telHref(settings.phone)} className="btn-accent mt-2 h-12">{t.common.callNumber(settings.phone)}</a>
            </div>
          )}

          {pages > 1 && (
            <nav aria-label={c.pagination} className="mt-8 flex flex-wrap justify-center gap-2">
              {page > 1 && (
                <Link href={hrefWith({ page: String(page - 1) })} className="btn-outline h-11 border px-4">{c.prev}</Link>
              )}
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter((n) => Math.abs(n - page) <= 2 || n === 1 || n === pages)
                .map((n) => (
                  <Link
                    key={n}
                    href={hrefWith({ page: n === 1 ? undefined : String(n) })}
                    aria-current={n === page ? "page" : undefined}
                    className={cn("btn h-11 w-11 px-0", n === page ? "bg-ink text-white" : "border border-line bg-white")}
                  >
                    {n}
                  </Link>
                ))}
              {page < pages && (
                <Link href={hrefWith({ page: String(page + 1) })} className="btn-outline h-11 border px-4">{c.next}</Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
