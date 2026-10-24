import { Search } from "lucide-react";

export function SearchForm({ defaultValue, id = "q" }: { defaultValue?: string; id?: string }) {
  return (
    <form action="/produits" role="search" className="flex min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">Rechercher un produit</label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Rechercher : perceuse, robinet, vis, peinture…"
        className="h-12 min-w-0 flex-1 rounded-l-xl border-2 border-r-0 border-ink bg-white px-4 text-base focus:outline-none"
      />
      <button type="submit" aria-label="Rechercher" className="flex h-12 w-14 cursor-pointer items-center justify-center rounded-r-xl bg-ink text-white hover:bg-black">
        <Search className="size-5" aria-hidden="true" />
      </button>
    </form>
  );
}
