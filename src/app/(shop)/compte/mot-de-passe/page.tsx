"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePassword } from "@/app/actions/auth";
import { AuthCard } from "@/components/shop/AuthCard";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useI18n } from "@/i18n/I18nProvider";

export default function ChangePasswordPage() {
  const { t } = useI18n();
  const [state, action] = useActionState(updatePassword, null);

  return (
    <AuthCard title={t.auth.newPwTitle}>
      <form action={action} className="flex flex-col gap-4">
        <FormMessage state={state} />
        <label className="field-label">
          {t.auth.newPw}
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </label>
        <label className="field-label">
          {t.auth.confirmPw}
          <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </label>
        <SubmitButton className="btn-accent h-13 text-lg" pendingLabel={t.common.saving}>{t.common.save}</SubmitButton>
        <Link href="/compte" className="text-center font-semibold underline">{t.auth.backToAccount}</Link>
      </form>
    </AuthCard>
  );
}
