"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleCheck, PackageCheck, Truck, Undo2, X } from "lucide-react";
import { deleteOrder, saveStaffNote, updateOrderStatus } from "@/app/actions/orders";
import { STATUS_LABEL } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { Select } from "@/components/ui/Select";

const NEXT_STEP: Partial<Record<OrderStatus, { status: OrderStatus; label: string; icon: typeof Truck }>> = {
  pending: { status: "confirmed", label: "Client appelé · confirmer", icon: CircleCheck },
  confirmed: { status: "out_for_delivery", label: "Remettre au livreur", icon: Truck },
  out_for_delivery: { status: "delivered", label: "Livrée et payée", icon: PackageCheck },
};

export function OrderActions({
  orderId,
  status,
  staffNote,
  canDelete,
}: {
  orderId: string;
  status: OrderStatus;
  staffNote: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState(staffNote);
  const next = NEXT_STEP[status];

  const setStatus = (s: OrderStatus, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, s);
      if (res.ok) toast.success(`Statut : ${STATUS_LABEL[s]}`);
      else toast.error(res.message);
    });
  };

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
      <section className="card flex flex-col gap-3 p-5">
        <h2 className="text-lg font-bold">Traitement</h2>
        {next && (
          <button type="button" disabled={pending} onClick={() => setStatus(next.status)} className="btn-accent h-13 text-[17px]">
            <next.icon className="size-5" aria-hidden="true" />
            {next.label}
          </button>
        )}
        {status === "delivered" && <p className="rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-900">Commande terminée.</p>}

        <label className="field-label mt-1">
          Changer le statut manuellement
          <Select
            value={status}
            disabled={pending}
            onChange={(v) => setStatus(v as OrderStatus)}
            options={(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
          />
        </label>

        {status !== "cancelled" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => setStatus("cancelled", "Annuler cette commande ? Le stock sera remis en rayon.")}
            className="btn-outline h-11 border-danger text-danger"
          >
            <X className="size-4" aria-hidden="true" />
            Annuler la commande
          </button>
        ) : (
          <button type="button" disabled={pending} onClick={() => setStatus("pending")} className="btn-outline h-11">
            <Undo2 className="size-4" aria-hidden="true" />
            Rétablir la commande
          </button>
        )}
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <label htmlFor="staff-note" className="text-lg font-bold">Note interne</label>
        <textarea
          id="staff-note"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex. : rappeler après 17h, livrer samedi matin…"
          className="textarea"
        />
        <button
          type="button"
          disabled={pending || note === staffNote}
          onClick={() =>
            startTransition(async () => {
              const res = await saveStaffNote(orderId, note);
              if (res.ok) toast.success("Note enregistrée");
              else toast.error(res.message);
            })
          }
          className="btn-dark h-11"
        >
          Enregistrer la note
        </button>
      </section>

      {canDelete && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Supprimer définitivement cette commande ?")) return;
            startTransition(async () => {
              const res = await deleteOrder(orderId);
              if (res.ok) {
                toast.success("Commande supprimée");
                router.push("/gestion/commandes");
              } else toast.error(res.message);
            });
          }}
          className="text-sm font-semibold text-danger underline"
        >
          Supprimer la commande (admin)
        </button>
      )}
    </aside>
  );
}
