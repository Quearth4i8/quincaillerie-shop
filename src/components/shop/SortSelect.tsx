"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { useI18n } from "@/i18n/I18nProvider";

const SORTS = ["populaire", "prix-asc", "prix-desc", "nouveau"];

export function SortSelect({ value }: { value: string }) {
  const { t } = useI18n();
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
      <label htmlFor="tri" className="whitespace-nowrap font-semibold">{t.catalog.sortBy}</label>
      <Select
        id="tri"
        value={value}
        onChange={onChange}
        className="w-52"
        triggerClassName="h-11"
        options={SORTS.map((s) => ({ value: s, label: t.catalog.sort[s] }))}
      />
    </div>
  );
}
