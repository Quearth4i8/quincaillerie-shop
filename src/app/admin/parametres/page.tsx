import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { PageHeader } from "@/components/admin/Shell";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="Paramètres de la boutique" description="Nom, téléphone et coordonnées affichés partout sur le site." />
      <SettingsForm settings={settings} />
    </>
  );
}
