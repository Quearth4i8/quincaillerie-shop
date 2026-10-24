import Link from "next/link";
import { LayoutGrid, Phone, User } from "lucide-react";
import { getCategories, getSettings } from "@/lib/data";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import { telHref } from "@/lib/format";
import { Logo } from "./Logo";
import { SearchForm } from "./SearchForm";
import { CartLink } from "./CartLink";

export async function Header() {
  const [settings, categories, user] = await Promise.all([getSettings(), getCategories(), getCurrentUser()]);

  return (
    <>
      <div className="bg-ink text-sm text-zinc-200">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
          <p className="flex flex-wrap gap-x-6">
            <span>Livraison à domicile partout en Tunisie</span>
            <span className="hidden sm:inline">Paiement cash à la livraison</span>
          </p>
          <a href={telHref(settings.phone)} className="font-semibold text-white hover:underline">
            {settings.phone}
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="container-page flex flex-wrap items-center gap-x-8 gap-y-3 py-3 md:py-4">
          <Logo name={settings.shop_name} tagline={settings.tagline} />
          <div className="order-last w-full md:order-none md:w-auto md:flex-1">
            <SearchForm />
          </div>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <a href={telHref(settings.phone)} className="hidden items-center gap-2.5 px-1 lg:flex">
              <span className="flex size-11 items-center justify-center rounded-full border-2 border-ink">
                <Phone className="size-5" aria-hidden="true" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[13px] text-muted">Commandez par téléphone</span>
                <span className="text-lg font-bold">{settings.phone}</span>
              </span>
            </a>
            <Link
              href={user ? homeForRole(user.role) : "/connexion"}
              className="btn-outline hidden h-12 px-4 md:inline-flex"
              aria-label={user ? "Mon espace" : "Se connecter"}
            >
              <User className="size-5" aria-hidden="true" />
              <span className="hidden xl:inline">{user ? "Mon espace" : "Connexion"}</span>
            </Link>
            <CartLink />
          </div>
        </div>
        <nav aria-label="Rayons" className="border-t border-line">
          <div className="container-page flex gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
            <Link href="/produits" className="flex items-center gap-2 bg-accent px-3.5 py-3 font-bold text-ink">
              <LayoutGrid className="size-4" aria-hidden="true" />
              Tous les rayons
            </Link>
            {categories.map((c) => (
              <Link key={c.id} href={`/produits?categorie=${c.slug}`} className="px-3 py-3 font-medium hover:bg-ground">
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}
