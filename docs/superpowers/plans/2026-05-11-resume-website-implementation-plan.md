# 个人简历网站实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 使用 Next.js + TailwindCSS + GSAP 构建一个深色极客风个人简历网站，支持中英文切换，包含博客功能，部署至 Cloudflare Pages。

**架构：** Next.js 15 App Router 单页应用，通过 i18n路由支持中英文切换，内容使用静态 Markdown 文件，GSAP 实现滚动动画。

**技术栈：** Next.js 15 · TailwindCSS · GSAP + ScrollTrigger · next-mdx-remote · Cloudflare Pages

---

## 文件结构

```
protfolio/
├── app/
│   ├── [lang]/                    # 国际化路由 /en /zh
│   │   ├── page.tsx               # 首页（单页结构）
│   │   ├── blog/
│   │   │   ├── page.tsx           # 博客列表
│   │   │   └── [slug]/page.tsx    # 博客详情
│   │   └── layout.tsx             # 语言布局
│   ├── layout.tsx                  # 根布局
│   └── globals.css                 # 全局样式 + Tailwind
├── components/
│   ├── Navigation.tsx              # 顶部导航
│   ├── Hero.tsx                    # Hero 区域
│   ├── About.tsx                  # 关于我
│   ├── Experience.tsx             # 工作经历时间线
│   ├── Skills.tsx                 # 技能标签云
│   ├── Projects.tsx               # 项目卡片
│   ├── Blog.tsx                   # 博客列表
│   ├── Contact.tsx                # 联系方式
│   ├── LanguageToggle.tsx         # 中英文切换
│   ├── AnimatedSection.tsx        # GSAP 动画 wrapper
│   └── ui/                        # 通用 UI 组件
│       ├── Button.tsx
│       ├── Card.tsx
│       └── SectionTitle.tsx
├── content/
│   ├── blog/                      # Markdown 博客文章
│   └── resume/                    # 简历数据
│       ├── data.ts                # 简历内容（包含中英文）
│       └── projects.ts            # 项目数据
├── i18n/
│   ├── config.ts                  # i18n 配置
│   └── dicts/
│       ├── en.json               # 英文翻译
│       └── zh.json               # 中文翻译
├── lib/
│   ├── mdx.ts                    # Markdown 解析
│   └── utils.ts                  # 工具函数
├── public/
│   ├── fonts/
│   └── images/
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## 任务列表

### Task 1: 初始化项目

**Files:**

- Create: `package.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `tsconfig.json`
- Create: `app/layout.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "protfolio",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "gsap": "^3.12.5",
    "next-mdx-remote": "^5.0.0",
    "gray-matter": "^4.0.3",
    "lucide-react": "^0.468.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "eslint": "^8",
    "eslint-config-next": "15.1.0"
  }
}
```

- [ ] **Step 2: 创建 next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

- [ ] **Step 3: 创建 tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: "#111118",
        border: "#1e1e2e",
        primary: "#6366f1",
        "neon-purple": "#a855f7",
        "neon-cyan": "#22d3ee",
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 4: 创建 app/globals.css**

```css
@import "tailwindcss";

@theme {
  --font-heading: "Space Grotesk", sans-serif;
  --font-body: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: #0a0a0f;
  color: #f8fafc;
}
```

- [ ] **Step 5: 创建 app/layout.tsx**

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chen Deji - Android Engineer",
  description: "Personal portfolio and resume website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: 创建 app/[lang]/page.tsx**

```typescript
export default function Home() {
  return <div className="min-h-screen bg-background">简历网站</div>;
}
```

- [ ] **Step 7: 创建 app/[lang]/layout.tsx**

```typescript
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  return (
    <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      {children}
    </body>
  );
}
```

- [ ] **Step 8: 创建 .gitignore**

```
node_modules
.next
out
.env
.env.local
```

- [ ] **Step 9: 创建 README.md**

```markdown
# Protfolio - 个人简历网站

使用 Next.js + TailwindCSS + GSAP 构建的深色极客风个人简历网站。

## 开发

\`\`\`bash
npm install
npm run dev
\`\`\`

## 部署

自动部署至 Cloudflare Pages。
```

---

### Task 2: 国际化配置

**Files:**

