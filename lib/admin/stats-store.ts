import { getCloudflareContext } from "@opennextjs/cloudflare";
import postIndex from "../../content/blog/index.json";
import type { MDXPost } from "../mdx";
import { composeDashboardStats, type DashboardStats } from "./stats";

/**
 * D1 access layer for the admin dashboard.
 *
 * Pure aggregation lives in `./stats.ts` — this file only fetches raw rows
 * from D1 and hands them to the pure composer.
 *
 * Post metadata comes from `content/blog/index.json`, a lightweight manifest
 * generated at build time by `scripts/build-post-index.ts`. We can't use
 * `lib/mdx.ts` here — it calls `fs.readdirSync`, which is unavailable on the
 * Cloudflare Workers runtime.
 */

interface PostIndexEntry {
  slug: string;
  title: string;
  date: string;
  summary: string;
  category: string;
  lang: "en" | "zh";
  published: boolean;
}

/**
 * Convert an index entry into the `MDXPost` shape the aggregation layer
 * expects. Only fields the pure composer reads have to be real — the rest
 * get sensible defaults so we don't leak "TODO / N/A" strings into the JSON.
 */
function toPost(entry: PostIndexEntry): MDXPost {
  return {
    slug: entry.slug,
    title: entry.title,
    date: entry.date,
    summary: entry.summary,
    content: "",
    icon: null,
    cover: null,
    category: entry.category,
    paired: null,
    lang: entry.lang,
    published: entry.published,
    createdAt: entry.date,
  };
}

function getPublishedPosts(): MDXPost[] {
  return (postIndex as PostIndexEntry[])
    .filter((p) => p.published)
    .map(toPost);
}

function getDb(): D1Database | null {
  try {
    const { env } = getCloudflareContext();
    const db = (env as unknown as CloudflareEnv).BLOG_VIEWS_DB;
    return db ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch total view counts for every known post from `blog_post_views`.
 * Returns a map keyed by `<lang>:<slug>`, matching the shape the aggregation
 * layer expects. Empty map on failure — the caller treats missing keys as 0.
 */
async function fetchViewsByKey(
  db: D1Database,
): Promise<Record<string, number>> {
  try {
    const rows = await db
      .prepare(`SELECT post_key, views FROM blog_post_views`)
      .all<{ post_key: string; views: number }>();

    return Object.fromEntries(
      (rows.results ?? []).map((r) => [r.post_key, r.views]),
    );
  } catch {
    return {};
  }
}

/**
 * Count events created since midnight UTC. UTC is intentional: SQLite's
 * `CURRENT_TIMESTAMP` writes UTC, and using the same timezone on read avoids
 * off-by-a-day drift. If we want local-timezone rollups later, the trend
 * endpoint (phase C) can offset there — this metric is a coarse "today" gauge.
 */
async function fetchTodayViews(db: D1Database): Promise<number> {
  try {
    const row = await db
      .prepare(
        `SELECT COUNT(*) AS count FROM blog_view_events
         WHERE created_at >= datetime('now', 'start of day')`,
      )
      .first<{ count: number }>();

    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Assemble the dashboard payload. Safe to call from a route handler or a
 * server component — never throws; degrades to zeros when D1 is unavailable.
 */
export async function getDashboardStats(
  options: { topPostsLimit?: number } = {},
): Promise<DashboardStats> {
  const db = getDb();
  const posts = getPublishedPosts();

  if (!db) {
    return composeDashboardStats({
      posts,
      viewsByKey: {},
      todayViews: 0,
      topPostsLimit: options.topPostsLimit,
    });
  }

  const [viewsByKey, todayViews] = await Promise.all([
    fetchViewsByKey(db),
    fetchTodayViews(db),
  ]);

  return composeDashboardStats({
    posts,
    viewsByKey,
    todayViews,
    topPostsLimit: options.topPostsLimit,
  });
}
