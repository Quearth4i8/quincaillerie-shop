"use client";

import { updateProfile } from "@/app/actions/profile";
import { GOVERNORATES } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFormAction } from "@/lib/use-form-action";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const { state, onSubmit, pending } = useFormAction(updateProfile);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <label className="field-label">
        Nom et prénom
        <input name="full_name" required defaultValue={profile?.full_name ?? ""} autoComplete="name" className="input" />
      </label>
      <label className="field-label">
        Téléphone
        <input name="phone" type="tel" defaultValue={profile?.phone ?? ""} autoComplete="tel" placeholder="XX XXX XXX" className="input" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          Gouvernorat
          <select name="governorate" defaultValue={profile?.governorate ?? ""} className="input">
            <option value="">—</option>
            {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label className="field-label">
          Ville / délégation
          <input name="city" defaultValue={profile?.city ?? ""} className="input" />
        </label>
      </div>
      <label className="field-label">
        Adresse
        <input name="address" defaultValue={profile?.address ?? ""} autoComplete="street-address" className="input" />
      </label>
      <SubmitButton pending={pending} className="btn-dark h-12" pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
    </form>
  );
}
