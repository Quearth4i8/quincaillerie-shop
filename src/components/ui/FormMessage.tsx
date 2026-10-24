import { CircleCheck, CircleX } from "lucide-react";
import type { ActionState } from "@/lib/types";
import { cn } from "@/lib/cn";

export function FormMessage({ state }: { state: ActionState }) {
  if (!state?.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl p-3.5 text-[15px] font-semibold",
        state.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900",
      )}
    >
      {state.ok ? <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : <CircleX className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
      {state.message}
    </p>
  );
}

export function FieldError({ state, name }: { state: ActionState; name: string }) {
  const message = state?.errors?.[name];
  if (!message) return null;
  return <span className="text-sm font-semibold text-danger">{message}</span>;
}