- Create: `i18n/config.ts`
- Create: `i18n/dicts/en.json`
- Create: `i18n/dicts/zh.json`
- Create: `i18n/index.ts`
- Modify: `app/[lang]/layout.tsx`
- Create: `components/LanguageToggle.tsx`

- [ ] **Step 1: 创建 i18n/config.ts**

```typescript
export const languages = ["en", "zh"] as const;
export type Language = (typeof languages)[number];

export const defaultLanguage: Language = "en";

export const languageNames: Record<Language, string> = {
  en: "English",
  zh: "中文",
};
```

- [ ] **Step 2: 创建 i18n/dicts/en.json**

```json
{
  "nav": {
    "about": "About",
    "experience": "Experience",
    "skills": "Skills",
    "projects": "Projects",
    "blog": "Blog",
    "contact": "Contact"
  },
  "hero": {
    "title": "Android Engineer",
    "subtitle": "Building exceptional mobile experiences",
    "cta": "View My Work"
  },
  "about": {
    "title": "About Me",
    "content": "Experienced Android developer with 12+ years of experience..."
  },
  "experience": {
    "title": "Work Experience"
  },
  "skills": {
    "title": "Skills"
  },
  "projects": {
    "title": "Projects"
  },
  "blog": {
    "title": "Blog"
  },
  "contact": {
    "title": "Get In Touch",
    "email": "Email",
    "github": "GitHub",
    "linkedin": "LinkedIn"
  }
}
```

- [ ] **Step 3: 创建 i18n/dicts/zh.json**

```json
{
  "nav": {
    "about": "关于我",
    "experience": "工作经历",
    "skills": "技能",
    "projects": "项目",
    "blog": "博客",
    "contact": "联系我"
  },
  "hero": {
    "title": "Android 工程师",
    "subtitle": "打造卓越的移动端体验",
    "cta": "查看我的作品"
  },
  "about": {
    "title": "关于我",
    "content": "拥有 12 年以上经验的 Android 开发工程师..."
  },
  "experience": {
    "title": "工作经历"
  },
  "skills": {
    "title": "技能"
  },
  "projects": {
    "title": "项目"
  },
  "blog": {
    "title": "博客"
  },
  "contact": {
    "title": "联系我",
    "email": "邮箱",
    "github": "GitHub",
    "linkedin": "领英"
  }
}
```

- [ ] **Step 4: 创建 i18n/index.ts**

```typescript
import { Language, defaultLanguage } from "./config";

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${NestedKeyOf<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

export type DictKey = NestedKeyOf<typeof import("./dicts/en.json")>;

export function getDict(lang: Language) {
  const dictionaries = {
    en: () => import("./dicts/en.json").then((m) => m.default),
    zh: () => import("./dicts/zh.json").then((m) => m.default),
  };
  return dictionaries[lang]();
}
```

- [ ] **Step 5: 修改 app/[lang]/layout.tsx**

```typescript
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { getDict } from "@/i18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDict(lang as Language);

  return (
    <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      {children}
    </body>
  );
}
```

- [ ] **Step 6: 创建 components/LanguageToggle.tsx**

```typescript
"use client";

import { useRouter, usePathname } from "next/navigation";
import { languages, languageNames, type Language } from "@/i18n/config";
import { clsx } from "clsx";

export function LanguageToggle({ currentLang }: { currentLang: Language }) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLang = (newLang: Language) => {
    if (newLang === currentLang) return;
    const segments = pathname.split("/");
    segments[1] = newLang;
    router.push(segments.join("/"));
  };

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => switchLang(lang)}
          className={clsx(
            "px-3 py-1 text-sm rounded transition-colors",
            currentLang === lang
              ? "bg-primary text-white"
              : "text-slate-400 hover:text-white"
          )}
        >
          {languageNames[lang]}
        </button>
      ))}
    </div>
  );
}
```

---

### Task 3: 简历数据

**Files:**

- Create: `content/resume/data.ts`
- Create: `content/resume/projects.ts`

- [ ] **Step 1: 创建 content/resume/data.ts**

