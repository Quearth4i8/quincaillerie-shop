"use client";

import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { FieldError, FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFormAction } from "@/lib/use-form-action";

export function SignUpForm() {
  const { state, onSubmit, pending } = useFormAction(signUp);

  if (state?.ok) return <FormMessage state={state} />;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <label className="field-label">
        Nom et prénom
        <input name="full_name" required autoComplete="name" className="input" />
        <FieldError state={state} name="full_name" />
      </label>
      <label className="field-label">
        <span>Téléphone <span className="font-normal text-muted">(facultatif)</span></span>
        <input name="phone" type="tel" autoComplete="tel" placeholder="XX XXX XXX" className="input" />
      </label>
      <label className="field-label">
        E-mail
        <input name="email" type="email" required autoComplete="email" className="input" />
        <FieldError state={state} name="email" />
      </label>
      <label className="field-label">
        Mot de passe
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        <span className="text-sm font-normal text-muted">8 caractères minimum</span>
        <FieldError state={state} name="password" />
      </label>
      <SubmitButton pending={pending} className="btn-accent h-13 text-lg" pendingLabel="Création…">Créer mon compte</SubmitButton>
      <p className="text-center text-muted">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-bold text-ink underline">Se connecter</Link>
      </p>
    </form>
  );
}
