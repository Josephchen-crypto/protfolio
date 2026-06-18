export default function BlogPostLoading() {
  return (
    <main className="bg-background min-h-screen">
      {/* Progress bar placeholder */}
      <div className="fixed top-0 left-0 z-50 w-full h-0.5 bg-border/30" />

      {/* Hero skeleton */}
      <div className="relative pt-24">
        <div className="absolute inset-0 h-[55vh] bg-gradient-to-b from-primary/5 via-neon-purple/5 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-16 md:pb-24 text-center">
          {/* Back link skeleton */}
          <div className="h-4 w-28 bg-surface rounded mx-auto mb-12 animate-pulse" />

          {/* Icon skeleton */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-surface animate-pulse" />
          </div>

          {/* Title skeleton */}
          <div className="h-12 w-3/4 bg-surface rounded-lg mx-auto mb-4 animate-pulse" />
          <div className="h-12 w-1/2 bg-surface rounded-lg mx-auto mb-6 animate-pulse" />

          {/* Meta skeleton */}
          <div className="flex items-center justify-center gap-4">
            <div className="h-4 w-32 bg-surface rounded animate-pulse" />
            <div className="h-4 w-20 bg-surface rounded animate-pulse" />
            <div className="h-4 w-24 bg-surface rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 pb-24 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-surface rounded animate-pulse"
            style={{ width: `${65 + Math.random() * 30}%` }}
          />
        ))}
      </div>
    </main>
  );
}
