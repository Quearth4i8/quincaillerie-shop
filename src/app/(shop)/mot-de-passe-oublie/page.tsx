"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";
import { AuthCard } from "@/components/shop/AuthCard";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useI18n } from "@/i18n/I18nProvider";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [state, action] = useActionState(requestPasswordReset, null);

  return (
    <AuthCard title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle}>
      <form action={action} className="flex flex-col gap-4">
        <FormMessage state={state} />
        <label className="field-label">
          {t.common.email}
          <input name="email" type="email" dir="ltr" required autoComplete="email" className="input" />
        </label>
        <SubmitButton className="btn-accent h-13 text-lg" pendingLabel={t.auth.sending}>{t.auth.sendLink}</SubmitButton>
        <Link href="/connexion" className="text-center font-semibold underline">{t.auth.backToLogin}</Link>
      </form>
    </AuthCard>
  );
}
