import type { Metadata } from "next";
import { getDeliveryZones } from "@/lib/data";
import { PageHeader } from "@/components/admin/Shell";
import { ZonesEditor } from "./ZonesEditor";

export const metadata: Metadata = { title: "Zones de livraison" };

export default async function DeliveryPage() {
  const zones = await getDeliveryZones();
  return (
    <>
      <PageHeader
        title="Zones de livraison"
        description="Frais et délai affichés au client selon son gouvernorat. Désactivez une zone pour ne plus y livrer."
      />
      <ZonesEditor zones={zones} />
    </>
  );
}
