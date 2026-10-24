"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { saveZone, setAllZoneFees } from "@/app/actions/admin";
import type { DeliveryZone } from "@/lib/types";

function ZoneRow({ zone }: { zone: DeliveryZone }) {
  const [fee, setFee] = useState(String(zone.fee));
  const [delay, setDelay] = useState(zone.delay ?? "");
  const [active, setActive] = useState(zone.is_active);
  const [pending, startTransition] = useTransition();
  const dirty = fee !== String(zone.fee) || delay !== (zone.delay ?? "") || active !== zone.is_active;
  const id = zone.governorate.replace(/\s/g, "-");

  const save = () =>
    startTransition(async () => {
      const res = await saveZone({ governorate: zone.governorate, fee, delay, is_active: active });
      if (res.ok) toast.success(`${zone.governorate} enregistré`);
      else toast.error(res.message);
    });

  return (
    <tr className="border-t border-line">
      <th scope="row" className="px-4 py-2.5 text-left font-semibold">{zone.governorate}</th>
      <td className="px-4 py-2.5">
        <label htmlFor={`fee-${id}`} className="sr-only">Frais {zone.governorate}</label>
        <input id={`fee-${id}`} type="number" min={0} step="0.5" value={fee} onChange={(e) => setFee(e.target.value)} className="input h-10 w-28" />
      </td>
      <td className="px-4 py-2.5">
        <label htmlFor={`delay-${id}`} className="sr-only">Délai {zone.governorate}</label>
        <input id={`delay-${id}`} value={delay} onChange={(e) => setDelay(e.target.value)} placeholder="ex. 24h" className="input h-10 w-32" />
      </td>
      <td className="px-4 py-2.5">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-5 accent-ink" />
          <span className="text-sm">{active ? "Livrée" : "Non desservie"}</span>
        </label>
      </td>
      <td className="px-4 py-2.5 text-right">
        <button type="button" onClick={save} disabled={!dirty || pending} className="btn-dark h-10 px-3 text-sm">
          <Check className="size-4" aria-hidden="true" />
          Enregistrer
        </button>
      </td>
    </tr>
  );
}

export function ZonesEditor({ zones }: { zones: DeliveryZone[] }) {
  const router = useRouter();
  const [bulk, setBulk] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <label className="field-label">
          Appliquer les mêmes frais partout (DT)
          <input type="number" min={0} step="0.5" value={bulk} onChange={(e) => setBulk(e.target.value)} className="input h-11 w-36" />
        </label>
        <button
          type="button"
          disabled={!bulk || pending}
          onClick={() => {
            if (!window.confirm(`Mettre ${bulk} DT de frais pour les 24 gouvernorats ?`)) return;
            startTransition(async () => {
              const res = await setAllZoneFees(Number(bulk));
              if (res.ok) {
                toast.success("Frais mis à jour");
                setBulk("");
                router.refresh();
              } else toast.error(res.message);
            });
          }}
          className="btn-outline h-11"
        >
          Appliquer
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="bg-ground text-left text-sm text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Gouvernorat</th>
              <th scope="col" className="px-4 py-3 font-semibold">Frais (DT)</th>
              <th scope="col" className="px-4 py-3 font-semibold">Délai</th>
              <th scope="col" className="px-4 py-3 font-semibold">Statut</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => <ZoneRow key={`${z.governorate}-${z.fee}-${z.delay}-${z.is_active}`} zone={z} />)}
          </tbody>
        </table>
      </div>
    </>
  );
}
