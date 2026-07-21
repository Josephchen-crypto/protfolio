import { Card } from "@/components/ui/Card";
import type { Dict } from "@/i18n";
import type { CategoryStatEntry } from "@/lib/admin/stats";

interface CategoryStatsProps {
  dict: Dict;
  categories: readonly CategoryStatEntry[];
}

/**
 * Table of blog categories with post counts and cumulative views.
 * Server component. Sorted descending by views on the server side.
 */
export function CategoryStats({ dict, categories }: CategoryStatsProps) {
  const columns = dict.admin.categories.columns;

  return (
    <Card>
      <h2 className="text-xl font-heading font-bold text-white mb-4">
        {dict.admin.categories.title}
      </h2>

      {categories.length === 0 ? (
        <p className="text-slate-400 text-sm">{dict.admin.categories.empty}</p>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-border">
                <th className="py-2 px-2 font-medium">{columns.name}</th>
                <th className="py-2 px-2 font-medium text-right w-24">
                  {columns.postCount}
                </th>
                <th className="py-2 px-2 font-medium text-right w-24">
                  {columns.totalViews}
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.name}
                  className="border-b border-border/50 last:border-b-0"
                >
                  <td className="py-2 px-2 text-white">{cat.name}</td>
                  <td className="py-2 px-2 text-right text-slate-300 tabular-nums">
                    {cat.postCount.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right text-white tabular-nums">
                    {cat.totalViews.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
