/**
 * Build-time index generator: reads every markdown file under content/blog and
 * writes a minimal JSON manifest to `content/blog/index.json`.
 *
 * Why:
 *   `lib/mdx.ts` uses Node's `fs` to read the markdown directory. That works
 *   during `next build` (SSG) but is not available at runtime on Cloudflare
 *   Workers. Pages that need the post list at runtime (e.g. the admin
 *   dashboard) import the JSON produced here instead, which Next inlines into
 *   the Worker bundle.
 *
 *   The full rendered HTML stays out of this JSON — only lightweight metadata
 *   the admin views need. Blog pages themselves continue to render via SSG
 *   and don't need this file.
 *
 * Run via `npm run prebuild`, which fires automatically before `next build`.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CWD = process.cwd();
const BLOG_DIR = path.join(CWD, "content/blog");
const OUT_FILE = path.join(BLOG_DIR, "index.json");

interface PostIndexEntry {
  slug: string;
  title: string;
  date: string;
  summary: string;
  category: string;
  lang: "en" | "zh";
  published: boolean;
}

function collectEntries(): PostIndexEntry[] {
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));

  const entries: PostIndexEntry[] = files.map((file) => {
    const slug = file.replace(/\.(md|mdx)$/, "");
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data } = matter(raw);
    return {
      slug,
      title: (data.title as string) || slug,
      date: (data.date as string) || "",
      summary: (data.summary as string) || "",
      category: (data.category as string) || "",
      lang: (data.lang as "en" | "zh") || "en",
      published: data.published !== false,
    };
  });

  // Sort newest first, then slug for stable output across runs.
  entries.sort((a, b) => {
    const da = new Date(a.date).getTime() || 0;
    const db = new Date(b.date).getTime() || 0;
    if (db !== da) return db - da;
    return a.slug.localeCompare(b.slug);
  });

  return entries;
}

const entries = collectEntries();
fs.writeFileSync(OUT_FILE, `${JSON.stringify(entries, null, 2)}\n`);
console.log(`[build-post-index] wrote ${entries.length} entries → ${path.relative(CWD, OUT_FILE)}`);
