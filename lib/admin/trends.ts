/**
 * Pure aggregation helpers for the admin trend chart.
 *
 * Everything here is deterministic and side-effect free — no D1, no `Date.now`
 * on the module level, no wallclock leakage. The store layer feeds in a fixed
 * `now` so tests can reproduce every point without freezing time.
 */

export type Granularity = "day" | "month";

export interface TrendPoint {
  /**
   * Bucket label formatted for display and used as a stable key:
   *   - day  → "YYYY-MM-DD"
   *   - month → "YYYY-MM"
   */
  label: string;
  count: number;
}

/**
 * Format a Date as `YYYY-MM-DD` in UTC. Uses UTC on purpose to stay aligned
 * with SQLite's `CURRENT_TIMESTAMP` (which also writes UTC) — mixing time
 * zones between insertion and read-side bucketing loses events at the day
 * boundary.
 */
export function formatDayUtc(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format a Date as `YYYY-MM` in UTC. Same reasoning as `formatDayUtc`.
 */
export function formatMonthUtc(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

/**
 * Enumerate the day labels covering the last `days` days including today,
 * in ascending chronological order. Length is always exactly `days`.
 */
export function enumerateDays(now: Date, days: number): string[] {
  const labels: string[] = [];
  const base = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const d = new Date(base - offset * 86_400_000);
    labels.push(formatDayUtc(d));
  }
  return labels;
}

/**
 * Enumerate the month labels covering the last `months` months including
 * this month, in ascending chronological order. Length is always exactly
 * `months`.
 */
export function enumerateMonths(now: Date, months: number): string[] {
  const labels: string[] = [];
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const totalMonths = year * 12 + month - offset;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths - y * 12;
    labels.push(`${y}-${String(m + 1).padStart(2, "0")}`);
  }
  return labels;
}

/**
 * Fill zero-count entries for every bucket in `labels` that isn't already
 * present in `counts`. Order matches `labels`. The store layer returns a
 * potentially sparse map (only days with events); the UI wants a dense
 * series so the x-axis stays evenly spaced.
 */
export function densify(
  labels: readonly string[],
  counts: Readonly<Record<string, number>>,
): TrendPoint[] {
  return labels.map((label) => ({ label, count: counts[label] ?? 0 }));
}

/**
 * Default window sizes matching the ROADMAP spec.
 * Kept as a single source so the API, the store, and any future UI knob agree.
 */
export const TREND_WINDOW: Record<Granularity, number> = {
  day: 30,
  month: 12,
};
