"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartColumn, ClipboardList, LayoutDashboard, MapPin, Package, PhoneCall, Settings, Tags, Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const MANAGER: Item[] = [
  { href: "/gestion", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/gestion/commandes", label: "Commandes", icon: ClipboardList },
  { href: "/gestion/commandes/nouvelle", label: "Commande téléphone", icon: PhoneCall, exact: true },
  { href: "/gestion/produits", label: "Produits", icon: Package },
  { href: "/gestion/categories", label: "Rayons", icon: Tags },
];

const ADMIN: Item[] = [
  { href: "/admin", label: "Statistiques", icon: ChartColumn, exact: true },
  { href: "/admin/utilisateurs", label: "Utilisateurs & rôles", icon: Users },
  { href: "/admin/livraison", label: "Zones de livraison", icon: MapPin },
  { href: "/admin/parametres", label: "Paramètres boutique", icon: Settings },
];

export function NavLinks({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const isActive = (item: Item) => {
    if (item.exact) return pathname === item.href;
    // "/gestion/commandes" must not stay active on "/gestion/commandes/nouvelle"
    if (item.href === "/gestion/commandes" && pathname === "/gestion/commandes/nouvelle") return false;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const renderGroup = (title: string, items: Item[]) => (
    <div className="flex shrink-0 gap-1 lg:flex-col">
      <span className="hidden px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-zinc-500 lg:block">{title}</span>
      {items.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 font-semibold transition",
              active ? "bg-accent text-ink" : "text-zinc-300 hover:bg-white/10 hover:text-white",
            )}
          >
            <item.icon className="size-[18px]" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );

  return (
    <nav aria-label="Back-office" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3">
      {renderGroup("Gestion", MANAGER)}
      {role === "admin" && renderGroup("Administration", ADMIN)}
    </nav>
  );
}
