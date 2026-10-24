import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { Shell } from "@/components/admin/Shell";

export const metadata: Metadata = { title: { default: "Gestion", template: "%s · Gestion" }, robots: { index: false } };

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["manager", "admin"], "/gestion");
  return <Shell user={user}>{children}</Shell>;
}
