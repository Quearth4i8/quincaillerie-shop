import Link from "next/link";
import { LogOut, Store } from "lucide-react";
import { getSettings } from "@/lib/data";
import { ROLE_LABEL } from "@/lib/format";
import type { UserRole } from "@/lib/types";
import { signOut } from "@/app/actions/auth";
import { NavLinks } from "./NavLinks";
import { RealtimeOrders } from "./RealtimeOrders";
import { RealtimeChat } from "./RealtimeChat";
import { createClient } from "@/lib/supabase/server";
import { I18nProvider } from "@/i18n/I18nProvider";

export async function Shell({
  user,
  children,
}: {
  user: { email: string | null; role: UserRole; profile: { full_name: string | null } | null };
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const [settings, { count: unreadChats }] = await Promise.all([
    getSettings(),
    supabase.from("conversations").select("id", { count: "exact", head: true }).gt("staff_unread", 0),
  ]);

  return (
    // The back office stays in French, even when the shop is shown in Arabic
    <I18nProvider locale="fr">
    <div lang="fr" dir="ltr" className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="bg-ink text-zinc-300 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-5 lg:py-6">
          <Link href={user.role === "admin" ? "/admin" : "/gestion"} className="flex flex-col leading-none">
            <span className="heading-display text-2xl uppercase text-white">{settings.shop_name}</span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-accent">
              Espace {user.role === "admin" ? "admin" : "gestion"}
            </span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold hover:bg-white/10 lg:hidden">
            <Store className="size-4" aria-hidden="true" />
            Boutique
          </Link>
        </div>
        <NavLinks role={user.role} unreadChats={unreadChats ?? 0} />
        <div className="mt-auto hidden border-t border-white/10 p-4 lg:block">
          <p className="truncate font-semibold text-white">{user.profile?.full_name || user.email}</p>
          <p className="text-sm">{ROLE_LABEL[user.role]}</p>
          <div className="mt-3 flex gap-2">
            <Link href="/" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 px-2 py-2 text-sm font-semibold text-white hover:bg-white/15">
              <Store className="size-4" aria-hidden="true" />
              Boutique
            </Link>
            <form action={signOut}>
              <button type="submit" aria-label="Déconnexion" className="flex cursor-pointer items-center justify-center rounded-lg bg-white/10 p-2 text-white hover:bg-white/15">
                <LogOut className="size-5" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="w-full px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</div>
      </div>
      <RealtimeOrders />
      <RealtimeChat />
    </div>
    </I18nProvider>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="heading-display text-4xl">{title}</h1>
        {description && <p className="mt-1.5 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: string | number; hint?: string; tone?: "default" | "accent" | "dark" }) {
  const styles = {
    default: "card",
    accent: "rounded-2xl bg-accent",
    dark: "rounded-2xl bg-ink text-white",
  }[tone];
  return (
    <div className={`${styles} flex flex-col gap-1 p-5`}>
      <span className={tone === "dark" ? "text-sm font-semibold text-zinc-300" : "text-sm font-semibold text-muted"}>{label}</span>
      <span className="heading-display text-4xl">{value}</span>
      {hint && <span className={tone === "dark" ? "text-sm text-zinc-300" : "text-sm text-muted"}>{hint}</span>}
    </div>
  );
}