```typescript
import { Language } from "@/i18n/config";

export const resumeData = {
  en: {
    name: "Chen Deji",
    title: "Android Engineer",
    age: 35,
    phone: "18559176792",
    email: "18701434169@163.com",
    location: "Fuzhou",
    experienceYears: 12,
    summary: `Experienced Android developer with 12+ years of expertise in building high-quality mobile applications.
    Proficient in Java, Kotlin, and Dart with Flutter cross-platform development experience.
    Strong background in project modularization, performance optimization, and team collaboration.
    Known for excellent communication skills and project planning capabilities.`,
    skills: [
      { name: "Java", level: 95 },
      { name: "Kotlin", level: 90 },
      { name: "Dart (Flutter)", level: 85 },
      { name: "Retrofit", level: 90 },
      { name: "EventBus", level: 85 },
      { name: "RxJava", level: 85 },
      { name: "Android SDK", level: 95 },
      { name: "MVVM", level: 90 },
      { name: "Room", level: 85 },
    ],
    experience: [
      {
        company: "Haojing Cloud Computing",
        position: "Android Engineer",
        period: "2023.07 - Present",
        description: "Leading Android development for Tokapay payment platform",
      },
      {
        company: "Fuzhou Grayscale Technology",
        position: "Android Engineer",
        period: "2023.03 - 2023.07",
        description: "News app development and Google Ads integration",
      },
    ],
  },
  zh: {
    name: "陈德基",
    title: "Android 工程师",
    age: 35,
    phone: "18559176792",
    email: "18701434169@163.com",
    location: "福州",
    experienceYears: 12,
    summary: `拥有12年以上经验的 Android 开发工程师，擅长构建高质量移动应用。
    精通 Java、Kotlin 及 Dart 语言，具有 Flutter 跨平台开发经验。
    在项目模块化、性能优化和团队协作方面有深厚背景。
    以出色的沟通能力和项目规划能力著称。`,
    skills: [
      { name: "Java", level: 95 },
      { name: "Kotlin", level: 90 },
      { name: "Dart (Flutter)", level: 85 },
      { name: "Retrofit", level: 90 },
      { name: "EventBus", level: 85 },
      { name: "RxJava", level: 85 },
      { name: "Android SDK", level: 95 },
      { name: "MVVM", level: 90 },
      { name: "Room", level: 85 },
    ],
    experience: [
      {
        company: "浩鲸云计算科技股份有限公司",
        position: "Android 工程师",
        period: "2023.07 - 至今",
        description: "主导 Tokapay 支付平台的 Android 开发",
      },
      {
        company: "福州灰度科技有限公司",
        position: "Android 工程师",
        period: "2023.03 - 2023.07",
        description: "新闻类 App 开发及谷歌广告集成",
      },
    ],
  },
};
```

- [ ] **Step 2: 创建 content/resume/projects.ts**

```typescript
import { Language } from "@/i18n/config";

export const projects = {
  en: [
    {
      name: "Tokapay",
      period: "2023.07 - Present",
      description:
        "Electronic wallet, QR payment, and electronic transfer app for Mexican payment provider.",
      tech: ["Kotlin", "MVVM", "Retrofit", "Room", "Coroutines"],
      link: "",
    },
    {
      name: "Smart Home Control",
      period: "2022.08 - 2022.12",
      description:
        "Smart home device control app supporting cloud and LAN control.",
      tech: ["Android SDK", "MQTT", "MVVM"],
      link: "",
    },
    {
      name: "Sunshine Military Camp",
      period: "2021.07 - 2021.12",
      description:
        "Psychological counseling app with IM and audio/video communication.",
      tech: ["Android", "IM SDK", "Room"],
      link: "",
    },
  ],
  zh: [
    {
      name: "Tokapay",
      period: "2023.07 - 至今",
      description:
        "与墨西哥支付服务提供商 toka 合作开发的电子钱包、扫码支付、电子转账应用。",
      tech: ["Kotlin", "MVVM", "Retrofit", "Room", "Coroutines"],
      link: "",
    },
    {
      name: "建发智能家居",
      period: "2022.08 - 2022.12",
      description: "智能家居设备控制端，支持云端和局域网控制设备开关。",
      tech: ["Android SDK", "MQTT", "MVVM"],
      link: "",
    },
    {
      name: "阳光军营",
      period: "2021.07 - 2021.12",
      description: "内部人员心理咨询应用，包含 IM 及音视频通讯功能。",
      tech: ["Android", "IM SDK", "Room"],
      link: "",
    },
  ],
};
```

---

### Task 4: 基础 UI 组件

**Files:**

- Create: `components/ui/Button.tsx`
- Create: `components/ui/Card.tsx`
- Create: `components/ui/SectionTitle.tsx`
- Create: `components/AnimatedSection.tsx`

