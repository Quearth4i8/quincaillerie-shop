"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ActionState, UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["customer", "manager", "admin"];

export async function setUserRole(userId: string, role: UserRole) {
  const admin = await requireRole(["admin"]);
  if (!ROLES.includes(role)) return { ok: false, message: "Rôle inconnu" };
  if (userId === admin.id) return { ok: false, message: "Vous ne pouvez pas changer votre propre rôle." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/utilisateurs");
  return { ok: true };
}

const zoneSchema = z.object({
  governorate: z.string().min(2),
  fee: z.coerce.number().min(0, "Frais ≥ 0").max(1000),
  delay: z.string().trim().max(40),
  is_active: z.boolean(),
});

export async function saveZone(input: { governorate: string; fee: number | string; delay: string; is_active: boolean }) {
  await requireRole(["admin"]);
  const parsed = zoneSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Valeurs invalides" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_zones")
    .update({ fee: parsed.data.fee, delay: parsed.data.delay || null, is_active: parsed.data.is_active })
    .eq("governorate", parsed.data.governorate);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/livraison");
  revalidatePath("/panier");
  return { ok: true };
}

export async function setAllZoneFees(fee: number) {
  await requireRole(["admin"]);
  if (!(fee >= 0 && fee <= 1000)) return { ok: false, message: "Frais invalides" };
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_zones").update({ fee }).neq("governorate", "");
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/livraison");
  return { ok: true };
}

const settingsSchema = z.object({
  shop_name: z.string().trim().min(2, "Nom requis").max(60),
  tagline: z.string().trim().max(80),
  phone: z.string().trim().min(8, "Téléphone requis").max(30),
  whatsapp: z.string().trim().regex(/^\d{8,15}$/, "WhatsApp : chiffres uniquement, ex. 21620123456"),
  email: z.union([z.email("E-mail invalide"), z.literal("")]),
  address: z.string().trim().max(200),
  hours: z.string().trim().max(100),
});

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: "Vérifiez les champs indiqués.", errors };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({ ...d, email: d.email || null, address: d.address || null, hours: d.hours || null })
    .eq("id", 1);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: "Paramètres enregistrés." };
}
