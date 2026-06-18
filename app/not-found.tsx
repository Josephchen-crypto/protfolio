import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="bg-background min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Large 404 */}
        <div className="relative mb-8">
          <h1 className="text-[12rem] md:text-[16rem] font-heading font-bold text-surface leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-primary/20 via-neon-purple/20 to-neon-cyan/20 rounded-full blur-3xl" />
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/en"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all hover:-translate-y-0.5"
        >
          <Home size={16} />
          Back to Home
        </Link>
      </div>
    </main>
  );
}
