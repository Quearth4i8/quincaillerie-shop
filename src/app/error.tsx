"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <main className="container-page flex min-h-[70dvh] flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="heading-display text-4xl">{t.error.title}</h1>
      <p className="max-w-md text-muted">{error.digest ? t.error.reference(error.digest) : t.error.retryLater}</p>
      <button type="button" onClick={reset} className="btn-accent h-12">{t.error.retry}</button>
    </main>
  );
}
