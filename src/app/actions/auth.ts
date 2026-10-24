"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { homeForRole } from "@/lib/auth";
import type { ActionState, UserRole } from "@/lib/types";
import { getT } from "@/i18n/server";
import type { Dict } from "@/i18n/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Only allow internal redirects ("/compte", not "https://evil.com" or "//evil.com") */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : null;
}

function translateAuthError(message: string, e: Dict["errors"]) {
  if (/invalid login credentials/i.test(message)) return e.invalidCredentials;
  if (/email not confirmed/i.test(message)) return e.emailNotConfirmed;
  if (/already registered|already exists/i.test(message)) return e.alreadyRegistered;
  if (/rate limit/i.test(message)) return e.rateLimit;
  if (/password/i.test(message)) return e.weakPassword;
  return message;
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const e = (await getT()).t.errors;
  if (!email || !password) return { ok: false, message: e.fillEmailPassword };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: translateAuthError(error.message, e) };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  const role = (profile?.role ?? "customer") as UserRole;

  revalidatePath("/", "layout");
  const next = safeNext(formData.get("next"));
  redirect(next ?? homeForRole(role));
}

const signUpSchema = (e: Dict["errors"]) =>
  z.object({
    full_name: z.string().trim().min(2, e.nameRequired).max(120),
    phone: z.string().trim().max(25).optional(),
    email: z.email(e.invalidEmail),
    password: z.string().min(8, e.min8).max(72),
  });

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const e = (await getT()).t.errors;
  const parsed = signUpSchema(e).safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: e.checkFields, errors };
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
  if (error) return { ok: false, message: translateAuthError(error.message, e) };

  // E-mail confirmation disabled in Supabase → the user is signed in right away
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/compte");
  }
  return { ok: true, message: e.accountCreated };
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const e = (await getT()).t.errors;
  if (!email) return { ok: false, message: e.fillEmail };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/compte/mot-de-passe`,
  });
  // Same answer whether or not the account exists
  return { ok: true, message: e.resetSent };
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const e = (await getT()).t.errors;
  if (password.length < 8) return { ok: false, message: e.min8 };
  if (password !== formData.get("confirm")) return { ok: false, message: e.pwMismatch };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: translateAuthError(error.message, e) };
  return { ok: true, message: e.pwUpdated };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
