import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The shop logo (public/logo.png). On dark backgrounds pass `tile`: the dark
 * hammer needs a white background to stay visible.
 */
export function BrandMark({ size = 44, tile, className }: { size?: number; tile?: boolean; className?: string }) {
  const image = <Image src="/logo.png" alt="" width={size} height={size} className="object-contain" />;
  if (!tile) return <span className={cn("flex shrink-0", className)}>{image}</span>;
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-[10px] bg-white p-1", className)}
      style={{ width: size + 8, height: size + 8 }}
    >
      {image}
    </span>
  );
}
