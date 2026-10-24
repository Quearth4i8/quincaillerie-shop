"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { setLocale } from "@/app/actions/locale";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  const next = locale === "ar" ? "fr" : "ar";

  return (
    <button
      type="button"
      onClick={() => startTransition(() => setLocale(next))}
      disabled={pending}
      lang={next}
      aria-label={t.language.switchLabel}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/25 px-3 py-0.5 font-bold text-white transition hover:border-accent hover:text-accent disabled:opacity-60",
        className,
      )}
    >
      <Languages className="size-4" aria-hidden="true" />
      {t.language.switchTo}
    </button>
  );
}
