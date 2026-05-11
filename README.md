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

# Production build
npm run build
```

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
# Build
npm run build

# Deploy
npx wrangler pages deploy out --project-name=protfolio
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
