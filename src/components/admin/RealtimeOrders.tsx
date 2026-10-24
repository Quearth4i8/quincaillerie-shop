"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";

/** Live alert + page refresh whenever a new order arrives (Supabase Realtime). */
export function RealtimeOrders() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("backoffice-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const o = payload.new as { id: string; order_number: number; customer_name: string; total: number };
          toast.info(`Nouvelle commande n° ${o.order_number}`, {
            description: `${o.customer_name} · ${formatPrice(o.total)} DT`,
            duration: 15000,
            action: { label: "Ouvrir", onClick: () => router.push(`/gestion/commandes/${o.id}`) },
          });
          router.refresh();
        },
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => router.refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
