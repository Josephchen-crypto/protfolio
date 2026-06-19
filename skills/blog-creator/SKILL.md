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
- `cover` — Optional but **strongly recommended**. Full HTTPS URL to a cover image. If omitted, the site uses the default branded OG image at `/og-default.svg`. **Cover is by author choice** — Joseph picks a cover image per post based on the topic's mood. Past covers have included the standard toka image (`ChatGPT Image 2026年5月18日 ...`) and `@linviena.jpeg`. No fixed default — but cover must be set explicitly on every post. (Updated 2026-06-18: Joseph replaced the standard toka cover with `@linviena.jpeg` on `business-or-tech-zh` because the topic is personal/essay — not technical. Treat cover as creative choice, not a hardcoded asset.)

### SKILL load verification (REQUIRED before writing)

**Always run `skill_view(name='blog-creator')` before starting any blog task.** The skill being listed as "enabled" in `hermes skills list` does NOT mean it's loaded into the session's working context. Joseph has explicitly flagged this (2026-06-18: "等等，你现在是已经加载了skill来走创建博客的流程吗？"). Until you've called `skill_view`, the rules in this file are not in your working memory — you may contradict them.

Correct sequence before any blog work:
1. `skill_view(name='blog-creator')` → load the main SKILL.md
2. `skill_view(name='blog-creator', file_path='references/de-sensitization.md')` → load de-sensitize rules
3. `skill_view(name='blog-creator', file_path='references/send-file-protocol.md')` → load send-file rules
4. Optionally load `references/joseph-style-profile.md` → learn Joseph's voice for style imitation
5. **Then** start the writing workflow

If the user asks "have you loaded the skill?" — that's a real check, not a rhetorical question. Confirm the load and what you see in the loaded content. Do not claim a skill is "in effect" without having called `skill_view` for it this session.
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

### Style imitation step (when polishing Joseph's drafts)

When the user provides a draft and asks for polish/revision/imitation, add this step **before** writing:

