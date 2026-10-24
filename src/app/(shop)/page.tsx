import Link from "next/link";
import { Banknote, MessageCircle, Phone, PhoneCall, RefreshCw, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getSettings, PRODUCT_CARD_FIELDS } from "@/lib/data";
import { telHref, whatsappHref } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";
import { getT } from "@/i18n/server";
import { categoryName } from "@/i18n/config";
import { ProductCard, type CardProduct } from "@/components/shop/ProductCard";

const PERK_ICONS = [Truck, Banknote, Phone, RefreshCw];

export default async function HomePage() {
  const supabase = await createClient();
  const [settings, categories, { t, locale }, { data: featured }] = await Promise.all([
    getSettings(),
    getCategories(),
    getT(),
    supabase
      .from("products")
      .select(PRODUCT_CARD_FIELDS)
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<CardProduct[]>(),
  ]);

  const tel = telHref(settings.phone);
  const wa = whatsappHref(settings.whatsapp, t.home.waMessage);

  return (
    <>
      {/* Hero */}
      <section className="container-page pt-6 md:pt-8">
        <div className="flex min-h-[380px] flex-col justify-between gap-8 rounded-[18px] bg-ink p-7 text-white sm:p-11">
          <div className="flex flex-col gap-4">
            <span className="self-start rounded-md bg-accent px-3 py-1.5 text-sm font-bold tracking-wide text-ink">
              {t.home.badge}
            </span>
            <h1 className="heading-display text-5xl sm:text-6xl lg:text-[68px] lg:leading-[0.95]">
              {t.home.title1}
              <br />
              {t.home.title2}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-zinc-300">{t.home.intro}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={tel} className="btn-accent h-14 px-6 text-lg">
              <Phone className="size-5" aria-hidden="true" />
              {t.home.callToOrder}
            </a>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp h-14 px-6 text-lg">
              <MessageCircle className="size-5" aria-hidden="true" />
              {t.common.whatsapp}
            </a>
            <Link href="/produits" className="btn h-14 border-2 border-zinc-500 px-6 text-lg text-white hover:border-white">
              {t.common.seeCatalogue}
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how" className="container-page pt-5">
        <h2 id="how" className="sr-only">{t.home.howTitle}</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {t.home.steps.map(([title, text], i) => (
            <li key={title} className="card flex items-start gap-4 p-5">
              <span className="heading-display flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-ink text-2xl text-accent">
                {i + 1}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-lg font-bold">{title}</span>
                <span className="text-[15px] leading-snug text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section aria-labelledby="cats" className="container-page pt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 id="cats" className="heading-display text-4xl">{t.home.departments}</h2>
            <Link href="/produits" className="font-semibold underline">{t.home.seeAll}</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/produits?categorie=${c.slug}`}
                className="card flex flex-col items-center gap-3 px-3 py-5 text-center transition hover:border-ink"
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-ground">
                  <CategoryIcon name={c.icon} className="size-8" />
                </span>
                <span className="text-[15px] font-semibold leading-tight">{categoryName(c, locale)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <section aria-labelledby="best" className="container-page pt-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 id="best" className="heading-display text-4xl">{t.home.best}</h2>
          <Link href="/produits" className="font-semibold underline">{t.home.seeAllProducts}</Link>
        </div>
        {featured && featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} phoneHref={tel} />
            ))}
          </div>
        ) : (
          <p className="card p-8 text-center text-muted">{t.home.comingSoon}</p>
        )}
      </section>

      {/* Call band */}
      <section className="container-page pt-14">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[18px] bg-accent p-7 sm:p-11">
          <div className="flex max-w-2xl flex-col gap-2">
            <h2 className="heading-display text-4xl sm:text-[42px]">{t.home.notFoundTitle}</h2>
            <p className="text-lg">{t.home.notFoundText}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={tel} className="btn-dark h-[60px] px-6 text-xl">
              <PhoneCall className="size-6" aria-hidden="true" />
              <span dir="ltr">{settings.phone}</span>
            </a>
            <a
              href={whatsappHref(settings.whatsapp, t.home.waLookingFor)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn h-[60px] bg-white px-6 text-lg text-ink hover:bg-ground"
            >
              <MessageCircle className="size-5 text-whatsapp" aria-hidden="true" />
              {t.home.sendPhoto}
            </a>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section aria-label={t.home.perksLabel} className="container-page pt-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.home.perks.map(([title, text], i) => {
            const Icon = PERK_ICONS[i] ?? Truck;
            return (
              <div key={title} className="flex items-center gap-3.5 py-3">
                <Icon className="size-9 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                <span className="flex flex-col">
                  <span className="font-bold">{title}</span>
                  <span className="text-sm text-muted">{text}</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
