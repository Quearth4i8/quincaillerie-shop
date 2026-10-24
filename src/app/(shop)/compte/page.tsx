import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, KeyRound, LayoutDashboard, LogOut, Package } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice, ROLE_LABEL } from "@/lib/format";
import type { Order } from "@/lib/types";
import { signOut } from "@/app/actions/auth";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const user = await requireRole(["customer", "manager", "admin"], "/compte");
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total, created_at, order_items(quantity)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<(Pick<Order, "id" | "order_number" | "status" | "total" | "created_at"> & { order_items: { quantity: number }[] })[]>();

  const isStaff = user.role !== "customer";

  return (
    <div className="container-page py-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="heading-display text-4xl sm:text-5xl">
            Bonjour{user.profile?.full_name ? `, ${user.profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1.5 text-muted">
            {user.email} · {ROLE_LABEL[user.role]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isStaff && (
            <Link href={user.role === "admin" ? "/admin" : "/gestion"} className="btn-dark h-11">
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Espace {user.role === "admin" ? "administration" : "gestion"}
            </Link>
          )}
          <Link href="/compte/mot-de-passe" className="btn-outline h-11">
            <KeyRound className="size-4" aria-hidden="true" />
            Mot de passe
          </Link>
          <form action={signOut}>
            <button type="submit" className="btn-outline h-11">
              <LogOut className="size-4" aria-hidden="true" />
              Déconnexion
            </button>
          </form>
        </div>
      </div>

      <div className="grid items-start gap-7 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="orders">
          <h2 id="orders" className="heading-display mb-4 text-3xl">Mes commandes</h2>
          {orders && orders.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/compte/commandes/${o.id}`} className="card flex items-center gap-4 p-4 transition hover:border-ink">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ground">
                      <Package className="size-6" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">Commande n° {o.order_number}</span>
                        <StatusBadge status={o.status} />
                      </span>
                      <span className="text-sm text-muted">
                        {formatDate(o.created_at)} · {o.order_items.reduce((n, i) => n + i.quantity, 0)} article(s)
                      </span>
                    </span>
                    <span className="whitespace-nowrap font-bold">{formatPrice(o.total)} DT</span>
                    <ChevronRight className="size-5 text-muted" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="card flex flex-col items-center gap-3 p-8 text-center">
              <p className="font-semibold">Vous n’avez pas encore passé de commande.</p>
              <Link href="/produits" className="btn-accent h-11">Voir le catalogue</Link>
            </div>
          )}
        </section>

        <section aria-labelledby="profile" className="card p-5 sm:p-6">
          <h2 id="profile" className="heading-display mb-1 text-3xl">Mes informations</h2>
          <p className="mb-4 text-sm text-muted">Pré-remplies automatiquement lors de vos prochaines commandes.</p>
          <ProfileForm profile={user.profile} />
        </section>
      </div>
    </div>
  );
}
