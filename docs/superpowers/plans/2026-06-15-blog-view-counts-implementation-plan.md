# Blog View Counts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add public per-post blog view counts to the blog detail page and blog list page, with English and Chinese posts counted separately, while preserving the existing static Markdown blog architecture.

**Architecture:** Keep article content statically generated and layer view counts on at runtime. Use a Cloudflare D1 table as the source of truth, a small internal API route for increment/read operations, a detail-page client component to increment with 12-hour dedupe, and a client-side fetch inside the existing blog list component to batch-read counts.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Cloudflare OpenNext, Cloudflare D1, Node built-in test runner with `--experimental-strip-types`

---

## File Structure

### Create

- `migrations/0000_create_blog_post_views.sql`
- `cloudflare-env.d.ts`
- `lib/blog-views.ts`
- `lib/blog-views-store.ts`
- `app/api/blog/views/route.ts`
- `components/blog/PostViewCount.tsx`
- `tests/blog-views.test.ts`

### Modify

- `wrangler.jsonc`
- `package.json`
- `components/Blog.tsx`
- `app/[lang]/blog/page.tsx`
- `app/[lang]/blog/[slug]/page.tsx`
- `i18n/dicts/en.json`
- `i18n/dicts/zh.json`
- `README.md`

### Responsibilities

- `wrangler.jsonc`: declare the D1 binding used by the Worker
- `migrations/0000_create_blog_post_views.sql`: create the `blog_post_views` table
- `cloudflare-env.d.ts`: type the new `BLOG_VIEWS_DB` binding for TypeScript
- `lib/blog-views.ts`: shared pure helpers for keys, validation, dedupe window, and zero-filling missing rows
- `lib/blog-views-store.ts`: D1-specific read/write helpers
- `app/api/blog/views/route.ts`: internal API for incrementing and reading view counts
- `components/blog/PostViewCount.tsx`: detail-page runtime count display + increment
- `components/Blog.tsx`: list-page batch fetch and display
- `tests/blog-views.test.ts`: unit tests for shared helper behavior

---

### Task 1: Provision D1 And Schema

**Files:**
- Modify: `wrangler.jsonc`
- Create: `migrations/0000_create_blog_post_views.sql`
- Create: `cloudflare-env.d.ts`

- [ ] **Step 1: Create the D1 database and auto-write the binding into Wrangler config**

Run:

```bash
npx wrangler d1 create protfolio-blog-views --binding BLOG_VIEWS_DB --update-config
```

Expected:

- Wrangler prints a successful database creation message
- `wrangler.jsonc` gains a new `d1_databases` entry with `binding: "BLOG_VIEWS_DB"`
- The entry includes a real `database_id`, so no manual placeholder is left behind

- [ ] **Step 2: Make sure the `wrangler.jsonc` D1 block sits alongside the existing R2 and image bindings**

The final `wrangler.jsonc` should contain a block like this in addition to the current config:

```jsonc
"d1_databases": [
  {
    "binding": "BLOG_VIEWS_DB",
    "database_name": "protfolio-blog-views",
    "database_id": "the-real-id-written-by-wrangler"
  }
],
```

Notes:

- Keep the existing `r2_buckets`, `services`, `images`, and `assets` blocks untouched
- Do not rename the binding after creation; the code will use `env.BLOG_VIEWS_DB`

- [ ] **Step 3: Create the D1 migration file**

Write this exact SQL into `migrations/0000_create_blog_post_views.sql`:

```sql
CREATE TABLE IF NOT EXISTS blog_post_views (
  post_key TEXT PRIMARY KEY,
  lang TEXT NOT NULL,
  slug TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_post_views_lang_slug
ON blog_post_views(lang, slug);
```

- [ ] **Step 4: Apply the migration to the local D1 database**

Run:

```bash
npx wrangler d1 migrations apply BLOG_VIEWS_DB --local
```

Expected:

- Wrangler reports the migration as applied locally
- A local D1 database appears under `.wrangler/state`

- [ ] **Step 5: Generate Cloudflare binding types**

Run:

```bash
npm run cf-typegen
```

Expected:

- A new `cloudflare-env.d.ts` file appears in the repo
- The file includes `BLOG_VIEWS_DB: D1Database`

