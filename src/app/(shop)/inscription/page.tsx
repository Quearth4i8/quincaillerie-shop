import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import { AuthCard } from "@/components/shop/AuthCard";
import { SignUpForm } from "./SignUpForm";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).t.meta.signup };
}

export default async function SignUpPage() {
  const [user, { t }] = await Promise.all([getCurrentUser(), getT()]);
  if (user) redirect(homeForRole(user.role));

  return (
    <AuthCard title={t.auth.signupTitle} subtitle={t.auth.signupSubtitle}>
      <SignUpForm />
    </AuthCard>
  );
}
