import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { MermaidContent } from "@/components/MermaidContent";
import { LearningSidebar } from "@/components/LearningSidebar";
import { getDict, type Language } from "@/i18n";
import { getBlogPost, getBlogPosts, getRelatedPosts } from "@/lib/mdx";
import { siteUrl } from "@/lib/site";
import { ArrowLeft, Calendar, Clock3, Eye, Link2 } from "lucide-react";
import { PostViewCount } from "@/components/PostViewCount";
import { ReadingProgress } from "@/components/ReadingProgress";
import { BlogTOC } from "@/components/BlogTOC";
import { SocialShare } from "@/components/SocialShare";
import { CommentsSection } from "@/components/comments/CommentsSection";
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

  if (!post) return { title: "Post Not Found" };

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
  return `${minutes} min`;
};

function addHeadingIds(html: string): string {
  let headingIndex = 0;
  return html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h[23]>/gi,
    (match, level, attrs, text) => {
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
  const language = lang as Language;
  const dict = await getDict(language);
  const post = await getBlogPost(slug, language);

  if (!post) notFound();

  const formattedDate = new Date(post.createdAt).toLocaleDateString(
    lang === "zh" ? "zh-CN" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );
  const readTime = readingTime(post.content);
  const categoryValue = (post.category || "").toLowerCase();
  const fallbackCover = categoryValue.includes("web3") || categoryValue.includes("wallet") || categoryValue.includes("blockchain")
    ? "/myknowledge/cover-web3.svg"
    : categoryValue.includes("android") || categoryValue.includes("jvm")
      ? "/myknowledge/cover-android.svg"
      : "/myknowledge/cover-jvm.svg";
  const articleCover = post.cover || fallbackCover;
  const contentWithIds = addHeadingIds(post.content);
  const relatedPosts = await getRelatedPosts(slug, lang as "en" | "zh", post.category);
  const isoDate = `${post.createdAt}T00:00:00+08:00`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    image: {
      "@type": "ImageObject",
      url: articleCover.startsWith("http") ? articleCover : `${siteUrl}${articleCover}`,
      width: 1200,
      height: 630,
    },
    datePublished: isoDate,
    dateModified: isoDate,
    author: { "@type": "Person", name: "Joseph Chen", url: siteUrl },
    publisher: { "@type": "Person", name: "Joseph Chen", url: siteUrl },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/${lang}/blog/${slug}`,
    },
  };

  return (
    <main className="min-h-screen bg-background">
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Navigation lang={language} dict={dict} pairedSlug={post.paired} />

      <section className="mk-article-hero">
        <div
          className="mk-article-cover"
          style={{ backgroundImage: `url(${articleCover})` }}
        />
        <div className="mk-article-hero-shade" />
        <div className="mk-article-hero-inner">
          <Link href={`/${lang}/knowledge`} className="mk-back-link">
            <ArrowLeft size={13} />
            {lang === "zh" ? "返回知识库" : "Back to knowledge"}
          </Link>

          <div className="mk-article-breadcrumb">
            KNOWLEDGE / {post.category || "TECH"} / {slug}
          </div>

          <h1>{post.title}</h1>
          <p>{post.summary}</p>

          <div className="mk-article-meta">
            <span><Calendar size={13} />{formattedDate}</span>
            <span><Clock3 size={13} />{readTime}</span>
            <span>
              <Eye size={13} />
              <PostViewCount
                lang={lang}
                slug={slug}
                label={dict.blog.views}
                incrementOnMount
              />
            </span>
            {post.category && <span className="mk-article-category">{post.category}</span>}
          </div>
        </div>
      </section>

      <div className="mk-article-shell">
        <LearningSidebar lang={language} currentSlug={slug} />

        <article className="mk-article-main">
          <div className="mk-article-prose prose prose-invert max-w-none">
            <MermaidContent content={contentWithIds} />
          </div>

          <SocialShare
            url={`${siteUrl}/${lang}/blog/${slug}`}
            title={post.title}
            labels={{ share: dict.blog.share, copied: dict.contact.copied }}
          />

          <CommentsSection
            dict={dict}
            lang={lang as "en" | "zh"}
            slug={slug}
          />
        </article>

        <aside className="mk-article-rail">
          <section className="mk-rail-card">
            <div className="mk-rail-title"><Link2 size={13} /> {lang === "zh" ? "本页导读" : "On this page"}</div>
            <BlogTOC content={contentWithIds} />
          </section>

          <section className="mk-rail-card mk-rail-highlight">
            <div className="mk-rail-title">⚡ {lang === "zh" ? "阅读策略" : "Reading Strategy"}</div>
            <ul>
              <li>{lang === "zh" ? "先建立心智模型，再深入实现细节。" : "Build the mental model before implementation details."}</li>
              <li>{lang === "zh" ? "第一次阅读达到 70–80% 理解即可继续。" : "70–80% understanding is enough for the first pass."}</li>
              <li>{lang === "zh" ? "把知识连接到真实 Android 场景。" : "Connect the idea to real Android scenarios."}</li>
            </ul>
          </section>

          {relatedPosts.length > 0 && (
            <section className="mk-rail-card">
              <div className="mk-rail-title">{lang === "zh" ? "相关知识" : "Related Knowledge"}</div>
              <div className="mk-rail-related">
                {relatedPosts.map((rp) => (
                  <Link key={rp.slug} href={`/${lang}/blog/${rp.slug}`}>
                    <small>{rp.category || "NOTE"}</small>
                    <b>{rp.title}</b>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
      <SiteFooter lang={language} />
      </main>
  );
}