- [ ] **Step 1: 创建 components/ui/Button.tsx**

```typescript
import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center gap-2",
        {
          "bg-primary hover:bg-primary/80 text-white": variant === "primary",
          "border border-border hover:border-primary/50 hover:text-primary":
            variant === "outline",
          "text-slate-400 hover:text-white": variant === "ghost",
        },
        {
          "px-3 py-1.5 text-sm": size === "sm",
          "px-5 py-2.5 text-base": size === "md",
          "px-8 py-3 text-lg": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: 创建 components/ui/Card.tsx**

```typescript
import { clsx } from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ children, className, hover = false, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-surface border border-border rounded-xl p-6 transition-all duration-300",
        hover && "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: 创建 components/ui/SectionTitle.tsx**

```typescript
interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionTitle({ title, subtitle, className = "" }: SectionTitleProps) {
  return (
    <div className={`mb-12 ${className}`}>
      <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
        {title}
      </h2>
      {subtitle && <p className="text-slate-400 text-lg">{subtitle}</p>}
    </div>
  );
}
```

- [ ] **Step 4: 创建 components/AnimatedSection.tsx**

```typescript
"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedSection({ children, className = "", delay = 0 }: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className={className} data-animated>
      {children}
    </div>
  );
}
```

---

### Task 5: Navigation 组件

**Files:**

- Create: `components/Navigation.tsx`

- [ ] **Step 1: 创建 components/Navigation.tsx**

```typescript
"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";
import { Language } from "@/i18n/config";
import { clsx } from "clsx";

const navItems = [
  { key: "about", href: "#about" },
  { key: "experience", href: "#experience" },
  { key: "skills", href: "#skills" },
  { key: "projects", href: "#projects" },
  { key: "blog", href: "#blog" },
  { key: "contact", href: "#contact" },
] as const;

export function Navigation({
  lang,
  dict,
}: {
  lang: Language;
  dict: Record<string, Record<string, string>>;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href={`/${lang}`} className="font-heading font-bold text-xl text-white">
          CD
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              {dict.nav[item.key]}
            </a>
          ))}
          <LanguageToggle currentLang={lang} />
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="px-6 py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {dict.nav[item.key]}
              </a>
            ))}
            <LanguageToggle currentLang={lang} />
          </div>
        </div>
      )}
    </nav>
  );
}
```

---

### Task 6: Hero 组件

**Files:**

- Create: `components/Hero.tsx`

- [ ] **Step 1: 创建 components/Hero.tsx**

```typescript
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowDown, Github, Linkedin, Mail } from "lucide-react";
import { Button } from "./ui/Button";

export function Hero({
  name,
  title,
  subtitle,
  cta,
  lang,
}: {
  name: string;
  title: string;
  subtitle: string;
  cta: string;
  lang: string;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const gsap = require("gsap").gsap || require("gsap");

    const tl = gsap.timeline();
    tl.fromTo(
      ".hero-word",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 }
    );
  }, []);

  const words = title.split("");

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-neon-purple/10" />

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 text-center px-6">
        <p className="text-primary font-mono text-sm mb-4 tracking-widest">
          {lang === "en" ? "WELCOME TO MY PORTFOLIO" : "欢迎来到我的作品集"}
        </p>

        <h1
          ref={titleRef}
          className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight"
        >
          {words.map((word, i) => (
            <span key={i} className="hero-word inline-block opacity-0">
              {word === " " ? "\u00A0" : word}
            </span>
          ))}
        </h1>

        <p className="text-slate-400 text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" variant="primary">
            {cta}
            <ArrowDown size={18} />
          </Button>
          <Button size="lg" variant="outline">
            <Github size={18} />
            GitHub
          </Button>
          <Button size="lg" variant="outline">
            <Linkedin size={18} />
            LinkedIn
          </Button>
        </div>

        <div className="flex justify-center gap-6 text-slate-500">
          <a href="mailto:18701434169@163.com" className="hover:text-white transition-colors">
            <Mail size={20} />
          </a>
          <a href="https://github.com/chendeji" target="_blank" className="hover:text-white transition-colors">
            <Github size={20} />
          </a>
          <a href="https://linkedin.com/in/chendeji" target="_blank" className="hover:text-white transition-colors">
            <Linkedin size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}
```

