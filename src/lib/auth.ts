import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile, UserRole } from "./types";

/** The signed-in user and their profile, or null. Cached per request. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, governorate, city, address, created_at")
    .eq("id", claims.sub)
    .single<Profile>();

  return {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? null,
    profile,
    role: (profile?.role ?? "customer") as UserRole,
  };
});

/** Redirects unless the current user has one of the given roles. */
export async function requireRole(roles: UserRole[], next = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  if (!roles.includes(user.role)) redirect("/?refus=1");
  return user;
}

export function homeForRole(role: UserRole) {
  if (role === "admin") return "/admin";
  if (role === "manager") return "/gestion";
  return "/compte";
}
