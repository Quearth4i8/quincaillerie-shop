"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { homeForRole } from "@/lib/auth";
import type { ActionState, UserRole } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Only allow internal redirects ("/compte", not "https://evil.com" or "//evil.com") */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : null;
}

function translateAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) return "E-mail ou mot de passe incorrect.";
  if (/email not confirmed/i.test(message)) return "Confirmez d’abord votre adresse e-mail (lien reçu par e-mail).";
  if (/already registered|already exists/i.test(message)) return "Un compte existe déjà avec cet e-mail.";
  if (/rate limit/i.test(message)) return "Trop de tentatives, réessayez dans quelques minutes.";
  if (/password/i.test(message)) return "Mot de passe trop faible (8 caractères minimum).";
  return message;
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, message: "Renseignez votre e-mail et votre mot de passe." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: translateAuthError(error.message) };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  const role = (profile?.role ?? "customer") as UserRole;

  revalidatePath("/", "layout");
  const next = safeNext(formData.get("next"));
  redirect(next ?? homeForRole(role));
}

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Indiquez votre nom").max(120),
  phone: z.string().trim().max(25).optional(),
  email: z.email("E-mail invalide"),
  password: z.string().min(8, "8 caractères minimum").max(72),
});

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: "Vérifiez les champs indiqués.", errors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name, phone: parsed.data.phone ?? "" },
      emailRedirectTo: `${SITE_URL}/auth/callback?next=/compte`,
    },
  });
  if (error) return { ok: false, message: translateAuthError(error.message) };

  // E-mail confirmation disabled in Supabase → the user is signed in right away
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/compte");
  }
  return { ok: true, message: "Compte créé ! Cliquez sur le lien reçu par e-mail pour l’activer." };
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { ok: false, message: "Renseignez votre e-mail." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/compte/mot-de-passe`,
  });
  // Same answer whether or not the account exists
  return { ok: true, message: "Si un compte existe pour cet e-mail, un lien de réinitialisation vient d’être envoyé." };
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { ok: false, message: "8 caractères minimum." };
  if (password !== formData.get("confirm")) return { ok: false, message: "Les deux mots de passe ne correspondent pas." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: translateAuthError(error.message) };
  return { ok: true, message: "Mot de passe mis à jour." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
