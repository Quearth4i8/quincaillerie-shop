"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash } from "lucide-react";
import { deleteCategory, saveCategory } from "@/app/actions/catalog";
import { CATEGORY_ICONS, CategoryIcon } from "@/lib/icons";
import type { Category } from "@/lib/types";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Select } from "@/components/ui/Select";

export function CategoryRow({ category, productCount }: { category?: Category; productCount: number }) {
  const [state, action] = useActionState(saveCategory, null);
  const [icon, setIcon] = useState(category?.icon ?? "package");
  const [deleting, startDelete] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const idPrefix = category?.id ?? "new";

  useEffect(() => {
    if (!state?.message) return;
    if (state.ok) {
      toast.success(state.message);
      if (!category) {
        formRef.current?.reset();
        setIcon("package");
      }
    } else toast.error(state.message);
  }, [state, category]);

  return (
    <form ref={formRef} action={action} className="card flex flex-wrap items-end gap-3 p-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ground">
        <CategoryIcon name={icon} className="size-6" />
      </span>
      <label className="field-label min-w-0 flex-1 basis-48" htmlFor={`${idPrefix}-name`}>
        Nom
        <input id={`${idPrefix}-name`} name="name" required defaultValue={category?.name} className="input h-11" />
      </label>
      <label className="field-label min-w-0 flex-1 basis-48" htmlFor={`${idPrefix}-name-ar`}>
        <span>Nom en arabe <span className="font-normal text-muted">(facultatif)</span></span>
        <input
          id={`${idPrefix}-name-ar`}
          name="name_ar"
          lang="ar"
          dir="rtl"
          defaultValue={category?.name_ar ?? ""}
          placeholder="مثلاً: العدّة الكهربائية"
          className="input h-11"
        />
      </label>
      <label className="field-label" htmlFor={`${idPrefix}-icon`}>
        Icône
        <Select
          id={`${idPrefix}-icon`}
          name="icon"
          value={icon}
          onChange={setIcon}
          className="w-48"
          triggerClassName="h-11"
          searchable={false}
          options={Object.entries(CATEGORY_ICONS).map(([key, { label }]) => ({
            value: key,
            label,
            icon: <CategoryIcon name={key} className="size-[18px]" />,
          }))}
        />
      </label>
      <label className="field-label w-24" htmlFor={`${idPrefix}-order`}>
        Ordre
        <input id={`${idPrefix}-order`} name="sort_order" type="number" min={0} defaultValue={category?.sort_order ?? 0} className="input h-11" />
      </label>
      <SubmitButton className="btn-dark h-11" pendingLabel="…">{category ? "Enregistrer" : "Créer"}</SubmitButton>
      {category && (
        <button
          type="button"
          disabled={deleting}
          aria-label={`Supprimer le rayon ${category.name}`}
          onClick={() => {
            const msg = productCount
              ? `Supprimer « ${category.name} » ? Ses ${productCount} produit(s) resteront en ligne mais sans rayon.`
              : `Supprimer « ${category.name} » ?`;
            if (!window.confirm(msg)) return;
            startDelete(async () => {
              const res = await deleteCategory(category.id);
              if (res.ok) toast.success("Rayon supprimé");
              else toast.error(res.message);
            });
          }}
          className="flex size-11 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-ground hover:text-danger"
        >
          <Trash className="size-5" aria-hidden="true" />
        </button>
      )}
      {category && <span className="w-full text-sm text-muted">{productCount} produit(s)</span>}
    </form>
  );
}
