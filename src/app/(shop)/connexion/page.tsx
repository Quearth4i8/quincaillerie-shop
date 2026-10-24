import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import { AuthCard } from "@/components/shop/AuthCard";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; erreur?: string }> }) {
  const { next, erreur } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));

  return (
    <AuthCard title="Connexion" subtitle="Suivez vos commandes et commandez plus vite.">
      {erreur === "lien" && (
        <p role="alert" className="rounded-xl bg-red-50 p-3.5 font-semibold text-red-900">
          Ce lien n’est plus valide. Reconnectez-vous ou demandez un nouveau lien.
        </p>
      )}
      <LoginForm next={next} />
    </AuthCard>
  );
}
