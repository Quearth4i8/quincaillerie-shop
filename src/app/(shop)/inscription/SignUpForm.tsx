"use client";

import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { FieldError, FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFormAction } from "@/lib/use-form-action";
import { useI18n } from "@/i18n/I18nProvider";

export function SignUpForm() {
  const { t } = useI18n();
  const a = t.auth;
  const { state, onSubmit, pending } = useFormAction(signUp);

  if (state?.ok) return <FormMessage state={state} />;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <label className="field-label">
        {t.common.fullName}
        <input name="full_name" required autoComplete="name" className="input" />
        <FieldError state={state} name="full_name" />
      </label>
      <label className="field-label">
        <span>{t.common.phone} <span className="font-normal text-muted">{t.common.optional}</span></span>
        <input name="phone" type="tel" dir="ltr" autoComplete="tel" placeholder="XX XXX XXX" className="input" />
      </label>
      <label className="field-label">
        {t.common.email}
        <input name="email" type="email" dir="ltr" required autoComplete="email" className="input" />
        <FieldError state={state} name="email" />
      </label>
      <label className="field-label">
        {t.common.password}
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        <span className="text-sm font-normal text-muted">{a.min8}</span>
        <FieldError state={state} name="password" />
      </label>
      <SubmitButton pending={pending} className="btn-accent h-13 text-lg" pendingLabel={a.creating}>{a.createMine}</SubmitButton>
      <p className="text-center text-muted">
        {a.already}{" "}
        <Link href="/connexion" className="font-bold text-ink underline">{a.signIn}</Link>
      </p>
    </form>
  );
}
