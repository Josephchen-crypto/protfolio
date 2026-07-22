import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  densify,
  enumerateDays,
  enumerateMonths,
  TREND_WINDOW,
  type Granularity,
  type TrendPoint,
} from "./trends";

/**
 * D1 access for the admin trend chart.
 *
 * Aggregation stays server-side: SQLite's `strftime` groups events into the
 * bucket key the UI expects, so we ship at most 30 rows (day) or 12 rows
 * (month) back — not the full event log.
 *
 * Pure day/month enumeration and densification live in `./trends.ts`. This
 * module just fetches the sparse map and hands it off, so the pure layer
 * remains fully unit-testable.
 */

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
 * Fetch bucket → count map from `blog_view_events` for the requested window.
 *
 * SQLite arithmetic:
 *   - day  → `strftime('%Y-%m-%d', created_at)`; cutoff `now - 29 days` for
 *     a 30-day inclusive window (day 0 = today).
 *   - month → `strftime('%Y-%m', created_at)`; cutoff `now - 11 months`.
 *
 * Returns `{}` on any failure or when the D1 binding is absent.
 */
async function fetchCountsByBucket(
  db: D1Database,
  granularity: Granularity,
): Promise<Record<string, number>> {
  const bucketExpr =
    granularity === "day"
      ? "strftime('%Y-%m-%d', created_at)"
      : "strftime('%Y-%m', created_at)";
  const cutoffModifier =
    granularity === "day"
      ? `-${TREND_WINDOW.day - 1} days`
      : `-${TREND_WINDOW.month - 1} months`;

  try {
    const rows = await db
      .prepare(
        `SELECT ${bucketExpr} AS bucket, COUNT(*) AS count
         FROM blog_view_events
         WHERE created_at >= datetime('now', ?)
         GROUP BY bucket`,
      )
      .bind(cutoffModifier)
      .all<{ bucket: string; count: number }>();

    return Object.fromEntries(
      (rows.results ?? []).map((r) => [r.bucket, r.count]),
    );
  } catch {
    return {};
  }
}

/**
 * Assemble the dense trend series for the requested granularity.
 * Safe to call from a route handler — never throws.
 */
export async function getTrendPoints(
  granularity: Granularity,
  now: Date = new Date(),
): Promise<TrendPoint[]> {
  const labels =
    granularity === "day"
      ? enumerateDays(now, TREND_WINDOW.day)
      : enumerateMonths(now, TREND_WINDOW.month);

  const db = getDb();
  if (!db) return densify(labels, {});

  const counts = await fetchCountsByBucket(db, granularity);
  return densify(labels, counts);
}
