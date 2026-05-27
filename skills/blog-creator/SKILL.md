---
name: blog-creator
description: Create new bilingual (EN+ZH) blog posts for the protfolio website with proper frontmatter, SEO metadata, paired hreflang, and Markdown content. Use when the user asks to add a blog post, article, or write content for the portfolio blog.
---

# Blog Creator

Creates bilingual blog posts for the Joseph Chen protfolio website.
The site is a Next.js SSG blog using local `.md` files rendered via
`remark` + `remark-gfm` + `remark-html`, with Mermaid diagram support.

## File Location

All blog posts live in `content/blog/`. Each post is a single `.md` file.
Bilingual posts require **two files** — one per language — cross-linked
via the `paired` field.

## Required Frontmatter

Every post MUST include all of these fields in its YAML frontmatter:

```yaml
---
title: "Post title in the post's language"
date: "YYYY-MM-DD"
summary: "One-sentence summary in the post's language"
lang: "en"                # or "zh"
category: "Android"       # display name, any string
paired: "other-slug"      # slug of the other-language version
cover: ""                 # optional — full-https URL to cover image
---
```

### Field Rules

- `title` — Use the post's language. EN titles in EN posts, ZH titles in ZH posts.
- `date` — ISO format `YYYY-MM-DD`. Used for sorting, sitemap, and JSON-LD.
- `summary` — 1–2 sentence description. Used for `<meta description>`, OG, Twitter card, and blog card previews.
- `lang` — MUST be `"en"` or `"zh"`. Determines which language route and hreflang the post appears under.
- `category` — **Use the post's language for the label.** English posts → English labels (e.g. `"Essay"`, `"Android"`, `"Getting Started"`). Chinese posts → Chinese labels (e.g. `"随笔"`, `"Android"`, `"入门指南"`). This is a recurring mistake — do NOT copy the other language's category string.
- `paired` — The **slug** of the other language version. This is **critical for SEO** — without it, Google sees EN and ZH posts as unrelated. Must point to the other file's slug (not title, not path). If creating a single-language post, omit this field.
- `cover` — Optional. Full HTTPS URL to a cover image. Used for OG image, Twitter card, and blog card hero. If omitted, the site uses the default branded OG image at `/og-default.svg`.

### CRITICAL: YAML closing delimiter

The frontmatter block MUST be closed with `---` on its own line BEFORE any Markdown content. Missing this delimiter causes a YAML parse error and the build to fail.

```yaml
---
title: "..."
date: "..."
---
# Heading starts here — no YAML after the closing ---
```

**Common mistakes that break the build:**
- Forgetting the closing `---` entirely
- Adding a trailing space after the closing `---` on the same line
- Using `---` inside a string value without properly quoting

## Content Body

Write standard Markdown after the `---` frontmatter closing. All GitHub Flavored Markdown features are supported:

| Feature | Syntax |
|---|---|
| Headings | `#` through `######` |
| Bold / Italic | `**bold**` / `*italic*` |
| Links | `[text](https://url)` |
| Images | `![alt](https://url)` |
| Ordered lists | `1. item` |
| Unordered lists | `- item` |
| Tables | `\| col \| col \|` |
| Task lists | `- [x] done` / `- [ ] pending` |
| Strikethrough | `~~text~~` |
| Code blocks | ` ```lang ` |
| Blockquotes | `> quote` |
| Horizontal rule | `---` |

### ⚠️ No H1 Heading in Body

**The body MUST NOT contain a first-level heading (`# Title`).** The title is already defined in the frontmatter's `title` field. Starting the body with `# Title` creates a duplicate title on the rendered page. Begin the body content directly with the second level (`##`) or lower, or with prose paragraphs.

### Mermaid Diagrams

Any code block tagged `mermaid` renders as an interactive SVG diagram:

    ```mermaid
    graph LR
        A[Start] --> B[Process]
        B --> C{Decision?}
        C -->|Yes| D[Deploy]
        C -->|No| B
    ```

Supported diagram types: `graph` (flowchart), `sequenceDiagram`, `classDiagram`,
`gantt`, `pie`, `gitGraph`, `stateDiagram`, and more.

## Bilingual Pairing Workflow

1. **Choose slugs** — pick short, kebab-case slugs for both versions.
   Convention: `my-topic` (EN), `my-topic-zh` (ZH).

2. **Create EN file** — `content/blog/my-topic.md`
3. **Create ZH file** — `content/blog/my-topic-zh.md`
4. **Set cross-references** — EN's `paired` points to ZH slug, ZH's `paired` to EN slug
5. **Same date** — both files must share the same `date`
6. **Verify** — run `npm run dev`, confirm both pages render

## What Happens Automatically

After `next build` (or Cloudflare Pages deploy), the new post automatically gets:

- URL route at `/{lang}/blog/{slug}`
- Sitemap entry with post date as `lastModified`
- Canonical URL
- hreflang alternates from `paired` field
- OG / Twitter Card with title, summary, cover (or default `og-default.svg`)
- Article JSON-LD structured data
- Category filter tab on `/blog` page
- Blog card on homepage (filtered by language)
