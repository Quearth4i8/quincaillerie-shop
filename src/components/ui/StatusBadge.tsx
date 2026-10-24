import type { OrderStatus } from "@/lib/types";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/format";
import { cn } from "@/lib/cn";

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return <span className={cn("badge", STATUS_STYLE[status], className)}>{STATUS_LABEL[status]}</span>;
}
