import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { Shell } from "@/components/admin/Shell";

export const metadata: Metadata = { title: { default: "Administration", template: "%s · Administration" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["admin"], "/admin");
  return <Shell user={user}>{children}</Shell>;
}
