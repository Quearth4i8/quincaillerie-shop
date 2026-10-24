"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { CATEGORY_ICONS } from "@/lib/icons";
import type { ActionState } from "@/lib/types";

const money = z.coerce.number().min(0, "Prix invalide").max(1_000_000);

const productSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Nom requis").max(160),
  slug: z.string().trim().max(90).optional(),
  reference: z.string().trim().max(60).optional(),
  description: z.string().trim().max(5000).optional(),
  category_id: z.union([z.uuid(), z.literal("")]),
  price: money,
  old_price: z.union([money, z.literal("")]).optional(),
  stock: z.coerce.number().int("Stock entier").min(0, "Stock ≥ 0").max(1_000_000),
  badge: z.string().trim().max(20).optional(),
  highlights: z.string().max(2000).optional(),
  specs: z.string().max(10000).optional(),
  images: z.string().max(10000).optional(),
  is_featured: z.boolean(),
  is_active: z.boolean(),
});

function revalidateCatalog() {
  revalidatePath("/", "layout");
}

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["manager", "admin"]);

  const raw = Object.fromEntries(formData);
  const parsed = productSchema.safeParse({
    ...raw,
    id: raw.id || undefined,
    is_featured: formData.get("is_featured") === "on",
    is_active: formData.get("is_active") === "on",
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: "Vérifiez les champs indiqués.", errors };
  }
  const d = parsed.data;

  let specs: { label: string; value: string }[] = [];
  let images: string[] = [];
  try {
    specs = JSON.parse(d.specs || "[]");
    images = JSON.parse(d.images || "[]");
  } catch {
    return { ok: false, message: "Données invalides." };
  }
  specs = specs.filter((s) => s.label?.trim() && s.value?.trim()).map((s) => ({ label: s.label.trim(), value: s.value.trim() }));
  images = images.filter((u) => typeof u === "string" && u.startsWith("https://")).slice(0, 10);

  const oldPrice = d.old_price === "" || d.old_price === undefined ? null : d.old_price;
  if (oldPrice !== null && oldPrice <= d.price) {
    return { ok: false, message: "L’ancien prix doit être supérieur au prix actuel.", errors: { old_price: "Doit être > prix" } };
  }

  const row = {
    name: d.name,
    slug: slugify(d.slug || d.name) || crypto.randomUUID().slice(0, 8),
    reference: d.reference || null,
    description: d.description || null,
    category_id: d.category_id || null,
    price: d.price,
    old_price: oldPrice,
    stock: d.stock,
    badge: d.badge?.toUpperCase() || null,
    highlights: (d.highlights ?? "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 10),
    specs,
    images,
    is_featured: d.is_featured,
    is_active: d.is_active,
  };

  const supabase = await createClient();
  const save = (r: typeof row) =>
    d.id ? supabase.from("products").update(r).eq("id", d.id).select("id").single() : supabase.from("products").insert(r).select("id").single();

  let { data, error } = await save(row);
  if (error?.code === "23505") {
    // Slug already taken → add a short suffix
    ({ data, error } = await save({ ...row, slug: `${row.slug}-${crypto.randomUUID().slice(0, 4)}` }));
  }
  if (error || !data) return { ok: false, message: error?.message ?? "Enregistrement impossible." };

  revalidateCatalog();
  if (!d.id) redirect(`/gestion/produits/${data.id}?cree=1`);
  return { ok: true, message: "Produit enregistré." };
}

export async function setProductActive(id: string, isActive: boolean) {
  await requireRole(["manager", "admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidateCatalog();
  return { ok: true };
}

export async function deleteProduct(id: string) {
  await requireRole(["manager", "admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidateCatalog();
  redirect("/gestion/produits");
}

const categorySchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Nom requis").max(80),
  icon: z.string().refine((v) => v in CATEGORY_ICONS, "Icône inconnue"),
  sort_order: z.coerce.number().int().min(0).max(999),
});

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["manager", "admin"]);
  const raw = Object.fromEntries(formData);
  const parsed = categorySchema.safeParse({ ...raw, id: raw.id || undefined });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Champs invalides." };

  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("categories").update(rest).eq("id", id)
    : await supabase.from("categories").insert({ ...rest, slug: slugify(rest.name) || crypto.randomUUID().slice(0, 8) });

  if (error) return { ok: false, message: error.code === "23505" ? "Un rayon porte déjà ce nom." : error.message };
  revalidateCatalog();
  return { ok: true, message: id ? "Rayon mis à jour." : "Rayon créé." };
}

export async function deleteCategory(id: string) {
  await requireRole(["manager", "admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidateCatalog();
  return { ok: true };
}