- [ ] **Step 6: Verify the table exists locally**

Run:

```bash
npx wrangler d1 execute BLOG_VIEWS_DB --local --command="SELECT name FROM sqlite_master WHERE type='table' AND name='blog_post_views';"
```

Expected:

- One row is returned for `blog_post_views`

- [ ] **Step 7: Commit the D1 scaffolding**

Run:

```bash
git add wrangler.jsonc migrations/0000_create_blog_post_views.sql cloudflare-env.d.ts
git commit -m "Add D1 scaffolding for public blog view counts" -m $'Constraint: Must keep the existing OpenNext Cloudflare deployment model intact\nRejected: Use KV for display counts | eventual consistency is a poor fit for public counters\nConfidence: high\nScope-risk: narrow\nReversibility: clean\nDirective: Keep BLOG_VIEWS_DB as the single source of truth for public per-post counts\nTested: npx wrangler d1 migrations apply BLOG_VIEWS_DB --local; npm run cf-typegen; local table existence query\nNot-tested: Remote D1 migration application'
```

---

### Task 2: Add Shared Helpers And TypeScript Test Support

**Files:**
- Modify: `package.json`
- Create: `lib/blog-views.ts`
- Create: `tests/blog-views.test.ts`

- [ ] **Step 1: Write the failing shared-helper tests**

Create `tests/blog-views.test.ts` with:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  BLOG_VIEW_DEDUPE_WINDOW_MS,
  buildPostKey,
  getViewStorageKey,
  normalizeViewRows,
  parseViewKeysParam,
  shouldCountView,
  isValidViewPayload,
} from "../lib/blog-views";

test("buildPostKey combines language and slug", () => {
  assert.equal(buildPostKey("en", "home-module-factory"), "en:home-module-factory");
  assert.equal(buildPostKey("zh", "home-module-factory-zh"), "zh:home-module-factory-zh");
});

test("parseViewKeysParam splits and trims the key list", () => {
  assert.deepEqual(parseViewKeysParam("en:foo, zh:bar ,,en:baz"), [
    "en:foo",
    "zh:bar",
    "en:baz",
  ]);
  assert.deepEqual(parseViewKeysParam(null), []);
});

test("normalizeViewRows fills missing keys with zero", () => {
  const result = normalizeViewRows(
    ["en:foo", "zh:bar"],
    [{ post_key: "en:foo", views: 12 }]
  );

  assert.deepEqual(result, {
    "en:foo": 12,
    "zh:bar": 0,
  });
});

test("shouldCountView only allows another count after the dedupe window", () => {
  const now = 1_700_000_000_000;
  assert.equal(shouldCountView(undefined, now), true);
  assert.equal(shouldCountView(now - BLOG_VIEW_DEDUPE_WINDOW_MS + 1, now), false);
  assert.equal(shouldCountView(now - BLOG_VIEW_DEDUPE_WINDOW_MS, now), true);
});

test("getViewStorageKey namespaces the post key", () => {
  assert.equal(
    getViewStorageKey("en:home-module-factory"),
    "blog:view-counted:en:home-module-factory"
  );
});

test("isValidViewPayload accepts only supported languages and non-empty slugs", () => {
  assert.equal(isValidViewPayload({ lang: "en", slug: "hello-world" }), true);
  assert.equal(isValidViewPayload({ lang: "zh", slug: "hello-world-zh" }), true);
  assert.equal(isValidViewPayload({ lang: "jp", slug: "hello-world" }), false);
  assert.equal(isValidViewPayload({ lang: "en", slug: "" }), false);
  assert.equal(isValidViewPayload(null), false);
});
```

- [ ] **Step 2: Run the tests to confirm they fail before implementation**

Run:

```bash
node --experimental-strip-types --test tests/blog-views.test.ts
```

Expected:

- The run fails because `lib/blog-views.ts` does not exist yet

- [ ] **Step 3: Update the test script so the repo can run `.ts` tests without new dependencies**

Change the `test` script in `package.json` to:

```json
"test": "node --experimental-strip-types --test tests/**/*.test.ts tests/**/*.test.mjs"
```

- [ ] **Step 4: Implement the shared helper module**

Create `lib/blog-views.ts` with:

```ts
export const BLOG_VIEW_DEDUPE_WINDOW_MS = 12 * 60 * 60 * 1000;

