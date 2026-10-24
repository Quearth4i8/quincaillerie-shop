"use client";

import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFormAction } from "@/lib/use-form-action";
import { useI18n } from "@/i18n/I18nProvider";

export function LoginForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const a = t.auth;
  const { state, onSubmit, pending } = useFormAction(signIn);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <FormMessage state={state} />
      <label className="field-label">
        {t.common.email}
        <input name="email" type="email" dir="ltr" required autoComplete="email" className="input" />
      </label>
      <label className="field-label">
        {t.common.password}
        <input name="password" type="password" required autoComplete="current-password" className="input" />
      </label>
      <Link href="/mot-de-passe-oublie" className="self-end text-sm font-semibold underline">
        {a.forgot}
      </Link>
      <SubmitButton pending={pending} className="btn-accent h-13 text-lg" pendingLabel={a.signingIn}>{a.signIn}</SubmitButton>
      <p className="text-center text-muted">
        {a.noAccount}{" "}
        <Link href={`/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-ink underline">
          {a.createAccount}
        </Link>
      </p>
      <p className="text-center text-sm text-muted">{a.optionalAccount}</p>
    </form>
  );
}
