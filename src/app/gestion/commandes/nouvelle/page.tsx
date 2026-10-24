import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDeliveryZones } from "@/lib/data";
import { PageHeader } from "@/components/admin/Shell";
import { StaffOrderForm } from "./StaffOrderForm";

export const metadata: Metadata = { title: "Commande téléphone" };

export default async function NewPhoneOrderPage() {
  const supabase = await createClient();
  const [{ data: products }, zones] = await Promise.all([
    supabase.from("products").select("id, name, reference, price, stock").eq("is_active", true).order("name"),
    getDeliveryZones(),
  ]);

  return (
    <>
      <PageHeader
        title="Commande téléphone"
        description="Saisissez la commande pendant l’appel. Elle est enregistrée comme « confirmée par téléphone » dans l’historique."
      />
      <StaffOrderForm products={products ?? []} zones={zones.filter((z) => z.is_active)} />
    </>
  );
}