export type SupportedLanguage = "en" | "zh";

export type ViewPayload = {
  lang: SupportedLanguage;
  slug: string;
};

export type ViewRow = {
  post_key: string;
  views: number;
};

export function buildPostKey(lang: SupportedLanguage, slug: string) {
  return `${lang}:${slug}`;
}

export function getViewStorageKey(postKey: string) {
  return `blog:view-counted:${postKey}`;
}

export function parseViewKeysParam(raw: string | null) {
  if (!raw) return [];

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeViewRows(keys: string[], rows: ViewRow[]) {
  const rowMap = new Map(rows.map((row) => [row.post_key, row.views]));
  return Object.fromEntries(keys.map((key) => [key, rowMap.get(key) ?? 0]));
}

export function shouldCountView(lastCountedAt?: number, now = Date.now()) {
  if (!lastCountedAt) return true;
  return now - lastCountedAt >= BLOG_VIEW_DEDUPE_WINDOW_MS;
}

export function isValidViewPayload(value: unknown): value is ViewPayload {
  if (!value || typeof value !== "object") return false;

  const lang = Reflect.get(value, "lang");
  const slug = Reflect.get(value, "slug");

  return (lang === "en" || lang === "zh") && typeof slug === "string" && slug.trim().length > 0;
}
```

- [ ] **Step 5: Run the shared-helper tests**

Run:

```bash
npm test
```

Expected:

- Existing Markdown tests still pass
- The new `tests/blog-views.test.ts` tests pass

- [ ] **Step 6: Commit the shared helper layer**

Run:

```bash
git add package.json lib/blog-views.ts tests/blog-views.test.ts
git commit -m "Add shared blog view helpers and TypeScript test support" -m $'Constraint: No new test dependencies should be introduced for this feature\nRejected: Add tsx or vitest just for this change | unnecessary when Node can strip types directly\nConfidence: high\nScope-risk: narrow\nReversibility: clean\nDirective: Keep shared blog-view logic pure and free of Cloudflare-specific imports\nTested: npm test\nNot-tested: UI integration'
```

---

### Task 3: Implement The D1 Store And Internal API

**Files:**
- Create: `lib/blog-views-store.ts`
- Create: `app/api/blog/views/route.ts`

- [ ] **Step 1: Implement the D1 store wrapper**

Create `lib/blog-views-store.ts` with:

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  buildPostKey,
  normalizeViewRows,
  type SupportedLanguage,
} from "@/lib/blog-views";

async function getDb() {
  const { env } = await getCloudflareContext({ async: true });

  if (!env.BLOG_VIEWS_DB) {
    throw new Error("BLOG_VIEWS_DB binding is not available");
  }

  return env.BLOG_VIEWS_DB;
}

export async function incrementBlogPostView(lang: SupportedLanguage, slug: string) {
  const db = await getDb();
  const postKey = buildPostKey(lang, slug);

  await db
    .prepare(
      `INSERT INTO blog_post_views (post_key, lang, slug, views, updated_at)
       VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(post_key) DO UPDATE SET
         views = views + 1,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(postKey, lang, slug)
    .run();

  const row = await db
    .prepare("SELECT views FROM blog_post_views WHERE post_key = ?")
    .bind(postKey)
    .first<{ views: number }>();

  return {
    postKey,
    views: row?.views ?? 1,
  };
}

