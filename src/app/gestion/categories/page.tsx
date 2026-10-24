import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data";
import { PageHeader } from "@/components/admin/Shell";
import { CategoryRow } from "./CategoryRow";

export const metadata: Metadata = { title: "Rayons" };

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [categories, { data: products }] = await Promise.all([
    getCategories(),
    supabase.from("products").select("category_id"),
  ]);
  const counts = new Map<string, number>();
  (products ?? []).forEach((p) => p.category_id && counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1));

  return (
    <>
      <PageHeader title="Rayons" description="Les rayons apparaissent dans le menu et sur l’accueil, dans l’ordre indiqué." />
      <div className="flex flex-col gap-3">
        {categories.map((c) => (
          <CategoryRow key={c.id} category={c} productCount={counts.get(c.id) ?? 0} />
        ))}
        <h2 className="heading-display mt-4 text-2xl">Nouveau rayon</h2>
        <CategoryRow productCount={0} />
      </div>
    </>
  );
}
