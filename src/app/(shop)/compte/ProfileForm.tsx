"use client";

import { updateProfile } from "@/app/actions/profile";
import { GOVERNORATES } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Select } from "@/components/ui/Select";
import { useFormAction } from "@/lib/use-form-action";
import { useI18n } from "@/i18n/I18nProvider";
import { governorateLabel } from "@/i18n/config";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const { t, locale } = useI18n();
  const { state, onSubmit, pending } = useFormAction(updateProfile);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <label className="field-label">
        {t.common.fullName}
        <input name="full_name" required defaultValue={profile?.full_name ?? ""} autoComplete="name" className="input" />
      </label>
      <label className="field-label">
        {t.common.phone}
        <input name="phone" type="tel" dir="ltr" defaultValue={profile?.phone ?? ""} autoComplete="tel" placeholder="XX XXX XXX" className="input" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          {t.common.governorate}
          <Select
            name="governorate"
            defaultValue={profile?.governorate ?? ""}
            options={[
              { value: "", label: t.account.notSet },
              ...GOVERNORATES.map((g) => ({ value: g, label: governorateLabel(g, locale) })),
            ]}
          />
        </label>
        <label className="field-label">
          {t.common.city}
          <input name="city" defaultValue={profile?.city ?? ""} className="input" />
        </label>
      </div>
      <label className="field-label">
        {t.common.address}
        <input name="address" defaultValue={profile?.address ?? ""} autoComplete="street-address" className="input" />
      </label>
      <SubmitButton pending={pending} className="btn-dark h-12" pendingLabel={t.common.saving}>{t.common.save}</SubmitButton>
    </form>
  );
}
