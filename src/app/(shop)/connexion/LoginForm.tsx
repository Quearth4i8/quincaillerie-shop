"use client";

import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFormAction } from "@/lib/use-form-action";

export function LoginForm({ next }: { next?: string }) {
  const { state, onSubmit, pending } = useFormAction(signIn);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <FormMessage state={state} />
      <label className="field-label">
        E-mail
        <input name="email" type="email" required autoComplete="email" className="input" />
      </label>
      <label className="field-label">
        Mot de passe
        <input name="password" type="password" required autoComplete="current-password" className="input" />
      </label>
      <Link href="/mot-de-passe-oublie" className="self-end text-sm font-semibold underline">
        Mot de passe oublié ?
      </Link>
      <SubmitButton pending={pending} className="btn-accent h-13 text-lg" pendingLabel="Connexion…">Se connecter</SubmitButton>
      <p className="text-center text-muted">
        Pas encore de compte ?{" "}
        <Link href={`/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-ink underline">
          Créer un compte
        </Link>
      </p>
      <p className="text-center text-sm text-muted">
        Le compte est facultatif : vous pouvez commander sans compte depuis le panier.
      </p>
    </form>
  );
}
