import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, ROLE_LABEL } from "@/lib/format";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/admin/Shell";
import { RoleSelect } from "./RoleSelect";

export const metadata: Metadata = { title: "Utilisateurs" };

type Row = {
  id: string; email: string; full_name: string | null; phone: string | null;
  role: UserRole; created_at: string; last_sign_in_at: string | null;
};

const FILTERS: (UserRole | "all")[] = ["all", "admin", "manager", "customer"];

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ role?: string; q?: string }> }) {
  const sp = await searchParams;
  const roleFilter = FILTERS.includes(sp.role as UserRole) ? (sp.role as UserRole | "all") : "all";
  const q = (sp.q ?? "").trim().toLowerCase();

  const supabase = await createClient();
  const [{ data, error }, me] = await Promise.all([supabase.rpc("admin_list_users"), getCurrentUser()]);
  const users = ((data ?? []) as Row[]).filter(
    (u) =>
      (roleFilter === "all" || u.role === roleFilter) &&
      (!q || [u.email, u.full_name, u.phone].some((v) => v?.toLowerCase().includes(q))),
  );

  return (
    <>
      <PageHeader
        title="Utilisateurs & rôles"
        description="Pour ajouter un gérant : la personne crée un compte sur le site, puis vous changez son rôle ici."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <nav aria-label="Filtrer par rôle" className="flex gap-1.5">
          {FILTERS.map((r) => (
            <a
              key={r}
              href={r === "all" ? "/admin/utilisateurs" : `/admin/utilisateurs?role=${r}`}
              aria-current={r === roleFilter ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-semibold",
                r === roleFilter ? "bg-ink text-white" : "border border-line bg-white",
              )}
            >
              {r === "all" ? "Tous" : ROLE_LABEL[r]}
            </a>
          ))}
        </nav>
        <form className="ml-auto flex-1 sm:max-w-xs" role="search">
          {roleFilter !== "all" && <input type="hidden" name="role" value={roleFilter} />}
          <label htmlFor="uq" className="sr-only">Rechercher un utilisateur</label>
          <input id="uq" name="q" defaultValue={sp.q} placeholder="Nom, e-mail, téléphone…" className="input h-11" />
        </form>
      </div>

      {error && <p className="card mb-4 p-4 text-danger">{error.message}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead className="bg-ground text-sm text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Utilisateur</th>
              <th scope="col" className="px-4 py-3 font-semibold">Téléphone</th>
              <th scope="col" className="px-4 py-3 font-semibold">Inscrit le</th>
              <th scope="col" className="px-4 py-3 font-semibold">Dernière connexion</th>
              <th scope="col" className="px-4 py-3 font-semibold">Rôle</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <span className="block font-semibold">{u.full_name || "—"}</span>
                  <span className="text-sm text-muted">{u.email}</span>
                </td>
                <td className="px-4 py-3 text-sm">{u.phone || "—"}</td>
                <td className="px-4 py-3 text-sm text-muted">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3 text-sm text-muted">{u.last_sign_in_at ? formatDate(u.last_sign_in_at) : "—"}</td>
                <td className="px-4 py-3">
                  {u.id === me?.id ? (
                    <span className="badge bg-ink text-accent ring-ink">{ROLE_LABEL[u.role]} (vous)</span>
                  ) : (
                    <RoleSelect userId={u.id} role={u.role} name={u.full_name || u.email} />
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted">Aucun utilisateur.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
