"use client";

import type { OrderStatus } from "@/lib/types";
import { STATUS_STYLE } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/I18nProvider";

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { t } = useI18n();
  return <span className={cn("badge", STATUS_STYLE[status], className)}>{t.status[status]}</span>;
}
