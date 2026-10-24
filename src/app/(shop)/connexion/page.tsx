import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import { AuthCard } from "@/components/shop/AuthCard";
import { LoginForm } from "./LoginForm";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).t.meta.login };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; erreur?: string }> }) {
  const { next, erreur } = await searchParams;
  const [user, { t }] = await Promise.all([getCurrentUser(), getT()]);
  if (user) redirect(homeForRole(user.role));

  return (
    <AuthCard title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      {erreur === "lien" && (
        <p role="alert" className="rounded-xl bg-red-50 p-3.5 font-semibold text-red-900">
          {t.auth.badLink}
        </p>
      )}
      <LoginForm next={next} />
    </AuthCard>
  );
}
