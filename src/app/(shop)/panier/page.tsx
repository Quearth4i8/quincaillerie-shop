import type { Metadata } from "next";
import { getDeliveryZones, getSettings } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutView } from "@/components/shop/CheckoutView";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).t.meta.cart };
}

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
