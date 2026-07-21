import { Card } from "@/components/ui/Card";

interface StatsCardProps {
  label: string;
  value: number;
}

/**
 * A single number tile in the dashboard summary grid.
 * Formats large numbers with locale-aware separators (e.g. 1,234).
 */
export function StatsCard({ label, value }: StatsCardProps) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
        {label}
      </p>
      <p className="text-3xl font-heading font-bold text-white">
        {value.toLocaleString()}
      </p>
    </Card>
  );
}