---

### Task 7: About 组件

**Files:**

- Create: `components/About.tsx`

- [ ] **Step 1: 创建 components/About.tsx**

```typescript
"use client";

import { useEffect, useRef } from "react";
import { SectionTitle } from "./ui/SectionTitle";

export function About({ title, content }: { title: string; content: string }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { gsap } = require("gsap");
    const { ScrollTrigger } = require("gsap/ScrollTrigger");
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(
      sectionRef.current?.querySelectorAll(".about-item"),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      }
    );
  }, []);

  return (
    <section id="about" ref={sectionRef} className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionTitle title={title} />

        <div className="bg-surface border border-border rounded-2xl p-8 md:p-12">
          <p className="text-slate-300 text-lg leading-relaxed about-item">
            {content}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-10 border-t border-border about-item">
            <div>
              <p className="text-primary font-bold text-3xl">12+</p>
              <p className="text-slate-400 text-sm">Years Experience</p>
            </div>
            <div>
              <p className="text-neon-cyan font-bold text-3xl">15+</p>
              <p className="text-slate-400 text-sm">Projects</p>
            </div>
            <div>
              <p className="text-neon-purple font-bold text-3xl">5</p>
              <p className="text-slate-400 text-sm">Companies</p>
            </div>
            <div>
              <p className="text-white font-bold text-3xl">3</p>
              <p className="text-slate-400 text-sm">Languages</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

### Task 8: Experience 组件

**Files:**

- Create: `components/Experience.tsx`

- [ ] **Step 1: 创建 components/Experience.tsx**

```typescript
"use client";

import { useEffect, useRef } from "react";
import { SectionTitle } from "./ui/SectionTitle";

