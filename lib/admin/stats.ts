/**
 * Pure aggregation helpers for the admin dashboard.
 *
 * Everything in this file is deterministic and side-effect free — no D1, no
 * Cloudflare bindings — so we can unit-test it with Node's native test runner.
 * The D1 query layer lives in `stats-store.ts` and calls into these helpers
 * after fetching raw rows.
 */

import type { MDXPost } from "../mdx";

export interface PostRankingEntry {
  slug: string;
  lang: "en" | "zh";
  title: string;
  category: string;
  views: number;
}

export interface CategoryStatEntry {
  name: string;
  postCount: number;
  totalViews: number;
}

export interface DashboardStats {
  totalPosts: number;
  totalViews: number;
  totalCategories: number;
  todayViews: number;
  topPosts: PostRankingEntry[];
  categories: CategoryStatEntry[];
}

/**
 * Build the `post_key = "<lang>:<slug>"` string used by `blog_post_views`
 * and `blog_view_events`. Duplicates `lib/blog-views.buildPostKey` on purpose
 * so this module has no runtime dependency on that layer during tests.
 */
export function buildPostKey(lang: "en" | "zh", slug: string): string {
  return `${lang}:${slug}`;
}

/**
 * Rank posts by view count descending.
 *
 * Posts with zero views are still included (a fresh admin view should still
 * show every post). Ties break on slug alphabetically for deterministic order.
 */
export function rankPostsByViews(
  posts: readonly MDXPost[],
  viewsByKey: Readonly<Record<string, number>>,
  limit?: number,
): PostRankingEntry[] {
  const ranked = posts.map<PostRankingEntry>((post) => ({
    slug: post.slug,
    lang: post.lang,
    title: post.title,
    category: post.category,
    views: viewsByKey[buildPostKey(post.lang, post.slug)] ?? 0,
  }));

  ranked.sort((a, b) => {
    if (b.views !== a.views) return b.views - a.views;
    return a.slug.localeCompare(b.slug);
  });

  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
}

/**
 * Aggregate view + post counts per category across every post.
 * Posts without a category (`""`) are ignored — matches how `getCategories()`
 * already treats them.
 */
export function aggregateCategories(
  posts: readonly MDXPost[],
  viewsByKey: Readonly<Record<string, number>>,
): CategoryStatEntry[] {
  const acc = new Map<string, { postCount: number; totalViews: number }>();

  for (const post of posts) {
    if (!post.category) continue;
    const bucket = acc.get(post.category) ?? { postCount: 0, totalViews: 0 };
    bucket.postCount += 1;
    bucket.totalViews += viewsByKey[buildPostKey(post.lang, post.slug)] ?? 0;
    acc.set(post.category, bucket);
  }

  return Array.from(acc.entries())
    .map(([name, { postCount, totalViews }]) => ({
      name,
      postCount,
      totalViews,
    }))
    .sort((a, b) => {
      if (b.totalViews !== a.totalViews) return b.totalViews - a.totalViews;
      return a.name.localeCompare(b.name);
    });
}

/**
 * Sum totals across the whole view table.
 */
export function sumTotalViews(viewsByKey: Readonly<Record<string, number>>): number {
  return Object.values(viewsByKey).reduce((sum, n) => sum + n, 0);
}

/**
 * Assemble the final dashboard payload. Pure — the store layer feeds in
 * already-fetched inputs.
 */
export function composeDashboardStats(input: {
  posts: readonly MDXPost[];
  viewsByKey: Readonly<Record<string, number>>;
  todayViews: number;
  topPostsLimit?: number;
}): DashboardStats {
  const { posts, viewsByKey, todayViews, topPostsLimit } = input;
  const categories = aggregateCategories(posts, viewsByKey);

  return {
    totalPosts: posts.length,
    totalViews: sumTotalViews(viewsByKey),
    totalCategories: categories.length,
    todayViews,
    topPosts: rankPostsByViews(posts, viewsByKey, topPostsLimit),
    categories,
  };
}
