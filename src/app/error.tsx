"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container-page flex min-h-[70dvh] flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="heading-display text-4xl">Une erreur est survenue</h1>
      <p className="max-w-md text-muted">{error.digest ? `Référence : ${error.digest}` : "Réessayez dans un instant."}</p>
      <button type="button" onClick={reset} className="btn-accent h-12">Réessayer</button>
    </main>
  );
}
