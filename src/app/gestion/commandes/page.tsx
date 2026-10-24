import type { Metadata } from "next";
import Link from "next/link";
import { PhoneCall, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABEL } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/admin/Shell";
import { ORDER_ROW_FIELDS, OrdersTable, type OrderRow } from "@/components/admin/OrdersTable";

export const metadata: Metadata = { title: "Commandes" };

const PER_PAGE = 25;
const TABS: (OrderStatus | "all")[] = ["all", "pending", "confirmed", "out_for_delivery", "delivered", "cancelled"];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = TABS.includes(sp.statut as OrderStatus) ? (sp.statut as OrderStatus) : "all";
  const q = (sp.q ?? "").trim().slice(0, 60);
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  let query = supabase.from("orders").select(ORDER_ROW_FIELDS, { count: "exact" });
  if (status !== "all") query = query.eq("status", status);
  if (q) {
    const safe = q.replace(/[%,()*\\]/g, " ");
    const asNumber = /^\d+$/.test(q) ? `,order_number.eq.${q}` : "";
    query = query.or(`customer_name.ilike.%${safe}%,phone.ilike.%${safe}%,city.ilike.%${safe}%${asNumber}`);
  }
  const from = (page - 1) * PER_PAGE;
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PER_PAGE - 1)
    .returns<OrderRow[]>();

  const pages = Math.max(1, Math.ceil((count ?? 0) / PER_PAGE));
  const href = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { statut: status !== "all" ? status : undefined, q: q || undefined, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && params.set(k, v));
    return `/gestion/commandes${params.size ? `?${params}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Commandes"
        description={`${count ?? 0} commande(s)`}
        actions={
          <Link href="/gestion/commandes/nouvelle" className="btn-accent h-11">
            <PhoneCall className="size-4" aria-hidden="true" />
            Commande téléphone
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <nav aria-label="Filtrer par statut" className="flex gap-1.5 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t}
              href={href({ statut: t === "all" ? undefined : t, page: undefined })}
              aria-current={t === status ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold",
                t === status ? "bg-ink text-white" : "border border-line bg-white hover:border-ink",
              )}
            >
              {t === "all" ? "Toutes" : STATUS_LABEL[t]}
            </Link>
          ))}
        </nav>
        <form className="ml-auto flex min-w-0 flex-1 sm:max-w-xs" role="search">
          {status !== "all" && <input type="hidden" name="statut" value={status} />}
          <label htmlFor="oq" className="sr-only">Rechercher une commande</label>
          <input id="oq" name="q" defaultValue={q} placeholder="N°, nom, téléphone, ville…" className="input h-11 rounded-r-none" />
          <button type="submit" aria-label="Rechercher" className="flex h-11 w-12 cursor-pointer items-center justify-center rounded-r-xl bg-ink text-white">
            <Search className="size-4" aria-hidden="true" />
          </button>
        </form>
      </div>

      <OrdersTable orders={data ?? []} empty="Aucune commande ne correspond." />

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3">
          {page > 1 && <Link href={href({ page: String(page - 1) })} className="btn-outline h-10 border">Précédent</Link>}
          <span className="text-sm text-muted">Page {page} / {pages}</span>
          {page < pages && <Link href={href({ page: String(page + 1) })} className="btn-outline h-10 border">Suivant</Link>}
        </nav>
      )}
    </>
  );
}
