import Link from "next/link";
import { Wrench } from "lucide-react";
import { cn } from "@/lib/cn";

export function Logo({
  name,
  tagline,
  homeLabel,
  className,
  dark,
}: {
  name: string;
  tagline?: string;
  homeLabel: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)} aria-label={homeLabel}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-accent">
        <Wrench className="size-6 text-ink" strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          lang="fr"
          className={cn("heading-display text-[26px] uppercase tracking-wide sm:text-[28px]", dark ? "text-white" : "text-ink")}
        >
          {name}
        </span>
        {tagline && <span className={cn("mt-1 hidden text-[13px] sm:block", dark ? "text-zinc-300" : "text-muted")}>{tagline}</span>}
      </span>
    </Link>
  );
}
