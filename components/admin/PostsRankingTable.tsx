import { Card } from "@/components/ui/Card";
import type { Dict } from "@/i18n";
import type { PostRankingEntry } from "@/lib/admin/stats";

interface PostsRankingTableProps {
  dict: Dict;
  posts: readonly PostRankingEntry[];
}

/**
 * Read-only leaderboard of blog posts sorted by all-time views.
 *
 * Server-rendered — no interaction, no client JS. If we later want sortable
 * columns or filtering we'll extract a `"use client"` wrapper; keep this
 * one pure for now.
 */
export function PostsRankingTable({ dict, posts }: PostsRankingTableProps) {
  const columns = dict.admin.topPosts.columns;

  return (
    <Card>
      <h2 className="text-xl font-heading font-bold text-white mb-4">
        {dict.admin.topPosts.title}
      </h2>

      {posts.length === 0 ? (
        <p className="text-slate-400 text-sm">{dict.admin.topPosts.empty}</p>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-border">
                <th className="py-2 px-2 font-medium w-10">{columns.rank}</th>
                <th className="py-2 px-2 font-medium">{columns.title}</th>
                <th className="py-2 px-2 font-medium w-16">{columns.lang}</th>
                <th className="py-2 px-2 font-medium">{columns.category}</th>
                <th className="py-2 px-2 font-medium text-right w-24">
                  {columns.views}
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, index) => (
                <tr
                  key={`${post.lang}:${post.slug}`}
                  className="border-b border-border/50 last:border-b-0"
                >
                  <td className="py-2 px-2 text-slate-500 tabular-nums">
                    {index + 1}
                  </td>
                  <td className="py-2 px-2 text-white">
                    <a
                      href={`/${post.lang}/blog/${post.slug}`}
                      className="hover:text-neon-cyan transition-colors"
                    >
                      {post.title}
                    </a>
                  </td>
                  <td className="py-2 px-2">
                    <span className="text-xs font-mono uppercase text-slate-400">
                      {post.lang}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-slate-300">
                    {post.category || "—"}
                  </td>
                  <td className="py-2 px-2 text-right text-white tabular-nums">
                    {post.views.toLocaleString()}
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
