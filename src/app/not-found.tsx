import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page flex min-h-[70dvh] flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="heading-display text-8xl text-accent-strong">404</span>
      <h1 className="heading-display text-4xl">Page introuvable</h1>
      <p className="max-w-md text-muted">Ce produit ou cette page n’existe plus. Revenez à l’accueil ou parcourez le catalogue.</p>
      <div className="flex gap-3">
        <Link href="/" className="btn-dark h-12">Accueil</Link>
        <Link href="/produits" className="btn-accent h-12">Catalogue</Link>
      </div>
    </main>
  );
}
