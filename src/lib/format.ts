import type { OrderSource, OrderStatus, UserRole } from "./types";

const priceFormatter = new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

/** 189 → "189,000" (Tunisian dinar uses 3 decimals) */
export function formatPrice(value: number | string | null | undefined) {
  return priceFormatter.format(Number(value ?? 0));
}

export function formatDT(value: number | string | null | undefined) {
  return `${formatPrice(value)} DT`;
}

const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Tunis" });
const dateOnly = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Africa/Tunis" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => dateOnly.format(new Date(iso));

export function discountPercent(price: number, oldPrice: number | null) {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round((1 - price / oldPrice) * 100);
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "En attente d’appel",
  confirmed: "Confirmée",
  out_for_delivery: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-900 ring-amber-300",
  confirmed: "bg-sky-100 text-sky-900 ring-sky-300",
  out_for_delivery: "bg-violet-100 text-violet-900 ring-violet-300",
  delivered: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  cancelled: "bg-zinc-200 text-zinc-700 ring-zinc-300",
};

export const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "out_for_delivery", "delivered"];

export const SOURCE_LABEL: Record<OrderSource, string> = {
  web: "Site web",
  phone: "Téléphone",
  whatsapp: "WhatsApp",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  customer: "Client",
  manager: "Gérant",
  admin: "Administrateur",
};

/** "+216 20 123 456" → "+21620123456" for tel: links */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** WhatsApp click-to-chat link; number in international format without + */
export function whatsappHref(number: string, text?: string) {
  const n = number.replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
