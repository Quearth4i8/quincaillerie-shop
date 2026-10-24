import Link from "next/link";
import { getCategories, getSettings } from "@/lib/data";
import { telHref } from "@/lib/format";
import { getT } from "@/i18n/server";
import { categoryName } from "@/i18n/config";
import { BrandMark } from "@/components/BrandMark";

export async function Footer() {
  const [settings, categories, { t, locale }] = await Promise.all([getSettings(), getCategories(), getT()]);

  return (
    <footer className="mt-16 bg-ink text-zinc-300">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-3">
            <BrandMark size={40} tile />
            <span lang="fr" className="heading-display text-3xl uppercase text-white">{settings.shop_name}</span>
          </span>
          <p className="leading-relaxed">{t.footer.about}</p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="mb-1 font-bold text-white">{t.footer.departments}</span>
          {categories.slice(0, 6).map((c) => (
            <Link key={c.id} href={`/produits?categorie=${c.slug}`} className="hover:text-white">
              {categoryName(c, locale)}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <span className="mb-1 font-bold text-white">{t.footer.account}</span>
          <Link href="/compte" className="hover:text-white">{t.footer.myOrders}</Link>
          <Link href="/panier" className="hover:text-white">{t.footer.myCart}</Link>
          <Link href="/connexion" className="hover:text-white">{t.footer.login}</Link>
        </div>
        <div className="flex flex-col items-start gap-2">
          <span className="mb-1 font-bold text-white">{t.footer.contact}</span>
          <a href={telHref(settings.phone)} dir="ltr" className="text-xl font-bold text-white hover:underline">{settings.phone}</a>
          {settings.address && <span>{settings.address}</span>}
          {settings.hours && <span>{settings.hours}</span>}
          {settings.email && <a href={`mailto:${settings.email}`} className="hover:text-white">{settings.email}</a>}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page py-5 text-sm">
          © {new Date().getFullYear()} {settings.shop_name} · {t.footer.legal}
        </div>
      </div>
    </footer>
  );
}
