import Link from "next/link";
import { cn } from "@/lib/cn";
import { BrandMark } from "@/components/BrandMark";

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
      <BrandMark size={dark ? 40 : 52} tile={dark} />
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
