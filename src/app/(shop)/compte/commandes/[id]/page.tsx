import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { formatDateTime, telHref } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OrderItemsTable, OrderTimeline } from "@/components/ui/OrderSummary";
import { CancelOrderButton } from "./CancelOrderButton";

export const metadata: Metadata = { title: "Suivi de commande" };

export default async function MyOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["customer", "manager", "admin"], `/compte/commandes/${id}`);
  const supabase = await createClient();

  const [{ data: order }, { data: history }, settings] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle<Order>(),
    supabase
      .from("order_status_history")
      .select("status, created_at")
      .eq("order_id", id)
      .order("created_at")
      .returns<{ status: OrderStatus; created_at: string }[]>(),
    getSettings(),
  ]);

  if (!order) notFound();

  return (
    <div className="container-page max-w-4xl py-8">
      <Link href="/compte" className="mb-4 inline-flex items-center gap-1.5 font-semibold hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Mes commandes
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-display text-4xl sm:text-5xl">Commande n° {order.order_number}</h1>
          <p className="mt-1 text-muted">Passée le {formatDateTime(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} className="px-3.5 py-1 text-sm" />
      </div>

      <div className="card mb-6 p-5 sm:p-6">
        <OrderTimeline status={order.status} history={history ?? []} />
      </div>

      <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <OrderItemsTable order={order} />
        <div className="card flex flex-col gap-2 p-5">
          <h2 className="text-lg font-bold">Livraison</h2>
          <p>{order.customer_name}</p>
          <p>{order.phone}</p>
          <p>
            {order.address}
            <br />
            {order.city}, {order.governorate}
          </p>
          {order.note && <p className="text-muted">« {order.note} »</p>}
          <p className="mt-2 text-sm text-muted">Paiement en espèces à la livraison.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href={telHref(settings.phone)} className="btn-dark h-12">
          <Phone className="size-4" aria-hidden="true" />
          Une question ? {settings.phone}
        </a>
        {order.status === "pending" && <CancelOrderButton orderId={order.id} />}
      </div>
    </div>
  );
}