export async function getBlogPostViews(keys: string[]) {
  if (keys.length === 0) {
    return {};
  }

  const db = await getDb();
  const placeholders = keys.map(() => "?").join(", ");
  const query = `SELECT post_key, views FROM blog_post_views WHERE post_key IN (${placeholders})`;
  const result = await db.prepare(query).bind(...keys).all<{ post_key: string; views: number }>();

  return normalizeViewRows(keys, result.results ?? []);
}
```

- [ ] **Step 2: Implement the route handler**

Create `app/api/blog/views/route.ts` with:

```ts
import { NextResponse } from "next/server";
import {
  isValidViewPayload,
  parseViewKeysParam,
} from "@/lib/blog-views";
import {
  getBlogPostViews,
  incrementBlogPostView,
} from "@/lib/blog-views-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keys = parseViewKeysParam(searchParams.get("keys"));
  const data = await getBlogPostViews(keys);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!isValidViewPayload(body)) {
    return NextResponse.json(
      { error: "Invalid blog view payload" },
      { status: 400 }
    );
  }

  const result = await incrementBlogPostView(body.lang, body.slug);
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
```

- [ ] **Step 3: Run lint and typecheck on the new server code**

Run:

```bash
npm run lint
npm run typecheck
```

Expected:

- No lint errors
- No type errors around `getCloudflareContext`, D1 bindings, or `NextResponse`

- [ ] **Step 4: Apply the migration to the remote D1 database**

Run:

```bash
npx wrangler d1 migrations apply BLOG_VIEWS_DB --remote
```

Expected:

- Wrangler reports the migration as applied remotely

- [ ] **Step 5: Commit the server-side runtime layer**

Run:

```bash
git add lib/blog-views-store.ts app/api/blog/views/route.ts
git commit -m "Add a D1-backed API for blog view counts" -m $'Constraint: The runtime API must work in OpenNext Cloudflare without making blog pages fully dynamic\nRejected: Put all D1 logic directly inside the route handler | harder to test and harder to reuse\nConfidence: high\nScope-risk: moderate\nReversibility: clean\nDirective: Keep all D1 access in lib/blog-views-store.ts so UI components stay storage-agnostic\nTested: npm run lint; npm run typecheck; npx wrangler d1 migrations apply BLOG_VIEWS_DB --remote\nNot-tested: End-to-end browser-driven counting'
```

---

### Task 4: Add Detail-Page View Counting

**Files:**
- Create: `components/blog/PostViewCount.tsx`
- Modify: `app/[lang]/blog/[slug]/page.tsx`
- Modify: `i18n/dicts/en.json`
- Modify: `i18n/dicts/zh.json`

- [ ] **Step 1: Add translation strings for the view label**

Update `i18n/dicts/en.json` inside `blog`:

```json
"views": "views"
```

Update `i18n/dicts/zh.json` inside `blog`:

```json
"views": "次浏览"
```

- [ ] **Step 2: Create the detail-page client component**

Create `components/blog/PostViewCount.tsx` with:

```tsx
"use client";

import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import {
  buildPostKey,
  getViewStorageKey,
  shouldCountView,
  type SupportedLanguage,
} from "@/lib/blog-views";

type PostViewCountProps = {
  lang: SupportedLanguage;
  slug: string;
  label: string;
  locale: string;
};

export function PostViewCount({
  lang,
  slug,
  label,
  locale,
}: PostViewCountProps) {
  const postKey = buildPostKey(lang, slug);
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadViews() {
      const storageKey = getViewStorageKey(postKey);
      let increment = true;

      try {
        const raw = window.localStorage.getItem(storageKey);
        const lastCountedAt = raw ? Number(raw) : undefined;
        increment = shouldCountView(
          Number.isFinite(lastCountedAt) ? lastCountedAt : undefined
        );
      } catch {
        increment = true;
      }

      const response = increment
        ? await fetch("/api/blog/views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lang, slug }),
          })
        : await fetch(`/api/blog/views?keys=${encodeURIComponent(postKey)}`, {
            cache: "no-store",
          });

      if (!response.ok || cancelled) {
        return;
      }

      if (increment) {
        const payload = (await response.json()) as { views: number };
        setViews(payload.views);

        try {
          window.localStorage.setItem(storageKey, String(Date.now()));
        } catch {}
        return;
      }

      const payload = (await response.json()) as Record<string, number>;
      setViews(payload[postKey] ?? 0);
    }

    void loadViews();

    return () => {
      cancelled = true;
    };
  }, [lang, slug, postKey]);

  return (
    <span className="flex items-center gap-1.5">
      <Eye size={14} />
      {views === null ? "--" : new Intl.NumberFormat(locale).format(views)} {label}
    </span>
  );
}
```

- [ ] **Step 3: Mount the component in the blog detail metadata row**

In `app/[lang]/blog/[slug]/page.tsx`:

1. Add the import:

```tsx
import { PostViewCount } from "@/components/blog/PostViewCount";
```

2. Extend the metadata row to include:

```tsx
<span className="w-1 h-1 rounded-full bg-slate-600" />
<PostViewCount
  lang={lang as Language}
  slug={slug}
  label={dict.blog.views}
  locale={lang === "zh" ? "zh-CN" : "en-US"}
