export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Chargement">
      <div className="mb-6 h-10 w-64 animate-pulse rounded-xl bg-line" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card h-28 animate-pulse" />
        ))}
      </div>
      <div className="card mt-6 h-96 animate-pulse" />
    </div>
  );
}
