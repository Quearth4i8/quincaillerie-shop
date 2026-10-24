"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { GOVERNORATES } from "@/lib/constants";
import type { OrderSource, OrderStatus } from "@/lib/types";
import { getT } from "@/i18n/server";
import { getDict, translateDbError, type Dict, type Locale } from "@/i18n/config";

/** Accepts "20 123 456", "+216 20123456", "0021620123456" → "+216 20 123 456" */
function normalizeTunisianPhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00216")) digits = digits.slice(5);
  else if (digits.startsWith("216") && digits.length === 11) digits = digits.slice(3);
  if (digits.length !== 8) return null;
  return `+216 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}

const itemsSchema = (e: Dict["errors"]) =>
  z
    .array(z.object({ product_id: z.uuid(), quantity: z.number().int().min(1).max(999) }))
    .min(1, e.cartEmpty)
    .max(100);

const orderSchema = (e: Dict["errors"]) =>
  z.object({
    customer_name: z.string().trim().min(2, e.nameRequired).max(120),
    phone: z.string().trim().min(8, e.phoneInvalid).max(25),
    governorate: z.enum(GOVERNORATES, { message: e.chooseGov }),
    city: z.string().trim().min(2, e.cityRequired).max(120),
    address: z.string().trim().min(5, e.addressRequired).max(300),
    note: z.string().trim().max(500).optional(),
  });

export type PlaceOrderResult =
  | { ok: true; orderNumber: number; total: number }
  | { ok: false; message: string; errors?: Record<string, string> };

async function submitOrder(formData: FormData, source: OrderSource, locale: Locale): Promise<PlaceOrderResult> {
  const e = getDict(locale).errors;
  const parsed = orderSchema(e).safeParse({
    customer_name: formData.get("customer_name"),
    phone: formData.get("phone"),
    governorate: formData.get("governorate"),
    city: formData.get("city"),
    address: formData.get("address"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: e.checkFields, errors };
  }

  const phone = normalizeTunisianPhone(parsed.data.phone);
  if (!phone) {
    return { ok: false, message: e.checkFields, errors: { phone: e.phoneTn } };
  }

  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { ok: false, message: e.cartInvalid };
  }
  const parsedItems = itemsSchema(e).safeParse(items);
  if (!parsedItems.success) return { ok: false, message: parsedItems.error.issues[0]?.message ?? e.cartInvalid };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_customer_name: parsed.data.customer_name,
    p_phone: phone,
    p_governorate: parsed.data.governorate,
    p_city: parsed.data.city,
    p_address: parsed.data.address,
    p_note: parsed.data.note ?? null,
    p_items: parsedItems.data,
    p_source: source,
  });

  if (error) return { ok: false, message: error.message ? translateDbError(error.message, locale) : e.orderFailed };

  const result = data as { order_number: number; total: number };
  revalidatePath("/gestion", "layout");
  revalidatePath("/compte");
  return { ok: true, orderNumber: result.order_number, total: Number(result.total) };
}

/** Checkout from the website (guests and signed-in customers) */
export async function placeOrder(formData: FormData) {
  const { locale } = await getT();
  return submitOrder(formData, "web", locale);
}

/** Order taken by staff over the phone / WhatsApp */
export async function createStaffOrder(formData: FormData) {
  await requireRole(["manager", "admin"]);
  const source = formData.get("source") === "whatsapp" ? "whatsapp" : "phone";
  return submitOrder(formData, source, "fr"); // back office is in French
}

const STATUSES: OrderStatus[] = ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"];

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const user = await requireRole(["manager", "admin"]);
  if (!STATUSES.includes(status)) return { ok: false, message: "Statut inconnu" };

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status, handled_by: user.id }).eq("id", orderId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/gestion", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveStaffNote(orderId: string, note: string) {
  await requireRole(["manager", "admin"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ staff_note: note.trim().slice(0, 1000) || null })
    .eq("id", orderId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/gestion/commandes/${orderId}`);
  return { ok: true };
}

export async function deleteOrder(orderId: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/gestion", "layout");
  return { ok: true };
}

export async function cancelMyOrder(orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_my_order", { p_order_id: orderId });
  if (error) return { ok: false, message: translateDbError(error.message, (await getT()).locale) };
  revalidatePath("/compte", "layout");
  return { ok: true };
}