/>
```

- [ ] **Step 4: Run the app locally and verify the detail-page count appears**

Run:

```bash
npm run preview
```

Manual verification:

- Open any blog detail page in the browser
- Confirm the metadata row shows `-- views` first and then resolves to a number
- Refresh the page once within a few seconds and confirm the number does not jump again

- [ ] **Step 5: Commit the detail-page view-count UI**

Run:

```bash
git add i18n/dicts/en.json i18n/dicts/zh.json components/blog/PostViewCount.tsx app/[lang]/blog/[slug]/page.tsx
git commit -m "Show and increment public view counts on blog detail pages" -m $'Constraint: Blog detail pages must remain static for content while loading counts at runtime\nRejected: Increment on the server render path | would force the route toward dynamic behavior\nConfidence: high\nScope-risk: moderate\nReversibility: clean\nDirective: Keep the 12-hour dedupe check in the client component unless product requirements change\nTested: npm run preview; manual browser verification on a blog detail page\nNot-tested: Cross-browser localStorage failure behavior'
```

---

### Task 5: Add List-Page View Display Without Affecting Home Page

**Files:**
- Modify: `components/Blog.tsx`
- Modify: `app/[lang]/blog/page.tsx`
- Modify: `README.md`

- [ ] **Step 1: Extend the `Blog` component props**

In `components/Blog.tsx`, extend the props and post shape:

```tsx
interface Post {
  slug: string;
  title: string;
  date: string;
  summary: string;
  icon?: string | null;
  cover?: string | null;
  category?: string;
  lang: string;
}

type BlogProps = {
  title: string;
  posts: Post[];
  categories?: CategoryMeta[];
  viewAllLabel: string;
  allLabel?: string;
  showViews?: boolean;
  viewsLabel?: string;
  viewsLocale?: string;
};
```

- [ ] **Step 2: Add batch view fetching inside `components/Blog.tsx`**

Add this state and effect:

```tsx
const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

useEffect(() => {
  if (!showViews || posts.length === 0) return;

  let cancelled = false;
  const keys = posts.map((post) => `${post.lang}:${post.slug}`);

  async function loadViewCounts() {
    const response = await fetch(
      `/api/blog/views?keys=${encodeURIComponent(keys.join(","))}`,
      { cache: "no-store" }
    );

    if (!response.ok || cancelled) return;

    const payload = (await response.json()) as Record<string, number>;
    setViewCounts(payload);
  }

  void loadViewCounts();

  return () => {
    cancelled = true;
  };
}, [showViews, posts]);
```

- [ ] **Step 3: Render the view count in each card without changing the home page by default**

Replace the date row in `components/Blog.tsx` with:

```tsx
<div className="flex items-center gap-3 text-slate-500 text-xs mb-3 flex-wrap">
  <span className="flex items-center gap-1">
    <Calendar size={12} />
    {post.date}
  </span>
  {showViews ? (
    <span className="flex items-center gap-1">
      <Eye size={12} />
      {viewCounts[`${post.lang}:${post.slug}`] === undefined
        ? "--"
        : new Intl.NumberFormat(viewsLocale).format(
            viewCounts[`${post.lang}:${post.slug}`]
          )}{" "}
      {viewsLabel}
    </span>
  ) : null}
</div>
```

Also update the imports:

```tsx
import { ArrowRight, Calendar, Eye } from "lucide-react";
```

And default the new props:

```tsx
showViews = false,
viewsLabel = "views",
viewsLocale = "en-US",
```

- [ ] **Step 4: Enable list-page view counts only on the dedicated blog listing page**

In `app/[lang]/blog/page.tsx`, update the component call:

```tsx
<Blog
  title=""
  posts={posts}
  categories={categories}
  viewAllLabel={dict.blog.viewAll}
  allLabel={dict.blog.all}
  showViews
  viewsLabel={dict.blog.views}
  viewsLocale={lang === "zh" ? "zh-CN" : "en-US"}
