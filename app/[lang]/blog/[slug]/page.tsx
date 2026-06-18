import { Navigation } from "@/components/Navigation";
import { MermaidContent } from "@/components/MermaidContent";
import { getDict, type Language } from "@/i18n";
import { getBlogPost, getBlogPosts } from "@/lib/mdx";
import { siteUrl } from "@/lib/site";
import { ArrowLeft, Calendar } from "lucide-react";
import { PostViewCount } from "@/components/PostViewCount";
import { ReadingProgress } from "@/components/ReadingProgress";
import { BlogTOC } from "@/components/BlogTOC";
import { SocialShare } from "@/components/SocialShare";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ lang: post.lang, slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = await getBlogPost(slug, lang as Language);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const pairedPost = post.paired ? await getBlogPost(post.paired) : null;
  const ogImage = post.cover
    ? [{ url: post.cover, width: 1200, height: 630 }]
    : [{ url: `${siteUrl}/og-default.png`, width: 1200, height: 630 }];

  const alternates: {
    canonical: string;
    languages?: Record<string, string>;
  } = {
    canonical: `${siteUrl}/${lang}/blog/${slug}`,
  };

  if (pairedPost) {
    alternates.languages = {
      [post.lang]: `${siteUrl}/${post.lang}/blog/${post.slug}`,
      [pairedPost.lang]: `${siteUrl}/${pairedPost.lang}/blog/${pairedPost.slug}`,
      "x-default": `${siteUrl}/en/blog/${post.lang === "en" ? post.slug : pairedPost.slug}`,
    };
  }

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      locale: lang === "zh" ? "zh_CN" : "en_US",
      url: `${siteUrl}/${lang}/blog/${slug}`,
      publishedTime: post.createdAt,
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: ogImage,
    },
    alternates,
  };
}

const readingTime = (html: string): string => {
  const words = html.replace(/<[^>]*>/g, "").trim();
  const count = words.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(count / 200));
  return `${minutes} min read`;
};

function addHeadingIds(html: string): string {
  let headingIndex = 0;
  return html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h[23]>/gi,
    (match, level, attrs, text) => {
      // Skip if already has an id
      if (/\bid\s*=/.test(attrs)) return match;
      const plain = text.replace(/<[^>]*>/g, "").trim();
      const id = `heading-${headingIndex}-${plain
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
        .replace(/(^-|-$)/g, "")}`;
      headingIndex++;
      return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    }
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const dict = await getDict(lang as Language);
  const post = await getBlogPost(slug, lang as Language);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.createdAt).toLocaleDateString(
    lang === "zh" ? "zh-CN" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const readTime = readingTime(post.content);

  // Process HTML to add heading IDs for TOC navigation
  const contentWithIds = addHeadingIds(post.content);

  const isoDate = `${post.createdAt}T00:00:00+08:00`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    image: {
      "@type": "ImageObject",
      url: post.cover || `${siteUrl}/og-default.png`,
      width: 1200,
      height: 630,
    },
    datePublished: isoDate,
    dateModified: isoDate,
    author: {
      "@type": "Person",
      name: "Joseph Chen",
      url: siteUrl,
    },
    publisher: {
      "@type": "Person",
      name: "Joseph Chen",
      url: siteUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/${lang}/blog/${slug}`,
    },
  };

  return (
    <main className="bg-background min-h-screen">
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Navigation lang={lang as Language} dict={dict} pairedSlug={post.paired} />
      <article>
        {/* Hero section */}
        <div className="relative pt-24">
          {/* Cover image as full-width hero background */}
          {post.cover ? (
            <div className="absolute inset-0 h-[70vh]">
              <img
                src={post.cover}
                alt={post.title}
                width={1200}
                height={800}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/60 to-background" />
            </div>
          ) : (
            <div className="absolute inset-0 h-[55vh] bg-gradient-to-b from-primary/5 via-neon-purple/5 to-transparent" />
          )}

          {/* Hero content */}
          <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-16 md:pb-24 text-center">
            <Link
              href={`/${lang}/blog`}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-12 transition-colors text-sm"
            >
              <ArrowLeft size={14} />
              {dict.blog.backToBlog}
            </Link>

            {post.icon && (
              <div className="flex justify-center mb-8">
                {post.icon.length > 2 ? (
                  <img
                    src={post.icon}
                    alt={`${post.title} icon`}
                    width={80}
                    height={80}
                    loading="lazy"
                    className="w-20 h-20 rounded-2xl shadow-2xl shadow-primary/10 ring-2 ring-white/10"
                  />
                ) : (
                  <span className="text-7xl md:text-8xl drop-shadow-2xl">
                    {post.icon}
                  </span>
                )}
              </div>
            )}

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white leading-tight mb-6 drop-shadow-lg">
              {post.title}
            </h1>

            <div className="flex items-center justify-center gap-4 text-slate-400 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {formattedDate}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>{readTime}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <PostViewCount
                lang={lang}
                slug={slug}
                label={dict.blog.views}
                incrementOnMount
              />
            </div>
          </div>
        </div>

        {/* Content area with TOC sidebar */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
          <div className="flex gap-8 justify-center">
            {/* Main content */}
            <div className="min-w-0 max-w-3xl flex-1">
              <div className="prose prose-invert prose-lg max-w-none">
                <MermaidContent content={contentWithIds} />
              </div>
              <SocialShare
                url={`${siteUrl}/${lang}/blog/${slug}`}
                title={post.title}
                labels={{ share: dict.blog.share, copied: dict.contact.copied }}
              />
            </div>
            {/* TOC sidebar */}
            <BlogTOC content={contentWithIds} />
          </div>
        </div>
      </article>
    </main>
  );
}
