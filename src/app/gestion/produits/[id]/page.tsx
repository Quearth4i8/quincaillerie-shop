import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data";
import type { Product } from "@/lib/types";
import { PageHeader } from "@/components/admin/Shell";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Modifier le produit" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cree?: string }>;
}) {
  const [{ id }, { cree }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [{ data: product }, categories] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle<Product>(),
    getCategories(),
  ]);
  if (!product) notFound();

  return (
    <>
      <Link href="/gestion/produits" className="mb-4 inline-flex items-center gap-1.5 font-semibold hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Produits
      </Link>
      <PageHeader
        title={product.name}
        actions={
          product.is_active && (
            <Link href={`/produit/${product.slug}`} target="_blank" className="btn-outline h-11">
              <ExternalLink className="size-4" aria-hidden="true" />
              Voir sur la boutique
            </Link>
          )
        }
      />
      {cree && (
        <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3.5 font-semibold text-emerald-900">
          Produit créé. Vous pouvez continuer à le compléter.
        </p>
      )}
      <ProductForm categories={categories} product={product} />
    </>
  );
}
