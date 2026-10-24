import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { daysAgoIso } from "@/lib/dates";
import { formatPrice, SOURCE_LABEL, STATUS_LABEL } from "@/lib/format";
import type { OrderSource, OrderStatus } from "@/lib/types";
import { PageHeader, StatCard } from "@/components/admin/Shell";

export const metadata: Metadata = { title: "Statistiques" };

const PERIODS = { "7": "7 jours", "30": "30 jours", "90": "90 jours" } as const;

export default async function AdminStatsPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const period = (p && p in PERIODS ? p : "30") as keyof typeof PERIODS;
  const since = daysAgoIso(Number(period) - 1);

  const supabase = await createClient();
  const [{ data: orders }, { data: items }, { count: customers }, { count: products }] = await Promise.all([
    supabase.from("orders").select("id, total, status, source, governorate, created_at").gte("created_at", since).limit(10000),
    supabase
      .from("order_items")
      .select("product_name, quantity, line_total, orders!inner(created_at, status)")
      .gte("orders.created_at", since)
      .neq("orders.status", "cancelled")
      .limit(20000),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const all = (orders ?? []) as { id: string; total: number; status: OrderStatus; source: OrderSource; governorate: string; created_at: string }[];
  const valid = all.filter((o) => o.status !== "cancelled");
  const delivered = all.filter((o) => o.status === "delivered");
  const revenue = delivered.reduce((n, o) => n + Number(o.total), 0);
  const pipeline = valid.filter((o) => o.status !== "delivered").reduce((n, o) => n + Number(o.total), 0);
  const avg = valid.length ? valid.reduce((n, o) => n + Number(o.total), 0) / valid.length : 0;
  const cancelRate = all.length ? Math.round(((all.length - valid.length) / all.length) * 100) : 0;

  // Revenue per day (delivered + in progress, excluding cancelled)
  const days = Array.from({ length: Number(period) }, (_, i) => {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(d);
  });
  const perDay = new Map(days.map((d) => [d, 0]));
  valid.forEach((o) => {
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(new Date(o.created_at));
    if (perDay.has(key)) perDay.set(key, (perDay.get(key) ?? 0) + Number(o.total));
  });
  const maxDay = Math.max(1, ...perDay.values());

  const countBy = <K extends string>(rows: { [k: string]: unknown }[], key: string) => {
    const m = new Map<K, number>();
    rows.forEach((r) => m.set(r[key] as K, (m.get(r[key] as K) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const byStatus = countBy<OrderStatus>(all, "status");
  const bySource = countBy<OrderSource>(all, "source");
  const byGov = countBy<string>(valid, "governorate").slice(0, 8);

  const top = new Map<string, { qty: number; revenue: number }>();
  (items ?? []).forEach((i) => {
    const cur = top.get(i.product_name) ?? { qty: 0, revenue: 0 };
    top.set(i.product_name, { qty: cur.qty + i.quantity, revenue: cur.revenue + Number(i.line_total) });
  });
  const topProducts = [...top.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 8);

  return (
    <>
      <PageHeader
        title="Statistiques"
        description={`Sur les ${PERIODS[period]} écoulés`}
        actions={
          <nav aria-label="Période" className="flex gap-1.5">
            {Object.entries(PERIODS).map(([k, label]) => (
              <a
                key={k}
                href={`/admin?p=${k}`}
                aria-current={k === period ? "page" : undefined}
                className={k === period ? "rounded-full bg-ink px-3.5 py-2 text-sm font-semibold text-white" : "rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold"}
              >
                {label}
              </a>
            ))}
          </nav>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard tone="dark" label="Chiffre encaissé (livré)" value={formatPrice(revenue)} hint="DT" />
        <StatCard tone="accent" label="En cours (non livré)" value={formatPrice(pipeline)} hint="DT" />
        <StatCard label="Commandes" value={all.length} hint={`Panier moyen ${formatPrice(avg)} DT`} />
        <StatCard label="Taux d’annulation" value={`${cancelRate} %`} hint={`${customers ?? 0} clients · ${products ?? 0} produits en ligne`} />
      </div>

      <section className="card mt-6 p-5">
        <h2 className="heading-display mb-4 text-2xl">Ventes par jour (DT)</h2>
        <div className="flex h-48 items-end gap-[3px]" role="img" aria-label="Histogramme des ventes par jour">
          {[...perDay.entries()].map(([day, value]) => (
            <div key={day} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-ink transition group-hover:bg-accent"
                style={{ height: `${Math.max(value ? 3 : 1, (value / maxDay) * 100)}%`, opacity: value ? 1 : 0.15 }}
              />
              <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white group-hover:block">
                {day.slice(5)} · {formatPrice(value)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>{days[0]?.slice(5)}</span>
          <span>{days.at(-1)?.slice(5)}</span>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="heading-display mb-3 text-2xl">Produits les plus vendus</h2>
          {topProducts.length ? (
            <table className="w-full text-left">
              <thead className="text-sm text-muted">
                <tr><th className="pb-2 font-semibold">Produit</th><th className="pb-2 text-right font-semibold">Qté</th><th className="pb-2 text-right font-semibold">DT</th></tr>
              </thead>
              <tbody>
                {topProducts.map(([name, v]) => (
                  <tr key={name} className="border-t border-line">
                    <td className="py-2 pr-2 text-sm font-semibold">{name}</td>
                    <td className="py-2 text-right">{v.qty}</td>
                    <td className="py-2 text-right">{formatPrice(v.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">Pas encore de ventes sur la période.</p>
          )}
        </section>

        <section className="card grid gap-6 p-5 sm:grid-cols-2">
          <Breakdown title="Par statut" rows={byStatus.map(([k, v]) => [STATUS_LABEL[k], v])} total={all.length} />
          <Breakdown title="Par canal" rows={bySource.map(([k, v]) => [SOURCE_LABEL[k], v])} total={all.length} />
          <div className="sm:col-span-2">
            <Breakdown title="Top gouvernorats" rows={byGov} total={valid.length} />
          </div>
        </section>
      </div>
    </>
  );
}

function Breakdown({ title, rows, total }: { title: string; rows: [string, number][]; total: number }) {
  return (
    <div>
      <h3 className="mb-2 font-bold">{title}</h3>
      {rows.length === 0 && <p className="text-sm text-muted">—</p>}
      <ul className="flex flex-col gap-2">
        {rows.map(([label, n]) => (
          <li key={label} className="text-sm">
            <div className="mb-1 flex justify-between"><span>{label}</span><span className="font-semibold">{n}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-ground">
              <div className="h-full rounded-full bg-ink" style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
