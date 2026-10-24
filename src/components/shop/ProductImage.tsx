import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function ProductImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-tile", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-contain p-3" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-zinc-400">
          <ImageIcon className="size-10" strokeWidth={1.3} aria-hidden="true" />
          <span className="text-xs">Photo à venir</span>
        </div>
      )}
    </div>
  );
}
