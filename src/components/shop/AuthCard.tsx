export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="card mx-auto flex max-w-md flex-col gap-5 p-6 sm:p-8">
        <div>
          <h1 className="heading-display text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
