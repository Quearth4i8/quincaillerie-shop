"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/I18nProvider";

/** Submit button with a spinner. Pass `pending` when the form submits through useFormAction. */
export function SubmitButton({
  children,
  className = "btn-accent h-12",
  pendingLabel,
  pending: pendingProp,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  pending?: boolean;
}) {
  const { t } = useI18n();
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" disabled={pending} className={cn(className)}>
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          {pendingLabel ?? t.common.wait}
        </>
      ) : (
        children
      )}
    </button>
  );
}
