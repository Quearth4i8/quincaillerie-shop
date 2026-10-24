"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";
import { AuthCard } from "@/components/shop/AuthCard";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(requestPasswordReset, null);

  return (
    <AuthCard title="Mot de passe oublié" subtitle="Recevez un lien pour choisir un nouveau mot de passe.">
      <form action={action} className="flex flex-col gap-4">
        <FormMessage state={state} />
        <label className="field-label">
          E-mail
          <input name="email" type="email" required autoComplete="email" className="input" />
        </label>
        <SubmitButton className="btn-accent h-13 text-lg" pendingLabel="Envoi…">Envoyer le lien</SubmitButton>
        <Link href="/connexion" className="text-center font-semibold underline">Retour à la connexion</Link>
      </form>
    </AuthCard>
  );
}
