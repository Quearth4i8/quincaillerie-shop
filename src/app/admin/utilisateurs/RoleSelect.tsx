"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { setUserRole } from "@/app/actions/admin";
import { ROLE_LABEL } from "@/lib/format";
import type { UserRole } from "@/lib/types";

export function RoleSelect({ userId, role, name }: { userId: string; role: UserRole; name: string }) {
  const [optimistic, setOptimistic] = useOptimistic(role);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as UserRole;
    if (next === "admin" && !window.confirm(`Donner tous les droits d’administration à ${name} ?`)) return;
    startTransition(async () => {
      setOptimistic(next);
      const res = await setUserRole(userId, next);
      if (res.ok) toast.success(`${name} est maintenant ${ROLE_LABEL[next].toLowerCase()}`);
      else toast.error(res.message);
    });
  }

  return (
    <>
      <label htmlFor={`role-${userId}`} className="sr-only">Rôle de {name}</label>
      <select id={`role-${userId}`} value={optimistic} onChange={onChange} disabled={pending} className="input h-10 w-auto">
        {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
        ))}
      </select>
    </>
  );
}
