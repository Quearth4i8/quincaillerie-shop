export default function Loading() {
  return (
    <div className="container-page py-8" aria-busy="true" aria-label="Chargement">
      <div className="mb-6 h-12 w-72 animate-pulse rounded-xl bg-line" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="card h-80 animate-pulse bg-white" />
        ))}
      </div>
    </div>
  );
}
