import Link from "next/link";
import { getT } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <main className="container-page flex min-h-[70dvh] flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="heading-display text-8xl text-accent-strong">404</span>
      <h1 className="heading-display text-4xl">{t.notFound.title}</h1>
      <p className="max-w-md text-muted">{t.notFound.text}</p>
      <div className="flex gap-3">
        <Link href="/" className="btn-dark h-12">{t.common.home}</Link>
        <Link href="/produits" className="btn-accent h-12">{t.common.catalogue}</Link>
      </div>
    </main>
  );
}
