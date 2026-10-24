"use client";

import type { DeliveryZone } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export type CustomerDefaults = {
  customer_name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="text-sm font-semibold text-danger">
      {message}
    </span>
  );
}

export function CustomerFields({
  zones,
  defaults,
  errors = {},
  governorate,
  onGovernorateChange,
}: {
  zones: DeliveryZone[];
  defaults: CustomerDefaults;
  errors?: Record<string, string>;
  governorate: string;
  onGovernorateChange: (g: string) => void;
}) {
  const err = (k: string) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-err` } : {});

  return (
    <>
      <fieldset className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <legend className="heading-display px-1.5 text-[26px]">1. Vos coordonnées</legend>
        <label className="field-label">
          Nom et prénom
          <input name="customer_name" required autoComplete="name" defaultValue={defaults.customer_name} className="input" {...err("customer_name")} />
          <FieldError id="customer_name-err" message={errors.customer_name} />
        </label>
        <label className="field-label">
          Téléphone
          <span className="flex">
            <span className="flex h-12 items-center rounded-l-xl border border-r-0 border-line-strong bg-ground px-3 font-semibold">+216</span>
            <input
              name="phone"
              type="tel"
              required
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="XX XXX XXX"
              defaultValue={defaults.phone.replace(/^\+216\s?/, "")}
              className="input rounded-l-none"
              {...err("phone")}
            />
          </span>
          <FieldError id="phone-err" message={errors.phone} />
        </label>
      </fieldset>

      <fieldset className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <legend className="heading-display px-1.5 text-[26px]">2. Adresse de livraison</legend>
        <label className="field-label">
          Gouvernorat
          <select
            name="governorate"
            required
            value={governorate}
            onChange={(e) => onGovernorateChange(e.target.value)}
            className="input"
            {...err("governorate")}
          >
            <option value="">Choisir…</option>
            {zones.map((z) => (
              <option key={z.governorate} value={z.governorate}>
                {z.governorate} — livraison {formatPrice(z.fee)} DT{z.delay ? ` · ${z.delay}` : ""}
              </option>
            ))}
          </select>
          <FieldError id="governorate-err" message={errors.governorate} />
        </label>
        <label className="field-label">
          Ville / délégation
          <input name="city" required autoComplete="address-level2" defaultValue={defaults.city} className="input" {...err("city")} />
          <FieldError id="city-err" message={errors.city} />
        </label>
        <label className="field-label sm:col-span-2">
          Adresse complète
          <input
            name="address"
            required
            autoComplete="street-address"
            placeholder="Rue, numéro, immeuble, étage…"
            defaultValue={defaults.address}
            className="input"
            {...err("address")}
          />
          <FieldError id="address-err" message={errors.address} />
        </label>
        <label className="field-label sm:col-span-2">
          <span>
            Repère ou remarque <span className="font-normal text-muted">(facultatif)</span>
          </span>
          <textarea
            name="note"
            rows={3}
            maxLength={500}
            placeholder="Ex. : en face de la pharmacie, appeler avant d’arriver"
            className="textarea"
          />
        </label>
      </fieldset>
    </>
  );
}
