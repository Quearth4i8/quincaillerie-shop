"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePassword } from "@/app/actions/auth";
import { AuthCard } from "@/components/shop/AuthCard";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function ChangePasswordPage() {
  const [state, action] = useActionState(updatePassword, null);

  return (
    <AuthCard title="Nouveau mot de passe">
      <form action={action} className="flex flex-col gap-4">
        <FormMessage state={state} />
        <label className="field-label">
          Nouveau mot de passe
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </label>
        <label className="field-label">
          Confirmer
          <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </label>
        <SubmitButton className="btn-accent h-13 text-lg" pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
        <Link href="/compte" className="text-center font-semibold underline">Retour à mon compte</Link>
      </form>
    </AuthCard>
  );
}