export function Experience({
  title,
  items,
}: {
  title: string;
  items: Array<{
    company: string;
    position: string;
    period: string;
    description: string;
  }>;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { gsap } = require("gsap");
    const { ScrollTrigger } = require("gsap/ScrollTrigger");
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(
      sectionRef.current?.querySelectorAll(".timeline-item"),
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      }
    );
  }, []);

  return (
    <section id="experience" ref={sectionRef} className="py-24 px-6 bg-surface/50">
      <div className="max-w-4xl mx-auto">
        <SectionTitle title={title} />

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-border md:transform md:-translate-x-px" />

          {items.map((item, index) => (
            <div
              key={index}
              className={`timeline-item relative pl-8 md:pl-0 ${
                index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"
              } mb-12`}
            >
              {/* Timeline dot */}
              <div className="absolute left-0 md:left-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background -translate-x-[6px] md:translate-x-[-8px]" />

              <div className={`bg-surface border border-border rounded-xl p-6 ${index % 2 === 0 ? "md:ml-auto" : ""}`}>
                <span className="text-primary font-mono text-sm">{item.period}</span>
                <h3 className="text-xl font-bold text-white mt-2">{item.position}</h3>
                <p className="text-neon-cyan text-sm mt-1">{item.company}</p>
                <p className="text-slate-400 mt-3 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### Task 9: Skills 组件

**Files:**

- Create: `components/Skills.tsx`

- [ ] **Step 1: 创建 components/Skills.tsx**

```typescript
"use client";

import { useEffect, useRef } from "react";
import { SectionTitle } from "./ui/SectionTitle";

export function Skills({
  title,
  items,
}: {
  title: string;
  items: Array<{ name: string; level: number }>;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { gsap } = require("gsap");
    const { ScrollTrigger } = require("gsap/ScrollTrigger");
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(
      sectionRef.current?.querySelectorAll(".skill-item"),
      { opacity: 0, scale: 0.8 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.05,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      }
    );

    // Animate skill bars
    const bars = sectionRef.current?.querySelectorAll(".skill-bar-fill");
    bars.forEach((bar) => {
      const width = bar.getAttribute("data-width");
      gsap.fromTo(
        bar,
        { width: 0 },
        {
          width: `${width}%`,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: bar,
            start: "top 90%",
          },
        }
      );
    });
  }, []);

  return (
    <section id="skills" ref={sectionRef} className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionTitle title={title} />

        <div className="grid gap-6">
          {items.map((skill, index) => (
            <div key={index} className="skill-item">
              <div className="flex justify-between mb-2">
                <span className="text-white font-medium">{skill.name}</span>
                <span className="text-slate-400 font-mono text-sm">{skill.level}%</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="skill-bar-fill h-full bg-gradient-to-r from-primary to-neon-cyan rounded-full"
                  data-width={skill.level}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### Task 10: Projects 组件

**Files:**

- Create: `components/Projects.tsx`

- [ ] **Step 1: 创建 components/Projects.tsx**

```typescript
"use client";

import { useEffect, useRef } from "react";
import { Card } from "./ui/Card";
import { SectionTitle } from "./ui/SectionTitle";
import { ExternalLink } from "lucide-react";

export function Projects({
  title,
  items,
}: {
  title: string;
  items: Array<{
    name: string;
    period: string;
    description: string;
    tech: string[];
    link: string;
  }>;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { gsap } = require("gsap");
    const { ScrollTrigger } = require("gsap/ScrollTrigger");
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(
      sectionRef.current?.querySelectorAll(".project-card"),
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      }
    );
  }, []);

  return (
    <section id="projects" ref={sectionRef} className="py-24 px-6 bg-surface/50">
      <div className="max-w-6xl mx-auto">
        <SectionTitle title={title} />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((project, index) => (
            <Card key={index} hover className="project-card flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{project.name}</h3>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    className="text-slate-400 hover:text-primary transition-colors"
                  >
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>

              <span className="text-primary font-mono text-xs mb-3">{project.period}</span>

              <p className="text-slate-400 text-sm mb-4 flex-grow">{project.description}</p>

              <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border">
                {project.tech.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### Task 11: Blog 组件

**Files:**

- Create: `components/Blog.tsx`
- Create: `content/blog/hello-world.md`

- [ ] **Step 1: 创建 content/blog/hello-world.md`**

```markdown
---
title: "Getting Started with Android Development"
date: "2024-01-15"
summary: "A beginner's guide to starting your Android development journey."
lang: "en"
---

# Getting Started with Android Development

Android development is an exciting journey...
```

- [ ] **Step 2: 创建 content/blog/first-post-zh.md`**

```markdown
---
title: "Android 开发入门指南"
date: "2024-01-15"
summary: "初学者入门 Android 开发的完整指南。"
lang: "zh"
---

# Android 开发入门指南

Android 开发是一段令人兴奋的旅程...
```

- [ ] **Step 3: 创建 components/Blog.tsx**

```typescript
"use client";

import { useEffect, useRef } from "react";
import { Card } from "./ui/Card";
import { SectionTitle } from "./ui/SectionTitle";
import { ArrowRight } from "lucide-react";

interface Post {
  slug: string;
  title: string;
  date: string;
  summary: string;
}

export function Blog({
  title,
  posts,
  viewAllLabel,
}: {
  title: string;
  posts: Post[];
  viewAllLabel: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { gsap } = require("gsap");
    const { ScrollTrigger } = require("gsap/ScrollTrigger");
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(
      sectionRef.current?.querySelectorAll(".blog-card"),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      }
    );
  }, []);

  return (
    <section id="blog" ref={sectionRef} className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionTitle title={title} />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {posts.map((post) => (
            <Card key={post.slug} hover className="blog-card flex flex-col h-full group">
              <span className="text-slate-500 text-sm mb-3">{post.date}</span>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-slate-400 text-sm flex-grow">{post.summary}</p>
              <div className="mt-4 pt-4 border-t border-border">
                <a
                  href={`/${post.lang}/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all text-sm"
                >
                  Read more <ArrowRight size={14} />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### Task 12: Contact 组件

**Files:**

- Create: `components/Contact.tsx`

- [ ] **Step 1: 创建 components/Contact.tsx**

```typescript
"use client";

import { useState } from "react";
import { SectionTitle } from "./ui/SectionTitle";
import { Button } from "./ui/Button";
import { Mail, Github, Linkedin, Copy, Check } from "lucide-react";

export function Contact({
  title,
  email,
  github,
  linkedin,
  copySuccessLabel,
}: {
  title: string;
  email: string;
  github: string;
  linkedin: string;
  copySuccessLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="contact" className="py-24 px-6 bg-surface/50">
      <div className="max-w-2xl mx-auto text-center">
        <SectionTitle title={title} className="mb-12" />

        <div className="bg-surface border border-border rounded-2xl p-8 md:p-12">
          <p className="text-slate-400 mb-8">
            Always open to new opportunities and collaborations.
            Feel free to reach out!
          </p>

          <Button
            size="lg"
            variant="primary"
            onClick={copyEmail}
            className="mb-8"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? copySuccessLabel : email}
          </Button>

          <div className="flex justify-center gap-6">
            <a
              href={`https://github.com/${github}`}
              target="_blank"
              className="p-3 bg-border rounded-full hover:bg-primary/20 hover:text-primary transition-colors"
            >
              <Github size={24} />
            </a>
            <a
              href={`https://linkedin.com/in/${linkedin}`}
              target="_blank"
              className="p-3 bg-border rounded-full hover:bg-primary/20 hover:text-primary transition-colors"
            >
              <Linkedin size={24} />
            </a>
            <a
              href={`mailto:${email}`}
              className="p-3 bg-border rounded-full hover:bg-primary/20 hover:text-primary transition-colors"
            >
              <Mail size={24} />
            </a>
          </div>
        </div>

        <p className="text-slate-600 text-sm mt-8">
          &copy; 2024 Chen Deji. All rights reserved.
        </p>
      </div>
    </section>
  );
}
```

---

### Task 13: 主页面整合

**Files:**

- Modify: `app/[lang]/page.tsx`

- [ ] **Step 1: 创建 app/[lang]/page.tsx**

```typescript
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Experience } from "@/components/Experience";
import { Skills } from "@/components/Skills";
import { Projects } from "@/components/Projects";
import { Blog } from "@/components/Blog";
import { Contact } from "@/components/Contact";
import { getDict, type Language } from "@/i18n";
import { resumeData } from "@/content/resume/data";
import { projects } from "@/content/resume/projects";
import { blogPosts } from "@/lib/mdx";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDict(lang as Language);
  const data = resumeData[lang as Language];
  const projectList = projects[lang as Language];
  const posts = await blogPosts(lang as Language);

  return (
    <main className="bg-background min-h-screen">
      <Navigation lang={lang as Language} dict={dict} />
      <Hero
        name={data.name}
        title={data.title}
        subtitle={data.summary}
        cta={dict.hero.cta}
        lang={lang}
      />
      <About title={dict.about.title} content={data.summary} />
      <Experience title={dict.experience.title} items={data.experience} />
      <Skills title={dict.skills.title} items={data.skills} />
      <Projects title={dict.projects.title} items={projectList} />
      <Blog title={dict.blog.title} posts={posts} viewAllLabel="View All" />
      <Contact
        title={dict.contact.title}
        email={data.email}
        github="chendeji"
        linkedin="chendeji"
        copySuccessLabel="Copied!"
      />
    </main>
  );
}
```

- [ ] **Step 2: 创建 lib/mdx.ts**

```typescript
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Language } from "@/i18n/config";

const blogDirectory = path.join(process.cwd(), "content/blog");

export async function blogPosts(lang: Language) {
  const files = fs.readdirSync(blogDirectory);

  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith(".md"))
      .map(async (file) => {
        const slug = file.replace(/\.md$/, "");
        const filePath = path.join(blogDirectory, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const { data } = matter(content);

        return {
          slug,
          title: data.title,
          date: data.date,
          summary: data.summary,
          lang: data.lang,
        };
      }),
  );

  return posts.filter((post) => post.lang === lang);
}
```

---

### Task 14: Cloudflare Pages 部署配置

**Files:**

- Create: `public/_headers`
- Create: `public/_redirects`
- Create: `.gitignore`

- [ ] **Step 1: 创建 public/\_headers**

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/sw.js
  Cache-Control: no-cache
```

- [ ] **Step 2: 创建 wrangler.json (可选，用于本地测试)**

```json
{
  "name": "protfolio",
  "compatibility_date": "2024-01-01"
}
```

- [ ] **Step 3: 验证部署配置**

```bash
# 安装依赖
npm install

# 构建
npm run build

# 本地预览
npx wrangler pages dev out
```

---

## 执行方式

**计划完成并保存至 `docs/superpowers/plans/2026-05-11-resume-website-implementation.md`。两种执行方式：**

**1. Subagent-Driven (推荐)** — 每任务派遣新 subagent，任务间进行 review，快速迭代

**2. Inline Execution** — 在当前 session 中按批次执行任务，带 review 检查点

选择哪种方式？
