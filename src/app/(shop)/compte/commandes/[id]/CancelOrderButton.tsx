"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { cancelMyOrder } from "@/app/actions/orders";
import { useI18n } from "@/i18n/I18nProvider";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(t.account.cancelConfirm)) return;
    startTransition(async () => {
      const res = await cancelMyOrder(orderId);
      if (res.ok) toast.success(t.account.cancelled);
      else toast.error(res.message);
    });
  }

  return (
    <button type="button" onClick={onClick} disabled={pending} className="btn-outline h-12 border-danger text-danger">
      {pending ? t.account.cancelling : t.account.cancel}
    </button>
  );
}
