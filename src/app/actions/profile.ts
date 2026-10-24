"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { GOVERNORATES } from "@/lib/constants";
import type { ActionState } from "@/lib/types";

const schema = z.object({
  full_name: z.string().trim().min(2, "Indiquez votre nom").max(120),
  phone: z.string().trim().max(25),
  governorate: z.union([z.enum(GOVERNORATES), z.literal("")]),
  city: z.string().trim().max(120),
  address: z.string().trim().max(300),
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Session expirée, reconnectez-vous." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Champs invalides." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      governorate: parsed.data.governorate || null,
      city: parsed.data.city || null,
      address: parsed.data.address || null,
    })
    .eq("id", user.id);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/compte");
  return { ok: true, message: "Vos informations sont enregistrées." };
}
