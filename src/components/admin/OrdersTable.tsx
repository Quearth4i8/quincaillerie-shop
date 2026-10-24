import Link from "next/link";
import type { Order } from "@/lib/types";
import { formatDateTime, formatPrice, SOURCE_LABEL } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";

export type OrderRow = Pick<
  Order,
  "id" | "order_number" | "customer_name" | "phone" | "governorate" | "city" | "total" | "status" | "source" | "created_at"
>;

export const ORDER_ROW_FIELDS = "id, order_number, customer_name, phone, governorate, city, total, status, source, created_at";

export function OrdersTable({ orders, empty = "Aucune commande." }: { orders: OrderRow[]; empty?: string }) {
  if (orders.length === 0) return <p className="card p-8 text-center text-muted">{empty}</p>;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead className="bg-ground text-sm text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">N°</th>
            <th scope="col" className="px-4 py-3 font-semibold">Client</th>
            <th scope="col" className="px-4 py-3 font-semibold">Livraison</th>
            <th scope="col" className="px-4 py-3 font-semibold">Date</th>
            <th scope="col" className="px-4 py-3 font-semibold">Statut</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-line transition hover:bg-ground/60">
              <td className="px-4 py-3">
                <Link href={`/gestion/commandes/${o.id}`} className="font-bold underline-offset-2 hover:underline">
                  #{o.order_number}
                </Link>
                <span className="block text-xs text-muted">{SOURCE_LABEL[o.source]}</span>
              </td>
              <td className="px-4 py-3">
                <span className="block font-semibold">{o.customer_name}</span>
                <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`} className="text-sm text-muted hover:underline">{o.phone}</a>
              </td>
              <td className="px-4 py-3 text-sm">
                {o.city}
                <span className="block text-muted">{o.governorate}</span>
              </td>
              <td className="px-4 py-3 text-sm text-muted">{formatDateTime(o.created_at)}</td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-bold">{formatPrice(o.total)} DT</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
