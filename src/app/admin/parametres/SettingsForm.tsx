"use client";

import { saveSettings } from "@/app/actions/admin";
import type { Settings } from "@/lib/types";
import { useFormAction } from "@/lib/use-form-action";
import { FieldError, FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function SettingsForm({ settings }: { settings: Settings }) {
  const { state, onSubmit, pending } = useFormAction(saveSettings);

  return (
    <form onSubmit={onSubmit} className="card grid max-w-3xl gap-4 p-5 sm:grid-cols-2 sm:p-6">
      <div className="sm:col-span-2">
        <FormMessage state={state} />
      </div>
      <label className="field-label">
        Nom de la boutique
        <input name="shop_name" required defaultValue={settings.shop_name} className="input" />
        <FieldError state={state} name="shop_name" />
      </label>
      <label className="field-label">
        Slogan
        <input name="tagline" defaultValue={settings.tagline} className="input" />
      </label>
      <label className="field-label">
        Téléphone affiché
        <input name="phone" required defaultValue={settings.phone} placeholder="+216 XX XXX XXX" className="input" />
        <FieldError state={state} name="phone" />
      </label>
      <label className="field-label">
        <span>Numéro WhatsApp <span className="font-normal text-muted">(ex. 21620123456)</span></span>
        <input name="whatsapp" required inputMode="numeric" defaultValue={settings.whatsapp} className="input" />
        <FieldError state={state} name="whatsapp" />
      </label>
      <label className="field-label">
        E-mail de contact
        <input name="email" type="email" defaultValue={settings.email ?? ""} className="input" />
        <FieldError state={state} name="email" />
      </label>
      <label className="field-label">
        Horaires
        <input name="hours" defaultValue={settings.hours ?? ""} placeholder="Lun–Sam · 8h–19h" className="input" />
      </label>
      <label className="field-label sm:col-span-2">
        Adresse
        <input name="address" defaultValue={settings.address ?? ""} className="input" />
      </label>
      <div className="sm:col-span-2">
        <SubmitButton pending={pending} className="btn-accent h-12 px-8" pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
      </div>
    </form>
  );
}
