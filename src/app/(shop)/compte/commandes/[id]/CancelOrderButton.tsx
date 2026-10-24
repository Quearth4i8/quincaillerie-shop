"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { cancelMyOrder } from "@/app/actions/orders";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm("Annuler cette commande ?")) return;
    startTransition(async () => {
      const res = await cancelMyOrder(orderId);
      if (res.ok) toast.success("Commande annulée");
      else toast.error(res.message);
    });
  }

  return (
    <button type="button" onClick={onClick} disabled={pending} className="btn-outline h-12 border-danger text-danger">
      {pending ? "Annulation…" : "Annuler la commande"}
    </button>
  );
}
