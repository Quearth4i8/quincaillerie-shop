export function SetupNotice() {
  return (
    <main className="container-page flex min-h-dvh items-center justify-center py-16">
      <div className="card max-w-xl p-8">
        <h1 className="heading-display text-4xl">Configuration requise</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Renseignez vos identifiants Supabase dans le fichier <code className="font-mono">.env.local</code> puis
          redémarrez le serveur :
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-sm text-white">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...`}
        </pre>
        <p className="mt-4 text-muted">
          Exécutez ensuite <code className="font-mono">supabase/01_schema.sql</code> et{" "}
          <code className="font-mono">supabase/02_seed.sql</code> dans l’éditeur SQL de Supabase.
        </p>
      </div>
    </main>
  );
}