1. **Extract style fingerprint** — Read the user's draft and identify:
   - Sentence length preference (short/run-on vs long/structured)
   - Transition word habits ("但是/其实/so/yeah/actually")
   - Rhetorical patterns (analogy, self-deprecation, no metaphor)
   - Paragraph rhythm (one-idea-per-paragraph vs dense)
   - Punctuation habits (Chinese: 逗号长串 / English: em-dashes)
   - Emotional stance (self-aware, doesn't sell out)
2. **State your observations back to the user** in 1 short message — "我从你这篇抓到了 X 个特征：..." — so they can correct your read
3. **Propose a "落点"** (one-sentence emotional landing) — what is this post really trying to say? Confirm with the user before writing
4. **Write the polished version** following your style fingerprint + their stated intensity
5. **Mark the AI-suspect sections** in your reply — list 2-4 sentences that you're not 100% sure sound like Joseph, so he can flag them

Detailed style fingerprint of Joseph (extracted from his published essays) lives in `references/joseph-style-profile.md` — load it when imitating his voice.

### Sync-after-edit protocol (when user edits one language)

When the user has edited the ZH version and asks to sync to EN (or vice versa):

1. **Run `diff` first** — never assume the user only changed what they said they changed. List every change.
2. **Flag cover image changes** — if the user changed `cover` in the source language, ask: keep the new cover globally (and update SKILL) or keep standard cover (and revert)? Do not assume.
3. **Sync the changes** to the other language, not just the one the user mentioned
4. **Update SKILL rules** if the user's change broke a previous hard rule (e.g., user replaced mandatory cover URL → update the cover rule in SKILL.md to "by author choice")
5. **Wait for explicit "push"** before `git add + commit + push` — never auto-push blog content even after sync

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

## User working style (Joseph-specific overrides)

These override or extend the rules above based on observed preferences. Each item is anchored to a specific 2026-06-18 incident.

### 1. Render-in-chat override (when user explicitly asks)

**Override**: If the user explicitly says "文件直接发到这个窗口来" / "贴出来给我看" / "直接发到这里" / "send file here" — **listen to the user and use `send_message` with `MEDIA:` to send the file directly to the chat**. Do not insist on the file-not-render rule when the user has overridden it. The file path format is `MEDIA:/absolute/path/to/file.md` and the platform will deliver it as an attachment.

This override is an exception, not a new default. After the user reviews, return to the file-send default for the next round.

### 2. Polish intensity is a required question (not a default)

When the user asks for a blog post, you MUST ask which intensity before writing. The default is **NOT** implied — Joseph has stated explicitly (2026-06-18): "我其实不太会写文章的。我的文笔不好". This means:

- Do NOT assume "light" / "heavy" / "rewrite" — always ask
- Do NOT proceed without a confirmed intensity
- The user's self-assessed writing skill is weak → **strong recommendation to default-suggest "try first + iterate"** (write one version, get feedback, revise) over "full rewrite" — Joseph's workflow preference is iterative, not single-shot

Recommended question to ask:
> "你文笔弱的事实不会影响我怎么写——只影响我**先写哪一版给你看**。三个真实选项：
> 1. 你重写草稿，我只精修错别字
> 2. 我按 light 强度改，原句保留 80-90%
> 3. 我完全重写，你看了认账/不认账
> 4. 我先写一版你看了再调（推荐——你不用重写）"

### 3. Style imitation requires `references/joseph-style-profile.md`

When polishing Joseph's drafts or imitating his voice, load `references/joseph-style-profile.md` first. It contains an extracted style fingerprint from his published essays. Do not rely on short-term impression — load the profile, then write.

### 4. Joseph's two-language workflow

Joseph writes in Chinese first, then asks for the English paired version. The English version is **NOT a translation** — it is an independent re-narration in Joseph's English voice (shorter, more direct, less rhetorical). Joseph's English essays (`my-super-individual-journey.md`, `toka-project-kickoff.md`) confirm this style. When writing the English paired version:

- Same `date` and `paired` slug (bidirectional)
- Same `cover` image (sync if user changes the ZH cover)
- Different `summary` (independent, not translated from ZH)
- `category` in the post's language (`Essay` for EN, `随笔` for ZH)
- Body should match Joseph's English voice, not a translation of the ZH body

## Source Processing Workflow

When the user provides a **handover/architecture/technical document** (e.g., 项目架构说明、交接文档、SA文档) as source material:

1. **First produce the analysis document** in the project root (`/home/chendeji/project/toka/toka/source/toka/`), NOT the blog post directly. Filename: `项目技术难点与亮点分析.md`
2. **Structure the analysis** around the actual technical challenges and design decisions found in the source material
3. **Then write the blog post** using the analysis document as source, applying the blog-creator rules (de-sensitize, bilingual, no H1 in body, etc.)

See `references/de-sensitization.md` for what to replace vs. keep when converting internal documents to public blog posts.
See `references/send-file-protocol.md` for file sending conventions — use MEDIA format, distinguish "review request" vs "file delivery request" vs "push request".
See `references/joseph-style-profile.md` for Joseph's writing style fingerprint — load this when polishing his drafts or imitating his voice in any new post.

**Do not ask for confirmation before starting** — if the user provides source material, proceed directly to step 1 unless they explicitly say "先不写" or "等一下"."push request".
See `references/joseph-style-profile.md` for Joseph's writing style fingerprint — load this when polishing his drafts or imitating his voice in any new post.

**Do not ask for confirmation before starting** — if the user provides source material, proceed directly to step 1 unless they explicitly say "先不写" or "等一下".

## Pre-Writing Workflow (Mandatory)

**Before writing any blog post — even if the user has not asked — complete these steps in order:**

### Step 1: Voice Learning (Read → Decode → Profile)

When the user provides source material (draft, outline, bullet points, or even a half-finished paragraph), the agent **MUST** extract the user's writing fingerprint and surface it back to the user before drafting. Extract these dimensions:

1. **Sentence length preference** — short declarative vs long subordinate clauses
2. **Transition word habits** — "但是" / "所以" / "然后" / hard cuts / "其实"
3. **Rhetorical devices** — metaphors, self-deprecation, rhetorical questions, dialect
4. **Self-expression** — does the user understate / overstate / use emoji for emphasis?
5. **Paragraph rhythm** — one idea per paragraph (流水账) vs dense blocks
6. **Punctuation habits** — long comma chains, periods, dashes, ellipses

**Output format**: A 5-section "Joseph 写作风格档案" listing concrete examples extracted from THIS session's source material, NOT generic observations.

### Step 2: Confirm Style Anchors (only for essay/opinion posts)

Before drafting, surface 1–2 honest observations about the source's **underlying intent** (落点) and **emotional direction** (吐槽对象), and confirm with the user that the read is correct. This prevents drafting toward the wrong target. Example:

> "判断 1: 你已经决定不做区块链了，落点是'放弃着迷的方向、转更稳的路、但游戏梦未死'。判断 2: 吐槽的对象是职场不是技术。"

If both checks pass, proceed. If the user adjusts, redraft the 落点 before writing the first word.

### Step 3: Edit Strength Selection (REQUIRED — pick one)

**Always ask the user to pick one of these three edit strengths before drafting. Do not default to a level.**

| Strength | What changes | What stays | When to pick |
|---|---|---|---|
| **Light** | 段落顺序 / 删重复句 / 加过渡 / 修错别字 | 80-90% 原句保留 | 用户说"文笔不好"但其实素材完整；想快速出稿 |
| **Standard** | 全面重构结构 + 补背景 + 加个人化语气 + 修表达 | 50% 原句保留 | 素材散乱 / 多段拼接 / 需重新组织逻辑 |
| **Heavy** | 重写 60%+，只保留核心观点和真实故事 | 落点 + 关键故事 | 素材只是 bullet points；用户明确说"帮我写" |

**Common trap**: User says "文笔不好" — that is a signal to **offer** the strength choice, NOT to assume Heavy. Many users have raw material that's good and just needs light editing.

### Step 4: Draft + File Send

Write the first language version (default: Chinese if user wrote in Chinese). Use the workflow in the Bilingual Pairing Workflow section above for file paths. Then **send the file** to the user (do NOT render in chat) using `send_message` with `MEDIA:/absolute/path/to/file.md`. See `references/send-file-protocol.md`.

### Step 5: Iterate

Default flow is: 中文初稿 → file send → user feedback → revise → 英文版 → file send → user feedback → revise → final commit + push.

**Don't write the English version until the user confirms the Chinese version reads right.** "Try first, adjust later" (选项 4 in practice) is the default flow when the user's writing confidence is low.

## Output Format Preference (Caveat)

**Default**: Always send files for blog posts, never render full content in chat. (See `references/send-file-protocol.md`.)

**Override**: If the user explicitly says "文件直接发到这个窗口来" / "贴出来给我看" / "直接发到这里" — **listen to the user and use `send_message` with `MEDIA:` to send the file directly to the chat**. Do not insist on the file-not-render rule when the user has overridden it. The file path format is `MEDIA:/absolute/path/to/file.md` and the platform will deliver it as an attachment.

This override is an exception, not a new default. After the user reviews, return to the file-send default for the next round.

## Polish Intensity (Required Question)

**Always ask the user the polish intensity before writing.** This determines how much you transform the user's raw material. The three modes:

| Mode | When to use | What it means |
|------|-------------|---------------|
| **Light** (10-20%) | User already wrote a draft, just wants expression cleanup | Keep original sentences as the spine. Only fix obvious "AI 味" telltales: "综上所述 / 总而言之 / 不仅...而且... / 在当今时代", overlong compound sentences, mechanical transitions. Do NOT restructure, add new sections, or change meaning. |
| **Standard** (full rewrite) | User provided bullet points / outline / messy notes | Restructure into blog-creator format. Add background context, narrative flow, and personal voice. Apply all 6 de-AI-味 rules. |
| **Heavy** (60%+ rewrite) | User provided only core opinions / a real story, wants "Joseph voice" | Preserve core opinions and lived experience. Retell in a personal, conversational tone. Drop generic "道理列表" structures that read as AI-generated. |

**Why this matters:** Joseph repeatedly asks "不能有 AI 味" — that's a voice/structure signal, not a "remove a few words" request. Light mode protects his original voice; Standard/Heavy mode give the agent license to restructure. Picking the wrong mode either ruins his draft (too much rewrites) or ships an AI-sounding blog (too few rewrites).

**How to ask (use `clarify` tool, single question with 3 choices):**
"博客润色强度？（人味越重 = 越偏离原文）"

## Skill Loading Hygiene

**Never claim a skill is loaded without calling `skill_view(name)` first.** Joseph explicitly checks ("你现在是已经加载了skill来走创建博客的流程吗？") — and rightly so, because "enabled" in `hermes skills list` only means "available to load", not "loaded into session context". A skill that isn't `skill_view`'d is invisible to you regardless of enabled state.

**Rule:** if you intend to follow a skill's rules in your reply, call `skill_view(name)` first and reference the specific rules you're applying. Don't say "按 SKILL 规则" unless you've actually read the SKILL.md in this turn.
