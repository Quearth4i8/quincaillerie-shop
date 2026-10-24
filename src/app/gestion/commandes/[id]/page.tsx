import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime, formatPrice, SOURCE_LABEL, STATUS_LABEL, telHref, whatsappHref } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OrderItemsTable } from "@/components/ui/OrderSummary";
import { OrderActions } from "./OrderActions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: `Commande ${(await params).id.slice(0, 8)}` };
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: order }, { data: history }, user] = await Promise.all([
    supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle<Order>(),
    supabase
      .from("order_status_history")
      .select("status, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: false })
      .returns<{ status: OrderStatus; created_at: string }[]>(),
    getCurrentUser(),
  ]);
  if (!order) notFound();

  const intlPhone = order.phone.replace(/\D/g, "");
  const waText = `Bonjour ${order.customer_name}, c'est la quincaillerie au sujet de votre commande n° ${order.order_number} (${formatPrice(order.total)} DT).`;

  return (
    <>
      <Link href="/gestion/commandes" className="mb-4 inline-flex items-center gap-1.5 font-semibold hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Commandes
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-display text-4xl">Commande #{order.order_number}</h1>
          <p className="mt-1 text-muted">
            {formatDateTime(order.created_at)} · via {SOURCE_LABEL[order.source]}
            {!order.user_id && order.source === "web" && " · client sans compte"}
          </p>
        </div>
        <StatusBadge status={order.status} className="px-3.5 py-1 text-sm" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <section className="card p-5">
            <h2 className="mb-3 text-lg font-bold">Client & livraison</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xl font-bold">{order.customer_name}</p>
                <p className="text-lg">{order.phone}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={telHref(order.phone)} className="btn-dark h-11">
                    <Phone className="size-4" aria-hidden="true" />
                    Appeler
                  </a>
                  <a href={whatsappHref(intlPhone, waText)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp h-11">
                    <MessageCircle className="size-4" aria-hidden="true" />
                    WhatsApp
                  </a>
                </div>
              </div>
              <div>
                <p className="font-semibold">{order.address}</p>
                <p>{order.city}, {order.governorate}</p>
                {order.note && <p className="mt-2 rounded-lg bg-amber-50 p-2.5 text-sm">Remarque client : « {order.note} »</p>}
              </div>
            </div>
          </section>

          <OrderItemsTable order={order} />

          <section className="card p-5">
            <h2 className="mb-3 text-lg font-bold">Historique</h2>
            <ol className="flex flex-col gap-2">
              {(history ?? []).map((h, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold">{STATUS_LABEL[h.status]}</span>
                  <span className="text-muted">{formatDateTime(h.created_at)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <OrderActions
          orderId={order.id}
          status={order.status}
          staffNote={order.staff_note ?? ""}
          canDelete={user?.role === "admin"}
        />
      </div>
    </>
  );
}
