"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, LoaderCircle, Plus, Star, Trash, X } from "lucide-react";
import { deleteProduct, saveProduct } from "@/app/actions/catalog";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/constants";
import type { Category, Product, Spec } from "@/lib/types";
import { FieldError, FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFormAction } from "@/lib/use-form-action";

const MAX_IMAGE_MB = 5;

export function ProductForm({ categories, product }: { categories: Category[]; product?: Product }) {
  const { state, onSubmit, pending } = useFormAction(saveProduct);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [specs, setSpecs] = useState<Spec[]>(product?.specs?.length ? product.specs : [{ label: "", value: "" }]);
  const [uploading, setUploading] = useState(false);
  const [deleting, startDelete] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const supabase = createClient();
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} n’est pas une image`);
        continue;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        toast.error(`${file.name} dépasse ${MAX_IMAGE_MB} Mo`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `products/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
      });
      if (error) {
        toast.error(`Échec de l’envoi : ${error.message}`);
        continue;
      }
      uploaded.push(supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl);
    }
    setImages((imgs) => [...imgs, ...uploaded].slice(0, 10));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const updateSpec = (i: number, key: keyof Spec, value: string) =>
    setSpecs((s) => s.map((row, j) => (j === i ? { ...row, [key]: value } : row)));

  return (
    <form onSubmit={onSubmit} className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="specs" value={JSON.stringify(specs)} />

      <div className="flex flex-col gap-5">
        <FormMessage state={state} />

        <section className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <h2 className="heading-display text-2xl sm:col-span-2">Informations</h2>
          <label className="field-label sm:col-span-2">
            Nom du produit
            <input name="name" required defaultValue={product?.name} className="input" />
            <FieldError state={state} name="name" />
          </label>
          <label className="field-label">
            Rayon
            <select name="category_id" defaultValue={product?.category_id ?? ""} className="input">
              <option value="">— Aucun —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field-label">
            <span>Référence <span className="font-normal text-muted">(facultatif)</span></span>
            <input name="reference" defaultValue={product?.reference ?? ""} className="input" />
          </label>
          <label className="field-label sm:col-span-2">
            Description
            <textarea name="description" rows={5} defaultValue={product?.description ?? ""} className="textarea" />
          </label>
          <label className="field-label sm:col-span-2">
            <span>Points forts <span className="font-normal text-muted">(un par ligne)</span></span>
            <textarea
              name="highlights"
              rows={3}
              defaultValue={product?.highlights?.join("\n") ?? ""}
              placeholder={"2 batteries incluses\nLivrée en coffret"}
              className="textarea"
            />
          </label>
        </section>

        <section className="card flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="heading-display text-2xl">Photos</h2>
            <span className="text-sm text-muted">La première photo est la photo principale. {MAX_IMAGE_MB} Mo max.</span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {images.map((src, i) => (
              <div key={src} className="group relative aspect-square overflow-hidden rounded-xl bg-tile ring-1 ring-line">
                <Image src={src} alt="" fill sizes="160px" className="object-contain p-1.5" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-ink px-1.5 py-0.5 text-[11px] font-bold text-accent">Principale</span>}
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => setImages((imgs) => [src, ...imgs.filter((u) => u !== src)])}
                      aria-label="Définir comme photo principale"
                      className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/95 shadow"
                    >
                      <Star className="size-4" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setImages((imgs) => imgs.filter((u) => u !== src))}
                    aria-label="Retirer la photo"
                    className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/95 text-danger shadow"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
            {images.length < 10 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line-strong text-sm font-semibold text-muted hover:border-ink hover:text-ink"
              >
                {uploading ? <LoaderCircle className="size-7 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-7" aria-hidden="true" />}
                {uploading ? "Envoi…" : "Ajouter"}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
            aria-label="Choisir des photos"
          />
        </section>

        <section className="card flex flex-col gap-3 p-5 sm:p-6">
          <h2 className="heading-display text-2xl">Caractéristiques</h2>
          {specs.map((s, i) => (
            <div key={i} className="flex gap-2">
              <label className="sr-only" htmlFor={`spec-l-${i}`}>Caractéristique</label>
              <input id={`spec-l-${i}`} value={s.label} onChange={(e) => updateSpec(i, "label", e.target.value)} placeholder="Ex. : Puissance" className="input" />
              <label className="sr-only" htmlFor={`spec-v-${i}`}>Valeur</label>
              <input id={`spec-v-${i}`} value={s.value} onChange={(e) => updateSpec(i, "value", e.target.value)} placeholder="Ex. : 800 W" className="input" />
              <button
                type="button"
                onClick={() => setSpecs((rows) => rows.filter((_, j) => j !== i))}
                aria-label="Supprimer la ligne"
                className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted hover:text-danger"
              >
                <Trash className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setSpecs((rows) => [...rows, { label: "", value: "" }])} className="btn-outline h-11 self-start border">
            <Plus className="size-4" aria-hidden="true" />
            Ajouter une ligne
          </button>
        </section>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
        <section className="card flex flex-col gap-4 p-5">
          <h2 className="heading-display text-2xl">Prix & stock</h2>
          <label className="field-label">
            Prix (DT)
            <input name="price" type="number" step="0.001" min="0" required defaultValue={product?.price} className="input" />
            <FieldError state={state} name="price" />
          </label>
          <label className="field-label">
            <span>Ancien prix (DT) <span className="font-normal text-muted">— promo</span></span>
            <input name="old_price" type="number" step="0.001" min="0" defaultValue={product?.old_price ?? ""} className="input" />
            <FieldError state={state} name="old_price" />
          </label>
          <label className="field-label">
            Stock disponible
            <input name="stock" type="number" step="1" min="0" required defaultValue={product?.stock ?? 0} className="input" />
            <FieldError state={state} name="stock" />
          </label>
          <label className="field-label">
            <span>Badge <span className="font-normal text-muted">(PROMO, NOUVEAU…)</span></span>
            <input name="badge" maxLength={20} defaultValue={product?.badge ?? ""} className="input" />
          </label>
          <label className="flex items-center gap-3 font-semibold">
            <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="size-5 accent-ink" />
            Visible sur la boutique
          </label>
          <label className="flex items-center gap-3 font-semibold">
            <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} className="size-5 accent-ink" />
            Mettre en avant (accueil)
          </label>
          <SubmitButton pending={pending} className="btn-accent h-13 text-lg" pendingLabel="Enregistrement…">
            {product ? "Enregistrer" : "Créer le produit"}
          </SubmitButton>
        </section>

        {product && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (!window.confirm("Supprimer définitivement ce produit ? (Les anciennes commandes gardent son nom.)")) return;
              startDelete(async () => {
                const res = await deleteProduct(product.id);
                if (res && !res.ok) toast.error(res.message);
              });
            }}
            className="btn-outline h-11 border-danger text-danger"
          >
            <Trash className="size-4" aria-hidden="true" />
            Supprimer le produit
          </button>
        )}
      </aside>
    </form>
  );
}
