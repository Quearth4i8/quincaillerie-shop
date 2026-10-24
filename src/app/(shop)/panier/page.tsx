import type { Metadata } from "next";
import { getDeliveryZones, getSettings } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutView } from "@/components/shop/CheckoutView";

export const metadata: Metadata = { title: "Panier et commande" };

export default async function CartPage() {
  const [zones, settings, user] = await Promise.all([getDeliveryZones(), getSettings(), getCurrentUser()]);
  const p = user?.profile;

  return (
    <div className="container-page py-7">
      <CheckoutView
        zones={zones.filter((z) => z.is_active)}
        phone={settings.phone}
        defaults={{
          customer_name: p?.full_name ?? "",
          phone: p?.phone ?? "",
          governorate: p?.governorate ?? "",
          city: p?.city ?? "",
          address: p?.address ?? "",
        }}
        signedIn={Boolean(user)}
      />
    </div>
  );
}
