// Скелетон ленты, пока сервер собирает страницу (loading.tsx).
export default function GridSkeleton() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-16" aria-busy>
      <div className="h-4 w-24 rounded shimmer" />
      <div className="mt-5 h-10 w-56 rounded-full shimmer" />
      <div className="mt-5 h-12 w-64 rounded-xl shimmer" />
      <div className="mt-10 h-12 max-w-md rounded-full shimmer" />
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="aspect-square rounded-2xl shimmer" />
            <div className="mt-2.5 h-4 w-3/4 rounded shimmer" />
            <div className="mt-1.5 h-4 w-1/3 rounded shimmer" />
          </div>
        ))}
      </div>
    </main>
  );
}
