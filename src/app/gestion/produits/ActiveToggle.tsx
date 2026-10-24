"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { setProductActive } from "@/app/actions/catalog";
import { cn } from "@/lib/cn";

export function ActiveToggle({ id, active }: { id: string; active: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(active);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={optimistic ? "En ligne — cliquer pour masquer" : "Masqué — cliquer pour mettre en ligne"}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          const res = await setProductActive(id, !optimistic);
          if (!res.ok) toast.error(res.message);
        })
      }
      className={cn(
        "relative inline-flex h-7 w-12 cursor-pointer items-center rounded-full transition",
        optimistic ? "bg-ok" : "bg-zinc-300",
      )}
    >
      <span className={cn("absolute size-5 rounded-full bg-white shadow transition", optimistic ? "left-6" : "left-1")} />
    </button>
  );
}
