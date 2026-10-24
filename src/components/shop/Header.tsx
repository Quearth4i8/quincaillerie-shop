import Link from "next/link";
import { LayoutGrid, Phone, User } from "lucide-react";
import { getCategories, getSettings } from "@/lib/data";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import { telHref } from "@/lib/format";
import { getT } from "@/i18n/server";
import { categoryName } from "@/i18n/config";
import { Logo } from "./Logo";
import { SearchForm } from "./SearchForm";
import { CartLink } from "./CartLink";
import { LanguageSwitch } from "./LanguageSwitch";

export async function Header() {
  const [settings, categories, user, { t, locale }] = await Promise.all([
    getSettings(),
    getCategories(),
    getCurrentUser(),
    getT(),
  ]);

  return (
    <>
      <div className="bg-ink text-sm text-zinc-200">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
          <p className="flex flex-wrap gap-x-6">
            <span>{t.topbar.delivery}</span>
            <span className="hidden sm:inline">{t.topbar.cash}</span>
          </p>
          <div className="flex items-center gap-4">
            <a href={telHref(settings.phone)} dir="ltr" className="font-semibold text-white hover:underline">
              {settings.phone}
            </a>
            <LanguageSwitch />
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="container-page flex flex-wrap items-center gap-x-8 gap-y-3 py-3 md:py-4">
          <Logo name={settings.shop_name} tagline={t.header.tagline ?? settings.tagline} homeLabel={t.header.homeLabel(settings.shop_name)} />
          <div className="order-last w-full md:order-none md:w-auto md:flex-1">
            <SearchForm label={t.search.label} placeholder={t.search.placeholder} submitLabel={t.search.submit} />
          </div>
          <div className="ms-auto flex items-center gap-2 md:ms-0">
            <a href={telHref(settings.phone)} className="hidden items-center gap-2.5 px-1 lg:flex">
              <span className="flex size-11 items-center justify-center rounded-full border-2 border-ink">
                <Phone className="size-5" aria-hidden="true" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[13px] text-muted">{t.header.orderByPhone}</span>
                <span dir="ltr" className="text-lg font-bold">{settings.phone}</span>
              </span>
            </a>
            <Link
              href={user ? homeForRole(user.role) : "/connexion"}
              className="btn-outline hidden h-12 px-4 md:inline-flex"
              aria-label={user ? t.header.mySpace : t.header.signInLabel}
            >
              <User className="size-5" aria-hidden="true" />
              <span className="hidden xl:inline">{user ? t.header.mySpace : t.header.login}</span>
            </Link>
            <CartLink />
          </div>
        </div>
        <nav aria-label={t.header.departments} className="border-t border-line">
          <div className="container-page flex gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
            <Link href="/produits" className="flex items-center gap-2 bg-accent px-3.5 py-3 font-bold text-ink">
              <LayoutGrid className="size-4" aria-hidden="true" />
              {t.header.allDepartments}
            </Link>
            {categories.map((c) => (
              <Link key={c.id} href={`/produits?categorie=${c.slug}`} className="px-3 py-3 font-medium hover:bg-ground">
                {categoryName(c, locale)}
              </Link>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}
