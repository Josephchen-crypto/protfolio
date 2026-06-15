import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { ViewPayload, ViewRow } from "./blog-views";

/**
 * Get the D1 database binding from the Cloudflare environment.
 *
 * Uses getCloudflareContext() from @opennextjs/cloudflare to access the
 * full env object — D1 bindings are objects, not strings, so they are NOT
 * available on process.env.
 * Falls back to null when the binding is absent (e.g. during static build).
 */
function getDb(): D1Database | null {
  try {
    const { env } = getCloudflareContext();
    const db = (env as unknown as CloudflareEnv).BLOG_VIEWS_DB;
    return db ?? null;
  } catch {
    // getCloudflareContext throws outside the Cloudflare runtime
    return null;
  }
}

/**
 * Increment the view count for a single blog post and return the new count.
 */
export async function incrementView(
  payload: ViewPayload,
): Promise<number | null> {
  const db = getDb();
  if (!db) return null;

  const postKey = `${payload.lang}:${payload.slug}`;

  try {
    const result = await db
      .prepare(
        `INSERT INTO blog_post_views (post_key, lang, slug, views, updated_at)
         VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
         ON CONFLICT(post_key) DO UPDATE SET
           views = views + 1,
           updated_at = CURRENT_TIMESTAMP
         RETURNING views`,
      )
      .bind(postKey, payload.lang, payload.slug)
      .first<{ views: number }>();

    return result?.views ?? null;
  } catch {
    return null;
  }
}

/**
 * Batch-read view counts for multiple post keys.
 *
 * Unrecognised keys are returned with a count of 0.
 */
export async function batchGetViews(
  keys: string[],
): Promise<Record<string, number>> {
  const db = getDb();
  if (!db || keys.length === 0) return {};

  try {
    const placeholders = keys.map(() => "?").join(",");
    const rows = await db
      .prepare(
        `SELECT post_key, views FROM blog_post_views WHERE post_key IN (${placeholders})`,
      )
      .bind(...keys)
      .all<ViewRow>();

    const rowMap = new Map(
      (rows.results ?? []).map((r) => [r.post_key, r.views]),
    );

    return Object.fromEntries(
      keys.map((key) => [key, rowMap.get(key) ?? 0]),
    );
  } catch {
    return {};
  }
}
