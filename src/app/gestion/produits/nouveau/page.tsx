import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCategories } from "@/lib/data";
import { PageHeader } from "@/components/admin/Shell";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Nouveau produit" };

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <>
      <Link href="/gestion/produits" className="mb-4 inline-flex items-center gap-1.5 font-semibold hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Produits
      </Link>
      <PageHeader title="Nouveau produit" />
      <ProductForm categories={categories} />
    </>
  );
}
