import { getDashboardStats } from "@/lib/admin/stats-store";
import { getDict } from "@/i18n";
import type { Language } from "@/i18n/config";
import { StatsCard } from "@/components/admin/StatsCard";
import { PostsRankingTable } from "@/components/admin/PostsRankingTable";
import { CategoryStats } from "@/components/admin/CategoryStats";

/**
 * Admin dashboard root page.
 *
 * Server component: reads aggregated stats directly through the store layer
 * (no self-fetch to `/api/admin/stats` — that endpoint is for future
 * client-side widgets / external tools). Access is enforced by the parent
 * `layout.tsx`.
 */
export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = rawLang as Language;
  const dict = await getDict(lang);
  const stats = await getDashboardStats({ topPostsLimit: 20 });

  const cards = [
    { label: dict.admin.stats.totalPosts, value: stats.totalPosts },
    { label: dict.admin.stats.totalViews, value: stats.totalViews },
    { label: dict.admin.stats.totalCategories, value: stats.totalCategories },
    { label: dict.admin.stats.todayViews, value: stats.todayViews },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">
          {dict.admin.title}
        </h1>
        <p className="text-slate-400">{dict.admin.subtitle}</p>
      </header>

      <section
        aria-label={dict.admin.title}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {cards.map((card) => (
          <StatsCard key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      <PostsRankingTable
        dict={dict}
        posts={stats.topPosts}
      />

      <CategoryStats
        dict={dict}
        categories={stats.categories}
      />
    </div>
  );
}
