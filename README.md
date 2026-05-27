# Protfolio - Personal Portfolio Website

A professional developer portfolio website with a dark geek aesthetic, designed to make a lasting impression on interviewers.

## Features

- **Dark Theme** — Near-black background with neon accents for a premium look
- **GSAP Animations** — Scroll-triggered reveals, parallax layers, typewriter effects
- **Bilingual** — Seamless English/Chinese switch for global remote interviews
- **Responsive Design** — Perfect on mobile, tablet, and desktop
- **Static Site** — Fast loading, simple deployment
- **Blog** — Markdown-based article management

## Tech Stack

- **Next.js 15** (App Router)
- **TailwindCSS** — Atomic CSS
- **GSAP** — Professional-grade animations
- **Cloudflare Pages** — Global edge deployment

## Getting Started

```bash
# Install dependencies
npm install

# Development
npm run dev

# Lint
npm run lint

# Tests
npm test

# Production build
npm run build
```

## Analytics Setup (Cloudflare + Clarity)

This project supports optional analytics scripts controlled by environment variables.

- `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN`: Cloudflare Web Analytics token
- `NEXT_PUBLIC_CLARITY_PROJECT_ID`: Microsoft Clarity project ID

### Local setup

```bash
cp .dev.vars.example .dev.vars
# fill NEXT_PUBLIC_* values in .dev.vars
```

If you also use `npm run dev`, add the same `NEXT_PUBLIC_*` values to `.env.local` so Next.js dev mode can read them.

### Production setup (Cloudflare)

Set these variables in Cloudflare dashboard:

1. **Build variables and secrets** (for build-time inlining of `NEXT_PUBLIC_*`)
2. **Runtime environment variables** (for worker runtime)

If you already enabled Cloudflare Pages one-click Web Analytics injection, leave `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN` empty to avoid double-injecting the beacon.

### What you can observe

- **Inbound traffic**: Visits, page views, referrers (Cloudflare Web Analytics)
- **Blog views**: Filter paths under `/en/blog` and `/zh/blog`
- **Behavior details**: Heatmaps and session recordings (Clarity)

### Compliance reminder

Before enabling Clarity in production, update your privacy/cookie notice and verify it fits your legal requirements.

## Project Structure

```
protfolio/
├── app/                    # Next.js App Router
│   └── [lang]/            # i18n routes (/en, /zh)
├── components/            # React components
│   ├── Hero.tsx          # Full-screen hero
│   ├── About.tsx         # About section
│   ├── Experience.tsx    # Work experience
│   ├── Skills.tsx        # Skills visualization
│   ├── Projects.tsx      # Project showcase
│   ├── Blog.tsx          # Blog listing
│   └── Contact.tsx       # Contact info
├── content/             # Content
│   ├── blog/            # Markdown blog posts
│   └── resume/          # Resume data
├── i18n/                # Internationalization
└── lib/                 # Utilities
```

## Deployment

### Cloudflare Pages

```bash
# Build for Cloudflare Worker
npm run cf:build

# Local preview
npm run preview

# Deploy
npm run deploy
```

### Vercel

```bash
npm run build
# Connect GitHub repo for auto-deploy
```

## About Me

- **Joseph Chen (陈德基)**
- Android Engineer with 12+ years of experience
- Specializing in mobile architecture and performance optimization
- GitHub: https://github.com/Josephchen-crypto
