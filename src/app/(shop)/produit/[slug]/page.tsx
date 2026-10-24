import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Banknote, Check, MessageCircle, Phone, ShieldCheck, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings, PRODUCT_CARD_FIELDS } from "@/lib/data";
import { discountPercent, formatPrice, telHref, whatsappHref } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { BuyBox } from "@/components/shop/BuyBox";
import { ProductCard, type CardProduct } from "@/components/shop/ProductCard";
import { getT } from "@/i18n/server";
import { categoryName } from "@/i18n/config";

type Params = Promise<{ slug: string }>;

async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle<Product>();
  return data;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: (await getT()).t.meta.productNotFound };
  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: { images: product.images[0] ? [product.images[0]] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, settings, { t, locale }] = await Promise.all([getProduct(slug), getSettings(), getT()]);
  if (!product) notFound();

  const supabase = await createClient();
  const { data: related } = product.category_id
    ? await supabase
        .from("products")
        .select(PRODUCT_CARD_FIELDS)
        .eq("is_active", true)
        .eq("category_id", product.category_id)
        .neq("id", product.id)
        .limit(4)
        .returns<CardProduct[]>()
    : { data: [] as CardProduct[] };

  const off = discountPercent(product.price, product.old_price);
  const tel = telHref(settings.phone);
  const wa = whatsappHref(settings.whatsapp, t.product.waOrder(product.name, formatPrice(product.price)));
  const p = t.product;
  const cur = t.common.currency;
  const specs = Array.isArray(product.specs) ? product.specs : [];

  return (
    <div className="container-page py-6">
      <nav aria-label={t.common.breadcrumb} className="mb-5 flex flex-wrap gap-2 text-sm text-muted">
        <Link href="/" className="hover:underline">{t.common.home}</Link>
        <span aria-hidden="true">/</span>
        {product.category && (
          <>
            <Link href={`/produits?categorie=${product.category.slug}`} className="hover:underline">{categoryName(product.category, locale)}</Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span className="font-semibold text-ink">{product.name}</span>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} badge={product.badge ?? (off ? p.promo(off) : null)} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-muted">
              {product.category && categoryName(product.category, locale)}
              {product.reference && ` · ${p.reference(product.reference)}`}
            </span>
            <h1 className="heading-display text-4xl sm:text-5xl">{product.name}</h1>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-4">
            <span className="heading-display whitespace-nowrap text-[56px]">
              {formatPrice(product.price)} <span className="text-3xl">{cur}</span>
            </span>
            {off && <span className="whitespace-nowrap text-xl text-muted line-through">{formatPrice(product.old_price)} {cur}</span>}
          </div>

          {product.highlights.length > 0 && (
            <ul className="flex list-disc flex-col gap-1.5 ps-5 leading-relaxed">
              {product.highlights.map((h) => <li key={h}>{h}</li>)}
            </ul>
          )}

          {product.stock > 0 ? (
            <span className="flex items-center gap-2 font-bold text-ok">
              <Check className="size-5" aria-hidden="true" />
              {product.stock > 5 ? p.readyToShip : p.onlyLeft(product.stock)}
            </span>
          ) : (
            <span className="font-bold text-danger">{p.outOfStockCall}</span>
          )}

          <BuyBox
            product={{ id: product.id, slug: product.slug, name: product.name, price: product.price, images: product.images, stock: product.stock }}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <a href={tel} className="btn-dark h-14 text-[17px]">
              <Phone className="size-5" aria-hidden="true" />
              {p.orderPhone}
            </a>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp h-14 text-[17px]">
              <MessageCircle className="size-5" aria-hidden="true" />
              {p.orderWhatsapp}
            </a>
          </div>

          <div className="card divide-y divide-line px-5">
            <p className="flex items-center gap-3.5 py-3.5">
              <Truck className="size-7 shrink-0" strokeWidth={1.6} aria-hidden="true" />
              <span><strong>{p.deliveryTitle}</strong> · {p.deliveryText}</span>
            </p>
            <p className="flex items-center gap-3.5 py-3.5">
              <Banknote className="size-7 shrink-0" strokeWidth={1.6} aria-hidden="true" />
              <span><strong>{p.codTitle}</strong> · {p.codText}</span>
            </p>
            <p className="flex items-center gap-3.5 py-3.5">
              <ShieldCheck className="size-7 shrink-0" strokeWidth={1.6} aria-hidden="true" />
              <span><strong>{p.confirmTitle}</strong> · {p.confirmText}</span>
            </p>
          </div>
        </div>
      </div>

      {(specs.length > 0 || product.description) && (
        <section className="mt-12 grid gap-8 lg:grid-cols-2">
          {specs.length > 0 && (
            <div>
              <h2 className="heading-display mb-4 text-[34px]">{p.specs}</h2>
              <div className="card overflow-hidden">
                <table className="w-full border-collapse">
                  <tbody>
                    {specs.map((s, i) => (
                      <tr key={i} className="border-b border-line last:border-0">
                        <th scope="row" className="w-[45%] px-5 py-3.5 text-start font-semibold text-muted">{s.label}</th>
                        <td className="px-5 py-3.5 font-semibold">{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {product.description && (
            <div>
              <h2 className="heading-display mb-4 text-[34px]">{p.description}</h2>
              <p className="whitespace-pre-line text-[17px] leading-relaxed">{product.description}</p>
              <p className="mt-4 text-[17px] leading-relaxed text-muted">
                {p.question}
              </p>
            </div>
          )}
        </section>
      )}

      {related && related.length > 0 && (
        <section className="mt-14">
          <h2 className="heading-display mb-5 text-4xl">{p.related}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} phoneHref={tel} />)}
          </div>
        </section>
      )}
    </div>
  );
}
