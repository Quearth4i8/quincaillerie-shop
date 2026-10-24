import Link from "next/link";
import { Banknote, MessageCircle, Phone, PhoneCall, RefreshCw, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getSettings, PRODUCT_CARD_FIELDS } from "@/lib/data";
import { telHref, whatsappHref } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";
import { ProductCard, type CardProduct } from "@/components/shop/ProductCard";

export default async function HomePage() {
  const supabase = await createClient();
  const [settings, categories, { data: featured }] = await Promise.all([
    getSettings(),
    getCategories(),
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
  const wa = whatsappHref(settings.whatsapp, "Bonjour, je voudrais passer une commande.");
  const [firstCat, secondCat] = categories;

  return (
    <>
      {/* Hero */}
      <section className="container-page grid gap-5 pt-6 md:pt-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex min-h-[380px] flex-col justify-between gap-8 rounded-[18px] bg-ink p-7 text-white sm:p-11">
          <div className="flex flex-col gap-4">
            <span className="self-start rounded-md bg-accent px-3 py-1.5 text-sm font-bold tracking-wide text-ink">
              QUINCAILLERIE DE QUARTIER · EN LIGNE
            </span>
            <h1 className="heading-display text-5xl sm:text-6xl lg:text-[68px] lg:leading-[0.95]">
              Votre quincaillerie,
              <br />
              livrée devant votre porte.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-zinc-300">
              Outillage, plomberie, électricité, peinture, visserie. Commandez en ligne ou par simple appel, on vous
              livre et vous payez à la réception.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={tel} className="btn-accent h-14 px-6 text-lg">
              <Phone className="size-5" aria-hidden="true" />
              Appeler pour commander
            </a>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp h-14 px-6 text-lg">
              <MessageCircle className="size-5" aria-hidden="true" />
              WhatsApp
            </a>
            <Link href="/produits" className="btn h-14 border-2 border-zinc-500 px-6 text-lg text-white hover:border-white">
              Voir le catalogue
            </Link>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
          {[firstCat, secondCat].filter(Boolean).map((c, i) => (
            <Link
              key={c.id}
              href={`/produits?categorie=${c.slug}`}
              className={`relative flex min-h-[180px] items-end overflow-hidden rounded-[18px] p-7 transition hover:brightness-[0.98] ${i === 0 ? "bg-[#e4e3dc]" : "bg-accent"}`}
            >
              <CategoryIcon
                name={c.icon}
                className={`absolute right-6 top-1/2 size-24 -translate-y-1/2 ${i === 0 ? "text-zinc-500" : "text-[#6b5300]"}`}
              />
              <span className="relative flex flex-col gap-1.5">
                <span className="heading-display text-[34px]">{c.name}</span>
                <span className="font-semibold underline">Découvrir le rayon →</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how" className="container-page pt-5">
        <h2 id="how" className="sr-only">Comment ça marche</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            ["Choisissez vos articles", "Sur le site, ou dites-nous simplement ce qu’il vous faut par téléphone."],
            ["On vous appelle", "Nous confirmons la commande, le prix total et l’heure de livraison."],
            ["Livré chez vous", "Vous vérifiez la marchandise et payez cash à la réception."],
          ].map(([title, text], i) => (
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
            <h2 id="cats" className="heading-display text-4xl">Nos rayons</h2>
            <Link href="/produits" className="font-semibold underline">Tout voir</Link>
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
                <span className="text-[15px] font-semibold leading-tight">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <section aria-labelledby="best" className="container-page pt-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 id="best" className="heading-display text-4xl">Les plus demandés</h2>
          <Link href="/produits" className="font-semibold underline">Voir tous les produits</Link>
        </div>
        {featured && featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} phoneHref={tel} />
            ))}
          </div>
        ) : (
          <p className="card p-8 text-center text-muted">Le catalogue arrive bientôt. Appelez-nous pour commander.</p>
        )}
      </section>

      {/* Call band */}
      <section className="container-page pt-14">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[18px] bg-accent p-7 sm:p-11">
          <div className="flex max-w-2xl flex-col gap-2">
            <h2 className="heading-display text-4xl sm:text-[42px]">Vous ne trouvez pas un article ?</h2>
            <p className="text-lg">
              Appelez-nous ou envoyez une photo sur WhatsApp. On le cherche pour vous et on vous rappelle avec le prix.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={tel} className="btn-dark h-[60px] px-6 text-xl">
              <PhoneCall className="size-6" aria-hidden="true" />
              {settings.phone}
            </a>
            <a
              href={whatsappHref(settings.whatsapp, "Bonjour, je cherche cet article :")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn h-[60px] bg-white px-6 text-lg text-ink hover:bg-ground"
            >
              <MessageCircle className="size-5 text-whatsapp" aria-hidden="true" />
              Envoyer une photo
            </a>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section aria-label="Nos engagements" className="container-page pt-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Truck, title: "Livraison à domicile", text: "Partout en Tunisie" },
            { icon: Banknote, title: "Paiement à la livraison", text: "Aucune carte nécessaire" },
            { icon: Phone, title: "Conseil par téléphone", text: "Un vrai quincaillier vous répond" },
            { icon: RefreshCw, title: "Échange facile", text: "Article non conforme ? On l’échange" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3.5 py-3">
              <Icon className="size-9 shrink-0" strokeWidth={1.6} aria-hidden="true" />
              <span className="flex flex-col">
                <span className="font-bold">{title}</span>
                <span className="text-sm text-muted">{text}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
