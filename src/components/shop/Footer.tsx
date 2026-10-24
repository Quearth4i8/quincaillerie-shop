import Link from "next/link";
import { getCategories, getSettings } from "@/lib/data";
import { telHref } from "@/lib/format";

export async function Footer() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);

  return (
    <footer className="mt-16 bg-ink text-zinc-300">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <span className="heading-display text-3xl uppercase text-white">{settings.shop_name}</span>
          <p className="leading-relaxed">
            Quincaillerie de quartier, maintenant en ligne. Commande par téléphone, WhatsApp ou sur le site.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="mb-1 font-bold text-white">Rayons</span>
          {categories.slice(0, 6).map((c) => (
            <Link key={c.id} href={`/produits?categorie=${c.slug}`} className="hover:text-white">
              {c.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <span className="mb-1 font-bold text-white">Votre compte</span>
          <Link href="/compte" className="hover:text-white">Mes commandes</Link>
          <Link href="/panier" className="hover:text-white">Mon panier</Link>
          <Link href="/connexion" className="hover:text-white">Connexion</Link>
        </div>
        <div className="flex flex-col gap-2">
          <span className="mb-1 font-bold text-white">Contact</span>
          <a href={telHref(settings.phone)} className="text-xl font-bold text-white hover:underline">{settings.phone}</a>
          {settings.address && <span>{settings.address}</span>}
          {settings.hours && <span>{settings.hours}</span>}
          {settings.email && <a href={`mailto:${settings.email}`} className="hover:text-white">{settings.email}</a>}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page py-5 text-sm">
          © {new Date().getFullYear()} {settings.shop_name} · Prix en dinars tunisiens (DT), TTC
        </div>
      </div>
    </footer>
  );
}
