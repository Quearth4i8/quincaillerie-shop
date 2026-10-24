import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import { AuthCard } from "@/components/shop/AuthCard";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));

  return (
    <AuthCard title="Créer un compte" subtitle="Retrouvez vos commandes et vos adresses de livraison.">
      <SignUpForm />
    </AuthCard>
  );
}
