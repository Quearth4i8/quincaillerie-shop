"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { setUserRole } from "@/app/actions/admin";
import { ROLE_LABEL } from "@/lib/format";
import type { UserRole } from "@/lib/types";
import { Select } from "@/components/ui/Select";

export function RoleSelect({ userId, role, name }: { userId: string; role: UserRole; name: string }) {
  const [optimistic, setOptimistic] = useOptimistic(role);
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    const next = value as UserRole;
    if (next === "admin" && !window.confirm(`Donner tous les droits d’administration à ${name} ?`)) return;
    startTransition(async () => {
      setOptimistic(next);
      const res = await setUserRole(userId, next);
      if (res.ok) toast.success(`${name} est maintenant ${ROLE_LABEL[next].toLowerCase()}`);
      else toast.error(res.message);
    });
  }

  return (
    <Select
      aria-label={`Rôle de ${name}`}
      value={optimistic}
      onChange={onChange}
      disabled={pending}
      className="w-44"
      triggerClassName="h-10"
      options={(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
    />
  );
}
