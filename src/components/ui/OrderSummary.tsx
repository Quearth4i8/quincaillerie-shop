import { Check } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { formatDateTime, formatPrice, STATUS_FLOW, STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/cn";

export function OrderItemsTable({ order }: { order: Order }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-left">
        <thead className="bg-ground text-sm text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Article</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Prix</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Qté</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items?.map((i) => (
            <tr key={i.id} className="border-t border-line">
              <td className="px-4 py-3 font-semibold">{i.product_name}</td>
              <td className="px-4 py-3 text-right">{formatPrice(i.unit_price)}</td>
              <td className="px-4 py-3 text-right">{i.quantity}</td>
              <td className="px-4 py-3 text-right font-semibold">{formatPrice(i.line_total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-ink">
          <tr>
            <td colSpan={3} className="px-4 pt-3 text-right text-muted">Sous-total</td>
            <td className="px-4 pt-3 text-right">{formatPrice(order.subtotal)}</td>
          </tr>
          <tr>
            <td colSpan={3} className="px-4 text-right text-muted">Livraison ({order.governorate})</td>
            <td className="px-4 text-right">{formatPrice(order.delivery_fee)}</td>
          </tr>
          <tr>
            <td colSpan={3} className="px-4 pb-3 text-right text-lg font-bold">Total</td>
            <td className="heading-display px-4 pb-3 text-right text-2xl">{formatPrice(order.total)} DT</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function OrderTimeline({
  status,
  history,
}: {
  status: OrderStatus;
  history: { status: OrderStatus; created_at: string }[];
}) {
  if (status === "cancelled") {
    const when = history.find((h) => h.status === "cancelled")?.created_at;
    return (
      <p className="rounded-xl bg-zinc-100 p-4 font-semibold text-zinc-700">
        Commande annulée{when ? ` le ${formatDateTime(when)}` : ""}.
      </p>
    );
  }
  const currentIndex = STATUS_FLOW.indexOf(status);

  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= currentIndex;
        const at = history.filter((h) => h.status === s).at(-1)?.created_at;
        return (
          <li key={s} className="flex items-center gap-3 sm:flex-col sm:items-start">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full border-2 font-bold",
                done ? "border-ink bg-ink text-accent" : "border-line-strong bg-white text-muted",
              )}
            >
              {done ? <Check className="size-5" aria-hidden="true" /> : i + 1}
            </span>
            <span className="flex flex-col">
              <span className={cn("font-semibold", !done && "text-muted")}>{STATUS_LABEL[s]}</span>
              {at && <span className="text-sm text-muted">{formatDateTime(at)}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
