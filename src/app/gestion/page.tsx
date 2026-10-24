import type { Metadata } from "next";
import Link from "next/link";
import { PhoneCall, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { startOfTodayTunis } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { PageHeader, StatCard } from "@/components/admin/Shell";
import { ORDER_ROW_FIELDS, OrdersTable, type OrderRow } from "@/components/admin/OrdersTable";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function ManagerDashboard() {
  const supabase = await createClient();
  const today = startOfTodayTunis();

  const count = (status?: string) => {
    let q = supabase.from("orders").select("id", { count: "exact", head: true });
    if (status) q = q.eq("status", status);
    return q;
  };

  const [pending, delivering, todayOrders, todayRevenue, latest, lowStock] = await Promise.all([
    count("pending"),
    count("out_for_delivery"),
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("orders").select("total").gte("created_at", today).neq("status", "cancelled"),
    supabase.from("orders").select(ORDER_ROW_FIELDS).order("created_at", { ascending: false }).limit(8).returns<OrderRow[]>(),
    supabase
      .from("products")
      .select("id, name, stock")
      .eq("is_active", true)
      .lte("stock", 3)
      .order("stock")
      .limit(8),
  ]);

  const revenue = (todayRevenue.data ?? []).reduce((n, o) => n + Number(o.total), 0);

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Les commandes en attente doivent être confirmées par appel."
        actions={
          <>
            <Link href="/gestion/commandes/nouvelle" className="btn-accent h-11">
              <PhoneCall className="size-4" aria-hidden="true" />
              Commande téléphone
            </Link>
            <Link href="/gestion/produits/nouveau" className="btn-outline h-11">
              <Plus className="size-4" aria-hidden="true" />
              Produit
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/gestion/commandes?statut=pending" className="transition hover:brightness-95">
          <StatCard tone="accent" label="À appeler (en attente)" value={pending.count ?? 0} hint="Ouvrir la liste →" />
        </Link>
        <Link href="/gestion/commandes?statut=out_for_delivery" className="transition hover:brightness-95">
          <StatCard label="En livraison" value={delivering.count ?? 0} />
        </Link>
        <StatCard label="Commandes aujourd’hui" value={todayOrders.count ?? 0} />
        <StatCard tone="dark" label="Chiffre du jour" value={`${formatPrice(revenue)}`} hint="DT, hors annulations" />
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1fr_300px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="heading-display text-2xl">Dernières commandes</h2>
            <Link href="/gestion/commandes" className="font-semibold underline">Toutes</Link>
          </div>
          <OrdersTable orders={latest.data ?? []} empty="Aucune commande pour l’instant." />
        </section>

        <section className="card p-5">
          <h2 className="heading-display mb-3 text-2xl">Stock faible</h2>
          {lowStock.data && lowStock.data.length > 0 ? (
            <ul className="flex flex-col divide-y divide-line">
              {lowStock.data.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/gestion/produits/${p.id}`} className="line-clamp-2 text-sm font-semibold hover:underline">{p.name}</Link>
                  <span className={`badge ${p.stock === 0 ? "bg-red-100 text-red-900 ring-red-300" : "bg-amber-100 text-amber-900 ring-amber-300"}`}>
                    {p.stock}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Tous les produits ont du stock.</p>
          )}
        </section>
      </div>
    </>
  );
}
