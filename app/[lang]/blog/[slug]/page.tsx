import { Navigation } from "@/components/Navigation";
import { MermaidContent } from "@/components/MermaidContent";
import { getDict, type Language } from "@/i18n";
import { getBlogPost, getBlogPosts } from "@/lib/mdx";
import { siteUrl, siteName } from "@/lib/site";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

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
  const post = await getBlogPost(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const pairedPost = post.paired ? await getBlogPost(post.paired) : null;
  const ogImage = post.cover
    ? [{ url: post.cover }]
    : [{ url: `${siteUrl}/og-default.svg` }];

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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const dict = await getDict(lang as Language);
  const post = await getBlogPost(slug);

  if (!post) {
    return (
      <main className="bg-background min-h-screen">
        <Navigation lang={lang as Language} dict={dict} />
        <div className="pt-32 pb-24 px-6">
          <div className="max-w-3xl mx-auto">
            <Link
              href={`/${lang}/blog`}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft size={16} />
              {dict.blog.backToBlog}
            </Link>
            <h1 className="text-3xl font-heading font-bold text-white mb-4">
              {dict.blog.notFound}
            </h1>
            <p className="text-slate-400">
              {dict.blog.notFoundMessage}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const formattedDate = new Date(post.createdAt).toLocaleDateString(
    lang === "zh" ? "zh-CN" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const readTime = readingTime(post.content);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.createdAt,
    author: {
      "@type": "Person",
      name: "Joseph Chen",
      url: siteUrl,
    },
  };

  return (
    <main className="bg-background min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Navigation lang={lang as Language} dict={dict} />
      <article>
        {/* Hero section */}
        <div className="relative pt-24">
          {/* Cover image as full-width hero background */}
          {post.cover ? (
            <div className="absolute inset-0 h-[70vh]">
              <img
                src={post.cover}
                alt={post.title}
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
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="relative z-10 max-w-3xl mx-auto px-6 pb-24">
          <div className="prose prose-invert prose-lg max-w-none">
            <MermaidContent content={post.content} />
          </div>
        </div>
      </article>
    </main>
  );
}