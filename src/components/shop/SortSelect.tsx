"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value === "populaire") params.delete("tri");
    else params.set("tri", e.target.value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor="tri" className="font-semibold">Trier par</label>
      <select id="tri" value={value} onChange={onChange} className="input h-11 w-auto pr-8">
        <option value="populaire">Les plus demandés</option>
        <option value="prix-asc">Prix croissant</option>
        <option value="prix-desc">Prix décroissant</option>
        <option value="nouveau">Nouveautés</option>
      </select>
    </div>
  );
}
