# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server on localhost:3000
npm run build     # Production build to .next/
npm run start     # Start production server
npm run lint      # ESLint with next/core-web-vitals
```

`npx wrangler pages deploy out --project-name=protfolio` deploys to Cloudflare Pages.

## Architecture

**Bilingual routing**: Next.js App Router with `app/[lang]/` as the sole route group (`en` | `zh`). `generateStaticParams` in page.tsx and blog pages creates static paths for both locales. The default app/layout.tsx is minimal (metadata only); fonts and CSS variable wiring live in `app/[lang]/layout.tsx`.

**i18n pattern**: Dictionaries are dynamic imports (`i18n/dicts/en.json`, `zh.json`) keyed by nav/hero/about/experience/skills/projects/blog/contact. `lib/mdx.ts` is legacy — the actual blog data source is the Notion API.

**Blog (Notion CMS)**: `lib/notion.ts` fetches blog posts from Notion child pages. The env vars are `NOTION_TOKEN` and `NOTION_BLOG_PAGE_IDS` (comma-separated page IDs). `getBlogPosts()` fetches all; `getBlogPost(slug)` finds one by generated slug.

**Content data**: Resume info is in `content/resume/data.ts` as a `Record<Language, ...>`. Projects are in `content/resume/projects.ts`, same pattern. Both are server-imported, not fetched.

**GSAP animations**: Hero uses `gsap.context()` with a timeline for entrance animation. Blog uses `ScrollTrigger` (registered client-side) for scroll-triggered card reveals. Animations are in `"use client"` components with cleanup via `ctx.revert()`.

**Styling**: Tailwind CSS v4 with theme tokens in `app/globals.css` (`@theme` block) — colors `background`, `surface`, `border`, `primary`, `neon-purple`, `neon-cyan`; fonts `heading` (Space Grotesk), `body` (Inter), `mono` (JetBrains Mono). Tailwind config in `tailwind.config.ts` mirrors these tokens for IDE intellisense. `clsx` is used for conditional classes.

**Shared UI components**: `components/ui/` has `Button` (primary/outline/ghost variants, sm/md/lg sizes), `Card` (optional hover), and `SectionTitle`. All use `forwardRef` where applicable.

**Navigation**: `Navigation.tsx` is a `"use client"` component with scroll-aware background blur, mobile hamburger menu, and inline `LanguageToggle`. Nav items reference `dict.nav[key]` for i18n labels. Language switch rewrites `pathname.split("/")[1]`.
