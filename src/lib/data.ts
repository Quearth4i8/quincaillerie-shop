import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Category, DeliveryZone, Settings } from "./types";

const DEFAULT_SETTINGS: Settings = {
  shop_name: "Dar Brico",
  tagline: "Quincaillerie en ligne",
  phone: "+216 00 000 000",
  whatsapp: "21600000000",
  email: null,
  address: null,
  hours: null,
};

export const getSettings = cache(async (): Promise<Settings> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("shop_name, tagline, phone, whatsapp, email, address, hours")
    .eq("id", 1)
    .maybeSingle<Settings>();
  return data ?? DEFAULT_SETTINGS;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*") // includes name_ar once 04_arabic.sql has run
    .order("sort_order")
    .order("name");
  return data ?? [];
});

export const getDeliveryZones = cache(async (): Promise<DeliveryZone[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("delivery_zones")
    .select("governorate, fee, delay, is_active")
    .order("governorate");
  return data ?? [];
});

export const PRODUCT_CARD_FIELDS =
  "id, slug, name, price, old_price, stock, images, badge, category:categories(*)";