/>
```

Do not change the homepage use of `Blog` in `app/[lang]/page.tsx`; it should continue relying on the default `showViews = false`.

- [ ] **Step 5: Document the new D1 setup in `README.md`**

Append a short section under analytics or deployment:

```md
## Blog View Counts Setup

- Create the D1 database:
  `npx wrangler d1 create protfolio-blog-views --binding BLOG_VIEWS_DB --update-config`
- Apply migrations locally:
  `npx wrangler d1 migrations apply BLOG_VIEWS_DB --local`
- Apply migrations remotely:
  `npx wrangler d1 migrations apply BLOG_VIEWS_DB --remote`
- Regenerate Cloudflare binding types:
  `npm run cf-typegen`
```

- [ ] **Step 6: Run full project verification**

Run:

```bash
npm run lint
npm test
npm run typecheck
npm run build
npm run cf:build
```

Expected:

- All commands pass
- No existing analytics integration regresses

- [ ] **Step 7: Commit the list-page integration**

Run:

```bash
git add components/Blog.tsx app/[lang]/blog/page.tsx README.md
git commit -m "Display blog view counts on the blog listing page" -m $'Constraint: The homepage blog teaser should stay visually lighter and not automatically gain public counts\nRejected: Reuse the detail-page incrementing component inside cards | cards should only display data, not mutate it\nConfidence: high\nScope-risk: moderate\nReversibility: clean\nDirective: Keep showViews opt-in so other Blog component call sites remain stable\nTested: npm run lint; npm test; npm run typecheck; npm run build; npm run cf:build\nNot-tested: Production traffic after deployment'
```

---

### Task 6: Final Manual Verification And Deployment

**Files:**
- No new files

- [ ] **Step 1: Start local Cloudflare preview**

Run:

```bash
npm run preview
```

Expected:

- Wrangler starts on `http://localhost:8787`
- The Worker exposes `BLOG_VIEWS_DB` as a local binding

- [ ] **Step 2: Verify detail-page counting behavior**

Manual verification:

- Open `/en/blog/<slug>`
- Confirm the detail view count appears
- Refresh once within 12 hours and confirm it does not increment again
- Open a different article and confirm it has its own counter

- [ ] **Step 3: Verify list-page display behavior**

Manual verification:

- Open `/en/blog`
- Confirm each visible card shows a view count
- Confirm the homepage `/en` still does not show view counts in the teaser blog module

- [ ] **Step 4: Verify local D1 contents**

Run:

```bash
npx wrangler d1 execute BLOG_VIEWS_DB --local --command="SELECT post_key, views FROM blog_post_views ORDER BY updated_at DESC LIMIT 10;"
```

Expected:

- Recently visited articles appear with incremented `views`

- [ ] **Step 5: Deploy**

Run:

```bash
npm run deploy
```

Expected:

- OpenNext Cloudflare build passes
- Deployment completes successfully

- [ ] **Step 6: Verify production**

Manual verification:

- Open one English article and one Chinese article in production
- Confirm both pages display view counts
- Open the blog list page and confirm card counts render
- Reopen the same article shortly after and confirm the count does not immediately jump

---

## Self-Review

### Spec coverage

- D1 storage requirement: covered in Task 1 and Task 3
- `lang + slug` separate counts: covered in Task 2 and Task 3
- Detail-page incrementing: covered in Task 4
- List-page display: covered in Task 5
- Keep static blog structure: enforced by Task 4 and Task 5 using client-side runtime data only
- 12-hour dedupe: covered in Task 2 and Task 4
- Cloudflare compatibility: covered in Task 1, Task 3, and Task 6

### Placeholder scan

- No `TODO` or `TBD`
- No “appropriate error handling” style placeholder text
- All file paths are concrete
- Commands are concrete

### Type consistency

- Shared types originate in `lib/blog-views.ts`
- Server code imports `SupportedLanguage` and helper functions from the shared module
- UI code uses `lang` and `slug` to build the same `${lang}:${slug}` key format used by the server

---

Plan complete and saved to `docs/superpowers/plans/2026-06-15-blog-view-counts-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
