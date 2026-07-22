"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { clsx } from "clsx";
import type { Dict } from "@/i18n";
import type { Granularity, TrendPoint } from "@/lib/admin/trends";

interface TrendChartProps {
  dict: Dict;
  /**
   * Initial series rendered on first paint. The dashboard passes the day
   * series so the chart has data before the client-side fetch completes.
   */
  initialGranularity: Granularity;
  initialPoints: TrendPoint[];
}

// Theme-aligned colours pulled from the CSS variables defined in globals.css.
// Recharts wants concrete hex values, not Tailwind class names, so we mirror
// the design tokens here. Keep in sync if the palette changes.
const NEON_CYAN = "#22d3ee";
const NEON_PURPLE = "#a855f7";
const GRID_STROKE = "rgba(148, 163, 184, 0.15)"; // slate-400 @ 15%
const AXIS_STROKE = "rgba(148, 163, 184, 0.4)";

/**
 * Client-side trend chart. Renders bar (day) or line (month) view over the
 * server-provided initial data, and re-fetches from `/api/admin/stats/trends`
 * when the user flips the granularity.
 */
export function TrendChart({
  dict,
  initialGranularity,
  initialPoints,
}: TrendChartProps) {
  const [granularity, setGranularity] = useState<Granularity>(initialGranularity);
  const [points, setPoints] = useState<TrendPoint[]>(initialPoints);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Skip the initial render — we already have `initialPoints` for that.
    if (granularity === initialGranularity) {
      setPoints(initialPoints);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/stats/trends?granularity=${granularity}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const typed = data as { points: TrendPoint[] };
        setPoints(typed.points);
      })
      .catch(() => {
        /* leave stale points; the empty state handles zero data */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [granularity, initialGranularity, initialPoints]);

  const isEmpty = points.every((p) => p.count === 0);
  const strokeColor = granularity === "day" ? NEON_CYAN : NEON_PURPLE;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-bold text-white">
          {dict.admin.trend.title}
        </h2>
        <div
          role="tablist"
          aria-label={dict.admin.trend.title}
          className="inline-flex rounded-lg border border-border overflow-hidden text-sm"
        >
          {(["day", "month"] as const).map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={granularity === g}
              onClick={() => setGranularity(g)}
              className={clsx(
                "px-3 py-1.5 transition-colors",
                granularity === g
                  ? "bg-primary text-white"
                  : "text-slate-400 hover:text-white hover:bg-background",
              )}
            >
              {dict.admin.trend.granularity[g]}
            </button>
          ))}
        </div>
      </div>

      <div
        className={clsx(
          "h-64 w-full transition-opacity",
          loading && "opacity-60",
        )}
      >
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            {dict.admin.trend.empty}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {granularity === "day" ? (
              <BarChart
                data={points}
                margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis
                  dataKey="label"
                  stroke={AXIS_STROKE}
                  fontSize={11}
                  tickFormatter={formatDayTick}
                  interval="preserveStartEnd"
                  minTickGap={20}
                />
                <YAxis
                  stroke={AXIS_STROKE}
                  fontSize={11}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<TrendTooltip dict={dict} />}
                  cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
                />
                <Bar
                  dataKey="count"
                  fill={strokeColor}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart
                data={points}
                margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis
                  dataKey="label"
                  stroke={AXIS_STROKE}
                  fontSize={11}
                />
                <YAxis
                  stroke={AXIS_STROKE}
                  fontSize={11}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<TrendTooltip dict={dict} />}
                  cursor={{ stroke: AXIS_STROKE, strokeDasharray: "3 3" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={strokeColor}
                  strokeWidth={2}
                  dot={{ r: 3, fill: strokeColor }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

function formatDayTick(value: string): string {
  // Shorten `YYYY-MM-DD` → `MM-DD` for the x-axis so labels fit.
  return value.slice(5);
}

/**
 * Tooltip content matching the surface / border theme.
 * `active` and `payload` come from recharts internally.
 */
function TrendTooltip({
  dict,
  active,
  payload,
  label,
}: {
  dict: Dict;
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0].value;
  const line = dict.admin.trend.tooltipCount.replace("{count}", value.toLocaleString());
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-lg text-sm">
      <div className="text-slate-400 text-xs mb-1">{label}</div>
      <div className="text-white">{line}</div>
    </div>
  );
}
