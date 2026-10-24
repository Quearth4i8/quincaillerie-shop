"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "populaire") params.delete("tri");
    else params.set("tri", next);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor="tri" className="font-semibold">Trier par</label>
      <Select
        id="tri"
        value={value}
        onChange={onChange}
        className="w-52"
        triggerClassName="h-11"
        options={[
          { value: "populaire", label: "Les plus demandés" },
          { value: "prix-asc", label: "Prix croissant" },
          { value: "prix-desc", label: "Prix décroissant" },
          { value: "nouveau", label: "Nouveautés" },
        ]}
      />
    </div>
  );
}
