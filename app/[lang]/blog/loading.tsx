export default function BlogLoading() {
  return (
    <main className="bg-background min-h-screen">
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Title skeleton */}
          <div className="h-10 w-24 bg-surface rounded-lg mb-4 animate-pulse" />
          <div className="h-5 w-80 bg-surface rounded-lg mb-10 animate-pulse" />

          {/* Category tabs skeleton */}
          <div className="flex gap-2 mb-4">
            <div className="h-9 w-16 bg-surface rounded-lg animate-pulse" />
            <div className="h-9 w-24 bg-surface rounded-lg animate-pulse" />
            <div className="h-9 w-20 bg-surface rounded-lg animate-pulse" />
          </div>

          {/* Search bar skeleton */}
          <div className="h-10 w-full bg-surface rounded-lg mb-10 animate-pulse" />

          {/* Post cards skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden animate-pulse">
                <div className="h-44 md:h-48 bg-border" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 bg-border rounded" />
                  <div className="h-3 w-1/2 bg-border rounded" />
                  <div className="h-3 w-1/4 bg-border rounded" />
                  <div className="h-4 w-full bg-border rounded" />
                  <div className="h-4 w-2/3 bg-border rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
