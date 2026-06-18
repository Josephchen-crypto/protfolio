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
- `date` — ISO format `YYYY-MM-DD`. Used for sorting, sitemap, and JSON-LD. **Must be today's date** (or the date you're actively working on it), not a historical date from source code.
- `summary` — 1–2 sentence description. **Must match the post's `lang`**: English posts → English summary, Chinese posts → Chinese summary. Never copy the other language's summary text.
  - **CRITICAL: summary must not duplicate title** — summary is used as OG description / blog card description and needs to be written independently. Do not simply rephrase the title. For example, if the title is "Tokapay 项目错误处理体系总结", the summary should NOT be "本文总结 Tokapay 项目错误处理体系". Instead, describe a concrete technical highlight: "四层错误处理架构：IErrorHandler 业务拦截 → Repository 统一兜底 → ViewModel DSL 策略 → ResultBuilder 最终回调，分层解耦、各司其职。"
  - **CRITICAL: summary must match body content** — any technical terms mentioned in summary must be explained or referenced in the body. If summary mentions "Service Proxy Pattern", the body must contain detailed explanation of that pattern.
  - **Common summary mistakes to avoid**:
    - Copying the title phrase into summary (e.g. title="四层架构总结", summary="本文总结四层架构" — this is a duplication, NOT a summary)
    - Writing summary in the wrong language (ZH post with EN summary, or vice versa)
    - Using technical terms in summary that don't appear in the body
    - Writing a vague/generic summary that could describe any blog ("本文介绍..." without specifics)
    - **A correct summary example for title "四层错误处理架构"**: "ErrorHandler 业务拦截 → BaseRepository 统一兜底 → ViewModel DSL 策略路由 → ResultBuilder 最终回调，四层各司其职、分层解耦。"
    - **A wrong summary example (duplication)**: title="四层错误处理架构总结", summary="本文总结 Tokapay 项目的四层错误处理架构" — the summary just restates the title without adding any new information.
- `cover` — Optional but **strongly recommended**. Full HTTPS URL to a cover image. If omitted, the site uses the default branded OG image at `/og-default.svg`. **Always set explicitly** — use the standard cover image URL: `https://raw.githubusercontent.com/Josephchen-crypto/pics/master/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8818%E6%97%A5%2020_20_55.png`
- `lang` — MUST be `"en"` or `"zh"`. Determines which language route and hreflang the post appears under.
- `category` — **Use the post's language for the label.** English posts → English labels (e.g. `"Essay"`, `"Android"`, `"Getting Started"`). Chinese posts → Chinese labels (e.g. `"随笔"`, `"Android"`, `"入门指南"`). This is a recurring mistake — do NOT copy the other language's category string. Same for `summary` — language must match `lang`.
- `paired` — The **slug** of the other language version. This is **critical for SEO** — without it, Google sees EN and ZH posts as unrelated. Must point to the other file's slug (not title, not path). If creating a single-language post, omit this field.

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

---

## Formatting Rules (Blog Post Aesthetics)

Joseph has strong opinions on blog readability. Follow these rules strictly:

1. **Diagrams: Mermaid mandatory** — Any architecture/flow/sequence diagram MUST use Mermaid. Never use ASCII art, plain text diagrams, Unicode boxes, or code-rendered "boxes". This is a hard rule: if a diagram is possible, it must be Mermaid. Use ` ```mermaid ` blocks for flowcharts (flowchart TD/TB/LR), sequence diagrams (sequenceDiagram), class diagrams (classDiagram), state diagrams (stateDiagram), etc.
2. **No deprecated components section** — Do not include sections about deprecated/legacy code. Write only what is current and active.
3. **No "trade-offs" / 折衷 sections** — These are not published in the blog. Stick to positive design highlights only.
4. **Error code de-sensitization** — Real error codes must be replaced with generic examples. Use patterns like `PHYSICAL_01`, `P2P_01`, `SHARE_01`, `TOKEN_01` instead of real project codes like `04200`, `03719`, `TOKEN_INVALID`.
5. **Table columns** — Use descriptive scenario names in tables (e.g., "典型场景"), not raw error code values.
6. **Send file, don't render** — After generating a blog post, always send the file via `MEDIA:/absolute/path/to/file` to Joseph. Do NOT paste the rendered Markdown content into the chat — the chat doesn't display it well.

### Blog De-sensitization Checklist

Before marking a post ready to push, verify:
- [ ] No real error codes (replace with `TYPE_XX` pattern)
- [ ] No deprecated/legacy sections
- [ ] No trade-offs / 折衷 sections
- [ ] All diagrams are Mermaid (not ASCII/text boxes)
- [ ] `date` is today's date (not source code date)
- [ ] `cover` is set to standard cover URL
- [ ] Summary does not duplicate the title

### When NOT to use this skill

- For career strategy, job seeking, or job application decisions → use `independent-analysis` instead. blog-creator is only for blog post creation.

## Source Processing Workflow

When the user provides a **handover/architecture/technical document** (e.g., 项目架构说明、交接文档、SA文档) as source material:

1. **First produce the analysis document** in the project root (`/home/chendeji/project/toka/toka/source/toka/`), NOT the blog post directly. Filename: `项目技术难点与亮点分析.md`
2. **Structure the analysis** around the actual technical challenges and design decisions found in the source material
3. **Then write the blog post** using the analysis document as source, applying the blog-creator rules (de-sensitize, bilingual, no H1 in body, etc.)

See `references/de-sensitization.md` for what to replace vs. keep when converting internal documents to public blog posts.
See `references/send-file-protocol.md` for file sending conventions — use MEDIA format, distinguish "review request" vs "file delivery request" vs "push request".

**Do not ask for confirmation before starting** — if the user provides source material, proceed directly to step 1 unless they explicitly say "先不写" or "等一下".
