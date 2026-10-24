import { Search } from "lucide-react";

export function SearchForm({
  defaultValue,
  id = "q",
  label,
  placeholder,
  submitLabel,
}: {
  defaultValue?: string;
  id?: string;
  label: string;
  placeholder: string;
  submitLabel: string;
}) {
  return (
    <form action="/produits" role="search" className="flex min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-12 min-w-0 flex-1 rounded-s-xl border-2 border-e-0 border-ink bg-white px-4 text-base focus:outline-none"
      />
      <button type="submit" aria-label={submitLabel} className="flex h-12 w-14 cursor-pointer items-center justify-center rounded-e-xl bg-ink text-white hover:bg-black">
        <Search className="size-5" aria-hidden="true" />
      </button>
    </form>
  );
}
