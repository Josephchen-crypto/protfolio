import assert from "node:assert/strict";
import test from "node:test";
import type { MDXPost } from "../lib/mdx";

const {
  rankPostsByViews,
  aggregateCategories,
  sumTotalViews,
  composeDashboardStats,
  buildPostKey,
} = await import(new URL("../lib/admin/stats.ts", import.meta.url).href);

/**
 * Build a minimal MDXPost fixture — only fields the stats layer reads.
 * Other fields get plausible defaults so TS is happy.
 */
function makePost(overrides: Partial<MDXPost>): MDXPost {
  return {
    slug: "post",
    title: "Post",
    date: "2026-01-01",
    summary: "",
    content: "",
    icon: null,
    cover: null,
    category: "General",
    paired: null,
    lang: "en",
    published: true,
    createdAt: "2026-01-01",
    ...overrides,
  };
}

test("buildPostKey joins lang and slug with a colon", () => {
  assert.equal(buildPostKey("en", "hello"), "en:hello");
  assert.equal(buildPostKey("zh", "你好"), "zh:你好");
});

test("sumTotalViews adds every value; empty map returns 0", () => {
  assert.equal(sumTotalViews({}), 0);
  assert.equal(sumTotalViews({ "en:a": 3, "en:b": 5, "zh:a": 2 }), 10);
});

test("rankPostsByViews sorts by views desc, breaks ties by slug asc", () => {
  const posts = [
    makePost({ slug: "b", title: "B" }),
    makePost({ slug: "a", title: "A" }),
    makePost({ slug: "c", title: "C" }),
  ];
  const views = { "en:a": 10, "en:b": 5, "en:c": 10 };

  const ranked = rankPostsByViews(posts, views);
  assert.deepEqual(
    ranked.map((r: { slug: string; views: number }) => [r.slug, r.views]),
    [
      ["a", 10],
      ["c", 10],
      ["b", 5],
    ],
  );
});

test("rankPostsByViews includes zero-view posts", () => {
  const posts = [
    makePost({ slug: "a" }),
    makePost({ slug: "b" }),
  ];
  const ranked = rankPostsByViews(posts, { "en:a": 3 });
  assert.equal(ranked.length, 2);
  assert.equal(ranked[1].views, 0);
});

test("rankPostsByViews honours the limit", () => {
  const posts = Array.from({ length: 5 }, (_, i) =>
    makePost({ slug: `p${i}` }),
  );
  const ranked = rankPostsByViews(posts, {}, 3);
  assert.equal(ranked.length, 3);
});

test("aggregateCategories sums views + counts by category, skips uncategorised", () => {
  const posts = [
    makePost({ slug: "a", category: "Rust" }),
    makePost({ slug: "b", category: "Rust" }),
    makePost({ slug: "c", category: "Life" }),
    makePost({ slug: "d", category: "" }),
  ];
  const views = { "en:a": 5, "en:b": 3, "en:c": 7, "en:d": 100 };

  const cats = aggregateCategories(posts, views);
  assert.deepEqual(
    cats.map((c: { name: string; postCount: number; totalViews: number }) => [
      c.name,
      c.postCount,
      c.totalViews,
    ]),
    [
      ["Rust", 2, 8],
      ["Life", 1, 7],
    ],
  );
});

test("composeDashboardStats returns the full payload", () => {
  const posts = [
    makePost({ slug: "a", category: "Rust" }),
    makePost({ slug: "b", category: "Life" }),
  ];
  const stats = composeDashboardStats({
    posts,
    viewsByKey: { "en:a": 4, "en:b": 6 },
    todayViews: 3,
  });

  assert.equal(stats.totalPosts, 2);
  assert.equal(stats.totalViews, 10);
  assert.equal(stats.totalCategories, 2);
  assert.equal(stats.todayViews, 3);
  assert.equal(stats.topPosts.length, 2);
  assert.equal(stats.topPosts[0].slug, "b");
  assert.equal(stats.categories.length, 2);
});
